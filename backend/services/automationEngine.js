const EventEmitter = require('events');
const Automation = require('../models/Automation');
const AutomationExecution = require('../models/AutomationExecution');
const actionHandlers = require('./actionHandlers');

class AutomationEngine extends EventEmitter {
    constructor() {
        super();
        this.isInitialized = false;
    }

    // Initialize the engine
    async initialize() {
        if (this.isInitialized) return;

        console.log('[AutomationEngine] Initializing...');
        this.registerEventListeners();
        this.isInitialized = true;
        console.log('[AutomationEngine] Initialized successfully');
    }

    // Register event listeners
    registerEventListeners() {
        const events = [
            'task.created',
            'task.updated',
            'task.deleted',
            'task.assigned',
            'task.status_changed',
            'task.priority_changed',
            'project.created',
            'project.updated',
            'user.created',
            'comment.created',
            'attachment.uploaded',
            'project.scaffolded'
        ];

        events.forEach(eventType => {
            this.on(eventType, (eventData) => this.handleEvent(eventType, eventData));
        });
    }

    // Handle incoming events
    async handleEvent(eventType, eventData) {
        try {
            console.log(`[AutomationEngine] Event received: ${eventType}`);

            // Find matching automations
            const automations = await this.findMatchingAutomations(eventType, eventData);

            if (automations.length === 0) {
                console.log(`[AutomationEngine] No automations found for ${eventType}`);
                return;
            }

            console.log(`[AutomationEngine] Found ${automations.length} matching automation(s)`);

            // Execute each automation
            for (const automation of automations) {
                await this.executeAutomation(automation, eventData, 'event');
            }
        } catch (error) {
            console.error('[AutomationEngine] Error handling event:', error);
        }
    }

    // Find automations that match the event
    async findMatchingAutomations(eventType, eventData) {
        try {
            const automations = await Automation.find({
                organizationId: eventData.organizationId || eventData.task?.organizationId || eventData.project?.organizationId,
                enabled: true,
                'trigger.type': 'event',
                'trigger.config.eventType': eventType
            });

            // Filter by trigger filters if any
            return automations.filter(automation => {
                const filters = automation.trigger.config.filters;
                if (!filters) return true;

                return this.matchesFilters(eventData, filters);
            });
        } catch (error) {
            console.error('[AutomationEngine] Error finding automations:', error);
            return [];
        }
    }

    // Check if event data matches filters
    matchesFilters(data, filters) {
        for (const [key, value] of Object.entries(filters)) {
            const actualValue = this.getNestedValue(data, key);
            if (actualValue !== value) {
                return false;
            }
        }
        return true;
    }

    // Execute automation workflow
    async executeAutomation(automation, triggerData, triggeredBy = 'event') {
        const startTime = Date.now();

        try {
            console.log(`[AutomationEngine] Executing automation: ${automation.name}`);

            // Create execution record
            const execution = await AutomationExecution.create({
                automationId: automation._id,
                organizationId: automation.organizationId,
                triggeredBy,
                triggerData,
                status: 'running',
                steps: []
            });

            // Evaluate conditions
            if (automation.conditions && automation.conditions.length > 0) {
                const conditionsMet = this.evaluateConditions(automation.conditions, triggerData);

                if (!conditionsMet) {
                    console.log(`[AutomationEngine] Conditions not met for: ${automation.name}`);
                    execution.status = 'completed';
                    execution.duration = Date.now() - startTime;
                    await execution.save();
                    return;
                }
            }

            // Execute actions sequentially
            const sortedActions = automation.actions.sort((a, b) => a.order - b.order);

            for (let i = 0; i < sortedActions.length; i++) {
                const action = sortedActions[i];
                const stepNumber = i + 1;

                try {
                    const stepStartTime = Date.now();

                    // Add step to execution
                    execution.steps.push({
                        stepNumber,
                        actionType: action.type,
                        status: 'running',
                        startedAt: new Date()
                    });
                    await execution.save();

                    // Execute action
                    const result = await this.executeAction(action, triggerData);

                    // Update step status
                    const step = execution.steps[stepNumber - 1];
                    step.status = 'completed';
                    step.completedAt = new Date();
                    step.result = result;
                    await execution.save();

                    console.log(`[AutomationEngine] Step ${stepNumber} completed: ${action.type}`);
                } catch (error) {
                    console.error(`[AutomationEngine] Step ${stepNumber} failed:`, error);

                    // Update step with error
                    const step = execution.steps[stepNumber - 1];
                    step.status = 'failed';
                    step.completedAt = new Date();
                    step.error = error.message;

                    execution.status = 'partial';
                    execution.error = {
                        message: `Step ${stepNumber} failed: ${error.message}`,
                        stack: error.stack
                    };
                    await execution.save();

                    // Continue with next action (don't break the whole automation)
                }
            }

            // Update execution status
            const hasFailedSteps = execution.steps.some(s => s.status === 'failed');
            execution.status = hasFailedSteps ? 'partial' : 'completed';
            execution.duration = Date.now() - startTime;
            await execution.save();

            // Update automation stats
            automation.runCount += 1;
            automation.lastRun = new Date();
            automation.lastRunStatus = execution.status === 'completed' ? 'success' : 'failed';
            await automation.save();

            console.log(`[AutomationEngine] Automation completed: ${automation.name} (${execution.status})`);
        } catch (error) {
            console.error('[AutomationEngine] Automation execution failed:', error);

            // Update execution with error
            try {
                const execution = await AutomationExecution.findOne({
                    automationId: automation._id
                }).sort({ triggeredAt: -1 });

                if (execution) {
                    execution.status = 'failed';
                    execution.duration = Date.now() - startTime;
                    execution.error = {
                        message: error.message,
                        stack: error.stack
                    };
                    await execution.save();
                }
            } catch (updateError) {
                console.error('[AutomationEngine] Failed to update execution:', updateError);
            }
        }
    }

