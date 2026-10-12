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
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }

    &.primary {
        background: #111827; /* Dark black pill */
        color: white;
        border-color: #111827;
        
        &:hover {
            background: #1F2937;
        }
    }
`;

const ProjectTitle = styled.div`
    animation: ${fadeIn} 0.5s ease-out;

    .title-text {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 14px;
        line-height: 1.15;
        letter-spacing: -0.02em;
    }
`;

const ProjectMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .manager {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 8px;
        padding-left: 12px;
        border-left: 1px solid rgba(255,255,255,0.3);
        
        .avatar {
            width: 24px; height: 24px;
            background: white;
            color: #008060;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.75rem; font-weight: 700;
        }
        span { font-size: 0.875rem; font-weight: 500; opacity: 0.95; }
    }
`;

const GlassTag = styled.div`
    padding: 4px 14px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex; align-items: center; gap: 6px;
    text-transform: capitalize;
`;

const MainContent = styled.div`
    max-width: 1400px;
    margin: -36px auto 0;
    padding: 0 32px 60px;
    position: relative;
    z-index: 20;
`;

const TabsWrapper = styled.div`
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    min-height: 500px;
    padding: 28px 32px;
    border: 1px solid #E5E7EB;
`;

// Overview Styles
const ContentFade = styled.div`
    animation: ${fadeIn} 0.4s ease-out;
`;

const BentoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 32px;

    @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const BentoCard = styled.div`
    background: #FAFAFA;
    border-radius: 14px;
    padding: 22px;
    position: relative;
    overflow: hidden;
    border: 1px solid #E5E7EB;
    transition: all 0.2s ease;

    &:hover {
        background: #ffffff;
        border-color: #D1D5DB;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        transform: translateY(-2px);
    }

    ${props => props.$type === 'danger' && css`
        background: #FEF2F2;
        border-color: #FECACA;
    `}
    
    ${props => props.$type === 'success' && css`
        border-bottom: 3px solid #008060;
    `}
`;

const BentoLabel = styled.div`
    font-size: 0.75rem;
    color: #6B7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
`;

const BentoValue = styled.div`
    font-size: 1.45rem;
    font-weight: 700;
    color: #111827;
`;

const BentoIcon = styled.div`
    position: absolute;
    bottom: 20px;
    right: 20px;
    color: ${props => props.$color};
    opacity: 0.85;
`;

const GridTwoColumns = styled.div`
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
    
    @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const ChartCard = styled.div`
    background: #ffffff;
    border-radius: 14px;
    padding: 24px;
    border: 1px solid #E5E7EB;
`;

const DelayedCard = styled.div`
    background: #ffffff;
    border-radius: 14px;
    padding: 24px;
    border: 1px solid #E5E7EB;
    display: flex;
    flex-direction: column;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
`;

const NavigableList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
`;

const DelayedItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: #FEF2F2;
    border-radius: 10px;
    border: 1px solid #FEE2E2;
    
    h4 { margin: 0; font-size: 0.875rem; color: #DC2626; font-weight: 600; }
    span { font-size: 0.75rem; color: #991B1B; }

    .right {
        display: flex; align-items: center; gap: 6px;
        .date { font-weight: 600; font-size: 0.75rem; color: #DC2626; }
    }
`;

const EmptyPlaceholder = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9CA3AF;
    font-weight: 500;
    min-height: 180px;
    background: #F9FAFB;
    border-radius: 12px;
    border: 1px dashed #E5E7EB;
    font-size: 0.875rem;
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 { font-size: 1.25rem; color: #111827; font-weight: 700; margin: 0; }
`;

const ActionBtn = styled.button`
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: #111827; 
    border: none;
    border-radius: 9999px;
    color: #ffffff; 
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;
    &:hover { background: #1F2937; transform: translateY(-1px); }
`;

const ModulesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
`;

const ModuleCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 20px;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
        border-color: #008060;
        box-shadow: 0 4px 12px rgba(0, 128, 96, 0.08);
        transform: translateY(-2px);
    }

    .top {
        display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;
        h4 { margin: 0; font-size: 0.9375rem; font-weight: 600; color: #111827; }
    }

    .progress {
        margin-bottom: 16px;
        .meta { display: flex; justify-content: flex-end; font-size: 0.75rem; color: #6B7280; margin-bottom: 4px; font-weight: 600; }
        .bar { height: 6px; background: #F3F4F6; border-radius: 9999px; overflow: hidden; }
        .fill { height: 100%; border-radius: 9999px; transition: width 0.3s ease; }
    }

    .meta-row {
        display: flex; gap: 12px; font-size: 0.75rem; color: #9CA3AF; font-weight: 500;
    }
`;

const EmptyPlaceholderBox = styled(EmptyPlaceholder)`
    padding: 40px;
`;

export default ProjectDashboard;
