const mongoose = require('mongoose');
const AutomationTemplate = require('../models/AutomationTemplate');
require('dotenv').config();

const templates = [
    {
        name: 'Auto-assign tasks by keyword',
        description: 'Automatically assign tasks to specific users based on keywords in the title',
        category: 'task_management',
        icon: 'user-plus',
        featured: true,
        template: {
            trigger: {
                type: 'event',
                config: {
                    eventType: 'task.created'
                }
            },
            conditions: [
                {
                    field: 'task.title',
                    operator: 'contains',
                    value: 'bug',
                    logicOperator: 'AND'
                }
            ],
            actions: [
                {
                    type: 'assign_task',
                    config: {
                        taskId: 'context.task._id',
                        assignee: 'CUSTOMIZE_USER_ID'
                    },
                    order: 0
                }
            ]
        },
        customizableFields: [
            {
                path: 'conditions[0].value',
                label: 'Keyword to match',
                type: 'text',
                required: true,
                defaultValue: 'bug'
            },
            {
                path: 'actions[0].config.assignee',
                label: 'Assign to',
                type: 'user_select',
                required: true
            }
        ]
    },
    {
        name: 'Overdue task escalation',
        description: 'Automatically notify managers and increase priority when tasks become overdue',
        category: 'task_management',
        icon: 'alert-triangle',
        featured: true,
        template: {
            trigger: {
                type: 'schedule',
                config: {
                    schedule: '0 9 * * *', // Daily at 9 AM
                    timezone: 'UTC'
                }
            },
            conditions: [],
            actions: [
                {
                    type: 'send_notification',
                    config: {
                        recipient: 'context.task.project.manager',
                        title: 'Overdue Task Alert',
                        message: 'Task "{{task.title}}" is overdue',
                        type: 'warning'
                    },
                    order: 0
                },
                {
                    type: 'update_task',
                    config: {
                        taskId: 'context.task._id',
                        priority: 'Critical'
                    },
                    order: 1
                }
            ]
        },
        customizableFields: [
            {
                path: 'trigger.config.schedule',
                label: 'Check frequency (cron)',
                type: 'text',
                required: true,
                defaultValue: '0 9 * * *'
            }
        ]
    },
    {
        name: 'Task completion workflow',
        description: 'When a task is marked as done, create a follow-up task and notify the team',
        category: 'task_management',
        icon: 'check-circle',
        featured: true,
        template: {
            trigger: {
                type: 'event',
                config: {
                    eventType: 'task.status_changed'
                }
            },
            conditions: [
                {
                    field: 'task.currentStage.isCompleteStage',
                    operator: 'equals',
                    value: true,
                    logicOperator: 'AND'
                }
            ],
            actions: [
                {
                    type: 'send_notification',
                    config: {
                        recipient: 'context.task.project.manager',
                        title: 'Task Completed',
                        message: '{{user.name}} completed task: {{task.title}}',
                        type: 'success'
                    },
                    order: 0
                },
                {
                    type: 'create_comment',
                    config: {
                        taskId: 'context.task._id',
                        text: '✅ Task completed by {{user.name}}'
                    },
                    order: 1
                }
            ]
        },
        customizableFields: []
    },
    {
        name: 'High priority task alert',
        description: 'Send immediate notification when a high priority task is created',
        category: 'notifications',
        icon: 'bell',
        featured: true,
        template: {
            trigger: {
                type: 'event',
                config: {
                    eventType: 'task.created'
                }
            },
            conditions: [
                {
                    field: 'task.priority',
                    operator: 'in',
                    value: ['High', 'Critical'],
                    logicOperator: 'AND'
                }
            ],
            actions: [
                {
                    type: 'send_notification',
                    config: {
                        recipient: 'context.task.project.manager',
                        title: 'High Priority Task Created',
                        message: '🚨 High priority task: {{task.title}}',
                        type: 'warning'
                    },
                    order: 0
                },
                {
                    type: 'send_email',
                    config: {
                        to: 'context.task.project.manager',
                        subject: 'High Priority Task: {{task.title}}',
                        body: 'A high priority task has been created:\n\nTitle: {{task.title}}\nPriority: {{task.priority}}\nDue Date: {{task.dueDate}}'
                    },
                    order: 1
                }
            ]
        },
        customizableFields: []
    },
    {
        name: 'Weekly status report',
        description: 'Automatically generate and send weekly project status reports',
        category: 'reporting',
        icon: 'file-text',
        featured: false,
        template: {
            trigger: {
                type: 'schedule',
                config: {
                    schedule: '0 17 * * 5', // Friday at 5 PM
                    timezone: 'UTC'
                }
            },
            conditions: [],
            actions: [
                {
                    type: 'send_notification',
                    config: {
                        recipient: 'context.project.manager',
                        title: 'Weekly Status Report',
                        message: 'Your weekly project status report is ready',
                        type: 'info'
                    },
                    order: 0
                }
            ]
        },
        customizableFields: [
            {
                path: 'trigger.config.schedule',
                label: 'Report schedule (cron)',
                type: 'text',
                required: true,
                defaultValue: '0 17 * * 5'
            }
        ]
    },
    {
        name: 'Task assignment notification',
        description: 'Notify users immediately when they are assigned to a task',
        category: 'notifications',
        icon: 'user-check',
        featured: false,
        template: {
            trigger: {
                type: 'event',
                config: {
                    eventType: 'task.assigned'
                }
            },
            conditions: [],
            actions: [
                {
                    type: 'send_notification',
                    config: {
                        recipient: 'context.task.assignee',
                        title: 'New Task Assignment',
                        message: 'You have been assigned to: {{task.title}}',
                        type: 'info'
                    },
                    order: 0
                },
                {
                    type: 'send_email',
                    config: {
                        to: 'context.task.assignee',
                        subject: 'New Task: {{task.title}}',
                        body: 'You have been assigned to a new task:\n\nTitle: {{task.title}}\nDescription: {{task.description}}\nDue Date: {{task.dueDate}}'
                    },
                    order: 1
                }
            ]
        },
        customizableFields: []
    }
];

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing templates
        await AutomationTemplate.deleteMany({});
        console.log('Cleared existing templates');

        // Insert new templates
        await AutomationTemplate.insertMany(templates);
        console.log(`Inserted ${templates.length} automation templates`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding templates:', error);
        process.exit(1);
    }
};

seedTemplates();
