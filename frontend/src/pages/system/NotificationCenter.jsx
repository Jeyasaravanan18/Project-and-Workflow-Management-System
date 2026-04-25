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
const Container = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px;
    min-height: 100vh;
    background: ${p => p.theme.bg.primary};
    @media (max-width: 768px) {
        padding: 24px;
    }
`;

const LoadingContainer = styled.div`
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${p => p.theme.bg.primary};
    .spinner {
        width: 40px; height: 40px;
        border: 3px solid ${p => p.theme.border};
        border-top-color: #0f62fe;
        border-radius: 0;
        animation: ${spinAnim} 1s linear infinite;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 30px;
    background: ${p => p.theme.mode === 'dark' ? p.theme.bg.card : '#ffffff'};
    padding: 30px;
    border: 1px solid ${p => p.theme.border};
`;

const HeaderContent = styled.div``;

const Title = styled.h1`
    font-size: 2rem;
    font-weight: 800;
    color: ${p => p.theme.text.primary};
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const BellWrapper = styled.div`
    position: relative;
    color: #0f62fe;
`;

const Badge = styled.span`
    position: absolute;
    top: -5px; right: -5px;
    background: #da1e28;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    width: 18px; height: 18px;
    border-radius: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid ${p => p.theme.bg.primary};
`;

const Subtitle = styled.p`
    font-size: 1rem;
    color: ${p => p.theme.text.secondary};
    margin: 0;
`;

const Actions = styled.div`display: flex; gap: 10px;`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.theme.border};
    border-radius: 0;
    font-weight: 600;
    font-size: 0.875rem;
    color: ${p => p.theme.text.secondary};
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: ${p => p.theme.bg.hover};
        color: ${p => p.theme.text.primary};
    }
`;

const Content = styled.div`
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 40px;
    align-items: start;
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const Filters = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: sticky;
    top: 24px;
`;

const FilterTab = styled.button`
    padding: 12px 16px;
    border-radius: 0;
    border: none;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    background: ${p => p.$active ? (p.theme.mode === 'dark' ? '#393939' : '#e0e0e0') : 'transparent'};
    color: ${p => p.$active ? p.theme.text.primary : p.theme.text.secondary};
    border-left: 3px solid ${p => p.$active ? '#0f62fe' : 'transparent'};
    &:hover {
        color: ${p => p.theme.text.primary};
        background: ${p => p.theme.mode === 'dark' ? '#393939' : '#e0e0e0'};
    }
`;

const NotificationFeed = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const GroupSection = styled.div`margin-bottom: 24px;`;

const GroupTitle = styled.h3`
    font-size: 0.78rem;
    font-weight: 700;
    color: ${p => p.theme.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
    margin-left: 0;
`;

const NotifList = styled.div`display: flex; flex-direction: column; gap: 0; border: 1px solid ${p => p.theme.border}; border-bottom: none;`;

const NotifItem = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: ${p => p.$isRead
        ? p.theme.bg.card
        : (p.theme.mode === 'dark' ? 'rgba(15,98,254,0.1)' : '#edf5ff')};
    border-bottom: 1px solid ${p => p.theme.border};
    border-radius: 0;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 0.2s;
    animation: ${fadeIn} 0.4s ease-out backwards;
    animation-delay: ${p => p.$delay}s;

    ${p => !p.$isRead && `
        &::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 4px;
            background: #0f62fe;
            border-radius: 0;
        }
    `}

    &:hover {
        background: ${p => p.theme.mode === 'dark' ? '#393939' : '#e5e5e5'};
        .actions { opacity: 1; transform: translateX(0); }
    }
`;

const IconBox = styled.div`
    width: 40px; height: 40px;
    border-radius: 0;
    background: ${p => p.$color}18;
    color: ${p => p.$color};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
`;

const NotifBody = styled.div`flex: 1; min-width: 0;`;

const NotifTitle = styled.div`
    font-size: 0.9375rem;
    font-weight: 600;
    color: ${p => p.theme.text.primary};
    margin-bottom: 4px;
    line-height: 1.4;
`;

const NotifMeta = styled.div`
    font-size: 0.72rem;
    color: ${p => p.theme.text.tertiary};
    font-weight: 500;
    text-transform: capitalize;
`;

const NotifActions = styled.div`
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: all 0.2s;
    @media (max-width: 768px) { opacity: 1; }
`;

const IconButton = styled.button`
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 0;
    border: 1px solid ${p => p.theme.border};
    background: ${p => p.theme.bg.card};
    color: ${p => p.$danger ? '#da1e28' : p.theme.text.secondary};
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: ${p => p.$danger
            ? (p.theme.mode === 'dark' ? 'rgba(218,30,40,0.15)' : '#ffe9e8')
            : (p.theme.mode === 'dark' ? '#4c4c4c' : '#d1d1d1')};
        border-color: ${p => p.$danger ? '#da1e28' : p.theme.border};
        color: ${p => p.$danger ? '#da1e28' : p.theme.text.primary};
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: ${p => p.theme.text.tertiary};
    border: 1px solid ${p => p.theme.border};
    background: ${p => p.theme.bg.card};
    border-radius: 0;
    .icon {
        width: 64px; height: 64px;
        background: ${p => p.theme.bg.hover};
        border-radius: 0;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 16px;
        color: ${p => p.theme.text.tertiary};
    }
    h3 { margin: 0 0 8px; color: ${p => p.theme.text.primary}; font-size: 1.125rem; }
    p { margin: 0; font-size: 0.875rem; }
`;

export default NotificationCenter;
