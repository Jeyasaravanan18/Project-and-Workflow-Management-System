import { useEffect, useState } from 'react';
import api from '../../services/api';
import AnalyticsChart from '../../components/AnalyticsChart';
import PinnableDashboardCard, { PinnedCardsBar } from '../../components/PinnableDashboardCard';
import { Users, FolderKanban, ListTodo, Activity, TrendingUp, RefreshCw, BarChart3, UserPlus, Plus, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { formatDistanceToNow } from 'date-fns';

const OrgDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        usersCount: 0,
        projectsCount: 0,
        tasksCount: 0,
        activeProjects: 0
    });
    const [workloadData, setWorkloadData] = useState([]);
    const [workloadSummary, setWorkloadSummary] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [usersRes, projectsRes, workloadRes, statsRes, activitiesRes] = await Promise.all([
                api.get('/users'),
                api.get('/projects'),
                api.get('/analytics/workload'),
                api.get('/analytics/overview'),
                api.get('/analytics/recent-activities')
            ]);

            // Validate all responses as arrays
            const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
            const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data?.data || []);

            // FIXED: Backend returns data nested in data.data
            const workloadResponse = workloadRes.data?.data || { topLoaded: [], summary: null };
            const statsData = statsRes.data || {};
            const activitiesData = Array.isArray(activitiesRes.data) ? activitiesRes.data : (activitiesRes.data?.data || []);

            setStats({
                usersCount: usersData.length,
                projectsCount: projectsData.length,
                activeProjects: projectsData.filter(p => p.status === 'active').length,
                tasksCount: statsData.activeTasks || 0,
                completedTasks: statsData.completedTasks || 0,
                totalTasks: statsData.totalTasks || 0,
                completionRate: statsData.completionRate || 0
            });

            // Store summary for display
            setWorkloadSummary(workloadResponse.summary);

            // Display top 8 most loaded members for the chart
            // Display top 8 most loaded members for the chart
            const topLoaded = Array.isArray(workloadResponse.topLoaded) ? workloadResponse.topLoaded : [];
            setWorkloadData(topLoaded.slice(0, 8).map(u => ({
                name: u.name || 'Unknown',
                tasks: u.activeTasks,
                status: u.status
            })));


            // Real activity data with formatted timestamps
            const iconMap = {
                'FolderKanban': FolderKanban,
                'CheckCircle2': CheckCircle2,
                'UserPlus': UserPlus,
                'Activity': Activity
            };

            setRecentActivity(activitiesData.map(activity => ({
                type: activity.type,
                message: activity.message,
                time: formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }),
                icon: iconMap[activity.icon] || Activity,
                color: activity.color
            })));
        } catch (error) {
            console.error(error);
            // Set safe defaults on error
            setStats({
                usersCount: 0,
                projectsCount: 0,
                activeProjects: 0,
                tasksCount: 0,
                completedTasks: 0,
                totalTasks: 0,
                completionRate: 0
            });
            setWorkloadData([]);
            setWorkloadSummary(null);
            setRecentActivity([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <Container>
                <Loading>
                    <Spinner />
                    <p>Loading organization overview...</p>
                </Loading>
            </Container>
        );
    }

    const completionRate = stats.completionRate || 0;

    return (
        <Container>
            {/* Hero Section */}
            <HeroSection>
                <HeroContent>
                    <WelcomeText>Organization Dashboard</WelcomeText>
                    <SubText>Monitor your organization's performance and activity</SubText>
                </HeroContent>
                <HeroActions>
                    <RefreshButton onClick={fetchData} disabled={refreshing}>
                        <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                        Refresh Data
                    </RefreshButton>
                </HeroActions>
            </HeroSection>

            {/* Pinned Cards Summary Bar */}
            <PinnedCardsBar allCards={[
                { id: 'stat-team-members',   title: 'Team Members',   value: stats.usersCount,     subtitle: 'Total active users',       color: '#475569' },
                { id: 'stat-active-projects',title: 'Active Projects', value: stats.activeProjects,  subtitle: `of ${stats.projectsCount} total`, color: '#22c55e' },
                { id: 'stat-active-tasks',   title: 'Active Tasks',   value: stats.tasksCount,     subtitle: 'Currently in progress',    color: '#0F62FE' },
                { id: 'stat-completion-rate',title: 'Completion Rate', value: `${completionRate}%`, subtitle: 'Project activity',          color: '#6366f1' },
            ]} />
            {/* Main Stats Grid */}
            <MainGrid>
                {/* Left Column - Stats Cards */}
                <LeftSection>
                    <StatsGrid>
                        <PinnableDashboardCard cardId="stat-team-members">
                        <StatCard $delay={0} color="#475569" onClick={() => navigate('/admin/users')}>
                            <StatContent>
                                <StatIcon color="#475569">
                                    <Users size={28} />
                                </StatIcon>
                                <StatDetails>
                                    <StatValue>{stats.usersCount}</StatValue>
                                    <StatLabel>Team Members</StatLabel>
                                    <StatTrend>Total active users</StatTrend>
                                </StatDetails>
                            </StatContent>
                        </StatCard>
                        </PinnableDashboardCard>

                        <PinnableDashboardCard cardId="stat-active-projects">
                        <StatCard $delay={0.1} color="#22c55e" onClick={() => navigate('/projects')}>
                            <StatContent>
                                <StatIcon color="#22c55e">
                                    <FolderKanban size={28} />
                                </StatIcon>
                                <StatDetails>
                                    <StatValue>{stats.activeProjects}</StatValue>
                                    <StatLabel>Active Projects</StatLabel>
                                    <StatTrend>of {stats.projectsCount} total</StatTrend>
                                </StatDetails>
                            </StatContent>
                        </StatCard>
                        </PinnableDashboardCard>

                        <PinnableDashboardCard cardId="stat-active-tasks">
                        <StatCard $delay={0.2} color="#0F62FE">
                            <StatContent>
                                <StatIcon color="#0F62FE">
                                    <ListTodo size={28} />
                                </StatIcon>
                                <StatDetails>
                                    <StatValue>{stats.tasksCount}</StatValue>
                                    <StatLabel>Active Tasks</StatLabel>
                                    <StatTrend>Currently in progress</StatTrend>
                                </StatDetails>
                            </StatContent>
                        </StatCard>
                        </PinnableDashboardCard>

                        <PinnableDashboardCard cardId="stat-completion-rate">
                        <StatCard $delay={0.3} color="#6366f1">
                            <StatContent>
                                <StatIcon color="#6366f1">
                                    <TrendingUp size={28} />
                                </StatIcon>
                                <StatDetails>
                                    <StatValue>{completionRate}%</StatValue>
                                    <StatLabel>Completion Rate</StatLabel>
                                    <StatTrend>Project activity</StatTrend>
                                </StatDetails>
                            </StatContent>
                        </StatCard>
                        </PinnableDashboardCard>
                    </StatsGrid>

                    {/* Workload Chart */}
                    <ChartCard>
                        <CardHeader>
                            <BarChart3 size={20} />
                            <h3>Team Workload Distribution</h3>
                        </CardHeader>

                        {/* Summary Stats */}
                        {workloadSummary && (
                            <WorkloadSummary>
                                <SummaryItem>
                                    <SummaryLabel>Total Members</SummaryLabel>
                                    <SummaryValue>{workloadSummary.totalMembers}</SummaryValue>
                                </SummaryItem>
                                <SummaryDivider />
                                <SummaryItem color="#ef4444">
                                    <SummaryLabel>Overloaded</SummaryLabel>
                                    <SummaryValue>{workloadSummary.overloaded}</SummaryValue>
                                </SummaryItem>
                                <SummaryDivider />
                                <SummaryItem color="#22c55e">
                                    <SummaryLabel>Optimal</SummaryLabel>
                                    <SummaryValue>{workloadSummary.optimal}</SummaryValue>
                                </SummaryItem>
                                <SummaryDivider />
                                <SummaryItem color="#94a3b8">
                                    <SummaryLabel>Idle</SummaryLabel>
                                    <SummaryValue>{workloadSummary.idle}</SummaryValue>
                                </SummaryItem>
                                <SummaryDivider />
                                <SummaryItem>
                                    <SummaryLabel>Avg Tasks</SummaryLabel>
                                    <SummaryValue>{workloadSummary.avgTasksPerMember}</SummaryValue>
                                </SummaryItem>
                            </WorkloadSummary>
                        )}

                        {workloadData.length > 0 ? (
                            <>
                                <ChartLabel>Top {workloadData.length} Most Loaded Members</ChartLabel>
                                <ChartWrapper>
                                    <AnalyticsChart
                                        data={workloadData}
                                        type="bar"
                                        dataKey="tasks"
                                        color="#475569"
                                    />
                                </ChartWrapper>
                                {workloadSummary && workloadSummary.totalMembers > 8 && (
                                    <ViewMoreButton onClick={() => navigate('/analytics/workload')}>
                                        View All {workloadSummary.totalMembers} Members →
                                    </ViewMoreButton>
                                )}
                            </>
                        ) : (
                            <EmptyChart>
                                <BarChart3 size={48} />
                                <p>No workload data available</p>
                            </EmptyChart>
                        )}
                    </ChartCard>
                </LeftSection>

                {/* Right Column - Activity & Quick Actions */}
                <RightSection>
                    {/* Quick Actions */}
                    <QuickActionsCard>
                        <CardHeader>
                            <Zap size={20} style={{ color: '#0F62FE' }} />
                            <h3>Quick Actions</h3>
                        </CardHeader>
                        <ActionsList>
                            <ActionButton onClick={() => navigate('/admin/users')}>
                                <ActionIcon color="#475569">
                                    <UserPlus size={20} />
                                </ActionIcon>
                                <ActionText>
                                    <h4>Invite Team Member</h4>
                                    <p>Add new users to your organization</p>
                                </ActionText>
                            </ActionButton>
                            <ActionButton onClick={() => navigate('/projects')}>
                                <ActionIcon color="#22c55e">
                                    <Plus size={20} />
                                </ActionIcon>
                                <ActionText>
                                    <h4>Create Project</h4>
                                    <p>Start a new project</p>
                                </ActionText>
                            </ActionButton>
                        </ActionsList>
                    </QuickActionsCard>

                    {/* Activity Feed */}
                    <ActivityCard>
                        <CardHeader>
                            <Activity size={20} />
                            <h3>Recent Activity</h3>
                        </CardHeader>
                        <ActivityList>
                            {recentActivity.map((activity, index) => (
                                <ActivityItem key={index} $delay={index * 0.1}>
                                    <ActivityIcon color={activity.color}>
                                        <activity.icon size={16} />
                                    </ActivityIcon>
                                    <ActivityContent>
                                        <ActivityMessage>{activity.message}</ActivityMessage>
                                        <ActivityTime>{activity.time}</ActivityTime>
                                    </ActivityContent>
                                </ActivityItem>
                            ))}
                        </ActivityList>
                    </ActivityCard>
                </RightSection>
            </MainGrid>
        </Container >
    );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
`;

// Styled Components
const Container = styled.div`
    padding: 32px;
    background: ${props => props.theme.bg.primary};
    min-height: 100vh;
    max-width: 1600px;
    margin: 0 auto;
`;

const Loading = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 70vh;
    color: ${props => props.theme.text.secondary};
    p { margin-top: 20px; font-size: 1rem; }
`;

const Spinner = styled.div`
    width: 50px;
    height: 50px;
    border: 4px solid ${props => props.theme.border};
    border-top-color: ${props => props.theme.text.secondary};
    border-radius: 50%;
    animation: ${rotate} 1s linear infinite;
`;

const HeroSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    animation: ${fadeIn} 0.5s ease-out;
`;

const HeroContent = styled.div``;

const WelcomeText = styled.h1`
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin-bottom: 8px;
`;

const SubText = styled.p`
    font-size: 1rem;
    color: ${props => props.theme.text.secondary};
`;

const HeroActions = styled.div`
    display: flex;
    gap: 12px;
`;

const RefreshButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #0F62FE; /* Carbon Blue */
    color: white; /* Carbon */
    border: none; /* Carbon */
    border-radius: 0; /* Carbon */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: none; /* Carbon */

    &:hover:not(:disabled) {
        background: #0043CE; /* Carbon Blue Hover */
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spin { animation: ${rotate} 1s linear infinite; }
`;

const MainGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 24px;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
    }
