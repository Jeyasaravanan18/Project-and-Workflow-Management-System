import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { CheckCircle2, AlertCircle, Clock, Calendar, TrendingUp, Zap, Target, Activity, ArrowRight, Circle, Play, Pause, Timer, Square, CheckSquare2, Trash2, UserCheck, ChevronDown } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from 'date-fns';
import styled, { keyframes } from 'styled-components';
import TaskDetailModal from '../../components/TaskDetailModal';
import ActivityHeatmap from '../../components/ActivityHeatmap';
import useRecentlyViewed from '../../hooks/useRecentlyViewed';
import toast from '../../utils/toast';

const MyWorkDashboard = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [activeTimerId, setActiveTimerId] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showAllCompleted, setShowAllCompleted] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const { trackVisit } = useRecentlyViewed();

    // Track this page visit
    useEffect(() => {
        trackVisit({ id: 'my-work', label: 'My Work', path: '/my-work', type: 'page' });
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/tasks/my-work');
            setData(res.data);

            // Check for running timer
            const runningTask = res.data.assignedTasks.find(t => t.timerStartedAt);
            if (runningTask) {
                setActiveTimerId(runningTask._id);
                // Calculate initial elapsed time
                const start = new Date(runningTask.timerStartedAt).getTime();
                const now = new Date().getTime();
                setElapsedTime((runningTask.timeSpent || 0) + Math.floor((now - start) / 1000));
            } else {
                setActiveTimerId(null);
                setElapsedTime(0);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(() => setLoading(false), 400);
        }
    };

    useEffect(() => {
        let interval;
        if (activeTimerId) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimerId]);

    useEffect(() => {
        fetchData();
        if (socket) {
            socket.on('task:updated', (updatedTask) => {
                // Determine if we need to update timer state locally based on socket event
                // Simple approach: re-fetch to sync truth
                fetchData();
            });
            socket.on('task:created', fetchData);
            socket.on('notification:new', fetchData);
            return () => {
                socket.off('task:updated', fetchData);
                socket.off('task:created', fetchData);
                socket.off('notification:new', fetchData);
            };
        }
    }, [socket]);

    const handleToggleTimer = async (e, taskId) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/tasks/${taskId}/timer`);
            if (res.data.success) {
                if (res.data.isRunning) {
                    setActiveTimerId(taskId);
                    const start = new Date(res.data.timerStartedAt).getTime();
                    const now = new Date().getTime();
                    setElapsedTime((res.data.timeSpent || 0) + Math.floor((now - start) / 1000));
                } else {
                    setActiveTimerId(null);
                }
                fetchData();
            }
        } catch (error) {
            console.error('Timer toggle failed:', error);
            toast.error('Failed to toggle timer');
        }
    };

    const toggleSelectTask = (e, taskId) => {
        e.stopPropagation();
        setSelectedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedTasks.size} task(s)?`)) return;
        const toastId = toast.loading(`Deleting ${selectedTasks.size} tasks...`);
        try {
            await Promise.all([...selectedTasks].map(id => api.delete(`/tasks/${id}`)));
            toast.dismiss(toastId);
            toast.success(`Deleted ${selectedTasks.size} tasks`);
            setSelectedTasks(new Set());
            fetchData();
        } catch {
            toast.dismiss(toastId);
            toast.error('Failed to delete tasks');
        }
    };

    const handleBulkStatus = async (status) => {
        const toastId = toast.loading(`Updating ${selectedTasks.size} tasks...`);
        try {
            await Promise.all([...selectedTasks].map(id => api.put(`/tasks/${id}`, { status })));
            toast.dismiss(toastId);
            toast.success(`Marked ${selectedTasks.size} tasks as ${status}`);
            setSelectedTasks(new Set());
            fetchData();
        } catch {
            toast.dismiss(toastId);
            toast.error('Failed to update tasks');
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getTaskPriority = (dueDate) => {
        if (!dueDate) return { level: 'low', color: '#8d8d8d', label: 'No deadline' };
        const date = new Date(dueDate);
        if (isPast(date) && !isToday(date)) return { level: 'critical', color: '#da1e28', label: 'Overdue' };
        if (isToday(date)) return { level: 'high', color: '#ff832b', label: 'Due today' };
        if (isTomorrow(date)) return { level: 'medium', color: '#f1c21b', label: 'Due tomorrow' };
        return { level: 'low', color: '#8d8d8d', label: formatDistanceToNow(date, { addSuffix: true }) };
    };

    // Today's Focus: Show tasks assigned today OR due today
    const todayTasks = data?.assignedTasks?.filter(task => {
        const dueToday = task.dueDate && isToday(new Date(task.dueDate));
        const assignedToday = task.createdAt && isToday(new Date(task.createdAt));
        return dueToday || assignedToday;
    }) || [];

    const overdueTasks = data?.overdueTasks || [];
    const totalTasks = data?.assignedTasks?.length || 0;
    const completedToday = data?.completedToday || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

    if (loading) {
        return (
            <DashboardContainer>
                <LoadingOverlay>
                    <Spinner />
                    <p>Loading your workspace...</p>
                </LoadingOverlay>
            </DashboardContainer>
        );
    }

    return (
        <DashboardContainer>
            {/* Hero Section */}
            <HeroSection>
                <div style={{ flex: 1 }}>
                    <GreetingSection>
                        <WelcomeText>
                            {getTimeBasedGreeting()}, <NameHighlight>{user?.name?.split(' ')[0]}</NameHighlight>! 👋
                        </WelcomeText>
                        <SubText>Here's what's on your plate today</SubText>
                    </GreetingSection>
                    <QuickStats>
                        <StatBubble color="#475569" $delay={0}>
                            <StatIconWrapper $color="#475569">
                                <Activity size={24} color="white" />
                            </StatIconWrapper>
                            <StatContent>
                                <StatValue>{totalTasks}</StatValue>
                                <StatLabel>Active</StatLabel>
                            </StatContent>
                        </StatBubble>
                        <StatBubble color="#22c55e" $delay={0.1}>
                            <StatIconWrapper $color="#22c55e">
                                <CheckCircle2 size={24} color="white" />
                            </StatIconWrapper>
                            <StatContent>
                                <StatValue>{completedToday}</StatValue>
                                <StatLabel>Done</StatLabel>
                            </StatContent>
                        </StatBubble>
                        <StatBubble color={overdueTasks.length > 0 ? "#ef4444" : "#64748b"} $delay={0.2}>
                            <StatIconWrapper $color={overdueTasks.length > 0 ? "#ef4444" : "#64748b"}>
                                <AlertCircle size={24} color="white" />
                            </StatIconWrapper>
                            <StatContent>
                                <StatValue>{overdueTasks.length}</StatValue>
                                <StatLabel>Urgent</StatLabel>
                            </StatContent>
                        </StatBubble>
                    </QuickStats>
                </div>
                <HeatmapWrapper>
                    <ActivityHeatmap data={data?.activityData || []} />
                </HeatmapWrapper>
            </HeroSection>

            {/* Main Content Grid */}
            <MainGrid>
                {/* Left Column - Tasks */}
                <LeftColumn>
                    {/* Progress Card */}
                    <ProgressCard>
                        <CardHeader>
                            <CardTitle>
                                <TrendingUp size={20} className="icon" />
                                Today's Progress
                            </CardTitle>
                        </CardHeader>
                        <ProgressRing>
                            <svg width="140" height="140">
                                <CircleBackground cx="70" cy="70" r="60" />
                                <CircleProgress
                                    cx="70"
                                    cy="70"
                                    r="60"
                                    $progress={completionRate}
                                />
                            </svg>
                            <ProgressValueWrapper>
                                <ProgressValue>{completionRate}%</ProgressValue>
                                <ProgressLabel>Complete</ProgressLabel>
                            </ProgressValueWrapper>
                        </ProgressRing>
                        <ProgressStat>
                            <strong>{completedToday}</strong> of <strong>{totalTasks}</strong> tasks done
                        </ProgressStat>
                    </ProgressCard>

                    {/* Today's Focus */}
                    <FocusCard>
                        <CardHeader>
                            <CardTitle>
                                <Target size={20} className="icon amber" />
                                Today's Focus
                            </CardTitle>
                            {todayTasks.length > 0 && <CountBadge>{todayTasks.length}</CountBadge>}
                        </CardHeader>
                        {todayTasks.length > 0 ? (
                            <FocusList>
                                {todayTasks.slice(0, 3).map((task, i) => (
                                    <FocusItem key={`${task._id}-${i}`} $delay={i * 0.1}>
                                        <FocusDot />
                                        <FocusContent>
                                            <h4>{task.title}</h4>
                                            <p>{task.projectId?.name}</p>
                                        </FocusContent>
                                        <ArrowRight size={16} />
                                    </FocusItem>
                                ))}
                            </FocusList>
                        ) : (
                            <EmptyFocus>
                                <CheckCircle2 size={40} />
                                <p>No tasks due today!</p>
                            </EmptyFocus>
                        )}
                    </FocusCard>
                </LeftColumn>

                {/* Center Column - Task List */}
                <CenterColumn>
                    <TaskListCard>
                        <CardHeader>
                            <CardTitle>
                                <Zap size={20} className="icon amber" />
                                Your Tasks
                            </CardTitle>
                            <FilterGroup>
                                <FilterButton
                                    $active={activeFilter === 'all'}
                                    onClick={() => setActiveFilter('all')}
                                >
                                    All
                                </FilterButton>
                                <FilterButton
                                    $active={activeFilter === 'urgent'}
                                    onClick={() => setActiveFilter('urgent')}
                                >
                                    Urgent
                                </FilterButton>
                            </FilterGroup>
                        </CardHeader>

                        <TasksList>
                            {data?.assignedTasks?.map((task, i) => {
                                const priority = getTaskPriority(task.dueDate);
                                if (activeFilter === 'urgent' && priority.level !== 'critical') return null;

                                return (
                                    <TaskItem
                                        key={`${task._id}-${i}`}
                                        $delay={i * 0.05}
                                        $priority={priority.color}
                                        $selected={selectedTasks.has(task._id)}
                                        onClick={() => setSelectedTaskId(task._id)}
                                    >
                                        <TaskCheckbox
                                            onClick={(e) => toggleSelectTask(e, task._id)}
                                            aria-label="Select task"
                                        >
                                            {selectedTasks.has(task._id)
                                                ? <CheckSquare2 size={16} style={{ color: '#6366f1' }} />
                                                : <Square size={16} />}
                                        </TaskCheckbox>
                                        <StatusStrip $color={priority.color} />
                                        <TaskContent>
                                            <TaskTitle>{task.title}</TaskTitle>
                                            <TaskMeta>
                                                <MetaTag>
                                                    <Calendar size={12} />
                                                    {task.projectId?.name || 'No project'}
                                                </MetaTag>
                                                <MetaTag className="priority" $color={priority.color}>
                                                    <Clock size={12} />
                                                    {priority.label}
                                                </MetaTag>
                                            </TaskMeta>
                                        </TaskContent>
                                        <TaskAction>
                                            <TimerButton
                                                $active={activeTimerId === task._id}
                                                onClick={(e) => handleToggleTimer(e, task._id)}
                                                disabled={activeTimerId && activeTimerId !== task._id}
                                            >
                                                {activeTimerId === task._id ? (
                                                    <>
                                                        <Pause size={14} fill="white" />
                                                        <span>{formatTime(elapsedTime)}</span>
                                                    </>
                                                ) : (
                                                    <Play size={14} fill="currentColor" />
                                                )}
                                            </TimerButton>
                                            <ArrowRight size={18} />
                                        </TaskAction>
                                    </TaskItem>
                                );
                            })}
                            {data?.assignedTasks?.length === 0 && (
                                <EmptyState>
                                    <p>No tasks assigned to you yet.</p>
                                </EmptyState>
                            )}
                        </TasksList>
                    </TaskListCard>

                    {/* Completed Works Section */}
                    {data?.completedTasks && data.completedTasks.length > 0 && (
                        <CompletedCard>
                            <CardHeader>
                                <CardTitle>
                                    <CheckCircle2 size={20} className="icon success" />
                                    Completed Works
                                </CardTitle>
                                <CountBadge className="success">{data.completedTasks.length}</CountBadge>
                            </CardHeader>
                            <CompletedList>
                                {(showAllCompleted ? data.completedTasks : data.completedTasks.slice(0, 5)).map((task, i) => (
                                    <CompletedItem
                                        key={`${task._id}-${i}`}
                                        $delay={i * 0.05}
                                        onClick={() => setSelectedTaskId(task._id)}
                                    >
                                        <CompletedCheckmark>
                                            <CheckCircle2 size={20} />
                                        </CompletedCheckmark>
                                        <CompletedContent>
                                            <CompletedTitle>{task.title}</CompletedTitle>
                                            <CompletedMeta>
                                                <MetaTag>
                                                    <Calendar size={12} />
                                                    {task.projectId?.name || 'No project'}
                                                </MetaTag>
                                                <MetaTag className="success">
                                                    <Clock size={12} />
                                                    Completed {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
                                                </MetaTag>
                                            </CompletedMeta>
                                        </CompletedContent>
                                        <ArrowRight size={18} />
                                    </CompletedItem>
                                ))}
                            </CompletedList>
                            {data.completedTasks.length > 5 && (
                                <ExpandButton onClick={() => setShowAllCompleted(!showAllCompleted)}>
                                    {showAllCompleted ? 'Show Less' : `View All (${data.completedTasks.length})`}
                                </ExpandButton>
                            )}
                        </CompletedCard>
                    )}
                </CenterColumn>

                {/* Right Column - Insights */}
                <RightColumn>
                    {/* Urgent Alerts */}
                    {overdueTasks.length > 0 && (
                        <UrgentCard>
                            <CardHeader className="urgent">
                                <CardTitle className="urgent">
                                    <AlertCircle size={20} />
                                    Needs Attention
                                </CardTitle>
                                <PulseBadge>{overdueTasks.length}</PulseBadge>
                            </CardHeader>
                            <UrgentList>
                                {overdueTasks.slice(0, 4).map((task, i) => (
                                    <UrgentItem key={`${task._id}-${i}`} $delay={i * 0.1}>
                                        <Circle size={8} className="pulse" />
                                        <div>
                                            <h4>{task.title}</h4>
                                            <span>Due {format(new Date(task.dueDate), 'MMM d')}</span>
                                        </div>
                                    </UrgentItem>
                                ))}
                            </UrgentList>
                        </UrgentCard>
                    )}

                    {/* Activity Timeline */}
                    <TimelineCard>
                        <CardHeader>
                            <CardTitle>
                                <Activity size={20} className="icon" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <Timeline>
                            <TimelineItem $delay={0}>
                                <TimelineDot $color="#475569" />
                                <TimelineContent>
                                    <h5>Tasks checked</h5>
                                    <span>Just now</span>
                                </TimelineContent>
                            </TimelineItem>
                            <TimelineItem $delay={0.1}>
                                <TimelineDot $color="#22c55e" />
                                <TimelineContent>
                                    <h5>{completedToday} tasks completed</h5>
                                    <span>Today</span>
                                </TimelineContent>
                            </TimelineItem>
                            <TimelineItem $delay={0.2}>
                                <TimelineDot $color="#f97316" />
                                <TimelineContent>
                                    <h5>{totalTasks} active tasks</h5>
                                    <span>Currently</span>
                                </TimelineContent>
                            </TimelineItem>
                        </Timeline>
                    </TimelineCard>
                </RightColumn>
            </MainGrid>

            {/* Bulk Action Toolbar */}
            {selectedTasks.size > 0 && (
                <BulkToolbar className="BulkToolbar">
                    <BulkCount>{selectedTasks.size} selected</BulkCount>
                    <BulkBtn onClick={() => handleBulkStatus('in-progress')}>
                        <UserCheck size={14} /> In Progress
                    </BulkBtn>
                    <BulkBtn onClick={() => handleBulkStatus('done')}>
                        <CheckSquare2 size={14} /> Mark Done
                    </BulkBtn>
                    <BulkBtn $danger onClick={handleBulkDelete}>
                        <Trash2 size={14} /> Delete
                    </BulkBtn>
                    <BulkBtn $ghost onClick={() => setSelectedTasks(new Set())}>
                        Clear
                    </BulkBtn>
                </BulkToolbar>
            )}

            {/* Task Detail Modal */}
            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    onClose={() => {
                        setSelectedTaskId(null);
                        fetchData();
                    }}
                    onUpdate={fetchData}
                />
            )}
        </DashboardContainer>
    );
};