    // Execute individual action
    async executeAction(action, context) {
        const handler = actionHandlers[action.type];

        if (!handler) {
            throw new Error(`Unknown action type: ${action.type}`);
        }

        // Interpolate variables in config
        const interpolatedConfig = this.interpolateVariables(action.config, context);

        // Execute handler
        return await handler(interpolatedConfig, context);
    }

    // Evaluate conditions
    evaluateConditions(conditions, data) {
        if (!conditions || conditions.length === 0) return true;

        let result = true;
        let currentLogic = 'AND';

        for (const condition of conditions) {
            const fieldValue = this.getNestedValue(data, condition.field);
            const conditionMet = this.compareValues(fieldValue, condition.operator, condition.value);

            if (currentLogic === 'AND') {
                result = result && conditionMet;
            } else {
                result = result || conditionMet;
            }

            currentLogic = condition.logicOperator || 'AND';
        }

        return result;
    }

    // Compare values based on operator
    compareValues(actual, operator, expected) {
        switch (operator) {
            case 'equals':
                return actual === expected;
            case 'not_equals':
                return actual !== expected;
            case 'contains':
                return String(actual).includes(String(expected));
            case 'not_contains':
                return !String(actual).includes(String(expected));
            case 'greater_than':
                return Number(actual) > Number(expected);
            case 'less_than':
                return Number(actual) < Number(expected);
            case 'in':
                return Array.isArray(expected) && expected.includes(actual);
            case 'not_in':
                return Array.isArray(expected) && !expected.includes(actual);
            default:
                return false;
        }
    }

    // Get nested value from object
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current?.[key];
        }, obj);
    }

    // Interpolate variables in config
    interpolateVariables(config, context) {
        if (typeof config === 'string') {
            return this.interpolateString(config, context);
        }

        if (Array.isArray(config)) {
            return config.map(item => this.interpolateVariables(item, context));
        }

        if (typeof config === 'object' && config !== null) {
            const result = {};
            for (const [key, value] of Object.entries(config)) {
                result[key] = this.interpolateVariables(value, context);
            }
            return result;
        }

        return config;
    }

    // Interpolate string with variables
    interpolateString(str, context) {
        return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const value = this.getNestedValue(context, path.trim());
            return value !== undefined ? value : match;
        });
    }

    // Manually trigger automation (for testing)
    async triggerManually(automationId, testData) {
        const automation = await Automation.findById(automationId);
        if (!automation) {
            throw new Error('Automation not found');
        }

        return await this.executeAutomation(automation, testData, 'manual');
    }
}

// Create singleton instance
const automationEngine = new AutomationEngine();

module.exports = automationEngine;
