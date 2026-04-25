const cron = require('node-cron');
const Automation = require('../models/Automation');
const automationEngine = require('./automationEngine');

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    // Initialize scheduler
    async initialize() {
        if (this.isInitialized) return;

        console.log('[SchedulerService] Initializing...');
        await this.reloadSchedules();
        this.isInitialized = true;
        console.log('[SchedulerService] Initialized successfully');
    }

    // Schedule automation
    scheduleAutomation(automation) {
        try {
            if (automation.trigger.type !== 'schedule') {
                console.log(`[SchedulerService] Skipping non-schedule automation: ${automation.name}`);
                return;
            }

            const cronExpression = automation.trigger.config.schedule;

            // Validate cron expression
            if (!cron.validate(cronExpression)) {
                console.error(`[SchedulerService] Invalid cron expression: ${cronExpression}`);
                return;
            }

            // Stop existing job if any
            this.unscheduleAutomation(automation._id.toString());

            // Create new job
            const job = cron.schedule(cronExpression, async () => {
                console.log(`[SchedulerService] Triggering scheduled automation: ${automation.name}`);

                try {
                    await automationEngine.executeAutomation(automation, {
                        triggeredBy: 'schedule',
                        timestamp: new Date(),
                        organizationId: automation.organizationId
                    }, 'schedule');
                } catch (error) {
                    console.error(`[SchedulerService] Error executing automation ${automation.name}:`, error);
                }
            }, {
                timezone: automation.trigger.config.timezone || 'UTC'
            });

            this.jobs.set(automation._id.toString(), job);
            console.log(`[SchedulerService] Scheduled automation: ${automation.name} (${cronExpression})`);
        } catch (error) {
            console.error('[SchedulerService] Error scheduling automation:', error);
        }
    }

    // Unschedule automation
    unscheduleAutomation(automationId) {
        const job = this.jobs.get(automationId);
        if (job) {
            job.stop();
            this.jobs.delete(automationId);
            console.log(`[SchedulerService] Unscheduled automation: ${automationId}`);
        }
    }

    // Reload all schedules
    async reloadSchedules() {
        try {
            console.log('[SchedulerService] Reloading all schedules...');

            // Stop all existing jobs
            this.jobs.forEach((job, id) => {
                job.stop();
            });
            this.jobs.clear();

            // Load all enabled schedule-based automations
            const automations = await Automation.find({
                'trigger.type': 'schedule',
                enabled: true
            });

            console.log(`[SchedulerService] Found ${automations.length} schedule-based automations`);

            // Schedule each automation
            automations.forEach(automation => {
                this.scheduleAutomation(automation);
            });

            console.log(`[SchedulerService] Scheduled ${this.jobs.size} automations`);
        } catch (error) {
            console.error('[SchedulerService] Error reloading schedules:', error);
        }
    }

    // Get scheduled jobs info
    getScheduledJobs() {
        const jobs = [];
        this.jobs.forEach((job, automationId) => {
            jobs.push({
                automationId,
                isRunning: job.running || false
            });
        });
        return jobs;
    }

    // Stop all jobs
    stopAll() {
        console.log('[SchedulerService] Stopping all scheduled jobs...');
        this.jobs.forEach((job, id) => {
            job.stop();
        });
        this.jobs.clear();
        console.log('[SchedulerService] All jobs stopped');
    }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
