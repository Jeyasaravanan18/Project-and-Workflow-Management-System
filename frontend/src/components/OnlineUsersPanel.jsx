/**
 * OnlineUsersPanel — Feature 1
 * Shows teammates currently online in the sidebar footer.
 * Listens to Socket.IO user:status-change events for real-time presence.
 */
import { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OnlineUsersPanel = ({ collapsed }) => {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const socket = useSocket();
    const { user } = useAuth();

    const fetchOnlineUsers = useCallback(async () => {
        try {
            const res = await api.get('/users/online');
            setOnlineUsers(res.data?.data || []);
        } catch {
            // silently fail
        }
    }, []);

    useEffect(() => {
        fetchOnlineUsers();
    }, [fetchOnlineUsers]);

    useEffect(() => {
        if (!socket) return;
        const handleStatusChange = ({ userId, status }) => {
            if (status === 'online') {
                // Re-fetch to get full user data for new online user
                fetchOnlineUsers();
            } else {
                // Remove offline user immediately
                setOnlineUsers(prev => prev.filter(u => u._id !== userId));
            }
        };
        socket.on('user:status-change', handleStatusChange);
        return () => socket.off('user:status-change', handleStatusChange);
    }, [socket, fetchOnlineUsers]);

    if (onlineUsers.length === 0) return null;

    const visible = onlineUsers.slice(0, collapsed ? 0 : 5);
    const extra = onlineUsers.length - 5;

    if (collapsed) {
        return (
            <CollapsedDot title={`${onlineUsers.length} online`}>
                <PulseDot />
                <CountBubble>{onlineUsers.length}</CountBubble>
            </CollapsedDot>
        );
    }

    return (
        <Panel>
            <PanelHeader>
                <PulsingDot />
                <PanelTitle>{onlineUsers.length} Online Now</PanelTitle>
            </PanelHeader>
            <AvatarRow>
                {visible.map(u => (
                    <AvatarWrap key={u._id} title={`${u.name} (${u.role})`}>
                        <OnlineAvatar>
                            {u.name?.charAt(0).toUpperCase()}
                        </OnlineAvatar>
                        <OnlineBadge />
                    </AvatarWrap>
                ))}
                {extra > 0 && (
                    <ExtraCount title={`${extra} more online`}>+{extra}</ExtraCount>
                )}
            </AvatarRow>
        </Panel>
    );
};

const pulse = keyframes`
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.6; }
`;

const Panel = styled.div`
    margin: 0 0 12px 0;
    padding: 12px 14px;
    background: ${p => p.theme.bg.hover};
    border-radius: 12px;
    border: 1px solid ${p => p.theme.border};
`;

const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
`;

const PanelTitle = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: ${p => p.theme.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const PulsingDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: ${pulse} 2s ease-in-out infinite;
    flex-shrink: 0;
`;

const AvatarRow = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
`;

const AvatarWrap = styled.div`
    position: relative;
    cursor: default;
`;

const OnlineAvatar = styled.div`
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f97316, #fb923c);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    border: 2px solid ${p => p.theme.bg.primary};
    transition: transform 0.15s;

    &:hover { transform: scale(1.12); }
`;

const OnlineBadge = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #22c55e;
    border: 2px solid ${p => p.theme.bg.primary};
`;

const ExtraCount = styled.div`
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: ${p => p.theme.bg.tertiary};
    border: 2px solid ${p => p.theme.border};
    color: ${p => p.theme.text.secondary};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: default;
`;

const CollapsedDot = styled.div`
    position: relative;
    width: 36px;
    height: 20px;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const PulseDot = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #22c55e;
    animation: ${pulse} 2s ease-in-out infinite;
`;

const CountBubble = styled.div`
    position: absolute;
    top: -4px;
    right: -2px;
    background: #22c55e;
    color: white;
    font-size: 0.6rem;
    font-weight: 800;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export default OnlineUsersPanel;
