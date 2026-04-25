const Automation = require('../models/Automation');
const AutomationExecution = require('../models/AutomationExecution');
const AutomationTemplate = require('../models/AutomationTemplate');
const automationEngine = require('../services/automationEngine');

// Get all automations
const getAutomations = async (req, res) => {
    try {
        const { enabled, triggerType } = req.query;
        const organizationId = req.user.organizationId;

        const query = { organizationId };
        if (enabled !== undefined) query.enabled = enabled === 'true';
        if (triggerType) query['trigger.type'] = triggerType;

        const automations = await Automation.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: automations.length,
            automations
        });
    } catch (error) {
        console.error('[AutomationController] getAutomations error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single automation
const getAutomation = async (req, res) => {
    try {
        const automation = await Automation.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        }).populate('createdBy', 'name email');

        if (!automation) {
            return res.status(404).json({ message: 'Automation not found' });
        }

        res.json({ success: true, automation });
    } catch (error) {
        console.error('[AutomationController] getAutomation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create automation
const createAutomation = async (req, res) => {
    try {
        const { name, description, trigger, conditions, actions } = req.body;

        // Validate required fields
        if (!name || !trigger || !actions || actions.length === 0) {
            return res.status(400).json({
                message: 'Name, trigger, and at least one action are required'
            });
        }

        const automation = await Automation.create({
            organizationId: req.user.organizationId,
            createdBy: req.user._id,
            name,
            description,
            trigger,
            conditions: conditions || [],
            actions,
            enabled: true
        });

        // If it's a schedule trigger, register it with scheduler
        if (trigger.type === 'schedule') {
            const schedulerService = require('../services/schedulerService');
            schedulerService.scheduleAutomation(automation);
        }

        res.status(201).json({
            success: true,
            message: 'Automation created successfully',
            automation
        });
    } catch (error) {
        console.error('[AutomationController] createAutomation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update automation
const updateAutomation = async (req, res) => {
    try {
        const { name, description, trigger, conditions, actions, enabled } = req.body;

        const automation = await Automation.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!automation) {
            return res.status(404).json({ message: 'Automation not found' });
        }

        // Update fields
        if (name) automation.name = name;
        if (description !== undefined) automation.description = description;
        if (trigger) automation.trigger = trigger;
        if (conditions !== undefined) automation.conditions = conditions;
        if (actions) automation.actions = actions;
        if (enabled !== undefined) automation.enabled = enabled;

        await automation.save();

        // Update scheduler if needed
        if (trigger && trigger.type === 'schedule') {
            const schedulerService = require('../services/schedulerService');
            schedulerService.unscheduleAutomation(automation._id.toString());
            if (automation.enabled) {
                schedulerService.scheduleAutomation(automation);
            }
        }

        res.json({
            success: true,
            message: 'Automation updated successfully',
            automation
        });
    } catch (error) {
        console.error('[AutomationController] updateAutomation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete automation
const deleteAutomation = async (req, res) => {
    try {
        const automation = await Automation.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!automation) {
            return res.status(404).json({ message: 'Automation not found' });
        }

        // Unschedule if it's a schedule trigger
        if (automation.trigger.type === 'schedule') {
            const schedulerService = require('../services/schedulerService');
            schedulerService.unscheduleAutomation(automation._id.toString());
        }

        await Automation.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Automation deleted successfully'
        });
    } catch (error) {
        console.error('[AutomationController] deleteAutomation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Toggle automation enabled/disabled
const toggleAutomation = async (req, res) => {
    try {
        const automation = await Automation.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!automation) {
            return res.status(404).json({ message: 'Automation not found' });
        }

        automation.enabled = !automation.enabled;
        await automation.save();

        // Update scheduler
        const schedulerService = require('../services/schedulerService');
        if (automation.trigger.type === 'schedule') {
            if (automation.enabled) {
                schedulerService.scheduleAutomation(automation);
            } else {
                schedulerService.unscheduleAutomation(automation._id.toString());
            }
        }

        res.json({
            success: true,
            message: `Automation ${automation.enabled ? 'enabled' : 'disabled'}`,
            automation
        });
    } catch (error) {
        console.error('[AutomationController] toggleAutomation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Test automation
const testAutomation = async (req, res) => {
    try {
        const { testData } = req.body;

        const automation = await Automation.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!automation) {
            return res.status(404).json({ message: 'Automation not found' });
        }

        // Execute automation with test data
        await automationEngine.triggerManually(automation._id, {
            ...testData,
            organizationId: req.user.organizationId
        });

        res.json({
            success: true,
            message: 'Automation test triggered successfully'
        });
    } catch (error) {
        console.error('[AutomationController] testAutomation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get automation executions
const getExecutions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const automation = await Automation.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!automation) {
            return res.status(404).json({ message: 'Automation not found' });
        }

        const query = { automationId: req.params.id };
        if (status) query.status = status;

        const executions = await AutomationExecution.find(query)
            .sort({ triggeredAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AutomationExecution.countDocuments(query);

        res.json({
            success: true,
            executions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[AutomationController] getExecutions error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get automation templates
const getTemplates = async (req, res) => {
    try {
        const { category, featured } = req.query;

        const query = {};
        if (category) query.category = category;
        if (featured !== undefined) query.featured = featured === 'true';

        const templates = await AutomationTemplate.find(query)
            .sort({ featured: -1, usageCount: -1 });

        res.json({
            success: true,
            count: templates.length,
            templates
        });
    } catch (error) {
        console.error('[AutomationController] getTemplates error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create automation from template
const createFromTemplate = async (req, res) => {
    try {
        const { customizations } = req.body;

        const template = await AutomationTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Apply customizations
        let automationData = JSON.parse(JSON.stringify(template.template));

        if (customizations) {
            for (const [path, value] of Object.entries(customizations)) {
                setNestedValue(automationData, path, value);
            }
        }

        // Create automation
        const automation = await Automation.create({
            organizationId: req.user.organizationId,
            createdBy: req.user._id,
            name: template.name,
            description: template.description,
            ...automationData,
            enabled: true
        });

        // Update template usage count
        template.usageCount += 1;
        await template.save();

        // Schedule if needed
        if (automation.trigger.type === 'schedule') {
            const schedulerService = require('../services/schedulerService');
            schedulerService.scheduleAutomation(automation);
        }

        res.status(201).json({
            success: true,
            message: 'Automation created from template',
            automation
        });
    } catch (error) {
        console.error('[AutomationController] createFromTemplate error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Helper to set nested value
const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        const match = key.match(/(.+)\[(\d+)\]/);
        if (match) {
            return current[match[1]][parseInt(match[2])];
        }
        return current[key];
    }, obj);
    target[lastKey] = value;
};

module.exports = {
    getAutomations,
    getAutomation,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    testAutomation,
    getExecutions,
    getTemplates,
    createFromTemplate
};