`;

const LeftSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const RightSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
`;

const StatCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    padding: 24px;
    border: 1px solid ${props => props.theme.border};
    box-shadow: none; /* Carbon */
    transition: all 0.3s ease;
    animation: ${fadeIn} 0.5s ease-out;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;
    animation-fill-mode: forwards;
    cursor: ${props => props.onClick ? 'pointer' : 'default'};

    &:hover {
        background: ${p => p.theme.bg.tertiary};
        border-color: ${props => props.color};
    }
`;

const StatContent = styled.div`
    display: flex;
    gap: 16px;
    align-items: start;
`;

const StatIcon = styled.div`
    width: 56px;
    height: 56px;
    background: transparent; /* Carbon - flat no bg needed for icon wrapper */
    border: 1px solid ${props => props.theme.border}; /* Structured */
    border-radius: 0; /* Carbon */
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.color};
    flex-shrink: 0;
`;

const StatDetails = styled.div`
    flex: 1;
`;

const StatValue = styled.div`
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    line-height: 1;
    margin-bottom: 4px;
`;

const StatLabel = styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.theme.text.secondary};
    margin-bottom: 2px;
`;

const StatTrend = styled.div`
    font-size: 0.75rem;
    color: ${props => props.theme.text.tertiary};
`;

const ChartCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    padding: 24px;
    border: 1px solid ${props => props.theme.border};
    box-shadow: none; /* Carbon */
    animation: ${fadeIn} 0.5s ease-out 0.4s;
    animation-fill-mode: backwards;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    h3 {
        font-size: 1.125rem;
        font-weight: 700;
        color: ${props => props.theme.text.primary};
        flex: 1;
    }

    svg {
        color: ${props => props.theme.text.secondary};
        
        &.amber { color: #f97316; }
    }
`;

const ChartWrapper = styled.div`
    height: 300px;
    min-height: 300px;
    width: 100%;
    display: flex;
    flex-direction: column;
    
    & > div {
        height: 100%;
        width: 100%;
    }
`;

const EmptyChart = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: ${props => props.theme.text.tertiary};

    svg {
        margin: 0 auto 16px;
    }

    p {
        color: ${props => props.theme.text.secondary};
        font-size: 0.875rem;
    }
`;

const QuickActionsCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    padding: 24px;
    border: 1px solid ${props => props.theme.border};
    box-shadow: none; /* Carbon */
    animation: ${slideIn} 0.5s ease-out 0.2s;
    animation-fill-mode: backwards;
`;

const ActionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: ${props => props.theme.bg.tertiary};
    border: 1px solid ${props => props.theme.border}; /* Flat border */
    border-radius: 0; /* Carbon */
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;

    &:hover {
        background: ${props => props.theme.bg.card};
        border-color: ${props => props.theme.text.tertiary};
    }
`;

const ActionIcon = styled.div`
    width: 40px;
    height: 40px;
    background: transparent;
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.color};
    flex-shrink: 0;
`;

const ActionText = styled.div`
    flex: 1;

    h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: ${props => props.theme.text.primary};
        margin-bottom: 2px;
    }

    p {
        font-size: 0.75rem;
        color: ${props => props.theme.text.secondary};
    }
`;

const ActivityCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    padding: 24px;
    border: 1px solid ${props => props.theme.border};
    box-shadow: none; /* Carbon */
    animation: ${slideIn} 0.5s ease-out 0.3s;
    animation-fill-mode: backwards;
`;

const ActivityList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const ActivityItem = styled.div`
    display: flex;
    gap: 12px;
    animation: ${fadeIn} 0.4s ease-out;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;
    animation-fill-mode: forwards;
`;

const ActivityIcon = styled.div`
    width: 36px;
    height: 36px;
    background: transparent;
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.color};
    flex-shrink: 0;
