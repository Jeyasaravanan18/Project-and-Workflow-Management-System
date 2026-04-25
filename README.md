# Harmonic Halo - Enterprise Workflow Management System

An industrial-grade SaaS platform for enterprise workflow automation, project management, and team collaboration.

## 🚀 Features

### Core Functionality
-   **Multi-Role Architecture**: Granular access control for Admin, Manager, and Member roles.
-   **Project Management**: Kanban boards, list views, and module-based organization.
-   **Task Automation**: Advanced task tracking with priorities, due dates, and dependencies.
-   **Real-Time Collaboration**: Live task updates, comments, and notifications via Socket.IO.

### Enterprise Modules (Add-ons)
-   **Time Tracking**: Built-in time logger with billable hours and manual entry.
-   **Global Search**: Instant search across projects, tasks, and users.
-   **Data Export**: CSV export functionality for tasks and reports.
-   **Integrations**: API Key management and Webhook event subscriptions.
-   **File Management**: Secure file attachments for tasks.

### Analytics & Reporting
-   **Admin Dashboard**: High-level organization metrics and user activity logs.
-   **Workload Analysis**: Visual breakdown of team capacity and task distribution.
-   **Bottleneck Detection**: Identify stalled tasks and project risks.

## 🛠 Tech Stack

-   **Frontend**: React (Vite), Styled-Components, Lucide Icons, Recharts.
-   **Backend**: Node.js, Express, MongoDB (Mongoose), Redis.
-   **DevOps**: Docker, Nginx, GitHub Actions (planned).

## 📦 Installation

### Prerequisites
-   Node.js v18+
-   MongoDB
-   Redis

### 1. Clone & Install
```bash
git clone https://github.com/your-org/harmonic-halo.git
cd harmonic-halo
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB/Redis credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Docker Deployment
```bash
docker-compose up --build
```

## 🔑 Default Roles

-   **Admin**: Full access to organization settings, user management, and integrations.
-   **Manager**: Can create projects, manage teams, and view analytics.
-   **Member**: Focus on assigned tasks and "My Work" dashboard.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License.