// Animations
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// Styled Components
const DashboardContainer = styled.div`
    padding: 8px 0 32px 0;
    background: transparent;
    min-height: 100vh;
    max-width: 1600px;
    margin: 0 auto;
    font-family: inherit;
`;

const LoadingOverlay = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 70vh;
    color: #6b7280;
    gap: 16px;
`;

const Spinner = styled.div`
    width: 44px;
    height: 44px;
    border: 3px solid #e5e7eb;
    border-top-color: #008060;
    border-radius: 50%;
    animation: ${rotate} 0.8s linear infinite;
`;

const HeroSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    animation: ${fadeInUp} 0.5s ease-out;

    @media (max-width: 968px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
    }
`;

const GreetingSection = styled.div`
    margin-bottom: 20px;
`;

const WelcomeText = styled.h1`
    font-size: 1.85rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
`;

const NameHighlight = styled.span`
    color: #008060;
`;

const SubText = styled.p`
    font-size: 0.95rem;
    color: #6b7280;
    margin: 0;
`;

const QuickStats = styled.div`
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
`;

const StatBubble = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    animation: ${fadeInUp} 0.5s ease-out;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;
    animation-fill-mode: forwards;
    transition: all 0.2s ease;
    min-width: 150px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
`;

const HeatmapWrapper = styled.div`
    flex: 1;
    max-width: 600px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    padding: 16px;
    
    @media (max-width: 1400px) {
        display: none;
    }
