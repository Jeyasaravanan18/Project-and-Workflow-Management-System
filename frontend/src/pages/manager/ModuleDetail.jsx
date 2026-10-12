import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageContainer from '../../components/PageContainer';
import Badge from '../../components/Badge';
import Avatar from '../../components/Avatar';
import TaskCard from '../../components/TaskCard';
import TaskDetailModal from '../../components/TaskDetailModal';
import Modal from '../../components/Modal';
import CreateTaskForm from '../../components/forms/CreateTaskForm';
import { Plus, Users, Clock, CheckCircle2, MoreHorizontal, ArrowRight } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from '../../utils/toast';

const ModuleDetail = () => {
    const { projectId, moduleId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [workflowStages, setWorkflowStages] = useState([]);

    const fetchData = async () => {
        try {
            const [moduleRes, projectRes] = await Promise.all([
                api.get(`/modules/${moduleId}`),
                api.get(`/projects/${projectId}`)
            ]);

            setData(moduleRes.data);

            if (projectRes.data.workflowStages) {
                setWorkflowStages(projectRes.data.workflowStages.sort((a, b) => a.order - b.order));
            }
        } catch (error) {
            console.error('Error fetching module details:', error);
        } finally {
            setTimeout(() => setLoading(false), 300);
        }
    };

    useEffect(() => {
        fetchData();
    }, [moduleId, isCreateTaskModalOpen]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const taskId = draggableId;
        const newStageId = destination.droppableId;

        // Optimistic UI update
        const taskToMove = tasks.find(t => t._id === taskId);
        if (!taskToMove) return;

        const originalTasks = [...tasks];
        const updatedTasks = tasks.map(t => 
            t._id === taskId ? { ...t, currentStage: { ...t.currentStage, _id: newStageId } } : t
        );
        setData(prev => ({ ...prev, tasks: updatedTasks }));

        try {
            await api.patch(`/tasks/${taskId}/status`, { stageId: newStageId });
            toast.success(`Task moved to Stage`);
        } catch (error) {
            console.error('Failed to update task status:', error);
            toast.error('Failed to move task');
            setData(prev => ({ ...prev, tasks: originalTasks }));
        }
    };

    if (loading || !data) {
        return (
            <PageContainer>
                <LoadingWrapper>
                    <Spinner />
                    <p>Loading module details...</p>
                </LoadingWrapper>
            </PageContainer>
        );
    }

    const { module, tasks, stats, teamMemberIds } = data;

    // Group tasks by workflow stage
    const tasksByStage = workflowStages.reduce((acc, stage) => {
        acc[stage._id] = tasks.filter(task =>
            task.currentStage && task.currentStage._id === stage._id
        );
        return acc;
    }, {});

    return (
        <PageContainer
            title={module.name}
            breadcrumbs={[
                { label: 'Projects', href: '/projects' },
                { label: module.projectId.name, href: `/projects/${projectId}` },
                { label: module.name }
            ]}
            actions={
                <PrimaryButton onClick={() => setIsCreateTaskModalOpen(true)}>
                    <Plus size={18} />
                    Create Task
                </PrimaryButton>
            }
        >
            {/* Module Overview Card */}
            <HeaderCard>
                <HeaderMain>
                    <HeaderTop>
                        <TitleSection>
                            <ModuleTitle>{module.name}</ModuleTitle>
                            <Badge variant="primary" pill>{module.status}</Badge>
                        </TitleSection>
                        <MetaSection>
                            <MetaItem>
                                <Users size={16} />
                                <span>Owner: {module.ownerId?.name}</span>
                            </MetaItem>
                            <MetaItem>
                                <Clock size={16} />
                                <span>Est. {module.estimatedHours}h</span>
                            </MetaItem>
                        </MetaSection>
                    </HeaderTop>

                    <ProgressSection>
                        <ProgressLabel>
                            <span>Progress</span>
                            <ProgressValue>{stats.completionPercentage}%</ProgressValue>
                        </ProgressLabel>
                        <ProgressBar>
                            <ProgressFill style={{ width: `${stats.completionPercentage}%` }} />
                        </ProgressBar>
                    </ProgressSection>
                </HeaderMain>

                {teamMemberIds.length > 0 && (
                    <TeamSection>
                        <TeamLabel>Team Members</TeamLabel>
                        <TeamList>
                            {/* Placeholder for avatars, assuming we might fetch details later or just show count */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={16} color="#64748b" />
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    {teamMemberIds.length} member{teamMemberIds.length > 1 ? 's' : ''} assigned
                                </span>
                            </div>
                        </TeamList>
                    </TeamSection>
                )}
            </HeaderCard>

            {/* Kanban Board */}
            <BoardContainer>
                {stats.totalTasks === 0 ? (
                    <EmptyBoard>
                        <CheckCircle2 size={48} color="#cbd5e1" />
                        <EmptyTitle>No tasks yet</EmptyTitle>
                        <EmptyDesc>Get started by creating the first task for this module.</EmptyDesc>
                        <PrimaryButton onClick={() => setIsCreateTaskModalOpen(true)}>
                            <Plus size={18} />
                            Create Task
                        </PrimaryButton>
                    </EmptyBoard>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <KanbanGrid columns={workflowStages.length}>
                            {workflowStages.map(stage => {
                                const stageTasks = tasksByStage[stage._id] || [];

                                return (
                                    <KanbanColumn key={stage._id}>
                                        <ColumnHeader>
                                            <ColumnTitle>{stage.name}</ColumnTitle>
                                            <CountBadge>{stageTasks.length}</CountBadge>
                                        </ColumnHeader>

                                        <Droppable droppableId={stage._id}>
                                            {(provided) => (
                                                <ColumnContent
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    {stageTasks.length > 0 ? (
                                                        stageTasks.map((task, index) => (
                                                            <Draggable key={task._id} draggableId={task._id} index={index}>
                                                                {(provided) => (
                                                                    <StyledTaskCardWrapper
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                    >
                                                                        <TaskCard
                                                                            task={task}
                                                                            onClick={() => setSelectedTaskId(task._id)}
                                                                        />
                                                                    </StyledTaskCardWrapper>
                                                                )}
                                                            </Draggable>
                                                        ))
                                                    ) : (
                                                        <EmptyColumn>No tasks</EmptyColumn>
                                                    )}
                                                    {provided.placeholder}
                                                </ColumnContent>
                                            )}
                                        </Droppable>
                                    </KanbanColumn>
                                );
                            })}
                        </KanbanGrid>
                    </DragDropContext>
                )}
            </BoardContainer>

            <Modal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                title="Create New Task"
            >
                <CreateTaskForm
                    projectId={projectId}
                    moduleId={moduleId}
                    onSuccess={() => setIsCreateTaskModalOpen(false)}
                    onCancel={() => setIsCreateTaskModalOpen(false)}
                />
            </Modal>

            <TaskDetailModal
                taskId={selectedTaskId}
                isOpen={!!selectedTaskId}
                onClose={() => setSelectedTaskId(null)}
                onUpdate={fetchData}
            />
        </PageContainer>
    );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// Styled Components
const LoadingWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    color: #64748b;
    gap: 16px;
`;

const Spinner = styled.div`
    width: 36px;
    height: 36px;
    border: 3px solid #e5e7eb;
    border-top-color: #1E40AF;
    border-radius: 50%;
    animation: ${rotate} 0.8s linear infinite;
`;

const PrimaryButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 20px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #1E40AF;
        transform: translateY(-1px);
    }
`;

const HeaderCard = styled.div`
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    padding: 28px 32px;
    margin-bottom: 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    animation: ${fadeIn} 0.4s ease-out;
`;

const HeaderMain = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 40px;
    margin-bottom: 20px;

    @media (max-width: 968px) {
        flex-direction: column;
        gap: 20px;
    }
`;

const HeaderTop = styled.div`
    flex: 1;
`;

const TitleSection = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
`;

const ModuleTitle = styled.h1`
    font-size: 1.6rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.02em;
    margin: 0;
`;

const MetaSection = styled.div`
    display: flex;
    gap: 20px;
    color: #6b7280;
`;

const MetaItem = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    
    svg {
        color: #9ca3af;
    }
`;

const ProgressSection = styled.div`
    flex: 1;
    max-width: 380px;
    background: #f8fafc;
    padding: 18px 20px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;

    @media (max-width: 968px) {
        width: 100%;
        max-width: none;
    }
`;

const ProgressLabel = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5563;
`;

const ProgressValue = styled.span`
    color: #1E40AF;
`;

const ProgressBar = styled.div`
    height: 6px;
    background: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    background: #1E40AF;
    border-radius: 9999px;
    transition: width 0.5s ease-out;
`;

const TeamSection = styled.div`
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
`;

const TeamLabel = styled.div`
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 10px;
    letter-spacing: 0.05em;
`;

const TeamList = styled.div`
    display: flex;
    gap: 8px;
`;

const BoardContainer = styled.div`
    animation: ${fadeIn} 0.4s ease-out 0.1s;
    animation-fill-mode: backwards;
`;

const EmptyBoard = styled.div`
    text-align: center;
    padding: 70px 24px;
    background: #ffffff;
    border-radius: 14px;
    border: 1px dashed #e5e7eb;
    display: flex;
    flex-direction: column;
    align-items: center;

    svg {
        margin-bottom: 20px;
    }
`;

const EmptyTitle = styled.h3`
    font-size: 1.3rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
`;

const EmptyDesc = styled.p`
    font-size: 0.95rem;
    color: #6b7280;
    margin-bottom: 24px;
`;

const KanbanGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(${props => props.columns}, minmax(300px, 1fr));
    gap: 20px;
    overflow-x: auto;
    padding-bottom: 24px;
`;

const KanbanColumn = styled.div`
    background: #f8fafc;
    border-radius: 14px;
    padding: 16px;
    border: 1px solid #e5e7eb;
    min-height: 500px;
    display: flex;
    flex-direction: column;
`;

const ColumnHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding: 0 4px;
`;

const ColumnTitle = styled.h3`
    font-size: 0.8rem;
    font-weight: 700;
    color: #4b5563;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const CountBadge = styled.span`
    background: #EFF6FF;
    color: #1E40AF;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    min-width: 24px;
    text-align: center;
`;

const ColumnContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const EmptyColumn = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
    font-style: italic;
    font-size: 0.85rem;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    margin-top: 8px;
`;

const StyledTaskCardWrapper = styled.div`
    transition: all 0.2s ease;
    
    &:hover {
        transform: translateY(-2px);
    }
`;

export default ModuleDetail;
