import {
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Pause,
    Play
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        'todo': {
            icon: Clock,
            className: 'status-todo'
        },
        'in-progress': {
            icon: Play,
            className: 'status-inprogress'
        },
        'inprogress': {
            icon: Play,
            className: 'status-inprogress'
        },
        'done': {
            icon: CheckCircle,
            className: 'status-done'
        },
        'completed': {
            icon: CheckCircle,
            className: 'status-completed'
        },
        'blocked': {
            icon: XCircle,
            className: 'status-blocked'
        },
        'pending': {
            icon: Pause,
            className: 'status-pending'
        }
    };

    const normalizedStatus = status?.toLowerCase() || 'todo';
    const config = statusConfig[normalizedStatus] || statusConfig.todo;
    const Icon = config.icon;

    return (
        <span className={`badge ${config.className}`}>
            <Icon size={12} />
            <span>{status || 'To Do'}</span>
        </span>
    );
};

export default StatusBadge;