`;

const StatIconWrapper = styled.div`
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: ${props => props.$color};
    display: flex;
    align-items: center;
    justify-content: center;
`;

const StatContent = styled.div`
    display: flex;
    flex-direction: column;
`;

const StatValue = styled.div`
    font-size: 1.4rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.1;
`;

const StatLabel = styled.div`
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
`;

const MainGrid = styled.div`
    display: grid;
    grid-template-columns: 320px 1fr 340px;
    gap: 28px;

    @media (max-width: 1400px) {
        grid-template-columns: 300px 1fr;
    }

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const LeftColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const CenterColumn = styled.div``;

const RightColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
    
    @media (max-width: 1400px) {
        display: none; 
        grid-column: span 2;
    }

    @media (max-width: 1024px) {
        display: flex;
        grid-column: auto;
    }
`;

const CardBase = styled.div`
    background: #ffffff;
    border-radius: 14px;
    padding: 22px 24px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
`;

const ProgressCard = styled(CardBase)`
    text-align: center;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    &.urgent {
        padding-bottom: 14px;
        border-bottom: 1px solid #fee2e2;
    }
`;

const CardTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin: 0;

    .icon {
        color: #6b7280;
        
        &.amber {
            color: #d97706;
        }
        
        &.success {
            color: #008060;
        }
    }

    &.urgent {
        color: #ef4444;
    }
`;

