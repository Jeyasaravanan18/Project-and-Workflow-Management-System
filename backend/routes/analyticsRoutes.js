const express = require("express");
const router = express.Router();
const {
  getWorkload,
  getBottlenecks,
  getOverview,
  getTeamProductivity,
  getProjectInsights,
  getRecentActivities,
  getTasksByStatus,
  getProjectProgress,
  getAvgDuration,
  getExtendedMetrics,
  getPersonalPerformance,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const {
  analyticsValidator,
} = require("../middleware/validators/analyticsValidator");

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Reporting and insights for Admins/Managers
 */

/**
 * @swagger
 * /api/analytics/workload:
 *   get:
 *     summary: Get team workload distribution
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workload statistics
 */
router.get(
  "/workload",
  protect,
  authorize("admin", "manager", "member"),
  analyticsValidator,
  validate,
  getWorkload,
);

router.get(
  "/personal-performance",
  protect,
  getPersonalPerformance
);

/**
 * @swagger
 * /api/analytics/bottlenecks:
 *   get:
 *     summary: Get workflow bottlenecks
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of stuck tasks and recommendations
 */
router.get(
  "/bottlenecks",
  protect,
  authorize("admin", "manager"),
  analyticsValidator,
  validate,
  getBottlenecks,
);

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get dashboard overview metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Key metrics (Total Tasks, Completion Rate, etc.)
 */
router.get("/overview", protect, authorize("admin"), getOverview);

/**
 * @swagger
 * /api/analytics/team-productivity:
 *   get:
 *     summary: Get team productivity stats
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top performers and role distribution
 */
router.get(
  "/team-productivity",
  protect,
  authorize("admin"),
  getTeamProductivity,
);

/**
 * @swagger
 * /api/analytics/project-insights:
 *   get:
 *     summary: Get project-level insights
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project completion rates and task distribution
 */
router.get(
  "/project-insights",
  protect,
  authorize("admin"),
  getProjectInsights,
);

/**
 * @swagger
 * /api/analytics/recent-activities:
 *   get:
 *     summary: Get recent organization activities
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent audit logs
 */
router.get(
  "/recent-activities",
  protect,
  authorize("admin"),
  getRecentActivities,
);

/**
 * @swagger
 * /api/analytics/tasks-by-status:
 *   get:
 *     summary: Get tasks grouped by status
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of tasks in each stage
 */
router.get("/tasks-by-status", protect, authorize("admin"), getTasksByStatus);

/**
 * @swagger
 * /api/analytics/project-progress:
 *   get:
 *     summary: Get progress for all projects
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress stats per project
 */
router.get(
  "/project-progress",
  protect,
  authorize("admin"),
  getProjectProgress,
);

/**
 * @swagger
 * /api/analytics/avg-duration:
 *   get:
 *     summary: Get average task completion duration
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Average days to complete a task
 */
router.get("/avg-duration", protect, authorize("admin"), getAvgDuration);

/**
 * @swagger
 * /api/analytics/extended-metrics:
 *   get:
 *     summary: Get extended analytics metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', 'all']
 *           default: '30d'
 *         description: Time range for metrics calculation
 *     responses:
 *       200:
 *         description: Extended metrics including overdue count, active users, task velocity, health score, WoW change
 */
router.get(
  "/extended-metrics",
  protect,
  authorize("admin"),
  getExtendedMetrics,
);

module.exports = router;
