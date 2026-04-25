# Implementation Guide: Analytics & Audit Trail Dashboard Enhancements

## Overview

This guide walks through implementing the recommended enhancements to the Analytics Dashboard and Activity Logs pages.

---

## PHASE 1: Quick Wins (Immediate Implementation)

### 1. Replace AnalyticsDashboard.jsx with Enhanced Version

**Step 1: Backup Current File**

```bash
cp frontend/src/pages/admin/AnalyticsDashboard.jsx frontend/src/pages/admin/AnalyticsDashboard.jsx.backup
```

**Step 2: Replace with Enhanced Version**

```bash
cp frontend/src/pages/admin/AnalyticsDashboard_ENHANCED.jsx frontend/src/pages/admin/AnalyticsDashboard.jsx
```

**Key Improvements in Enhanced Version:**

#### A. Removed Debug Code (Line 289)

```javascript
// ❌ BEFORE: Shows JSON in UI
<p style={{ fontSize: '12px', marginTop: '8px' }}>
    Debug: tasksByStatus = {JSON.stringify(data.tasksByStatus)}
</p>

// ✅ AFTER: Clean message
<p style={{ fontSize: '12px', marginTop: '8px', color: '#94a3b8' }}>
    Create tasks to see distribution
</p>
```

#### B. Added New KPI Cards

- **Overdue Tasks Counter** (with alert when > 0)
- **Active Users** (from new `/analytics/extended-metrics` endpoint)
- **Task Velocity** (tasks completed per week)
- **Project Health Score** (calculated metric)

#### C. Added Week-over-Week (WoW) Trending

```javascript
<TrendIndicator $positive={data.weekOverWeekChange >= 0}>
  WoW: {Math.abs(data.weekOverWeekChange).toFixed(1)}%
</TrendIndicator>
```

#### D. Overdue Alert Notification

```javascript
{
  data.overdueCount > 0 && (
    <OverdueNotification>
      <h4>⚠️ {data.overdueCount} Overdue Tasks</h4>
      <p>These tasks have exceeded their due dates.</p>
      <NotificationAction
        onClick={() => navigate("/admin/tasks?filter=overdue")}
      >
        View Overdue
      </NotificationAction>
    </OverdueNotification>
  );
}
```

#### E. New Extended Metrics API Call

```javascript
// Added to fetchData():
const metricsRes = await api.get("/analytics/extended-metrics", {
  params: { range: dateRange },
});
```

**What Backend API Needs to Support:**

1. `/analytics/tasks-by-status` - ✅ Already exists
2. `/analytics/project-progress` - ✅ Already exists
3. `/analytics/avg-duration` - ✅ Already exists
4. `/analytics/extended-metrics` - **⚠️ NEEDS IMPLEMENTATION**

---

### 2. Implement Backend Endpoint: `/analytics/extended-metrics`

**File:** `backend/routes/analyticsRoutes.js`