`;

const ActivityContent = styled.div`
    flex: 1;
`;

const ActivityMessage = styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.theme.text.primary};
    margin-bottom: 2px;
`;

const ActivityTime = styled.div`
    font-size: 0.75rem;
    color: ${props => props.theme.text.secondary};
`;

const WorkloadSummary = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: ${props => props.theme.bg.tertiary};
    border-radius: 0; /* Carbon */
    margin-bottom: 20px;
    flex-wrap: wrap;
    border: 1px solid ${props => props.theme.border};
`;

const SummaryItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
`;

const SummaryLabel = styled.div`
    font-size: 0.75rem;
    color: ${props => props.theme.text.secondary};
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
`;

const SummaryValue = styled.div`
    font-size: 1.25rem;
    font-weight: 700;
    color: ${props => props.color || props.theme.text.primary};
`;

const SummaryDivider = styled.div`
    width: 1px;
    height: 32px;
    background: ${props => props.theme.border};
`;

const ChartLabel = styled.div`
    font-size: 0.875rem;
    color: ${props => props.theme.text.secondary};
    font-weight: 600;
    margin-bottom: 12px;
    text-align: center;
`;

const ViewMoreButton = styled.button`
    width: 100%;
    padding: 12px;
    margin-top: 16px;
    background: ${props => props.theme.bg.tertiary};
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    color: ${props => props.theme.text.secondary};
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: ${props => props.theme.bg.card};
        border-color: ${props => props.theme.text.primary};
        color: ${props => props.theme.text.primary};
    }
`;

export default OrgDashboard;
