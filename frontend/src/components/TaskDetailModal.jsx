import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, Circle, History } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import TaskComments from './TaskComments';
import TaskAttachments from './TaskAttachments';
import TimeTracker from './TimeTracker';
import TaskActivityTimeline from './TaskActivityTimeline';
import { useSocket } from '../context/SocketContext';

const TaskDetailModal = ({ taskId, onClose, onUpdate }) => {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [workflowStages, setWorkflowStages] = useState([]);
    const [updating, setUpdating] = useState(false);
    const socket = useSocket();

    useEffect(() => {
        if (taskId) {
            fetchTaskDetails();
        }

        // Socket.IO listeners for real-time updates
        if (socket) {
            socket.on('task:updated', (data) => {
                if (data.taskId === taskId) {
                    fetchTaskDetails();
                    if (onUpdate) onUpdate();
                }
            });

            socket.on('comment:created', (data) => {
                if (data.taskId === taskId) {
                    // TaskComments component will handle this
                }
            });

            socket.on('attachment:created', (data) => {
                if (data.taskId === taskId) {
                    // TaskAttachments component will handle this
                }
            });

            socket.on('time:updated', (data) => {
                if (data.taskId === taskId) {
                    // TimeTracker component will handle this
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('task:updated');
                socket.off('comment:created');
                socket.off('attachment:created');
                socket.off('time:updated');
            }
        };
    }, [taskId, socket, onUpdate]);

    const fetchTaskDetails = async () => {
        try {
            const res = await api.get(`/tasks/${taskId}`);
            setTask(res.data);

            // Fetch workflow stages for the project
            if (res.data.projectId?._id) {
                const stagesRes = await api.get(`/workflow-stages?projectId=${res.data.projectId._id}`);
                setWorkflowStages(stagesRes.data || []);
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch task details', error);
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStageId) => {
        if (!newStageId || newStageId === task.currentStage?._id) return;

        setUpdating(true);
        try {
            await api.patch(`/tasks/${taskId}/status`, { stageId: newStageId });
            // Refresh task details to show updated status
            await fetchTaskDetails();
            // Notify parent component to refresh
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to update task status', error);
            alert(error.response?.data?.message || 'Failed to update task status');
        } finally {
            setUpdating(false);
        }
    };

    if (!taskId) return null;

    const getPriorityColor = (p) => {
        switch (p) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#d97706';
            case 'low': return '#22c55e';
            default: return '#64748b';
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                {loading ? (
                    <LoadingState>Loading task details...</LoadingState>
                ) : task ? (
                    <>
                        <Header>
                            <HeaderLeft>
                                <TaskId>#{task._id.slice(-4)}</TaskId>
                                <Title>{task.title}</Title>
                            </HeaderLeft>
                            <CloseButton onClick={onClose}>
                                <X size={20} />
                            </CloseButton>
                        </Header>

                        <Content>
                            <MainColumn>
                                <Section>
                                    <Label>Description</Label>
                                    <Description>
                                        {task.description || 'No description provided.'}
                                    </Description>
                                </Section>

                                <Section>
                                    <Label>Attachments</Label>
                                    <TaskAttachments taskId={taskId} />
                                </Section>

                                <Section>
                                    <Label>Activity & Comments</Label>
                                    <TaskComments taskId={taskId} />
                                </Section>
                            </MainColumn>

                            <Sidebar>
                                <SidebarSection>
                                    <Label>Status</Label>
                                    <StatusDropdown
                                        value={task.currentStage?._id || ''}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        disabled={updating}
                                    >
                                        <option value="" disabled>Select stage...</option>
                                        {workflowStages.map(stage => (
                                            <option key={stage._id} value={stage._id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </StatusDropdown>
                                    {task.currentStage && (
                                        <CurrentStage>
                                            Current: <strong>{task.currentStage.name}</strong>
                                        </CurrentStage>
                                    )}
                                </SidebarSection>

                                <SidebarSection>
                                    <Label>Priority</Label>
                                    <PriorityBadge $color={getPriorityColor(task.priority)}>
                                        {task.priority}
                                    </PriorityBadge>
                                </SidebarSection>

                                <SidebarSection>
                                    <Label>Due Date</Label>
                                    <MetaRow>
                                        <Calendar size={14} />
                                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No date'}
                                    </MetaRow>
                                </SidebarSection>

                                <SidebarSection>
                                    <Label>Time Tracking</Label>
                                    <TimeTracker taskId={taskId} />
                                </SidebarSection>

                                <SidebarSection>
                                    <Label>Assignee</Label>
                                    <AssigneeRow>
                                        {Array.isArray(task.assignedTo) ? (
                                            task.assignedTo.map(user => (
                                                <UserBadge key={user._id}>
                                                    <Avatar>
                                                        {user.avatar ? (
                                                            <AvatarImg src={user.avatar} />
                                                        ) : (
                                                            user.name?.charAt(0) || '?'
                                                        )}
                                                    </Avatar>
                                                    <UserName>{user.name}</UserName>
                                                </UserBadge>
                                            ))
                                        ) : (
                                            task.assignedTo && (
                                                <UserBadge>
                                                    <Avatar>
                                                        {task.assignedTo.name?.charAt(0) || '?'}
                                                    </Avatar>
                                                    <UserName>{task.assignedTo.name}</UserName>
                                                </UserBadge>
                                            )
                                        )}
                                    </AssigneeRow>
                                </SidebarSection>
                                <SidebarSection>
                                    <Label><History size={14} />History</Label>
                                    <TaskActivityTimeline taskId={taskId} />
                                </SidebarSection>

                            </Sidebar>
                        </Content>
                    </>
                ) : (
                    <ErrorState>Failed to load task</ErrorState>
                )}
            </ModalContainer>
        </Overlay>
    );
};

// Animations
const fadeIn = keyframes`
    from { 
        opacity: 0; 
        transform: scale(0.95);
    }
    to { 
        opacity: 1; 
        transform: scale(1);
    }
`;

const slideUp = keyframes`
    from { 
        opacity: 0; 
        transform: translateY(20px);
    }
    to { 
        opacity: 1; 
        transform: translateY(0);
    }
`;

const shimmer = keyframes`
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
`;

// Styled Components
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
    background: ${props => props.theme.bg.card};
    width: 90%;
    max-width: 1000px;
    height: 90vh;
    border-radius: 24px;
    box-shadow: ${props => props.theme.shadow.xl};
    border: 1px solid ${props => props.theme.border};
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ${slideUp} 0.3s ease-out;
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #f97316, #fb923c, #fdba74);
        background-size: 200% 100%;
        animation: ${shimmer} 3s linear infinite;
    }
`;

const Header = styled.div`
    padding: 28px 32px;
    background: ${props => props.theme.bg.primary};
    border-bottom: 2px solid ${props => props.theme.border};
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
`;

const HeaderLeft = styled.div`
    flex: 1;
`;

const TaskId = styled.div`
    font-size: 11px;
    color: ${props => props.theme.text.tertiary};
    margin-bottom: 6px;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
`;

const Title = styled.h2`
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin: 0;
    line-height: 1.3;
`;

const CloseButton = styled.button`
    background: ${props => props.theme.bg.hover};
    border: none;
    color: ${props => props.theme.text.secondary};
    cursor: pointer;
    padding: 10px;
    border-radius: 12px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: ${props => props.theme.bg.tertiary};
        color: ${props => props.theme.text.primary};
        transform: rotate(90deg);
    }
    
    &:active {
        transform: rotate(90deg) scale(0.95);
    }
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    background: ${props => props.theme.bg.tertiary};
    
    @media (max-width: 768px) {
        flex-direction: column;
        overflow-y: auto;
    }
`;

const MainColumn = styled.div`
    flex: 1;
    padding: 32px;
    overflow-y: auto;
    border-right: 2px solid ${props => props.theme.border};
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 8px;
    }
    
    &::-webkit-scrollbar-track {
        background: ${props => props.theme.bg.tertiary};
    }
    
    &::-webkit-scrollbar-thumb {
        background: ${props => props.theme.border};
        border-radius: 4px;
        
        &:hover {
            background: ${props => props.theme.text.tertiary};
        }
    }
    
    @media (max-width: 768px) {
        border-right: none;
        border-bottom: 2px solid ${props => props.theme.border};
    }
`;

const Sidebar = styled.div`
    width: 340px;
    padding: 32px 28px;
    background: ${props => props.theme.bg.primary};
    overflow-y: auto;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 8px;
    }
    
    &::-webkit-scrollbar-track {
        background: ${props => props.theme.bg.tertiary};
    }
    
    &::-webkit-scrollbar-thumb {
        background: ${props => props.theme.border};
        border-radius: 4px;
        
        &:hover {
            background: ${props => props.theme.text.tertiary};
        }
    }
    
    @media (max-width: 768px) {
        width: 100%;
        background: ${props => props.theme.bg.card};
    }
`;

const Section = styled.div`
    margin-bottom: 36px;
    animation: ${fadeIn} 0.4s ease-out;
`;

const SidebarSection = styled.div`
    margin-bottom: 28px;
    padding: 20px;
    background: ${props => props.theme.bg.card};
    border-radius: 16px;
    border: 1px solid ${props => props.theme.border};
    box-shadow: ${props => props.theme.shadow.sm};
    transition: all 0.3s ease;
    
    &:hover {
        box-shadow: ${props => props.theme.shadow.md};
        transform: translateY(-2px);
    }
`;

const Label = styled.h3`
    font-size: 11px;
    text-transform: uppercase;
    color: ${props => props.theme.text.tertiary};
    font-weight: 700;
    margin: 0 0 12px 0;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &::before {
        content: '';
        width: 3px;
        height: 12px;
        background: linear-gradient(180deg, #f97316, #fb923c);
        border-radius: 2px;
    }
`;

const Description = styled.div`
    color: ${props => props.theme.text.secondary};
    line-height: 1.7;
    font-size: 15px;
    white-space: pre-wrap;
    background: ${props => props.theme.bg.card};
    padding: 20px;
    border-radius: 12px;
    border: 1px solid ${props => props.theme.border};
    box-shadow: ${props => props.theme.shadow.sm};
`;

const StatusBadge = styled.span`
    display: inline-block;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    background: ${props => props.theme.bg.tertiary};
    color: ${props => props.theme.text.secondary};
    text-transform: capitalize;
    box-shadow: ${props => props.theme.shadow.sm};
`;

const StatusDropdown = styled.select`
    width: 100%;
    padding: 12px 16px;
    border: 2px solid ${props => props.theme.border};
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.text.primary};
    background: ${props => props.theme.bg.card};
    cursor: pointer;
    transition: all 0.3s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 40px;
    
    &:hover {
        border-color: ${props => props.theme.text.tertiary};
        background-color: ${props => props.theme.bg.hover};
    }
    
    &:focus {
        outline: none;
        border-color: #f97316;
        box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
        background-color: ${props => props.theme.bg.card};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: ${props => props.theme.bg.tertiary};
    }
`;

const CurrentStage = styled.div`
    margin-top: 12px;
    padding: 10px 14px;
    font-size: 12px;
    color: ${props => props.theme.text.secondary};
    background: ${props => props.theme.mode === 'dark' ? 'rgba(254, 243, 199, 0.1)' : 'linear-gradient(135deg, #fef3c7, #fed7aa)'};
    border-radius: 8px;
    border-left: 3px solid #f97316;
    
    strong {
        color: ${props => props.theme.mode === 'dark' ? '#fbbf24' : '#ea580c'};
        font-weight: 700;
    }
`;

const PriorityBadge = styled.span`
    display: inline-block;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    background: ${props => `linear-gradient(135deg, ${props.$color}15, ${props.$color}25)`};
    color: ${props => props.$color};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 2px 8px ${props => `${props.$color}20`};
    border: 1px solid ${props => `${props.$color}30`};
`;

const MetaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${props => props.theme.text.primary};
    font-size: 14px;
    font-weight: 600;
    padding: 10px 14px;
    background: ${props => props.theme.bg.tertiary};
    border-radius: 8px;
    border: 1px solid ${props => props.theme.border};
    
    svg {
        color: #f97316;
    }
`;

const AssigneeRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

const UserBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${props => props.theme.bg.card};
    padding: 6px 14px 6px 6px;
    border-radius: 24px;
    border: 2px solid ${props => props.theme.border};
    transition: all 0.2s ease;
    
    &:hover {
        border-color: #f97316;
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
        transform: translateY(-2px);
    }
`;

const Avatar = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f97316, #fb923c);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: white;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
`;

const AvatarImg = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const UserName = styled.span`
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.text.primary};
`;

const LoadingState = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.text.tertiary};
    gap: 16px;
    
    &::before {
        content: '';
        width: 48px;
        height: 48px;
        border: 4px solid ${props => props.theme.border};
        border-top-color: #f97316;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

const ErrorState = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
    font-weight: 600;
    font-size: 16px;
`;

export default TaskDetailModal;