const ProgressRing = styled.div`
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0 auto 18px;
`;

const CircleBackground = styled.circle`
    fill: none;
    stroke: #f1f5f9;
    stroke-width: 10;
`;

const CircleProgress = styled.circle`
    fill: none;
    stroke: #008060;
    stroke-width: 10;
    stroke-linecap: round;
    stroke-dasharray: 377;
    stroke-dashoffset: ${props => 377 - (377 * props.$progress) / 100};
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: stroke-dashoffset 1s ease-out;
`;

const ProgressValueWrapper = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
`;

const ProgressValue = styled.div`
    font-size: 1.85rem;
    font-weight: 700;
    color: #111827;
    line-height: 1;
`;

const ProgressLabel = styled.div`
    font-size: 0.72rem;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 4px;
    letter-spacing: 0.04em;
`;

const ProgressStat = styled.p`
    font-size: 0.85rem;
    color: #6b7280;
    margin: 0;
    
    strong {
        color: #111827;
        font-weight: 600;
    }
`;

const FocusCard = styled(CardBase)`
    background: #ffffff;
    border-color: #e5e7eb;
`;

const CountBadge = styled.span`
    background: #ecfdf5;
    color: #008060;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
`;

const FocusList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const FocusItem = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0;
    animation: ${fadeInUp} 0.4s ease-out forwards;
    animation-delay: ${props => props.$delay}s;

    &:hover {
        background: #ecfdf5;
        border-color: #a7f3d0;
        transform: translateX(2px);
    }
    
    svg {
        color: #9ca3af;
    }
`;

