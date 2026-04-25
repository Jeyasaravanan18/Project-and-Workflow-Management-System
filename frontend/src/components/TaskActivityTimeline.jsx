/**
 * TaskActivityTimeline — Feature 3
 * Shows a chronological audit trail for a specific task.
 * Wired into `TaskDetailModal` as a new "History" section in the sidebar.
 */
import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { History, ArrowRight, User, Clock } from 'lucide-react';
import api from '../services/api';
import { formatDistanceToNow, format } from 'date-fns';

const ACTION_META = {
    CREATE_TASK:         { label: 'Task created',        color: '#22c55e', icon: '✦' },
    UPDATE_TASK_STATUS:  { label: 'Status changed',      color: '#f97316', icon: '↻' },
    UPDATE_TASK:         { label: 'Task updated',        color: '#3b82f6', icon: '✎' },
    DELETE_TASK:         { label: 'Task deleted',        color: '#ef4444', icon: '✕' },
    COMMENT_ADDED:       { label: 'Comment added',       color: '#8b5cf6', icon: '💬' },
    ATTACHMENT_ADDED:    { label: 'File attached',       color: '#06b6d4', icon: '📎' },
    TIMER_STARTED:       { label: 'Timer started',       color: '#22c55e', icon: '▶' },
    TIMER_STOPPED:       { label: 'Timer stopped',       color: '#f59e0b', icon: '■' },
};

const getActionMeta = (action) =>
    ACTION_META[action] || { label: action.replace(/_/g, ' ').toLowerCase(), color: '#94a3b8', icon: '•' };

const TaskActivityTimeline = ({ taskId }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/tasks/${taskId}/activity`);
                setEntries(res.data?.data || []);
            } catch {
                setEntries([]);
            } finally {
                setLoading(false);
            }
        };
        if (taskId) fetch();
    }, [taskId]);

    if (loading) return <Skeleton />;
    if (entries.length === 0) return (
        <Empty>
            <History size={18} />
            No activity recorded yet
        </Empty>
    );

    const visible = expanded ? entries : entries.slice(0, 5);

    return (
        <Timeline>
            {visible.map((entry, i) => {
                const meta = getActionMeta(entry.action);
                const hasChange = entry.changes?.oldValue != null && entry.changes?.newValue != null;
                return (
                    <Entry key={entry._id || i}>
                        <Dot $color={meta.color}>{meta.icon}</Dot>
                        <EntryContent>
                            <EntryRow>
                                <ActionLabel>{meta.label}</ActionLabel>
                                <TimeLabel title={format(new Date(entry.timestamp), 'PPpp')}>
                                    <Clock size={10} />
                                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                                </TimeLabel>
                            </EntryRow>
                            {entry.user?.name && (
                                <UserRow>
                                    <User size={10} />
                                    {entry.user.name}
                                </UserRow>
                            )}
                            {hasChange && (
                                <ChangeRow>
                                    <OldVal>{String(entry.changes.oldValue)}</OldVal>
                                    <ArrowRight size={10} color="#94a3b8" />
                                    <NewVal>{String(entry.changes.newValue)}</NewVal>
                                </ChangeRow>
                            )}
                        </EntryContent>
                    </Entry>
                );
            })}
            {entries.length > 5 && (
                <ShowMore onClick={() => setExpanded(e => !e)}>
                    {expanded ? 'Show less' : `Show ${entries.length - 5} more`}
                </ShowMore>
            )}
        </Timeline>
    );
};

const shimmer = keyframes`
    0% { background-position: -600px 0; }
    100% { background-position: 600px 0; }
`;

const Skeleton = styled.div`
    height: 80px;
    border-radius: 8px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 1200px 100%;
    animation: ${shimmer} 1.5s infinite;
`;

const Empty = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: ${p => p.theme.text.tertiary};
    padding: 12px 0;
`;

const Timeline = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
`;

const Entry = styled.div`
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid ${p => p.theme.border + '60'};
    &:last-of-type { border-bottom: none; }
    animation: fadeIn 0.3s ease-out;
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
`;

const Dot = styled.div`
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: ${p => p.$color + '18'};
    border: 1.5px solid ${p => p.$color + '40'};
    color: ${p => p.$color};
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 700;
`;

const EntryContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const EntryRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 3px;
`;

const ActionLabel = styled.span`
    font-size: 0.82rem;
    font-weight: 600;
    color: ${p => p.theme.text.primary};
    text-transform: capitalize;
`;

const TimeLabel = styled.span`
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.7rem;
    color: ${p => p.theme.text.tertiary};
    white-space: nowrap;
    flex-shrink: 0;
`;

const UserRow = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    color: ${p => p.theme.text.secondary};
    margin-bottom: 4px;
`;

const ChangeRow = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
`;

const OldVal = styled.span`
    font-size: 0.7rem;
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    padding: 1px 6px;
    font-weight: 500;
`;

const NewVal = styled.span`
    font-size: 0.7rem;
    color: #16a34a;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 4px;
    padding: 1px 6px;
    font-weight: 500;
`;

const ShowMore = styled.button`
    width: 100%;
    padding: 8px;
    background: none;
    border: 1px dashed ${p => p.theme.border};
    border-radius: 8px;
    color: ${p => p.theme.text.tertiary};
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
    transition: all 0.15s;
    &:hover { background: ${p => p.theme.bg.hover}; color: ${p => p.theme.text.primary}; border-style: solid; }
`;

export default TaskActivityTimeline;
