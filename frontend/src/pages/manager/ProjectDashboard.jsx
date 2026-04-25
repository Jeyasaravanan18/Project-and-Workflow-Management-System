import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Tabs from '../../components/Tabs';
import AnalyticsChart from '../../components/AnalyticsChart';
import Badge from '../../components/Badge';
import {
    AlertCircle, CheckCircle2, Layers, Plus, TrendingUp, Target,
    Users as UsersIcon, ArrowLeft, Calendar, GripVertical, MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import CreateTaskForm from '../../components/forms/CreateTaskForm';
import CreateModuleForm from '../../components/forms/CreateModuleForm';
import TeamMembersSidebar from '../../components/TeamMembersSidebar';
import ProjectTeamTab from '../../components/ProjectTeamTab';
import ProjectTasksTab from '../../components/ProjectTasksTab';
import CalendarView from '../../components/CalendarView';
import { useSocket } from '../../context/SocketContext';
import styled, { keyframes, css } from 'styled-components';

// Helper for consistent gradients
// Helper for consistent solid colors
const getProjectColor = (str) => {
    if (!str) return '#393939'; // Carbon gray 80
    const colors = [
        '#fa4d56', // Red 50
        '#0f62fe', // Blue 60
        '#198038', // Green 60
        '#8a3ffc', // Purple 60
        '#d12771', // Magenta 60
        '#0072c3', // Cyan 60
        '#009d9a', // Teal 60
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const ProjectDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed for clean view
    const socket = useSocket();

    const fetchData = async () => {
        try {
            const [projRes, dashRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/projects/${id}/dashboard`)
            ]);
            setProject(projRes.data);
            setData(dashRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (socket) {
            socket.emit('project:join', id);
            socket.on('task:created', fetchData);
            socket.on('task:updated', fetchData);
            return () => {
                socket.emit('project:leave', id);
                socket.off('task:created', fetchData);
                socket.off('task:updated', fetchData);
            };
        }
    }, [id, socket]);

    const taskChartData = data?.tasksByStage.map(item => ({
        name: item.stage.name,
        count: item.count
    }));

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #f1f5f9', borderTopColor: '#f97316', borderRadius: '0px', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    const projectColor = getProjectColor(project?.id + project?.name);

    // --- Overview Content ---
    const overviewTab = (
        <ContentFade>
            <BentoGrid>
                <BentoCard $delay={0.1}>
                    <BentoLabel>Project Structure</BentoLabel>
                    <BentoValue>{data?.projectSummary?.totalModules || 0} Modules</BentoValue>
                    <BentoIcon $color="#0f62fe"><Layers size={20} /></BentoIcon>
                </BentoCard>
                <BentoCard $delay={0.2}>
                    <BentoLabel>Workload</BentoLabel>
                    <BentoValue>{data?.projectSummary?.totalTasks || 0} Tasks</BentoValue>
                    <BentoIcon $color="#0f62fe"><Target size={20} /></BentoIcon>
                </BentoCard>
                <BentoCard $delay={0.3} $type={data?.delayedTasks?.length > 0 ? "danger" : "success"}>
                    <BentoLabel>Timeline Health</BentoLabel>
                    <BentoValue>{data?.delayedTasks?.length > 0 ? `${data.delayedTasks.length} Delayed` : "On Track"}</BentoValue>
                    <BentoIcon $color={data?.delayedTasks?.length > 0 ? "#da1e28" : "#24a148"}>
                        {data?.delayedTasks?.length > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    </BentoIcon>
                </BentoCard>
                <BentoCard $delay={0.4}>
                    <BentoLabel>Progress</BentoLabel>
                    <BentoValue>{project?.progress || 0}% Complete</BentoValue>
                    <BentoIcon $color="#24a148"><TrendingUp size={20} /></BentoIcon>
                </BentoCard>
            </BentoGrid>

            <GridTwoColumns>
                <ChartCard>
                    <CardHeader>
                        <h3>Task Distribution</h3>
                    </CardHeader>
                    {taskChartData?.length > 0 ? (
                        <div style={{ height: 300 }}>
                            <AnalyticsChart data={taskChartData} dataKey="count" />
                        </div>
                    ) : (
                        <EmptyPlaceholder>No tasks yet</EmptyPlaceholder>
                    )}
                </ChartCard>

                <DelayedCard>
                    <CardHeader>
                        <h3>Attention Needed</h3>
                        {data?.delayedTasks?.length > 0 && <Badge variant="danger" pill>{data.delayedTasks.length} Overdue</Badge>}
                    </CardHeader>
                    <NavigableList>
                        {data?.delayedTasks?.length > 0 ? (
                            data.delayedTasks.map(task => (
                                <DelayedItem key={task._id}>
                                    <div>
                                        <h4>{task.title}</h4>
                                        <span>{task.assignedTo?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="right">
                                        <span className="date">Due {format(new Date(task.dueDate), 'MMM d')}</span>
                                        <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                                    </div>
                                </DelayedItem>
                            ))
                        ) : (
                            <EmptyPlaceholder>
                                <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom: 8 }} />
                                Everything is on schedule
                            </EmptyPlaceholder>
                        )}
                    </NavigableList>
                </DelayedCard>
            </GridTwoColumns>

            <SectionHeader>
                <h2>Modules</h2>
                <ActionBtn onClick={() => setIsCreateModuleModalOpen(true)}>
                    <Plus size={16} /> Add Module
                </ActionBtn>
            </SectionHeader>

            {data?.moduleStats?.length > 0 ? (
                <ModulesGrid>
                    {data.moduleStats.map(mod => {
                        const progressColor = mod.completionPercentage === 100 ? '#24A148' : '#0F62FE';
                        return (
                            <ModuleCard key={mod._id} onClick={() => navigate(`/projects/${id}/modules/${mod._id}`)}>
                                <div className="top">
                                    <h4>{mod.name}</h4>
                                    <Badge variant="neutral" size="sm" style={{borderRadius: 0}}>{mod.status}</Badge>
                                </div>
                                <div className="progress">
                                    <div className="meta">
                                        <span>{mod.completionPercentage}%</span>
                                    </div>
                                    <div className="bar">
                                        <div className="fill" style={{ width: `${mod.completionPercentage}%`, background: progressColor }} />
                                    </div>
                                </div>
                                <div className="meta-row">
                                    <span>{mod.totalTasks || 0} tasks</span>
                                    <span>{mod.estimatedHours || 0}h est</span>
                                </div>
                            </ModuleCard>
                        )
                    })}
                </ModulesGrid>
            ) : (
                <EmptyPlaceholderBox>
                    <Layers size={40} style={{ opacity: 0.3 }} />
                    <p>No modules defined</p>
                </EmptyPlaceholderBox>
            )}
        </ContentFade>
    );

    return (
        <Container>
            {/* Hero Section */}
            <HeroSection style={{ background: projectColor }}>
                <HeroContent>
                    <TopNav>
                        <BackButton to="/projects">
                            <ArrowLeft size={20} />
                            Back to Projects
                        </BackButton>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <GlassBtn onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                <UsersIcon size={18} /> Team ({data?.projectSummary?.teamSize || 'View'})
                            </GlassBtn>
                            <GlassBtn onClick={() => setIsCreateTaskModalOpen(true)} className="primary">
                                <Plus size={18} /> New Task
                            </GlassBtn>
                        </div>
                    </TopNav>
                    <ProjectTitle>
                        <h1 className="title-text">{project?.name}</h1>
                        <ProjectMeta>
                            <GlassTag>
                                <Calendar size={14} />
                                {project?.targetEndDate ? `Due ${format(new Date(project.targetEndDate), 'MMM d, yyyy')}` : 'No due date'}
                            </GlassTag>
                            <GlassTag>{project?.status}</GlassTag>
                            <div className="manager">
                                <div className="avatar">{project?.managerId?.name?.charAt(0)}</div>
                                <span style={{ marginLeft: 8 }}>Managed by {project?.managerId?.name}</span>
                            </div>
                        </ProjectMeta>
                    </ProjectTitle>
                </HeroContent>
            </HeroSection>

            {/* Main Content Area */}
            <MainContent>
                <TabsWrapper>
                    <Tabs
                        tabs={[
                            { label: 'Overview', content: overviewTab },
                            { label: 'Tasks', content: <ProjectTasksTab projectId={id} /> },
                            { label: 'Calendar', content: <CalendarView projectId={id} /> },
                            { label: 'Modules', content: (
                                data?.moduleStats?.length > 0 ? (
                                    <ModulesGrid>
                                        {data.moduleStats.map(mod => {
                                            const progressColor = mod.completionPercentage === 100 ? '#24A148' : '#0F62FE';
                                            return (
                                                <ModuleCard key={mod._id} onClick={() => navigate(`/projects/${id}/modules/${mod._id}`)}>
                                                    <div className="top">
                                                        <h4>{mod.name}</h4>
                                                        <Badge variant="neutral" size="sm" style={{borderRadius: 0}}>{mod.status}</Badge>
                                                    </div>
                                                    <div className="progress">
                                                        <div className="meta">
                                                            <span>{mod.completionPercentage}%</span>
                                                        </div>
                                                        <div className="bar">
                                                            <div className="fill" style={{ width: `${mod.completionPercentage}%`, background: progressColor }} />
                                                        </div>
                                                    </div>
                                                    <div className="meta-row">
                                                        <span>{mod.totalTasks || 0} tasks</span>
                                                        <span>{mod.estimatedHours || 0}h est</span>
                                                    </div>
                                                </ModuleCard>
                                            )
                                        })}
                                    </ModulesGrid>
                                ) : (
                                    <EmptyPlaceholderBox>No modules found</EmptyPlaceholderBox>
                                )
                            ) },
                            { label: 'Team', content: <ProjectTeamTab projectId={id} /> }
                        ]}
                    />
                </TabsWrapper>
            </MainContent>

            {/* Modals & Sidebar */}
            <Modal isOpen={isCreateTaskModalOpen} onClose={() => setIsCreateTaskModalOpen(false)} title="Create New Task">
                <CreateTaskForm
                    projectId={id}
                    onSuccess={() => { setIsCreateTaskModalOpen(false); fetchData(); }}
                    onCancel={() => setIsCreateTaskModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isCreateModuleModalOpen} onClose={() => setIsCreateModuleModalOpen(false)} title="Add New Module">
                <CreateModuleForm
                    projectId={id}
                    onSuccess={() => { setIsCreateModuleModalOpen(false); fetchData(); }}
                    onCancel={() => setIsCreateModuleModalOpen(false)}
                />
            </Modal>

            <TeamMembersSidebar
                projectId={id}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
        </Container>
    );
};

// --- Animations ---
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const Container = styled.div`
    min-height: 100vh;
    background: ${props => props.theme.bg.primary};
    font-family: 'IBM Plex Sans', sans-serif;
    transition: background-color 0.3s;
`;

const HeroSection = styled.div`
    height: 280px; /* Slimmer for Carbon */
    position: relative;
    padding: 0;
    display: flex;
    align-items: flex-end;

    /* Dark overlay so white text is always legible on any project color */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        pointer-events: none;
        z-index: 1;
    }
    
    &::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 140px;
        background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.7));
        pointer-events: none;
        z-index: 1;
    }
`;

const HeroContent = styled.div`
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px;
    color: white;
    z-index: 20;
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

const TopNav = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const BackButton = styled(Link)`
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9375rem;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover { opacity: 1; }
`;

const GlassBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(22, 22, 22, 0.4); /* Solidified Carbon Gray 100 base */
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 0; /* Carbon */
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(22, 22, 22, 0.6);
    }

    &.primary {
        background: #0f62fe; /* Carbon Blue */
        color: white;
        box-shadow: none;
        
        &:hover {
            background: #0043ce;
        }
    }
`;

const ProjectTitle = styled.div`
    animation: ${fadeIn} 0.5s ease-out;

    .title-text {
        font-size: 3rem;
        font-weight: 400; /* Carbon */
        margin: 0 0 16px;
        line-height: 1.1;
        text-shadow: none;
    }
`;

const ProjectMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;

    .manager {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 12px;
        padding-left: 12px;
        border-left: 1px solid rgba(255,255,255,0.3);
        
        .avatar {
            width: 24px; height: 24px;
            background: white;
            color: #0f172a;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.75rem; font-weight: 700;
        }
        span { font-size: 0.875rem; font-weight: 500; opacity: 0.9; }
    }
`;

const GlassTag = styled.div`
    padding: 4px 12px;
    background: rgba(22, 22, 22, 0.6);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 0; /* Carbon */
    font-size: 0.75rem;
    font-weight: 400;
    display: flex; align-items: center; gap: 6px;
    text-transform: uppercase;
`;

const MainContent = styled.div`
    max-width: 1400px;
    margin: -40px auto 0;
    padding: 0 40px 60px;
    position: relative;
    z-index: 20;
`;

const TabsWrapper = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    box-shadow: none; /* Carbon */
    min-height: 500px;
    padding: 32px;
    border: 1px solid ${props => props.theme.border};
`;

// Overview Styles
const ContentFade = styled.div`
    animation: ${fadeIn} 0.4s ease-out;
`;

const BentoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 40px;

    @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const BentoCard = styled.div`
    background: ${props => props.theme.bg.tertiary};
    border-radius: 0; /* Carbon */
    padding: 24px;
    position: relative;
    overflow: hidden;
    border: 1px solid ${props => props.theme.border};
    animation: ${fadeIn} 0.4s ease-out;
    animation-delay: ${props => props.$delay}s;
    animation-fill-mode: backwards;

    ${props => props.$type === 'danger' && css`
        background: ${props.theme.mode === 'dark' ? 'rgba(218, 30, 40, 0.1)' : '#fff1f1'};
        border-color: #da1e28;
    `}
    
    ${props => props.$type === 'success' && css`
        border-bottom: 4px solid #24a148;
    `}
`;

const BentoLabel = styled.div`
    font-size: 0.8125rem;
    color: ${props => props.theme.text.tertiary};
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 8px;
`;

const BentoValue = styled.div`
    font-size: 1.5rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
`;

const BentoIcon = styled.div`
    position: absolute;
    bottom: 24px;
    right: 24px;
    color: ${props => props.$color};
    opacity: 0.8;
`;

const GridTwoColumns = styled.div`
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 32px;
    margin-bottom: 40px;
    
    @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const ChartCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    padding: 24px;
    border: 1px solid ${props => props.theme.border};
`;

const DelayedCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    padding: 24px;
    border: 1px solid ${props => props.theme.border};
    display: flex;
    flex-direction: column;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 { font-size: 1.125rem; font-weight: 700; color: ${props => props.theme.text.primary}; margin: 0; }
`;

const NavigableList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
`;

const DelayedItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(218, 30, 40, 0.05)' : '#fff1f1'};
    border-radius: 0; /* Carbon */
    border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(218, 30, 40, 0.2)' : '#ffb3b8'};
    
    h4 { margin: 0; font-size: 0.9375rem; color: #ef4444; }
    span { font-size: 0.8125rem; color: ${props => props.theme.mode === 'dark' ? '#f87171' : '#b91c1c'}; }

    .right {
        display: flex; align-items: center; gap: 8px;
        .date { font-weight: 600; }
    }
`;

const EmptyPlaceholder = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.text.tertiary};
    font-weight: 400;
    min-height: 200px;
    background: ${props => props.theme.bg.tertiary};
    border-radius: 0; /* Carbon */
    border: 1px dashed ${props => props.theme.border};
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 { font-size: 1.5rem; color: ${props => props.theme.text.primary}; font-weight: 700; margin: 0; }
`;

const ActionBtn = styled.button`
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: ${props => props.theme.bg.card}; 
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    color: ${props => props.theme.text.primary}; 
    font-weight: 400;
    cursor: pointer;
    &:hover { background: ${props => props.theme.bg.hover}; }
`;

const ModulesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
`;

const ModuleCard = styled.div`
    background: ${props => props.theme.bg.card};
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    padding: 24px;
    transition: all 0.2s;
    cursor: pointer;

    &:hover {
        border-color: #0f62fe; /* Carbon Blue */
    }

    .top {
        display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;
        h4 { margin: 0; font-size: 1rem; font-weight: 400; color: ${props => props.theme.text.primary}; }
    }

    .progress {
        margin-bottom: 20px;
        .meta { display: flex; justify-content: flex-end; font-size: 0.75rem; color: ${props => props.theme.text.secondary}; margin-bottom: 6px; font-weight: 400; }
        .bar { height: 4px; background: ${props => props.theme.bg.tertiary}; border-radius: 0; overflow: hidden; }
        .fill { height: 100%; border-radius: 0; }
    }

    .meta-row {
        display: flex; gap: 12px; font-size: 0.8125rem; color: ${props => props.theme.text.tertiary}; font-weight: 500;
    }
`;

const EmptyPlaceholderBox = styled(EmptyPlaceholder)`
    padding: 40px;
`;

export default ProjectDashboard;
