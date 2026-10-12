import { useEffect, useState } from 'react';
import api from '../../services/api';
import AnalyticsChart from '../../components/AnalyticsChart';
import PinnableDashboardCard, { PinnedCardsBar } from '../../components/PinnableDashboardCard';
import { Users, FolderKanban, ListTodo, Activity, TrendingUp, RefreshCw, BarChart3, UserPlus, Plus, CheckCircle2, Clock, Zap, Calendar as CalendarIcon, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const OrgDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        usersCount: 0,
        projectsCount: 0,
        tasksCount: 0,
        activeProjects: 0,
        completedTasks: 0,
        totalTasks: 0,
        completionRate: 0
    });
    const [workloadData, setWorkloadData] = useState([]);
    const [workloadSummary, setWorkloadSummary] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Current date helpers for Brevo calendar
    const today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[today.getMonth()];
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

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

            const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
            const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data?.data || []);
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

            setWorkloadSummary(workloadResponse.summary);

            const topLoaded = Array.isArray(workloadResponse.topLoaded) ? workloadResponse.topLoaded : [];
            setWorkloadData(topLoaded.slice(0, 8).map(u => ({
                name: u.name || 'Unknown',
                tasks: u.activeTasks,
                status: u.status
            })));

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
                    <p>Loading workspace overview...</p>
                </Loading>
            </Container>
        );
    }

    const completionRate = stats.completionRate || 0;
    const userName = user?.name ? user.name.split(' ')[0] : 'there';

    return (
        <Container>
            {/* Brevo Greeting Bar */}
            <GreetingBar>
                <GreetingTitle>Hello {userName}</GreetingTitle>
                <GreetingActions>
                    <CustomizeBtn onClick={fetchData} title="Refresh data">
                        <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
                        <span>Refresh data</span>
                    </CustomizeBtn>
                    <UpgradePillBtn onClick={() => navigate('/projects')}>
                        <Plus size={15} />
                        <span>Create project</span>
                    </UpgradePillBtn>
                </GreetingActions>
            </GreetingBar>

            {/* Brevo Top Widgets: Calendar & Get Started Banners */}
            <TopWidgetsGrid>
                {/* Brevo Mini Calendar Card */}
                <CalendarCard>
                    <CalendarNav>
                        <ChevronLeft size={16} color="#6B7280" style={{ cursor: 'pointer' }} />
                        <CalendarMonthText>{currentMonth} {currentYear}</CalendarMonthText>
                        <ChevronRight size={16} color="#6B7280" style={{ cursor: 'pointer' }} />
                    </CalendarNav>

                    <WeekDaysRow>
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </WeekDaysRow>

                    <DaysGrid>
                        {/* Sample month dates with today highlighted */}
                        <DayNum $muted>28</DayNum><DayNum $muted>29</DayNum><DayNum $muted>30</DayNum>
                        <DayNum>1</DayNum><DayNum>2</DayNum><DayNum>3</DayNum><DayNum>4</DayNum>
                        <DayNum>5</DayNum><DayNum>6</DayNum><DayNum>7</DayNum><DayNum>8</DayNum><DayNum>9</DayNum><DayNum>10</DayNum><DayNum>11</DayNum>
                        <DayNum $active={true}>{currentDay}</DayNum>
                        <DayNum>13</DayNum><DayNum>14</DayNum><DayNum>15</DayNum><DayNum>16</DayNum><DayNum>17</DayNum><DayNum>18</DayNum>
                        <DayNum>19</DayNum><DayNum>20</DayNum><DayNum>21</DayNum><DayNum>22</DayNum><DayNum>23</DayNum><DayNum>24</DayNum><DayNum>25</DayNum>
                        <DayNum>26</DayNum><DayNum>27</DayNum><DayNum>28</DayNum><DayNum>29</DayNum><DayNum>30</DayNum><DayNum>31</DayNum><DayNum $muted>1</DayNum>
                    </DaysGrid>
                </CalendarCard>

                {/* Brevo 'Get started with ProjectFlow' Card */}
                <OnboardingCard>
                    <OnboardingHeader>
                        <OnboardingTitle>Get started with ProjectFlow</OnboardingTitle>
                        <DarkPillButton onClick={() => navigate('/projects')}>
                            Create project
                        </DarkPillButton>
                    </OnboardingHeader>

                    <StepsRow>
                        {/* Step 1 */}
                        <StepBox onClick={() => navigate('/projects')}>
                            <StepNumberBox>
                                <svg width="44" height="60" viewBox="0 0 44 60" fill="none">
                                    <path d="M14 16 L26 8 L26 56 L16 56" stroke="#008060" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 24 C10 10, 28 6, 36 18 C38 32, 16 38, 10 24 Z" fill="#D1FAE5" opacity="0.6" />
                                </svg>
                            </StepNumberBox>
                            <StepInfo>
                                <h4>Add your first project</h4>
                                <p>Create a project, assign team members, and track workflows in real time.</p>
                                <StepActionLink>
                                    <span>Create your project</span>
                                    <ArrowRight size={14} />
                                </StepActionLink>
                            </StepInfo>
                        </StepBox>

                        {/* Step 2 */}
                        <StepBox onClick={() => navigate('/admin/automations')}>
                            <StepNumberBox>
                                <svg width="44" height="60" viewBox="0 0 44 60" fill="none">
                                    <path d="M10 18 C12 8, 34 8, 34 22 C34 34, 12 40, 10 52 L36 52" stroke="#008060" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M26 12 C36 12, 42 26, 34 38 C28 42, 18 36, 26 12 Z" fill="#D1FAE5" opacity="0.6" />
                                </svg>
                            </StepNumberBox>
                            <StepInfo>
                                <h4>Create your automations</h4>
                                <p>Set up automated triggers and notifications to streamline approvals.</p>
                                <StepActionLink>
                                    <span>Explore automations</span>
                                    <ArrowRight size={14} />
                                </StepActionLink>
                            </StepInfo>
                        </StepBox>
                    </StepsRow>
                </OnboardingCard>
            </TopWidgetsGrid>

            {/* Brevo Middle Row: Feature Callout & Workspace Usage */}
            <MiddleWidgetsGrid>
                {/* Organize your team Card */}
                <CalloutCard>
                    <CalloutVisual>
                        <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
                            <rect x="14" y="22" width="46" height="42" rx="6" fill="#FEF3C7" opacity="0.7"/>
                            <rect x="26" y="14" width="46" height="42" rx="6" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5"/>
                            <path d="M36 44 L44 34 L54 40 L64 26" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="64" cy="26" r="3.5" fill="#008060" />
                            <circle cx="42" cy="62" r="12" fill="#008060" />
                        </svg>
                    </CalloutVisual>
                    <CalloutContent>
                        <h3>Organize your team & workflows</h3>
                        <p>With roles and smart assignment, align team members with projects and sprint goals.</p>
                        <DarkPillButton onClick={() => navigate('/admin/users')}>
                            Manage team
                        </DarkPillButton>
                    </CalloutContent>
                </CalloutCard>

                {/* Workspace Usage Card */}
                <UsageCard>
                    <UsageTitle>Your workspace usage</UsageTitle>
                    
                    <UsageItem>
                        <UsageItemHeader>
                            <span className="label">Active Projects</span>
                            <span className="count">{stats.activeProjects} active out of {stats.projectsCount || 1}</span>
                        </UsageItemHeader>
                        <ProgressBar>
                            <ProgressFill $percent={Math.min(100, Math.round((stats.activeProjects / (stats.projectsCount || 1)) * 100))} $color="#008060" />
                        </ProgressBar>
                    </UsageItem>

                    <UsageItem>
                        <UsageItemHeader>
                            <span className="label">Completed Tasks</span>
                            <span className="count">{stats.completedTasks} completed out of {stats.totalTasks || 1}</span>
                        </UsageItemHeader>
                        <ProgressBar>
                            <ProgressFill $percent={completionRate} $color="#4F46E5" />
                        </ProgressBar>
                    </UsageItem>

                    <UsageItem>
                        <UsageItemHeader>
                            <span className="label">Team Seats</span>
                            <span className="count">{stats.usersCount} team members active</span>
                        </UsageItemHeader>
                        <ProgressBar>
                            <ProgressFill $percent={Math.min(100, stats.usersCount * 10)} $color="#0D9488" />
                        </ProgressBar>
                    </UsageItem>
                </UsageCard>
            </MiddleWidgetsGrid>

            {/* Pinned Cards Bar */}
            <PinnedCardsBar allCards={[
                { id: 'stat-team-members',   title: 'Team Members',   value: stats.usersCount,     subtitle: 'Total active users',       color: '#008060' },
                { id: 'stat-active-projects',title: 'Active Projects', value: stats.activeProjects,  subtitle: `of ${stats.projectsCount} total`, color: '#008060' },
                { id: 'stat-active-tasks',   title: 'Active Tasks',   value: stats.tasksCount,     subtitle: 'Currently in progress',    color: '#4F46E5' },
                { id: 'stat-completion-rate',title: 'Completion Rate', value: `${completionRate}%`, subtitle: 'Project velocity',          color: '#10B981' },
            ]} />

            {/* Main Content Grid: Charts & Activity */}
            <MainGrid>
                {/* Left Section - Workload Distribution */}
                <LeftSection>
                    <ChartCard>
                        <CardHeader>
                            <BarChart3 size={20} color="#008060" />
                            <h3>Team Workload Distribution</h3>
                        </CardHeader>

                        {workloadSummary && (
                            <WorkloadSummary>
                                <SummaryItem>
                                    <SummaryLabel>Total Members</SummaryLabel>
                                    <SummaryValue>{workloadSummary.totalMembers}</SummaryValue>
                                </SummaryItem>
                                <SummaryDivider />
                                <SummaryItem color="#EF4444">
                                    <SummaryLabel>Overloaded</SummaryLabel>
                                    <SummaryValue>{workloadSummary.overloaded}</SummaryValue>
                                </SummaryItem>
                                <SummaryDivider />
                                <SummaryItem color="#008060">
                                    <SummaryLabel>Optimal</SummaryLabel>
                                    <SummaryValue>{workloadSummary.optimal}</SummaryValue>
                                </SummaryItem>
                                <SummaryDivider />
                                <SummaryItem color="#94A3B8">
                                    <SummaryLabel>Idle</SummaryLabel>
                                    <SummaryValue>{workloadSummary.idle}</SummaryValue>
                                </SummaryItem>
                            </WorkloadSummary>
                        )}

                        {workloadData.length > 0 ? (
                            <>
                                <ChartLabel>Top {workloadData.length} Loaded Members</ChartLabel>
                                <ChartWrapper>
                                    <AnalyticsChart
                                        data={workloadData}
                                        type="bar"
                                        dataKey="tasks"
                                        color="#008060"
                                    />
                                </ChartWrapper>
                            </>
                        ) : (
                            <EmptyChart>
                                <BarChart3 size={40} color="#CBD5E1" />
                                <p>No workload data recorded yet</p>
                            </EmptyChart>
                        )}
                    </ChartCard>
                </LeftSection>

                {/* Right Section - Recent Activity */}
                <RightSection>
                    <ActivityCard>
                        <CardHeader>
                            <Activity size={20} color="#008060" />
                            <h3>Recent Activity</h3>
                        </CardHeader>
                        {recentActivity.length === 0 ? (
                            <EmptyActivity>
                                <Clock size={36} color="#CBD5E1" />
                                <p>No recent activity logs</p>
                            </EmptyActivity>
                        ) : (
                            <ActivityList>
                                {recentActivity.slice(0, 6).map((activity, idx) => (
                                    <ActivityItem key={idx}>
                                        <ActivityDot />
                                        <ActivityContent>
                                            <ActivityMessage>{activity.message}</ActivityMessage>
                                            <ActivityTime>{activity.time}</ActivityTime>
                                        </ActivityContent>
                                    </ActivityItem>
                                ))}
                            </ActivityList>
                        )}
                    </ActivityCard>
                </RightSection>
            </MainGrid>
        </Container>
    );
};

