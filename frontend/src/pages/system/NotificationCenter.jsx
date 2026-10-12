import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import {
    Bell, Check, CheckCircle2, Trash2, Clock,
    MessageSquare, AlertCircle, Info, Zap
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const socket = useSocket();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        if (socket) {
            socket.on('notification:new', fetchNotifications);
            return () => socket.off('notification:new', fetchNotifications);
        }
    }, [socket]);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) { console.error(error); }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) { console.error(error); }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) { console.error(error); }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'assignment': return <Zap size={18} />;
            case 'status_change': return <Info size={18} />;
            case 'deadline_approaching': return <Clock size={18} />;
            case 'overdue': return <AlertCircle size={18} />;
            case 'mention': return <MessageSquare size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'assignment': return '#0f62fe';
            case 'status_change': return '#1192e8';
            case 'deadline_approaching': return '#f1c21b';
            case 'overdue': return '#da1e28';
            case 'mention': return '#8a3ffc';
            default: return '#525252';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'read') return n.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = new Date(notification.createdAt);
        let key = 'Earlier';
        if (isToday(date)) key = 'Today';
        else if (isYesterday(date)) key = 'Yesterday';
        if (!groups[key]) groups[key] = [];
        groups[key].push(notification);
        return groups;
    }, {});

    const groupOrder = ['Today', 'Yesterday', 'Earlier'];

    if (loading) return <LoadingContainer><div className="spinner" /></LoadingContainer>;

    return (
        <Container>
            <Header>
                <HeaderContent>
                    <Title>
                        <BellWrapper>
                            <Bell size={24} />
                            {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
                        </BellWrapper>
                        Notifications
                    </Title>
                    <Subtitle>Stay updated seamlessly.</Subtitle>
                </HeaderContent>

                <Actions>
                    {unreadCount > 0 && (
                        <ActionButton onClick={markAllAsRead}>
                            <CheckCircle2 size={16} /> Mark all read
                        </ActionButton>
                    )}
                </Actions>
            </Header>

            <Content>
                <Filters>
                    {['all', 'unread', 'read'].map(f => (
                        <FilterTab
                            key={f}
                            $active={filter === f}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </FilterTab>
                    ))}
                </Filters>

                <NotificationFeed>
                    {filteredNotifications.length === 0 ? (
                        <EmptyState>
                            <div className="icon"><Bell size={32} /></div>
                            <h3>No notifications here</h3>
                            <p>You're all caught up! Check back later.</p>
                        </EmptyState>
                    ) : (
                        groupOrder.map(group => groupedNotifications[group] && (
                            <GroupSection key={group}>
                                <GroupTitle>{group}</GroupTitle>
                                <NotifList>
                                    {groupedNotifications[group].map((n, idx) => (
                                        <NotifItem
                                            key={n._id}
                                            $isRead={n.isRead}
                                            $delay={idx * 0.05}
                                        >
                                            <IconBox $color={getColor(n.type)}>
                                                {getIcon(n.type)}
                                            </IconBox>
                                            <NotifBody>
                                                <NotifTitle>{n.message}</NotifTitle>
                                                <NotifMeta>
                                                    {format(new Date(n.createdAt), 'h:mm a')} • {n.type.replace('_', ' ')}
                                                </NotifMeta>
                                            </NotifBody>
                                            <NotifActions className="actions">
                                                {!n.isRead && (
                                                    <IconButton onClick={() => markAsRead(n._id)} title="Mark Read">
                                                        <Check size={16} />
                                                    </IconButton>
                                                )}
                                                <IconButton onClick={() => deleteNotification(n._id)} title="Delete" $danger>
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </NotifActions>
                                        </NotifItem>
                                    ))}
                                </NotifList>
                            </GroupSection>
                        ))
                    )}
                </NotificationFeed>
            </Content>
        </Container>
    );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const spinAnim = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// ─── Styled Components ────────────────────────────────────────────────────────

const LoadingContainer = styled.div`
    height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    .spinner {
        width: 40px; height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #008060;
        border-radius: 50%;
        animation: ${spinAnim} 0.8s linear infinite;
    }
`;

const Container = styled.div`
    padding: 8px 0 40px 0;
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    background: #ffffff;
    padding: 24px 28px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
    font-size: 1.6rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.02em;
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const BellWrapper = styled.div`
    position: relative;
    color: #008060;
`;

const Badge = styled.span`
    position: absolute;
    top: -6px; right: -8px;
    background: #ef4444;
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 9999px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #ffffff;
`;

const Subtitle = styled.p`
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
`;

const Actions = styled.div`display: flex; gap: 10px;`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: #111827;
    border: none;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.825rem;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: #008060;
        transform: translateY(-1px);
    }
`;

const Content = styled.div`
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 28px;
    align-items: start;
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const Filters = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: sticky;
    top: 24px;
    background: #ffffff;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
`;

const FilterTab = styled.button`
    padding: 10px 14px;
    border-radius: 9999px;
    border: none;
    text-align: left;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    background: ${p => p.$active ? '#ecfdf5' : 'transparent'};
    color: ${p => p.$active ? '#008060' : '#4b5563'};
    &:hover {
        background: ${p => p.$active ? '#ecfdf5' : '#f8fafc'};
        color: ${p => p.$active ? '#008060' : '#111827'};
    }
`;

const NotificationFeed = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const GroupSection = styled.div`margin-bottom: 24px;`;

const GroupTitle = styled.h3`
    font-size: 0.75rem;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 10px;
    margin-left: 4px;
`;

const NotifList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const NotifItem = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: ${p => p.$isRead ? '#ffffff' : '#f0fdf4'};
    border: 1px solid ${p => p.$isRead ? '#e5e7eb' : '#bbf7d0'};
    border-radius: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    animation: ${fadeIn} 0.4s ease-out backwards;
    animation-delay: ${p => p.$delay}s;

    &:hover {
        background: ${p => p.$isRead ? '#f8fafc' : '#ecfdf5'};
        border-color: #cbd5e1;
        transform: translateY(-1px);
        .actions { opacity: 1; transform: translateX(0); }
    }
`;

const IconBox = styled.div`
    width: 38px; height: 38px;
    border-radius: 10px;
    background: ${p => p.$color}18;
    color: ${p => p.$color};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
`;

const NotifBody = styled.div`flex: 1; min-width: 0;`;

const NotifTitle = styled.div`
    font-size: 0.9rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 3px;
    line-height: 1.4;
`;

const NotifMeta = styled.div`
    font-size: 0.72rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: capitalize;
`;

const NotifActions = styled.div`
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: all 0.2s;
    @media (max-width: 768px) { opacity: 1; }
`;

const IconButton = styled.button`
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: ${p => p.$danger ? '#ef4444' : '#6b7280'};
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: ${p => p.$danger ? '#fee2e2' : '#f1f5f9'};
        border-color: ${p => p.$danger ? '#fca5a5' : '#cbd5e1'};
        color: ${p => p.$danger ? '#dc2626' : '#111827'};
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 24px;
    color: #9ca3af;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    border-radius: 14px;
    .icon {
        width: 56px; height: 56px;
        background: #ecfdf5;
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 16px;
        color: #008060;
    }
    h3 { margin: 0 0 6px; color: #111827; font-size: 1.05rem; font-weight: 700; }
    p { margin: 0; font-size: 0.85rem; }
`;

export default NotificationCenter;
