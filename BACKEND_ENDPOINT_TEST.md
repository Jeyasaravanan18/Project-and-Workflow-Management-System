# Testing Extended Metrics Endpoint

## Prerequisites

1. MongoDB running with test data
2. Backend server running on http://localhost:5000
3. Admin user token from authentication

## Test Cases

### 1. Basic Request (Default 30-day range)

```bash
curl -X GET http://localhost:5000/api/analytics/extended-metrics \
  -H "Authorization: Bearer <your_admin_token>" \
  -H "Content-Type: application/json"
```

### 2. 7-Day Range

```bash
curl -X GET "http://localhost:5000/api/analytics/extended-metrics?range=7d" \
  -H "Authorization: Bearer <your_admin_token>" \
  -H "Content-Type: application/json"
```

### 3. 90-Day Range

```bash
curl -X GET "http://localhost:5000/api/analytics/extended-metrics?range=90d" \
  -H "Authorization: Bearer <your_admin_token>" \
  -H "Content-Type: application/json"
```

### 4. All-Time Data

```bash
curl -X GET "http://localhost:5000/api/analytics/extended-metrics?range=all" \
  -H "Authorization: Bearer <your_admin_token>" \
  -H "Content-Type: application/json"
```

## Expected Response

### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "overdueCount": 5,
    "activeUsers": 12,
    "taskVelocity": 23,
    "projectHealthScore": 78,
    "weekOverWeekChange": 15.5
  }
}
```

### Failure (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to fetch metrics",
  "data": {
    "overdueCount": 0,
    "activeUsers": 0,
    "taskVelocity": 0,
    "projectHealthScore": 0,
    "weekOverWeekChange": 0
  }
}
```

## Validation Checklist

### Response Validation

- [ ] HTTP Status: 200 (success) or 500 (error)
- [ ] `success` field is boolean
- [ ] `data` object contains all 5 metrics
- [ ] All metrics are numbers
- [ ] No null/undefined values in data object

### Data Validation

- [ ] `overdueCount` >= 0
- [ ] `activeUsers` >= 0
- [ ] `taskVelocity` >= 0 (integer)
- [ ] `projectHealthScore` 0-100 (integer)
- [ ] `weekOverWeekChange` is decimal (can be negative)

### Edge Cases

- [ ] Empty organization (no projects) returns correct zero values
- [ ] No tasks in period returns taskVelocity = 0
- [ ] No overdue tasks returns overdueCount = 0
- [ ] Zero active users returns activeUsers = 0

## Integration Test with Frontend

1. Start Frontend Server:

   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `/admin/analytics`

3. Verify that the ExtendedMetricsGrid displays:
   - Overdue Tasks card shows correct count
   - Active Users card shows correct count
   - Task Velocity card shows tasks/week
   - Health Score card shows percentage

4. Change date range (7d, 30d, 90d) and verify metrics update

5. Check browser console for any API errors

## Database Query Performance

The endpoint makes the following queries:

1. `Project.find()` - Fast (orgId indexed)
2. `Task.countDocuments()` - Overdue tasks (dueDate, completedAt indexed)
3. `User.countDocuments()` - Active users (onlineStatus, lastActive indexed)
4. `Task.countDocuments()` - Completed tasks (by date range)
5. `Task.find()` - For health score calculation
6. `WorkflowStage.find()` - For completion stage detection
7. `Task.countDocuments()` x2 - For WoW calculation

Total queries: ~10 database operations
Estimated response time: 200-500ms (with indexes)

## Troubleshooting

### Response shows all zeros

- Check if organization has any projects
- Verify MongoDB connection is active
- Check if any tasks exist in database

### Timeout errors

- Check database performance
- Verify indexes are created: `db.tasks.getIndexes()`
- Monitor server logs for slow queries

### 401 Unauthorized

- Verify admin token is valid
- Check token hasn't expired
- Ensure user has 'admin' role

### 500 Internal Server Error

- Check backend server logs
- Verify all models (Task, User, Project, WorkflowStage) are accessible
- Check for MongoDB connection issues