// --- Brevo Styled Components ---

const GreetingBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const GreetingTitle = styled.h1`
    font-size: 1.85rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.02em;
`;

const GreetingActions = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const CustomizeBtn = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: transparent;
    border: none;
    color: #4F46E5;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 9999px;
    transition: all 0.15s ease;

    &:hover {
        background: #EEF2FF;
    }

    .spin { animation: rotate 1s linear infinite; }
`;

const UpgradePillBtn = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: #FEF3C7;
    border: 1px solid #FDE68A;
    border-radius: 9999px;
    color: #92400E;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #FDE68A;
        transform: translateY(-1px);
    }
`;

const TopWidgetsGrid = styled.div`
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
    margin-bottom: 24px;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const CalendarCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const CalendarNav = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
`;

const CalendarMonthText = styled.span`
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
`;

const WeekDaysRow = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #9CA3AF;
    margin-bottom: 12px;
`;

const DaysGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    text-align: center;
`;

const DayNum = styled.div`
    font-size: 0.8125rem;
    font-weight: ${props => props.$active ? '700' : '500'};
    color: ${props => props.$active ? '#ffffff' : props.$muted ? '#D1D5DB' : '#374151'};
    background: ${props => props.$active ? '#4F46E5' : 'transparent'};
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    cursor: pointer;

    &:hover {
        background: ${props => props.$active ? '#4338CA' : '#F3F4F6'};
    }
`;

const OnboardingCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

const OnboardingHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const OnboardingTitle = styled.h2`
    font-size: 1.15rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
`;

const DarkPillButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: #111827;
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #1F2937;
        transform: translateY(-1px);
    }
`;

const StepsRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const StepBox = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    border: 1px solid #F3F4F6;
    border-radius: 12px;
    background: #FAFAFA;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #ffffff;
        border-color: #A7F3D0;
        box-shadow: 0 4px 12px rgba(0, 128, 96, 0.08);
        transform: translateY(-2px);
    }
`;

const StepNumberBox = styled.div`
    flex-shrink: 0;
`;

const StepInfo = styled.div`
    flex: 1;

    h4 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
    }

    p {
        font-size: 0.75rem;
        color: #6B7280;
        line-height: 1.4;
        margin: 0 0 10px 0;
    }
`;

const StepActionLink = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #4F46E5;

    &:hover {
        text-decoration: underline;
    }
`;

const MiddleWidgetsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const CalloutCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const CalloutVisual = styled.div`
    flex-shrink: 0;
`;

const CalloutContent = styled.div`
    flex: 1;

    h3 {
        font-size: 1rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 6px 0;
    }

    p {
        font-size: 0.8125rem;
        color: #6B7280;
        line-height: 1.45;
        margin: 0 0 14px 0;
    }
