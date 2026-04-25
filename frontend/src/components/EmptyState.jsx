import { Inbox, AlertCircle, Lock, FileQuestion } from 'lucide-react';

const EmptyState = ({
    type = 'no-data',
    title,
    description,
    action,
    actionLabel
}) => {
    const iconMap = {
        'no-data': Inbox,
        'error': AlertCircle,
        'no-access': Lock,
        'not-found': FileQuestion
    };

    const Icon = iconMap[type] || Inbox;

    const colorMap = {
        'no-data': 'var(--slate-400)',
        'error': 'var(--danger-400)',
        'no-access': 'var(--warning-400)',
        'not-found': 'var(--info-400)'
    };

    return (
        <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">
                <Icon
                    size={64}
                    style={{
                        width: '100%',
                        height: '100%',
                        color: colorMap[type]
                    }}
                />
            </div>
            <h3 className="empty-state-title">
                {title || 'No Data Available'}
            </h3>
            <p className="empty-state-description">
                {description || 'There\'s nothing to display here yet.'}
            </p>
            {action && actionLabel && (
                <button onClick={action} className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
