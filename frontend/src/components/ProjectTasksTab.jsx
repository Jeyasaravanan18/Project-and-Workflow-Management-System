import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import api from '../services/api';
import { CheckCircle2, Circle, Clock, AlertCircle, MoreHorizontal, Download, Trash2, UserCheck, CheckSquare2, Square, X } from 'lucide-react';
import { format } from 'date-fns';
import TaskDetailModal from './TaskDetailModal';
import toast from '../utils/toast';

const ProjectTasksTab = ({ projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState(new Set());

    const fetchTasks = async () => {
        try {
            const res = await api.get(`/tasks?projectId=${projectId}`);
            setTasks(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'critical': return '#da1e28';
            case 'high': return '#ff832b';
            case 'medium': return '#0f62fe';
            case 'low': return '#24a148';
            default: return '#8d8d8d';
        }
    };

    const handleExport = async (e) => {
        e.stopPropagation();
        try {
            const response = await api.get(`/export/tasks?projectId=${projectId}&format=csv`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `project-tasks.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export tasks');
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
            fetchTasks();
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
            fetchTasks();
        } catch {
            toast.dismiss(toastId);
            toast.error('Failed to update tasks');
        }
    };

    const getStatusIcon = (status) => {
        // This depends on the stage object, assuming populated
        // If stage is an object with 'type' or 'name'
        return <Circle size={18} />;
    };

    if (loading) return <LoadingState>Loading tasks...</LoadingState>;

    if (tasks.length === 0) {
        return (
            <EmptyState>
                <div className="icon">
                    <CheckCircle2 size={48} />
                </div>
                <h3>No tasks found</h3>
                <p>Get started by creating a new task above.</p>
            </EmptyState>
        );
    }

    return (
        <Container>
            <Header>
                <Title>Tasks</Title>
                <ExportButton onClick={handleExport}>
                    <Download size={14} />
                    Export CSV
                </ExportButton>
            </Header>
            {tasks.map((task, index) => (
                <TaskCard 
                    key={task._id} 
                    delay={index * 0.05} 
                    onClick={() => setSelectedTaskId(task._id)}
                    $selected={selectedTasks.has(task._id)}
                >
                    <TaskCheckbox 
                        onClick={(e) => toggleSelectTask(e, task._id)}
                        aria-label="Select task"
                    >
                        {selectedTasks.has(task._id) 
                            ? <CheckSquare2 size={16} /> 
                            : <Square size={16} />}
                    </TaskCheckbox>
                    <StatusLine $priority={getPriorityColor(task.priority)} />

                    <TaskMain>
                        <TaskHeader>
                            <TaskTitle>{task.title}</TaskTitle>
                            {task.moduleId && (
                                <ModuleBadge>{task.moduleId.name}</ModuleBadge>
                            )}
                        </TaskHeader>

                        <TaskDesc>{task.description || 'No description'}</TaskDesc>

                        <TaskFooter>
                            <MetaGroup>
                                <MetaItem>
                                    <Clock size={14} />
                                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No Date'}
                                </MetaItem>
                                <PriorityBadge $color={getPriorityColor(task.priority)}>
                                    {task.priority}
                                </PriorityBadge>
                            </MetaGroup>

                            <AvatarGroup>
                                {Array.isArray(task.assignedTo) ? (
                                    task.assignedTo.map((user, i) => (
                                        <Avatar key={user._id || i} $params={{ index: i }}>
                                            {user.name ? user.name.charAt(0) : '?'}
                                        </Avatar>
                                    ))
                                ) : (
                                    // Fallback for old single assignee data
                                    task.assignedTo && (
                                        <Avatar>
                                            {task.assignedTo.name ? task.assignedTo.name.charAt(0) : '?'}
                                        </Avatar>
                                    )
                                )}
                            </AvatarGroup>
                        </TaskFooter>
                    </TaskMain>
                </TaskCard>
            ))}

            {selectedTasks.size > 0 && (
                <BulkToolbar>
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
                        <X size={14} /> Clear
                    </BulkBtn>
                </BulkToolbar>
            )}

            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    onClose={() => {
                        setSelectedTaskId(null);
                        fetchTasks(); // Refresh tasks after closing
                    }}
                    onUpdate={fetchTasks} // Refresh tasks when task is updated
                />
            )}
        </Container>
    );
};

// Animations
const fadeIn = keyframes`
            from {opacity: 0; transform: translateY(10px); }
            to {opacity: 1; transform: translateY(0); }
            `;

// Styled Components
const Container = styled.div`
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding-bottom: 40px;
            `;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const Title = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: #334155;
    margin: 0;
`;

const ExportButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.theme.border};
    border-radius: 0; /* Carbon */
    color: ${p => p.theme.text.secondary};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${p => p.theme.bg.tertiary};
        color: ${p => p.theme.text.primary};
        border-color: #0f62fe;
    }
`;

const LoadingState = styled.div`
            text-align: center;
            padding: 40px;
            color: #94a3b8;
            `;

const EmptyState = styled.div`
            text-align: center;
            padding: 60px;
            background: ${p => p.theme.bg.card};
            border-radius: 0; /* Carbon */
            border: 1px dashed ${p => p.theme.border};

            .icon {
                color: #cbd5e1;
            margin-bottom: 16px;
    }

            h3 {
                font - size: 1.125rem;
            color: #0f172a;
            margin-bottom: 4px;
    }

            p {
                color: #64748b;
    }
            `;

const TaskCard = styled.div`
            background: ${p => p.$selected ? p.theme.bg.tertiary : p.theme.bg.card};
            border-radius: 0; /* Carbon */
            border: 1px solid ${p => p.$selected ? '#0f62fe' : p.theme.border};
            overflow: hidden;
            position: relative;
            transition: all 0.2s ease;
            animation: ${fadeIn} 0.4s ease-out;
            animation-delay: ${props => props.delay}s;
            opacity: 0;
            animation-fill-mode: forwards;
            display: flex;

            cursor: pointer;

            &:hover {
                background: ${p => p.theme.bg.tertiary};
                border-color: #0f62fe;
            }
`;

const TaskCheckbox = styled.button`
    width: 32px;
    height: 100%;
    align-self: stretch;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: ${p => p.theme.text.tertiary};
    transition: all 0.2s;
    border-right: 1px solid ${p => p.theme.border};

    &:hover {
        background: ${p => p.theme.bg.hover};
        color: #0f62fe;
    }
`;

const BulkToolbar = styled.div`
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    background: ${props => props.theme.mode === 'dark' ? '#161616' : '#ffffff'};
    color: ${props => props.theme.text.primary};
    padding: 12px 24px;
    border-top: 4px solid #0f62fe;
    border-radius: 0;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    
    @media print { display: none; }
`;

const BulkCount = styled.span`
    font-size: 0.875rem;
    font-weight: 600;
    margin-right: 16px;
    color: ${p => p.theme.text.primary};
`;

const BulkBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 0.8125rem;
    font-weight: 400;
    border-radius: 0;
    border: ${props => props.$ghost ? `1px solid ${props.theme.border}` : 'none'};
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;

    background: ${props => props.$danger
        ? '#da1e28'
        : props.$ghost
            ? 'transparent'
            : '#0f62fe'};
    color: ${props => props.$ghost ? props.theme.text.secondary : 'white'};

    &:hover {
        background: ${props => props.$danger
            ? '#a51921'
            : props.$ghost
                ? props.theme.bg.hover
                : '#0043ce'};
    }
`;

const StatusLine = styled.div`
            width: 4px;
            background: ${props => props.$priority};
            `;

const TaskMain = styled.div`
            flex: 1;
            padding: 20px;
            `;

const TaskHeader = styled.div`
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            `;

const TaskTitle = styled.h3`
            font-size: 1rem;
            font-weight: 400; /* Carbon */
            color: ${p => p.theme.text.primary};
            margin: 0;
            `;

const ModuleBadge = styled.span`
            padding: 2px 8px;
            background: ${p => p.theme.bg.tertiary};
            color: ${p => p.theme.text.secondary};
            font-size: 0.75rem;
            font-weight: 400;
            border-radius: 0;
            border: 1px solid ${p => p.theme.border};
            `;

const TaskDesc = styled.p`
            font-size: 0.875rem;
            color: #64748b;
            margin-bottom: 16px;
            line-height: 1.5;
            `;

const TaskFooter = styled.div`
            display: flex;
            justify-content: space-between;
            align-items: center;
            `;

const MetaGroup = styled.div`
            display: flex;
            align-items: center;
            gap: 16px;
            `;

const MetaItem = styled.div`
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8125rem;
            color: #94a3b8;
            font-weight: 500;
            `;

const PriorityBadge = styled.span`
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            color: ${props => props.$color};
            background: ${props => `${props.$color}15`};
            padding: 2px 8px;
            border-radius: 0;
            border: 1px solid ${props => props.$color};
            `;

const AvatarGroup = styled.div`
            display: flex;
            align-items: center;
            `;

const Avatar = styled.div`
            width: 28px;
            height: 28px;
            border-radius: 0; /* Carbon */
            background: #0f62fe; /* Carbon Blue */
            border: 1px solid white;
            color: white;
            font-size: 0.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: -8px;
            position: relative;
            z-index: ${props => 10 - (props.$params?.index || 0)};

            &:first-child {
                margin - left: 0;
    }
            `;

export default ProjectTasksTab;