```javascript
// Add this route
router.get("/extended-metrics", auth, async (req, res) => {
  try {
    const { range = "30d" } = req.query;
    const orgId = req.user.organizationId;

    // Calculate date range
    const dateFilter = getDateRangeFilter(range);

    // 1. Count overdue tasks
    const overdueCount = await Task.countDocuments({
      organization: orgId,
      dueDate: { $lt: new Date() },
      status: { $ne: "done" },
    });

    // 2. Count active users (last 5 minutes)
    const activeUsers = await User.countDocuments({
      organization: orgId,
      lastActivity: { $gt: new Date(Date.now() - 5 * 60 * 1000) },
    });

    // 3. Calculate task velocity (tasks completed per week)
    const completedTasks = await Task.countDocuments({
      organization: orgId,
      completedAt: { $gte: dateFilter.$gte },
      status: "done",
    });
    const weeks = calculateWeeks(range);
    const taskVelocity = weeks > 0 ? Math.round(completedTasks / weeks) : 0;

    // 4. Calculate project health score (0-100)
    const projects = await Project.find({ organization: orgId });
    let totalScore = 0;
    const projectScores = [];

    for (const project of projects) {
      const tasks = await Task.find({ project: project._id });
      const completed = tasks.filter((t) => t.status === "done").length;
      const onTime = tasks.filter(
        (t) => t.completedAt && t.completedAt <= t.dueDate,
      ).length;

      const completionRate = tasks.length > 0 ? completed / tasks.length : 0;
      const onTimeRate = completed > 0 ? onTime / completed : 0;
      const score = (completionRate * 70 + onTimeRate * 30) * 100;

      projectScores.push(score);
      totalScore += score;
    }
    const projectHealthScore =
      projects.length > 0 ? Math.round(totalScore / projects.length) : 0;

    // 5. Calculate week-over-week change
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekCompleted = await Task.countDocuments({
      organization: orgId,
      completedAt: { $gte: thisWeekStart },
      status: "done",
    });
    const lastWeekCompleted = await Task.countDocuments({
      organization: orgId,
      completedAt: { $gte: lastWeekStart, $lt: thisWeekStart },
      status: "done",
    });
    const weekOverWeekChange =
      lastWeekCompleted > 0
        ? ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100
        : 0;

    res.json({
      success: true,
      data: {
        overdueCount,
        activeUsers,
        taskVelocity,
        projectHealthScore,
        weekOverWeekChange,
      },
    });
  } catch (error) {
    console.error("Error fetching extended metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
      data: {
        overdueCount: 0,
        activeUsers: 0,
        taskVelocity: 0,
        projectHealthScore: 0,
        weekOverWeekChange: 0,
      },
    });
  }
});

// Helper function to calculate weeks from range
function calculateWeeks(range) {
  switch (range) {
    case "7d":
      return 1;
    case "30d":
      return 4.3;
    case "90d":
      return 12.9;
    default:
      return 52;
  }
}
```

---

### 3. Add ChangeDetailsModal to ActivityLogs

**File:** `frontend/src/pages/admin/ActivityLogs.jsx`

```javascript
// Replace existing ActivityLogs.jsx with:
import React, { useState } from "react";
import AuditTrailDashboard from "../../components/AuditTrailDashboard";
import ChangeDetailsModal from "../../components/ChangeDetailsModal";

const ActivityLogs = () => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  return (
    <>
      <AuditTrailDashboard onViewDetails={handleViewDetails} />
      <ChangeDetailsModal
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ActivityLogs;
```

**Update AuditTrailDashboard.jsx:**

Add click handler to activity rows (around line 250):

```javascript
// BEFORE:
<tr key={activity.id || index}>
    <td>...</td>
    ...
</tr>

// AFTER:
<tr
    key={activity.id || index}
    onClick={() => onViewDetails && onViewDetails(activity)}
    style={{ cursor: onViewDetails ? 'pointer' : 'default' }}
>
    <td>...</td>
    ...
</tr>
```

Add `onViewDetails` prop to component signature:

```javascript
const AuditTrailDashboard = ({ onViewDetails }) => {
  // ... rest of component
};
```

---

### 4. Update Backend: Add Change Details to Audit Trail

**File:** `backend/models/ActivityLog.js`

Add these fields to the schema:

```javascript
const activityLogSchema = new Schema({
  // ... existing fields
  changeDetails: [
    {
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
    },
  ],
  affectedRecords: { type: Number, default: 1 },
  source: {
    type: String,
    enum: ["API", "UI", "Import", "Bulk"],
    default: "API",
  },
  environment: {
    type: String,
    enum: ["production", "staging"],
    default: "production",
  },
  duration: { type: Number, default: 0 }, // milliseconds
});
```

**Update Activity Logging Middleware:**

File: `backend/middleware/activityLogger.js`

