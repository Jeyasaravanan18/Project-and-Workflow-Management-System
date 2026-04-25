/**
 * useNotificationCount — Feature 4 (hook)
 * Returns live unread notification count.
 * Refetches when new notifications arrive via Socket.IO.
 * Used by Sidebar to show a live badge on the Notifications link.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const useNotificationCount = () => {
    const [count, setCount] = useState(0);
    const socket = useSocket();

    const fetchCount = useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setCount(res.data?.count || 0);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchCount();
    }, [fetchCount]);

    // Refresh count on new notification events
    useEffect(() => {
        if (!socket) return;
        const refresh = () => fetchCount();
        socket.on('notification:new', refresh);
        socket.on('notification:read', refresh);
        return () => {
            socket.off('notification:new', refresh);
            socket.off('notification:read', refresh);
        };
    }, [socket, fetchCount]);

    // Decrement locally when user marks as read (for instant UX)
    const markOneRead = useCallback(() => {
        setCount(c => Math.max(0, c - 1));
    }, []);

    const markAllRead = useCallback(() => {
        setCount(0);
    }, []);

    return { count, refetch: fetchCount, markOneRead, markAllRead };
};

export default useNotificationCount;
