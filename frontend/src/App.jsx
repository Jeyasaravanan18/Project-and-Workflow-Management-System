import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import styled, { keyframes } from 'styled-components';
import ErrorBoundary from './components/ErrorBoundary';
import KeyboardShortcutsOverlay from './components/KeyboardShortcutsOverlay';

// Eager load critical components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/auth/Login';

// Lazy load everything else
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AcceptInvitation = lazy(() => import('./pages/auth/AcceptInvitation'));

const ProjectsList = lazy(() => import('./pages/manager/ProjectsList'));
const ProjectDashboard = lazy(() => import('./pages/manager/ProjectDashboard'));
const SprintPlannerPage = lazy(() => import('./pages/manager/SprintPlannerPage'));
const ModuleDetail = lazy(() => import('./pages/manager/ModuleDetail'));
const MyWorkDashboard = lazy(() => import('./pages/member/MyWorkDashboard'));
const OrgDashboard = lazy(() => import('./pages/admin/OrgDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const WorkloadAnalytics = lazy(() => import('./pages/admin/WorkloadAnalytics'));
const NotificationCenter = lazy(() => import('./pages/system/NotificationCenter'));
const ActivityLogs = lazy(() => import('./pages/system/ActivityLogs'));
const BottleneckAnalysis = lazy(() => import('./pages/system/BottleneckAnalysis'));
const Profile = lazy(() => import('./pages/system/Profile'));
const NotFound = lazy(() => import('./pages/system/NotFound'));
const Integrations = lazy(() => import('./pages/admin/IntegrationsPage'));
const Unauthorized = lazy(() => import('./pages/system/Unauthorized'));
const Automations = lazy(() => import('./pages/admin/Automations'));
const AutomationBuilder = lazy(() => import('./pages/admin/AutomationBuilder'));
const AutomationTemplates = lazy(() => import('./pages/admin/AutomationTemplates'));
const AutomationHistory = lazy(() => import('./pages/admin/AutomationHistory'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const ProjectScaffolderPage = lazy(() => import('./pages/admin/ProjectScaffolderPage'));
const PersonalPerformance = lazy(() => import('./pages/PersonalPerformance'));

// Role-based redirect component
const RoleBasedRedirect = () => {
    const { user } = useAuth();

    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    } else if (user?.role === 'manager') {
        return <Navigate to="/projects" replace />;
    } else {
        return <Navigate to="/my-work" replace />;
    }
};

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #f97316;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
`;

const LoadingContainer = styled.div`
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f8fafc;
`;

const PageLoader = () => (
    <LoadingContainer>
        <Spinner />
    </LoadingContainer>
);

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <CustomThemeProvider>
                    <KeyboardShortcutsOverlay />
                    <SocketProvider>
                        <Toaster
                            position="top-right"
                            toastOptions={{ style: { zIndex: 9999 } }}
                        />
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />
                                <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

                                <Route element={<ProtectedRoute />}>
                                    <Route element={<Layout />}>
                                        <Route path="/" element={<RoleBasedRedirect />} />
                                        <Route path="/unauthorized" element={<Unauthorized />} />
                                        <Route path="/notifications" element={<NotificationCenter />} />
                                        <Route path="/activity-logs" element={<ActivityLogs />} />
                                        <Route path="/profile" element={<Profile />} />
                                        <Route path="/ai-assistant" element={<AIAssistant />} />

                                        {/* All Authenticated Users - Role-based data filtering */}
                                        <Route path="/analytics/workload" element={<WorkloadAnalytics />} />
                                        <Route path="/analytics/performance" element={<PersonalPerformance />} />

                                        {/* Member & Manager Routes - Task Work */}
                                        <Route element={<ProtectedRoute allowedRoles={['member', 'manager']} />}>
                                            <Route path="/my-work" element={<MyWorkDashboard />} />
                                        </Route>

                                        {/* Admin Routes */}
                                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                            <Route path="/admin" element={<OrgDashboard />} />
                                            <Route path="/admin/users" element={<UserManagement />} />
                                            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                                            <Route path="/admin/integrations" element={<Integrations />} />
                                        </Route>

                                        {/* Manager & Admin Routes - Projects & Planning */}
                                        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                                            <Route path="/projects" element={<ProjectsList />} />
                                            <Route path="/sprint-planner" element={<SprintPlannerPage />} />
                                            <Route path="/projects/:id" element={<ProjectDashboard />} />
                                            <Route path="/projects/:projectId/modules/:moduleId" element={<ModuleDetail />} />
                                            <Route path="/analytics/bottlenecks" element={<BottleneckAnalysis />} />

                                            {/* Automation Routes */}
                                            <Route path="/admin/automations" element={<Automations />} />
                                            <Route path="/admin/automations/new" element={<AutomationBuilder />} />
                                            <Route path="/admin/automations/templates" element={<AutomationTemplates />} />
                                            <Route path="/admin/automations/:id" element={<AutomationBuilder />} />
                                            <Route path="/admin/automations/:id/history" element={<AutomationHistory />} />
                                            <Route path="/admin/project-scaffolder" element={<ProjectScaffolderPage />} />
                                        </Route>

                                        {/* 404 catch-all inside layout */}
                                        <Route path="*" element={<NotFound />} />
                                    </Route>
                                </Route>

                                {/* 404 for unauthenticated routes */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </SocketProvider>
                </CustomThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