```javascript
const logActivity = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Log the activity with change details
    if (
      req.user &&
      (req.method === "PUT" ||
        req.method === "PATCH" ||
        req.method === "DELETE")
    ) {
      const activity = new ActivityLog({
        userId: req.user._id,
        organization: req.user.organizationId,
        action: `${req.method} ${req.originalUrl}`,
        actionType: getActionType(req.method),
        entityType: getEntityType(req.originalUrl),
        entityName: getEntityName(data),
        timestamp: new Date(),
        ipAddress: req.ip,
        severity: getSeverity(req.method),
        changeDetails: extractChanges(req.body, data),
        affectedRecords: getAffectedCount(data),
        source: detectSource(req),
        environment: process.env.NODE_ENV || "production",
      });
      activity
        .save()
        .catch((err) => console.error("Error logging activity:", err));
    }

    return originalJson.call(this, data);
  };

  next();
};

function extractChanges(oldData, newData) {
  const changes = [];
  const trackableFields = [
    "title",
    "status",
    "priority",
    "assignee",
    "dueDate",
    "description",
  ];

  trackableFields.forEach((field) => {
    if (oldData[field] !== newData[field]) {
      changes.push({
        field,
        oldValue: oldData[field],
        newValue: newData[field],
      });
    }
  });

  return changes;
}

function getAffectedCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data?.updatedCount) return data.updatedCount;
  return 1;
}

function detectSource(req) {
  if (req.headers["x-api-key"]) return "API";
  if (req.body?.bulk === true) return "Bulk";
  return "UI";
}
```

---

## PHASE 2: Enhanced Features (Week 2)

### 5. Add Custom Date Range Picker

Create component: `frontend/src/components/CustomDateRangePicker.jsx`

```javascript
import React, { useState } from "react";
import styled from "styled-components";
import { Calendar } from "lucide-react";

const CustomDateRangePicker = ({ onApply, initialStart, initialEnd }) => {
  const [startDate, setStartDate] = useState(initialStart || "");
  const [endDate, setEndDate] = useState(initialEnd || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    onApply({ startDate, endDate });
    setIsOpen(false);
  };

  return (
    <Container>
      <Trigger onClick={() => setIsOpen(!isOpen)}>
        <Calendar size={16} />
        Custom Range
      </Trigger>

      {isOpen && (
        <PickerPanel>
          <PickerGroup>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </PickerGroup>

          <PickerGroup>
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </PickerGroup>

          <ApplyBtn onClick={handleApply}>Apply</ApplyBtn>
        </PickerPanel>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${(props) => props.theme.bg.card};
  border: 2px solid ${(props) => props.theme.border};
  border-radius: 10px;
  color: ${(props) => props.theme.text.secondary};
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #f97316;
  }
`;

const PickerPanel = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: ${(props) => props.theme.bg.card};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 12px;
  padding: 16px;
  min-width: 280px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const PickerGroup = styled.div`
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${(props) => props.theme.text.secondary};
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid ${(props) => props.theme.border};
    border-radius: 8px;
    background: ${(props) => props.theme.bg.primary};
    color: ${(props) => props.theme.text.primary};
    font-size: 0.875rem;
  }
`;

const ApplyBtn = styled.button`
  width: 100%;
  padding: 10px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #ea580c;
  }
`;

export default CustomDateRangePicker;
```

---

## PHASE 3: Advanced Features (Week 3-4)

### 6. Compliance Reporting (SOC2/GDPR)

Create utility: `backend/utils/complianceReport.js`

```javascript
const generateComplianceReport = async (
  organizationId,
  reportType,
  dateRange,
) => {
  const activities = await ActivityLog.find({
    organization: organizationId,
    timestamp: { $gte: dateRange.start, $lte: dateRange.end },
  }).populate("userId", "email name");

  const reportData = {
    reportDate: new Date(),
    reportType,
    organizationId,
    dateRange,
    summary: {
      totalEvents: activities.length,
      criticalEvents: activities.filter((a) => a.severity === "critical")
        .length,
      securityEvents: activities.filter((a) => a.isSecurityEvent).length,
      uniqueUsers: [...new Set(activities.map((a) => a.userId._id))].length,
    },
    events: activities.map((a) => ({
      timestamp: a.timestamp,
      user: a.userId.email,
      action: a.action,
      entity: a.entityType,
      ipAddress: a.ipAddress,
      severity: a.severity,
      changeDetails: a.changeDetails,
    })),
  };

  if (reportType === "GDPR") {
    return generateGDPRReport(reportData);
  } else if (reportType === "SOC2") {
    return generateSOC2Report(reportData);
  }

  return reportData;
};

