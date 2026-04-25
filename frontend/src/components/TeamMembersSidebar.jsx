import { useEffect, useState } from 'react';
import { Users, X, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const TeamMembersSidebar = ({ projectId, isOpen, onToggle }) => {
    const [teamData, setTeamData] = useState({ managers: [], members: [], totalCount: 0 });
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/members`);
            const allMembers = [
                ...(res.data.manager ? [res.data.manager] : []),
                ...res.data.members
            ];
            const managers = allMembers.filter(u => u.role === 'manager' || u.role === 'admin' || u.isManager);
            const members = allMembers.filter(u => u.role === 'member' && !u.isManager);

            setTeamData({ managers, members, totalCount: allMembers.length });
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchTeamMembers();
    }, [projectId]);

    useEffect(() => {
        if (!socket) return;

        const handleStatusChange = (data) => {
            const { userId, status, lastActive } = data;
            setTeamData(prev => {
                const updateUser = (users) => users.map(user =>
                    user._id === userId ? { ...user, onlineStatus: status, lastActive } : user
                );
                return { ...prev, managers: updateUser(prev.managers), members: updateUser(prev.members) };
            });
        };

        socket.on('user:status-change', handleStatusChange);
        return () => socket.off('user:status-change', handleStatusChange);
    }, [socket]);

    const getStatusIndicator = (user) => {
        const { onlineStatus, lastActive } = user;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const lastActiveDate = new Date(lastActive);
        const isAway = onlineStatus === 'online' && lastActiveDate < fiveMinutesAgo;
        const status = isAway ? 'away' : onlineStatus;

        const statusConfig = {
            online: { color: '#22c55e', label: 'Online' },
            away: { color: '#f59e0b', label: 'Away' },
            offline: { color: '#94a3b8', label: 'Offline' }
        };

        return statusConfig[status] || statusConfig.offline;
    };

    const getLastActiveText = (user) => {
        const { onlineStatus, lastActive } = user;
        if (!lastActive) return 'Never active';

        if (onlineStatus === 'online') {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const lastActiveDate = new Date(lastActive);
            if (lastActiveDate < fiveMinutesAgo) {
                return `Away (${formatDistanceToNow(lastActiveDate, { addSuffix: true }).replace('about ', '')})`;
            }
            return 'Active now';
        }

        return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
    };

    const renderUserItem = (user) => {
        const statusInfo = getStatusIndicator(user);
        const lastActiveText = getLastActiveText(user);

        return (
            <div
                key={user._id}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-2)',
                    borderRadius: 'var(--radius-lg)',
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'translateX(-2px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
            >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                    }}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: statusInfo.color,
                        border: '2px solid white',
                        boxShadow: `0 0 0 1px ${statusInfo.color}40`
                    }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {user.name}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: statusInfo.color,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {lastActiveText}
                    </div>
                </div>

                {(user.role === 'manager' || user.role === 'admin' || user.isManager) && (
                    <div style={{
                        padding: '3px 8px',
                        background: '#fef3c7',
                        border: '1px solid #fcd34d',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: '#d97706',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        flexShrink: 0
                    }}>
                        Lead
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="btn btn-ghost"
                style={{
                    position: 'fixed',
                    right: 'var(--space-4)',
                    top: '80px',
                    zIndex: 40,
                    padding: 'var(--space-3)',
                    minWidth: 'auto',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                title="Show team members"
            >
                <Users size={20} style={{ color: '#64748b' }} />
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                right: 0,
                top: 0,
                height: '100vh',
                width: '340px',
                background: '#ffffff',
                borderLeft: '1px solid #e5e7eb',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInRight 0.3s ease-out',
                boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.1)'
            }}
        >
            <div style={{
                padding: 'var(--space-5)',
                borderBottom: '1px solid #e5e7eb',
                background: '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)'
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                    }}>
                        <Users size={18} style={{ color: 'white' }} />
                    </div>
                    <div>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: '#111827',
                            margin: 0
                        }}>
                            Team Members
                        </h3>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '2px'
                        }}>
                            {teamData.totalCount} {teamData.totalCount === 1 ? 'member' : 'members'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    style={{
                        padding: 'var(--space-2)',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: '#6b7280',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.color = '#111827';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                    }}
                    title="Hide team members"
                >
                    <X size={18} />
                </button>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-4)',
                background: '#fafafa'
            }}>
                {loading ? (
                    <div style={{ padding: 'var(--space-2)' }}>
                        <div className="skeleton" style={{ width: '100%', height: '64px', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-lg)' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '64px', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-lg)' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '64px', borderRadius: 'var(--radius-lg)' }}></div>
                    </div>
                ) : (
                    <>
                        {teamData.managers.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                <div style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: '#d97706',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: 'var(--space-3)',
                                    paddingLeft: 'var(--space-1)'
                                }}>
                                    Project Leads ({teamData.managers.length})
                                </div>
                                {teamData.managers.map(renderUserItem)}
                            </div>
                        )}

                        {teamData.members.length > 0 && (
                            <div>
                                <div style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: 'var(--space-3)',
                                    paddingLeft: 'var(--space-1)'
                                }}>
                                    Team Members ({teamData.members.length})
                                </div>
                                {teamData.members.map(renderUserItem)}
                            </div>
                        )}

                        {teamData.totalCount === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: 'var(--space-12) var(--space-6)',
                                color: '#9ca3af'
                            }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    margin: '0 auto var(--space-4)',
                                    borderRadius: 'var(--radius-2xl)',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <Users size={32} style={{ color: '#9ca3af' }} />
                                </div>
                                <p style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    marginBottom: 'var(--space-2)'
                                }}>
                                    No team members yet
                                </p>
                                <p style={{
                                    fontSize: '0.8125rem',
                                    color: '#9ca3af',
                                    lineHeight: 1.5
                                }}>
                                    Assign tasks to add<br />members to this project
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TeamMembersSidebar;
