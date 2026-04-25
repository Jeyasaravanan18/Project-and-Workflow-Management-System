const mongoose = require('mongoose');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const User = require('../models/User');
require('dotenv').config();

const sampleDocuments = [
    {
        title: "How to Create a New Project",
        type: "guide",
        category: "workflow",
        summary: "Step-by-step guide for creating and configuring a new project in the system.",
        content: `# Creating a New Project

## Prerequisites
- You must have Admin or Manager role
- You must be logged into the system

## Steps

1. **Navigate to Projects**
   - Click on "Projects" in the left sidebar
   - Or go to /projects

2. **Click "New Project" Button**
   - Located in the top-right corner
   - Blue button with "+" icon

3. **Fill in Project Details**
   - **Project Name**: Enter a descriptive name (required)
   - **Description**: Add project goals and scope (optional but recommended)
   - **Start Date**: Select project start date
   - **End Date**: Select target completion date
   - **Priority**: Choose Low, Medium, or High

4. **Configure Workflow Stages**
   - Default stages: Backlog, In Progress, Review, Testing, Done
   - You can customize these later in Project Settings

5. **Assign Team Members**
   - Click "Add Members"
   - Select users from your organization
   - Assign roles (Manager or Member)

6. **Save Project**
   - Click "Create Project" button
   - You'll be redirected to the project dashboard

## Common Issues

**"Permission Denied" Error**
- Only Admins and Managers can create projects
- Contact your organization admin for access

**Team Members Not Showing**
- Ensure users are added to your organization first
- Go to Admin > User Management to add users

## Next Steps
- Create modules to organize work
- Add tasks to modules
- Set up automations for repetitive workflows`,
        tags: ["project", "create", "setup", "workflow", "getting-started"],
        metadata: {
            severity: "low",
            category: "workflow",
            successRate: 100,
            viewCount: 0,
            helpfulCount: 0
        }
    },
    {
        title: "Task Assignment and Management Guide",
        type: "guide",
        category: "workflow",
        summary: "Complete guide on assigning, managing, and tracking tasks effectively.",
        content: `# Task Assignment and Management

## Creating Tasks

### Quick Create
1. Navigate to a project
2. Click "+ New Task"
3. Enter title and press Enter
4. Task created with default settings

### Detailed Create
1. Click "+ New Task" and select "Detailed"
2. Fill in:
   - **Title**: Clear, actionable description
   - **Description**: Detailed requirements
   - **Module**: Select parent module
   - **Assignee**: Choose team member(s)
   - **Priority**: Set importance level
   - **Due Date**: Set deadline
   - **Workflow Stage**: Initial stage (usually "Backlog")

## Assigning Tasks

### Single Assignment
1. Open task details
2. Click "Assign" button
3. Select team member
4. Member receives notification

### Multiple Assignment
1. Select multiple tasks (checkbox)
2. Click "Bulk Actions"
3. Choose "Assign To"
4. Select team member
5. All tasks assigned simultaneously

### Best Practices
- Assign based on expertise and workload
- Check Workload Analytics before assigning
- Avoid overloading team members (>5 active tasks)
- Communicate with assignee before assignment

## Tracking Tasks

### My Work Dashboard
- View all your assigned tasks
- Filter by status, priority, project
- Sort by due date, priority, created date

### Task Status Updates
1. Open task
2. Click current stage
3. Select new stage from dropdown
4. Add comment explaining change (recommended)
5. Task moves in workflow

### Workload Analytics
- Go to Analytics > Workload
- See team member task distribution
- Identify overloaded members
- Redistribute tasks as needed

## Common Issues

**"Cannot Assign Task" Error**
- User may not be project member
- Add user to project first

**Task Not Showing in "My Work"**
- Check if task is assigned to you
- Verify task is not completed
- Clear filters in My Work view

**Task Stuck in Stage**
- Review task requirements
- Check for blockers in comments
- Escalate to manager if needed`,
        tags: ["task", "assign", "management", "workflow", "tracking"],
        metadata: {
            severity: "low",
            category: "workflow",
            successRate: 95,
            viewCount: 0,
            helpfulCount: 0
        }
    },
    {
        title: "Database Connection Timeout Troubleshooting",
        type: "runbook",
        category: "technical",
        summary: "Step-by-step resolution guide for database connection timeout errors.",
        content: `# Database Connection Timeout Resolution

## Symptoms
- Application shows "connection timeout" errors
- Database queries hang indefinitely
- Connection pool exhausted messages
- Users unable to load data

## Severity: HIGH

## Immediate Actions

### Step 1: Verify Database Status
\`\`\`bash
# Check if database is responding
ping db.example.com

# Test database connection
psql -h db.example.com -U dbuser -d workflow_db -c "SELECT 1;"
\`\`\`

Expected: Should return "1" within 1 second
If fails: Database server may be down - escalate to infrastructure team

### Step 2: Check Connection Pool
\`\`\`bash
# View current connections
SELECT count(*) FROM pg_stat_activity;

# View connection pool status
SELECT * FROM pg_stat_activity WHERE state = 'active';
\`\`\`

Expected: <50 active connections
If >50: Connection pool exhausted - proceed to Step 3

### Step 3: Identify Long-Running Queries
\`\`\`sql
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;
\`\`\`

Action: Kill long-running queries
\`\`\`sql
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE now() - pg_stat_activity.query_start > interval '10 minutes';
\`\`\`

### Step 4: Restart Connection Pool
\`\`\`bash
# Backend server
pm2 restart backend

# Or if using Docker
docker-compose restart backend
\`\`\`

### Step 5: Monitor Recovery
- Check application logs for new connections
- Verify users can access system
- Monitor for 15 minutes to confirm stability

## Root Cause Analysis

Common causes:
1. **Unoptimized queries** - Add indexes, optimize joins
2. **Connection leaks** - Ensure connections are properly closed
3. **Insufficient pool size** - Increase maxPoolSize in config
4. **Database server overload** - Scale database resources

## Prevention

### Application Config
\`\`\`javascript
// backend/server.js
mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 50,  // Increase if needed
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});
\`\`\`

### Monitoring
- Set up alerts for connection count >40
- Monitor query execution time
- Track connection pool metrics

## Escalation
If issue persists after 30 minutes:
1. Notify DevOps team
2. Check database server resources (CPU, memory)
3. Consider scaling database instance

## Related Documents
- Database Performance Optimization Guide
- Connection Pool Configuration Best Practices`,
        tags: ["database", "timeout", "connection", "troubleshooting", "technical"],
        metadata: {
            severity: "high",
            category: "technical",
            lastIncidentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            resolutionTime: 15, // 15 minutes
            successRate: 90,
            viewCount: 0,
            helpfulCount: 0
        }
    },
    {
        title: "Understanding Workload Analytics Dashboard",
        type: "guide",
        category: "analytics",
        summary: "Guide to interpreting and acting on workload analytics data.",
        content: `# Workload Analytics Dashboard Guide

## Overview
The Workload Analytics dashboard helps managers identify team capacity issues and redistribute work effectively.

## Accessing the Dashboard
1. Navigate to Analytics > Workload
2. Or go directly to /analytics/workload

## Key Metrics

### Team Member Workload
**What it shows**: Number of active tasks per team member

**How to interpret**:
- **Green (0-3 tasks)**: Healthy workload, can take more tasks
- **Yellow (4-5 tasks)**: At capacity, monitor closely
- **Red (6+ tasks)**: Overloaded, redistribute tasks immediately

**Actions**:
- Click on overloaded member to see their tasks
- Use "Redistribute" button to move tasks
- Consider task complexity, not just count

### Task Distribution by Stage
**What it shows**: How tasks are distributed across workflow stages

**How to interpret**:
- Balanced distribution: Healthy workflow
- Bottleneck: One stage has significantly more tasks
- Empty stages: May indicate process issues

**Actions**:
- Identify bottleneck stages
- Add resources to bottleneck
- Review process for that stage

### Completion Rate Trends
**What it shows**: Tasks completed over time

**How to interpret**:
- Upward trend: Team velocity increasing
- Downward trend: Team slowing down
- Flat line: Consistent pace

**Actions**:
- Investigate downward trends
- Celebrate upward trends
- Adjust sprint planning based on velocity

## Common Scenarios

### Scenario 1: Team Member Overloaded
**Symptoms**: Member has 8+ active tasks, missing deadlines

**Solution**:
1. Review task priorities
2. Move low-priority tasks to other members
3. Extend deadlines if necessary
4. Set up automation to prevent future overload

### Scenario 2: Bottleneck in Review Stage
**Symptoms**: 15+ tasks stuck in Review for >3 days

**Solution**:
1. Assign additional reviewers
2. Set up review rotation
3. Create automation: "Auto-assign reviewer when task enters Review"
4. Consider pair programming to reduce review time

### Scenario 3: Uneven Task Distribution
**Symptoms**: Some members have 1 task, others have 10

**Solution**:
1. Use "Balance Workload" feature
2. Redistribute tasks manually
3. Set up automation: "Alert when member has >5 tasks"
4. Review assignment process

## Best Practices

1. **Check Daily**: Review workload analytics every morning
2. **Proactive Redistribution**: Don't wait for complaints
3. **Consider Complexity**: 1 complex task ≠ 1 simple task
4. **Communicate**: Inform team members before reassigning
5. **Track Trends**: Look for patterns over weeks, not days

## Automation Recommendations

Set up these automations to maintain healthy workload:
- Alert when member exceeds 5 active tasks
- Auto-assign tasks to least busy member
- Weekly workload summary email
- Escalate tasks stuck >3 days

## Related Documents
- Bottleneck Analysis Guide
- Task Assignment Best Practices
- Automation Setup Guide`,
        tags: ["analytics", "workload", "dashboard", "management", "metrics"],
        metadata: {
            severity: "medium",
            category: "analytics",
            successRate: 100,
            viewCount: 0,
            helpfulCount: 0
        }
    },
    {
        title: "Permission Denied Error Resolution",
        type: "incident_report",
        category: "user_management",
        summary: "Common causes and solutions for permission denied errors.",
        content: `# Permission Denied Error - Incident Report

## Incident Overview
Users encountering "Permission Denied" or "Access Denied" errors when trying to perform actions.

## Common Scenarios

### Scenario 1: Cannot Create Project
**Error**: "Permission Denied - Only Admins and Managers can create projects"

**Cause**: User has "Member" role

**Solution**:
1. Verify user's current role: Admin > User Management
2. If user should have Manager access:
   - Click on user
   - Change role to "Manager"
   - Save changes
3. User must log out and log back in for role change to take effect

### Scenario 2: Cannot View Analytics
**Error**: "Access Denied - Insufficient permissions"

**Cause**: Analytics pages are restricted to Admin and Manager roles

**Solution**:
- If user needs analytics access, upgrade to Manager role
- Or create custom analytics views for Members
- Or export reports and share manually

### Scenario 3: Cannot Edit Task
**Error**: "You don't have permission to edit this task"

**Causes**:
1. Task not assigned to user
2. Task in locked project
3. Task completed/archived

**Solutions**:
1. Assign task to user first
2. Check project permissions
3. Reopen task if needed

### Scenario 4: Cannot Access Project
**Error**: "Project not found" or "Access denied"

**Cause**: User not added to project team

**Solution**:
1. Go to project settings
2. Click "Team Members"
3. Add user to project
4. Assign appropriate role (Manager or Member)

## Prevention

### Role Assignment Best Practices
- **Admin**: Organization owners, IT staff (1-2 people)
- **Manager**: Team leads, project managers (10-20% of users)
- **Member**: Individual contributors (majority of users)

### Project Access
- Add users to projects they need to work on
- Review project membership quarterly
- Remove users when they leave projects

### Regular Audits
- Monthly: Review user roles
- Quarterly: Review project access
- Annually: Full permission audit

## Escalation
If user still cannot access after following steps:
1. Check browser console for detailed error
2. Review server logs for permission checks
3. Contact system administrator
4. Create support ticket with error details

## Related Documents
- User Role Permissions Matrix
- Project Access Management Guide
- Security Best Practices`,
        tags: ["permission", "access", "error", "user-management", "troubleshooting"],
        metadata: {
            severity: "medium",
            category: "user_management",
            lastIncidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            resolutionTime: 5, // 5 minutes
            successRate: 100,
            viewCount: 0,
            helpfulCount: 0
        }
    },
    {
        title: "Automation Setup Best Practices",
        type: "best_practice",
        category: "automation",
        summary: "Guidelines for creating effective workflow automations.",
        content: `# Automation Setup Best Practices

## Overview
Automations reduce manual work and ensure consistent processes. Follow these best practices for maximum effectiveness.

## When to Automate

### Good Automation Candidates
✅ Repetitive tasks (done >5 times/week)
✅ Rule-based decisions (if X then Y)
✅ Notifications and reminders
✅ Status updates based on conditions
✅ Task assignments based on workload

### Poor Automation Candidates
❌ Complex decision-making requiring judgment
❌ Tasks requiring human creativity
❌ One-time or rare events
❌ Processes still being defined

## Automation Types

### 1. Task Assignment Automations
**Use Case**: Auto-assign tasks to least busy team member

**Setup**:
1. Go to Admin > Automations
2. Click "New Automation"
3. Trigger: "Task Created"
4. Condition: "Task is unassigned"
5. Action: "Assign to user with fewest active tasks"

**Benefits**:
- Balanced workload
- Faster task pickup
- No manual assignment needed

### 2. Status Update Automations
**Use Case**: Move task to "Testing" when all subtasks complete

**Setup**:
1. Trigger: "Subtask Completed"
2. Condition: "All subtasks are complete"
3. Action: "Update task stage to Testing"

**Benefits**:
- Automatic workflow progression
- No manual stage updates
- Consistent process

### 3. Notification Automations
**Use Case**: Alert manager when task overdue

**Setup**:
1. Trigger: "Scheduled (Daily at 9 AM)"
2. Condition: "Task due date < today AND task not complete"
3. Action: "Send email to task assignee and manager"

**Benefits**:
- Proactive issue detection
- Timely escalation
- No tasks fall through cracks

### 4. Escalation Automations
**Use Case**: Escalate task stuck >3 days

**Setup**:
1. Trigger: "Scheduled (Daily)"
2. Condition: "Task in same stage >3 days"
3. Action: "Add comment mentioning manager + Send notification"

**Benefits**:
- Automatic bottleneck detection
- Manager awareness
- Faster resolution

## Best Practices

### 1. Start Simple
- Begin with 1-2 automations
- Test thoroughly before adding more
- Gradually increase complexity

### 2. Test Before Deploying
- Use test project for automation testing
- Verify all conditions work correctly
- Check notification content

### 3. Document Automations
- Name automations clearly
- Add description explaining purpose
- Document expected behavior

### 4. Monitor Performance
- Review automation logs weekly
- Check for unexpected triggers
- Adjust conditions as needed

### 5. Avoid Automation Loops
⚠️ **Warning**: Don't create circular automations

**Bad Example**:
- Automation A: When task assigned → Update stage to "In Progress"
- Automation B: When stage changes → Reassign task
- Result: Infinite loop!

**Solution**: Add conditions to prevent loops

### 6. Handle Edge Cases
Consider:
- What if user is on vacation?
- What if task has no assignee?
- What if project is archived?

Add conditions to handle these scenarios.

## Common Automation Recipes

### Recipe 1: New Hire Onboarding
**Trigger**: User created with role "Member"
**Actions**:
1. Send welcome email
2. Create onboarding tasks
3. Assign to manager
4. Add to default projects

### Recipe 2: Sprint Planning
**Trigger**: Scheduled (Every Monday 9 AM)
**Actions**:
1. Create weekly sprint project
2. Move backlog tasks to sprint
3. Notify team of sprint start

### Recipe 3: Overload Prevention
**Trigger**: Task assigned
**Condition**: Assignee has >5 active tasks
**Actions**:
1. Send alert to manager
2. Suggest redistribution
3. Log warning

## Troubleshooting

**Automation Not Triggering**
- Check trigger conditions
- Verify automation is enabled
- Review automation logs

**Automation Triggering Too Often**
- Add more specific conditions
- Adjust trigger timing
- Check for loops

**Unexpected Behavior**
- Review automation logs
- Test in isolation
- Simplify conditions

## Related Documents
- Automation API Reference
- Workflow Stage Configuration
- Notification Templates`,
        tags: ["automation", "best-practices", "workflow", "efficiency", "setup"],
        metadata: {
            severity: "low",
            category: "automation",
            successRate: 100,
            viewCount: 0,
            helpfulCount: 0
        }
    }
];