const FocusDot = styled.div`
    width: 8px;
    height: 8px;
    background: #008060;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px #d1fae5;
`;

const FocusContent = styled.div`
    flex: 1;
    min-width: 0;

    h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    p {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
    }
`;

const EmptyFocus = styled.div`
    text-align: center;
    padding: 28px 16px;
    color: #9ca3af;

    svg {
        color: #008060;
        margin-bottom: 10px;
    }

    p {
        margin: 0;
        font-size: 0.85rem;
    }
`;

const TaskListCard = styled(CardBase)``;

const FilterGroup = styled.div`
    display: flex;
    gap: 6px;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 9999px;
`;

const FilterButton = styled.button`
    padding: 5px 14px;
    border-radius: 9999px;
    border: none;
    background: ${props => props.$active ? '#111827' : 'transparent'};
    color: ${props => props.$active ? '#ffffff' : '#6b7280'};
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        color: ${props => props.$active ? '#ffffff' : '#111827'};
    }
`;

const TasksList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 600px;
    overflow-y: auto;
    padding-right: 6px;
    
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 4px;
    }
`;

const TaskItem = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    animation: ${fadeInUp} 0.4s ease-out forwards;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;

    &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
`;

const StatusStrip = styled.div`
    width: 3px;
    height: 100%;
    align-self: stretch;
    background: ${props => props.$color};
    border-radius: 3px;
    flex-shrink: 0;
`;

const TaskContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const TaskTitle = styled.h4`
    font-size: 0.9rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
`;

const TaskMeta = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
`;

const MetaTag = styled.span`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.72rem;
    color: #6b7280;
    font-weight: 500;

    svg {
        color: #9ca3af;
    }

    &.priority {
        color: ${props => props.$color};
        background: ${props => props.$color}15;
        padding: 2px 8px;
        border-radius: 9999px;
        font-weight: 600;

        svg {
            color: ${props => props.$color};
        }
    }
`;

const TaskAction = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #9ca3af;
    transition: color 0.2s ease;

    ${TaskItem}:hover & {
        color: #008060;
    }
`;

const TimerButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: ${props => props.$active ? '#008060' : '#f1f5f9'};
    color: ${props => props.$active ? 'white' : '#475569'};
    border: none;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-width: ${props => props.$active ? '80px' : '32px'};
    justify-content: center;

    &:hover {
        background: ${props => props.$active ? '#006a4e' : '#e2e8f0'};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 36px;
    color: #9ca3af;
    font-size: 0.85rem;
`;

const UrgentCard = styled(CardBase)`
    border-color: #fee2e2;
    background: #fffafa;
`;

const PulseBadge = styled.span`
    background: #ef4444;
    color: white;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 600;
`;

const UrgentList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const UrgentItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #fecaca;
    animation: ${fadeInUp} 0.4s ease-out forwards;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;

    h4 {
        margin: 0 0 3px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #dc2626;
    }

    span {
        font-size: 0.72rem;
        color: #ef4444;
        font-weight: 500;
    }

    .pulse {
        color: #ef4444;
        margin-top: 4px;
        animation: ${pulse} 1.5s infinite;
    }
`;

const TimelineCard = styled(CardBase)``;

const Timeline = styled.div`
    position: relative;
    padding-left: 12px;
    
    &::before {
        content: '';
        position: absolute;
        left: 3px;
        top: 8px;
        bottom: 0;
        width: 2px;
        background: #f1f5f9;
    }
`;

const TimelineItem = styled.div`
    position: relative;
    padding-left: 20px;
    margin-bottom: 20px;
    animation: ${fadeInUp} 0.4s ease-out forwards;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;

    &:last-child {
        margin-bottom: 0;
    }
`;

const TimelineDot = styled.div`
    position: absolute;
    left: -4px;
    top: 5px;
    width: 14px;
    height: 14px;
    background: #ffffff;
    border: 2px solid ${props => props.$color};
    border-radius: 50%;
    z-index: 1;
`;

const TimelineContent = styled.div`
    h5 {
        margin: 0 0 2px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #111827;
    }

    span {
        font-size: 0.72rem;
        color: #9ca3af;
    }
`;

const CompletedCard = styled(CardBase)`
    margin-top: 24px;
    border-color: #e5e7eb;
    background: #ffffff;
`;

const CompletedList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const CompletedItem = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    animation: ${fadeInUp} 0.4s ease-out forwards;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;

    &:hover {
        border-color: #008060;
        background: #f8fafc;
    }

    svg:last-child {
        color: #9ca3af;
        margin-left: auto;
    }
`;

const CompletedCheckmark = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: #008060;
    margin: 0;
`;

const CompletedContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const CompletedTitle = styled.h3`
    margin: 0 0 6px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
`;

const CompletedMeta = styled(TaskMeta)`
    .success {
        background: #ecfdf5;
        color: #008060;
    }
`;

const ExpandButton = styled.button`
    width: 100%;
    padding: 10px 18px;
    margin-top: 14px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #008060;
    }
`;

// ─── Bulk Operations ──────────────────────────────────────────────────────────

const TaskCheckbox = styled.button`
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: #9ca3af;
    transition: all 0.15s;
    margin-right: 4px;

    &:hover {
        background: #f1f5f9;
        color: #008060;
    }
`;

const BulkToolbar = styled.div`
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #111827;
    color: #ffffff;
    padding: 8px 18px;
    border-radius: 9999px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    animation: ${fadeInUp} 0.3s ease-out;

    @media print { display: none; }
`;

const BulkCount = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-right: 6px;
    white-space: nowrap;
`;

const BulkBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;

    background: ${props => props.$danger
        ? '#ef4444'
        : props.$ghost
            ? 'rgba(255, 255, 255, 0.1)'
            : '#008060'};
    color: white;

    &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
`;

export default MyWorkDashboard;