`;

const UsageCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const UsageTitle = styled.h3`
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 18px 0;
`;

const UsageItem = styled.div`
    margin-bottom: 14px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const UsageItemHeader = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.8125rem;
    margin-bottom: 6px;

    .label {
        font-weight: 600;
        color: #374151;
    }

    .count {
        color: #6B7280;
    }
`;

const ProgressBar = styled.div`
    height: 6px;
    background: #F3F4F6;
    border-radius: 9999px;
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    width: ${props => props.$percent}%;
    background: ${props => props.$color || '#008060'};
    border-radius: 9999px;
    transition: width 0.4s ease;
`;

const ActivityCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const ActivityList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const ActivityItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #F9FAFB;

    &:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
`;

const ActivityDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #008060;
    margin-top: 6px;
    flex-shrink: 0;
`;

const ActivityContent = styled.div`
    flex: 1;
`;

const ActivityMessage = styled.div`
    font-size: 0.8125rem;
    font-weight: 500;
    color: #1F2937;
`;

const ActivityTime = styled.div`
    font-size: 0.75rem;
    color: #9CA3AF;
    margin-top: 2px;
`;

const EmptyActivity = styled.div`
    text-align: center;
    padding: 30px 10px;
    color: #9CA3AF;
    font-size: 0.8125rem;
`;

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// Base Layout
const Container = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    padding-bottom: 40px;
`;

const Loading = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    color: #6B7280;
    p { margin-top: 16px; font-size: 0.9375rem; }
`;

const Spinner = styled.div`
    width: 44px;
    height: 44px;
    border: 3px solid #E5E7EB;
    border-top-color: #008060;
    border-radius: 50%;
    animation: ${rotate} 0.8s linear infinite;
`;

const MainGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 20px;
    margin-top: 24px;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const LeftSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const RightSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const ChartCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;

    h3 {
        font-size: 1rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
    }
`;

const ChartWrapper = styled.div`
    height: 280px;
    width: 100%;
`;

const ChartLabel = styled.div`
    font-size: 0.8125rem;
    color: #6B7280;
    font-weight: 600;
    margin-bottom: 12px;
`;

const EmptyChart = styled.div`
    text-align: center;
    padding: 50px 20px;
    color: #9CA3AF;

    svg {
        margin: 0 auto 12px;
    }

    p {
        color: #6B7280;
        font-size: 0.875rem;
        margin: 0;
    }
`;

const WorkloadSummary = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #F9FAFB;
    border-radius: 10px;
    margin-bottom: 20px;
    border: 1px solid #F3F4F6;
    flex-wrap: wrap;
`;

const SummaryItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
`;

const SummaryLabel = styled.div`
    font-size: 0.6875rem;
    color: #6B7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

const SummaryValue = styled.div`
    font-size: 1.125rem;
    font-weight: 700;
    color: ${props => props.color || '#111827'};
`;

const SummaryDivider = styled.div`
    width: 1px;
    height: 24px;
    background: #E5E7EB;
`;

export default OrgDashboard;
