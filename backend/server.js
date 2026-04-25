const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
require('dotenv').config();

// Import utilities and middleware
const logger = require('./utils/logger');
const { initRedis, getRedisClient, isRedisReady, sadd, srem, smembers } = require('./config/redis');
const { applySecurityMiddleware } = require('./middleware/securityHeaders');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const realtimeIntegrationService = require('./services/realtimeIntegrationService');

const app = express();
const server = http.createServer(app);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Apply security middleware
applySecurityMiddleware(app);

// Swagger API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Compression middleware
app.use(compression());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    maxAge: 86400 // 24 hours
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Initialize Redis and Socket.IO
let io;

const initializeServer = async () => {
    try {
        // Initialize Redis (non-blocking - continue even if it fails)
        await initRedis().catch(err => {
            logger.warn('Redis initialization failed, continuing without Redis:', err.message);
        });

        // Socket.io Setup - ALWAYS initialize regardless of Redis
        io = new Server(server, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });

        // Use Redis adapter if available
        if (isRedisReady()) {
            try {
                const { createAdapter } = require('@socket.io/redis-adapter');
                const redisClient = getRedisClient();
                const subClient = redisClient.duplicate();

                await subClient.connect();

                io.adapter(createAdapter(redisClient, subClient));
                logger.info('✅ Socket.IO using Redis adapter for horizontal scaling');
            } catch (error) {
                logger.warn('⚠️  Failed to setup Redis adapter, using in-memory adapter:', error.message);
            }
        } else {
            logger.warn('⚠️  Socket.IO using in-memory adapter (suitable for single-server development)');
        }

        // Make io available in routes
        app.set('io', io);

        // Socket.io Event Handlers
        const User = require('./models/User');

        io.on('connection', (socket) => {
            logger.debug('New client connected:', socket.id);

            // Handle user authentication and online status
            socket.on('user:authenticate', async (userId) => {
                try {
                    socket.userId = userId;
                    socket.join(userId);

                    // Store in Redis if available, otherwise in-memory
                    if (isRedisReady()) {
                        await sadd(`user:${userId}:sockets`, socket.id);
                        await getRedisClient().set(`user:${userId}:status`, 'online');
                    }

                    // Update user status to online
                    await User.findByIdAndUpdate(userId, {
                        onlineStatus: 'online',
                        lastActive: new Date()
                    });

                    // Broadcast status change to all clients
                    io.emit('user:status-change', {
                        userId,
                        status: 'online',
                        lastActive: new Date()
                    });

                    logger.debug(`User ${userId} is now online`);
                } catch (error) {
                    logger.error('Error authenticating user:', error);
                }
            });

            // Handle joining project room
            socket.on('project:join', (projectId) => {
                socket.join(`project:${projectId}`);
                logger.debug(`Socket ${socket.id} joined project room: ${projectId}`);
            });

            // Handle joining organization integration room
            socket.on('integrations:join', (organizationId) => {
                socket.join(`org:${organizationId}:integrations`);
                logger.debug(`Socket ${socket.id} joined integrations room for org: ${organizationId}`);
            });

            // Handle leaving project room
            socket.on('project:leave', (projectId) => {
                socket.leave(`project:${projectId}`);
                logger.debug(`Socket ${socket.id} left project room: ${projectId}`);
            });

            // Handle disconnect
            socket.on('disconnect', async () => {
                logger.debug('Client disconnected:', socket.id);

                if (socket.userId) {
                    try {
                        let shouldSetOffline = false;

                        if (isRedisReady()) {
                            await srem(`user:${socket.userId}:sockets`, socket.id);
                            const sockets = await smembers(`user:${socket.userId}:sockets`);
                            shouldSetOffline = sockets.length === 0;
                        } else {
                            // Fallback: assume offline (not ideal for multi-server)
                            shouldSetOffline = true;
                        }

                        if (shouldSetOffline) {
                            await User.findByIdAndUpdate(socket.userId, {
                                onlineStatus: 'offline',
                                lastActive: new Date()
                            });

                            // Broadcast offline status
                            io.emit('user:status-change', {
                                userId: socket.userId,
                                status: 'offline',
                                lastActive: new Date()
                            });

                            logger.debug(`User ${socket.userId} is now offline`);
                        }
                    } catch (error) {
                        logger.error('Error updating user offline status:', error);
                    }
                }
            });
        });

        // Initialize automation engine
        const automationEngine = require('./services/automationEngine');
        await automationEngine.initialize();
        logger.info('✅ Automation engine initialized');

        // Initialize scheduler service
        const schedulerService = require('./services/schedulerService');
        await schedulerService.initialize();
        logger.info('✅ Scheduler service initialized');

        // Initialize Realtime Integration Service
        realtimeIntegrationService.init(app);

    } catch (error) {
        logger.error('Failed to initialize server:', error);
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1,
        redis: isRedisReady(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'Harmonic Halo API',
        version: '2.0.0',
        status: 'running'
    });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const commentRoutes = require('./routes/commentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const timeRoutes = require('./routes/timeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityRoutes = require('./routes/activityRoutes');
const automationRoutes = require('./routes/automationRoutes');
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api', commentRoutes); // Mount at root so it can handle /api/tasks/:taskId/comments and /api/comments/:id
app.use('/api/projects', projectRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/keys', require('./routes/apiKeyRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/workflow-stages', require('./routes/workflowStageRoutes'));
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/integrations', require('./routes/integrationsRoutes'));
app.use('/api/sprint-planner', require('./routes/sprintPlannerRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND'
        }
    });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, closing server gracefully...');

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');

            if (isRedisReady()) {
                const { closeRedis } = require('./config/redis');
                await closeRedis();
                logger.info('Redis connection closed');
            }

            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Database Connection and Server Startup
const startServer = async () => {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 50,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info('✅ MongoDB Connected');

        // Reset all stale online statuses from previous server run
        // (handles nodemon restarts, crashes, or ungraceful shutdowns)
        const User = require('./models/User');
        const staleCount = await User.countDocuments({ onlineStatus: 'online' });
        if (staleCount > 0) {
            await User.updateMany(
                { onlineStatus: 'online' },
                { $set: { onlineStatus: 'offline', lastActive: new Date() } }
            );
            logger.info(`🔄 Reset ${staleCount} stale online status(es) to offline`);
        }

        // 2. Initialize Services (Redis, Socket.io, Scheduler, Automation)
        await initializeServer();

        // 3. Start HTTP Server
        server.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

            // Verify email config without blocking server startup
            verifyEmailConfig().catch(err => {
                logger.warn('Email verification failed, but server is running:', err.message);
            });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);

        // Attempt graceful shutdown if possible, otherwise exit
        try {
            await mongoose.connection.close();
            if (isRedisReady()) {
                const { closeRedis } = require('./config/redis');
                await closeRedis();
            }
        } catch (shutdownError) {
            logger.error('Error during cleanup:', shutdownError);
        }

        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    gracefulShutdown();
});

// Verify email configuration on startup
const { verifyEmailConfig } = require('./services/emailService');

// Export app and server for testing
module.exports = { app, server, startServer };

// Start the server only if run directly
if (require.main === module) {
    startServer();
}
