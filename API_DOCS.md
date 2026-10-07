# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication
All endpoints (except auth) require a Bearer Token in the header:
`Authorization: Bearer <your_jwt_token>`

## 📚 Core Resources

### Auth
- `POST /auth/register`: Register new organization (Admin only initial setup).
- `POST /auth/login`: Login user.
- `POST /auth/refresh-token`: Refresh access token.

### Projects
- `GET /projects`: List projects.
- `POST /projects`: Create project.
- `GET /projects/:id`: Get project details.

### Tasks
- `GET /tasks`: List tasks (filters: projectId, status, priority).
- `POST /tasks`: Create task.
- `PATCH /tasks/:id`: Update task.

### Users
- `GET /users`: List organization users.
- `POST /users/invite`: Invite new member.

## 🔌 Interactions

### Search
- `GET /search?query=...`: Global search across all entities.

### Export
- `GET /export/tasks?format=csv`: Download task list as CSV.

### File Attachments
- `POST /attachments`: Upload file (multipart/form-data).
- `GET /attachments/:model/:id`: List attachments for an entity.

### Time Tracking
- `POST /time/start`: Start timer for a task.
- `POST /time/stop`: Stop active timer.
- `GET /time`: List time entries.

## 🔐 Integrations

### API Keys
- `GET /keys`: List active API keys.
- `POST /keys`: Generate new API key.
- `DELETE /keys/:id`: Revoke key.

### Webhooks
- `POST /webhooks`: Register webhook URL.
- **Events**: `task.created`, `task.completed`, `comment.created`.
- **Payload Signature**: `X-ProjectFlow-Signature` (HMAC-SHA256).