const generateGDPRReport = (data) => {
  return {
    ...data,
    reportType: "GDPR Data Processing Report",
    dataCategory: "Personal Data Processing Activities",
    retentionPolicy: "Data retained for 90 days per GDPR compliance",
    dataAccessLog: data.events.filter((e) =>
      ["view", "read", "export"].includes(e.action),
    ),
  };
};

const generateSOC2Report = (data) => {
  return {
    ...data,
    reportType: "SOC2 Compliance Report",
    accessControls: countByType(data.events, "auth"),
    changeManagement: countByType(data.events, "update"),
    securityEvents: data.summary.securityEvents,
    incidentResponse: data.events.filter(
      (e) => e.severity === "critical" || e.severity === "high",
    ),
  };
};

module.exports = { generateComplianceReport };
```

---

## Testing the Enhancements

### Test Overdue Task Alert

```bash
# Add a task with dueDate in the past
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Overdue Task",
    "dueDate": "2024-01-01",
    "status": "pending"
  }'

# Check if alert appears on Analytics Dashboard
# Should show: "⚠️ 1 Overdue Tasks"
```

### Test Change Details Modal

```bash
# Update a task to trigger change log
curl -X PATCH http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "status": "in-progress"
  }'

# Go to Admin > Activity Logs
# Click on the update event to see before/after values
```

### Test Extended Metrics Endpoint

```bash
curl -X GET http://localhost:5000/api/analytics/extended-metrics?range=30d \
  -H "Authorization: Bearer TOKEN"

# Should return:
# {
#   "success": true,
#   "data": {
#     "overdueCount": 3,
#     "activeUsers": 12,
#     "taskVelocity": 8,
#     "projectHealthScore": 85,
#     "weekOverWeekChange": 12.5
#   }
# }
```

---

## Deployment Checklist

- [ ] Backup current AnalyticsDashboard.jsx
- [ ] Deploy enhanced AnalyticsDashboard.jsx
- [ ] Create `/analytics/extended-metrics` backend endpoint
- [ ] Update ActivityLog model with changeDetails fields
- [ ] Deploy ChangeDetailsModal component
- [ ] Update ActivityLogs.jsx wrapper component
- [ ] Test all features with sample data
- [ ] Update database with new field indexes for performance
- [ ] Monitor API response times (extended-metrics call)
- [ ] Document new API endpoints in API_DOCS.md
- [ ] Deploy to staging first, verify functionality
- [ ] Schedule production deployment during low-traffic window

---

## Performance Considerations

### Database Indexes Needed

```javascript
// Add to models:
activityLogSchema.index({ organization: 1, timestamp: -1 });
activityLogSchema.index({ organization: 1, severity: 1 });
taskSchema.index({ organization: 1, status: 1, dueDate: 1 });
userSchema.index({ organization: 1, lastActivity: -1 });
```

### Caching Strategy

```javascript
// Cache extended metrics for 5 minutes
const cacheKey = `analytics:extended-metrics:${orgId}:${range}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... fetch data ...

await redis.setex(cacheKey, 300, JSON.stringify(data));
```

---

## Summary of Changes

| Component                | Change                              | Impact                         | Effort        |
| ------------------------ | ----------------------------------- | ------------------------------ | ------------- |
| AnalyticsDashboard       | Remove debug code, add metrics      | 🟢 Critical fix                | 15 min        |
| AnalyticsDashboard       | Add overdue alert                   | 🟡 Nice to have                | 30 min        |
| ActivityLogs             | Add ChangeDetailsModal              | 🟢 Critical feature            | 45 min        |
| Backend                  | Implement extended-metrics endpoint | 🟡 Required for Phase 1        | 1 hour        |
| Backend                  | Add changeDetails to ActivityLog    | 🟡 Required for change history | 1.5 hours     |
| **Total Estimated Time** |                                     |                                | **4-5 hours** |

---

## Next Steps

1. **Review** this implementation guide with team
2. **Prioritize** features based on business needs
3. **Assign** tasks to developers
4. **Create** pull requests following your review process
5. **Test** thoroughly in staging environment
6. **Deploy** to production with monitoring
7. **Gather** user feedback and iterate