async function seedKnowledgeBase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find an admin user to use as creator
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        console.log(`📝 Using admin user: ${adminUser.name} (${adminUser.email})`);

        // Get organization ID from admin user
        const organizationId = adminUser.organizationId;
        if (!organizationId) {
            console.error('❌ Admin user has no organization. Please assign organization first.');
            process.exit(1);
        }

        // Clear existing documents for this organization (optional)
        const deleteResult = await KnowledgeDocument.deleteMany({ organizationId });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing documents`);

        // Insert sample documents
        const documentsToInsert = sampleDocuments.map(doc => ({
            ...doc,
            organizationId,
            createdBy: adminUser._id,
            status: 'published'
        }));

        const insertedDocs = await KnowledgeDocument.insertMany(documentsToInsert);
        console.log(`✅ Inserted ${insertedDocs.length} knowledge base documents:`);

        insertedDocs.forEach(doc => {
            console.log(`   - ${doc.title} (${doc.type})`);
        });

        console.log('\n🎉 Knowledge base seeded successfully!');
        console.log('\nYou can now:');
        console.log('1. Test the AI Assistant at /ai-assistant');
        console.log('2. Ask questions like:');
        console.log('   - "How do I create a new project?"');
        console.log('   - "What should I do if I get a permission denied error?"');
        console.log('   - "How do I fix database timeout errors?"');
        console.log('   - "How can I understand the workload analytics?"');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding knowledge base:', error);
        process.exit(1);
    }
}

// Run the seed function
seedKnowledgeBase();
