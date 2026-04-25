import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import styled, { keyframes } from 'styled-components';
import {
    CheckCircle, AlertCircle, UserPlus, FileText, MessageSquare,
    Upload, Trash2, Edit, Clock, Activity as ActivityIcon
} from 'lucide-react';
import { io } from 'socket.io-client';

const RealtimeActivityFeed = ({ limit = 20 }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const hasFetchedRef = useRef(false);

    const fetchActivities = async () => {
        try {
            const res = await api.get(`/activities/recent?limit=${limit}`);
            if (res.data.success) {
                setActivities(res.data.activities);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        fetchActivities();

        const token = localStorage.getItem('token');
        socketRef.current = io('', {
            auth: { token }
        });

        socketRef.current.on('activity:new', (newActivity) => {
            setActivities(prev => [newActivity, ...prev].slice(0, limit));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [limit]);

    const getActivityIcon = (type) => {
        if (type.includes('TASK') || type.includes('CREATED')) return <CheckCircle size={16} />;
        if (type.includes('COMMENT')) return <MessageSquare size={16} />;
        if (type.includes('UPLOAD') || type.includes('ATTACHMENT')) return <Upload size={16} />;
        if (type.includes('DELETE')) return <Trash2 size={16} />;
        if (type.includes('UPDATE') || type.includes('EDIT')) return <Edit size={16} />;
        if (type.includes('ASSIGNED') || type.includes('USER')) return <UserPlus size={16} />;
        return <ActivityIcon size={16} />;
    };

    const getActivityColor = (actionType) => {
        switch (actionType) {
            case 'create': return '#0f62fe';
            case 'update': return '#0f62fe';
            case 'delete': return '#da1e28';
            case 'auth': return '#8a3ffc';
            default: return '#525252';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getActivityDescription = (activity) => {
        const userName = activity.user?.name || 'Someone';
        const targetName = activity.target?.title || 'item';
        const action = activity.type.toLowerCase().replace(/_/g, ' ');

        return (
            <>
                <strong>{userName}</strong> {action} <em>{targetName}</em>
            </>
        );
    };

    if (loading) {
        return (
            <FeedContainer>
                <FeedHeader>
                    <ActivityIcon size={18} />
                    <h3>Recent Activity</h3>
                </FeedHeader>
                <LoadingState>
                    <div className="spinner" />
                    <p>Loading activities...</p>
                </LoadingState>
            </FeedContainer>
        );
    }

    return (
        <FeedContainer>
            <FeedHeader>
                <div className="left">
                    <ActivityIcon size={18} />
                    <h3>Recent Activity</h3>
                    <LiveBadge>
                        <span className="pulse" />
                        Live
                    </LiveBadge>
                </div>
                <RefreshBtn onClick={fetchActivities}>
                    <Clock size={14} />
                    Refresh
                </RefreshBtn>
            </FeedHeader>

            <ActivityList>
                {activities.length === 0 ? (
                    <EmptyState>
                        <ActivityIcon size={32} />
                        <p>No recent activity</p>
                    </EmptyState>
                ) : (
                    activities.map((activity, index) => (
                        <ActivityItem key={activity.id || index} $delay={index * 0.05}>
                            <IconWrapper $color={getActivityColor(activity.actionType)}>
                                {getActivityIcon(activity.type)}
                            </IconWrapper>
                            <ActivityContent>
                                <ActivityText>
                                    {getActivityDescription(activity)}
                                </ActivityText>
                                <ActivityTime>{formatTimestamp(activity.timestamp)}</ActivityTime>
                            </ActivityContent>
                        </ActivityItem>
                    ))
                )}
            </ActivityList>

            {activities.length > 0 && (
                <ViewAllLink href="/admin/analytics">
                    View full activity logs →
                </ViewAllLink>
            )}
        </FeedContainer>
    );
};

// --- Animations ---
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// --- Styled Components ---
const FeedContainer = styled.div`
    background: white;
    border: 1px solid #e0e0e0;
    font-family: 'IBM Plex Sans', sans-serif;
`;

const FeedHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e0e0e0;

    .left {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #161616;
    }

    svg {
        color: #0f62fe;
    }
`;

const LiveBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    background: #f4f4f4;
    color: #161616;
    border: 1px solid #e0e0e0;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    .pulse {
        width: 6px;
        height: 6px;
        background: #24a148;
        border-radius: 50%;
    }
`;

const RefreshBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    background: transparent;
    border: 1px solid #e0e0e0;
    height: 32px;
    color: #525252;
    font-size: 0.75rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f4f4f4;
        color: #161616;
    }
`;

const ActivityList = styled.div`
    max-height: 500px;
    overflow-y: auto;

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: #e0e0e0;
    }
`;

const ActivityItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid #f4f4f4;
    animation: ${fadeIn} 0.3s ease-out backwards;
    animation-delay: ${props => props.$delay}s;

    &:hover {
        background: #f4f4f4;
    }

    &:last-child {
        border-bottom: none;
    }
`;

const IconWrapper = styled.div`
    width: 24px;
    height: 24px;
    color: ${props => props.$color};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const ActivityContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const ActivityText = styled.div`
    font-size: 0.8125rem;
    color: #161616;
    line-height: 1.4;
    margin-bottom: 2px;

    strong {
        font-weight: 600;
    }

    em {
        font-style: normal;
        color: #0f62fe;
        font-weight: 500;
    }
`;

const ActivityTime = styled.div`
    font-size: 0.75rem;
    color: #525252;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
    color: #8d8d8d;

    svg {
        margin-bottom: 12px;
    }

    p {
        margin: 0;
        font-size: 0.8125rem;
    }
`;

const LoadingState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
    color: #8d8d8d;

    .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e0e0e0;
        border-top-color: #0f62fe;
        animation: ${spin} 0.8s linear infinite;
        margin-bottom: 16px;
    }

    p {
        margin: 0;
        font-size: 0.8125rem;
    }
`;

const ViewAllLink = styled.a`
    display: block;
    padding: 12px 24px;
    text-align: center;
    color: #0f62fe;
    font-size: 0.8125rem;
    font-weight: 400;
    text-decoration: none;
    border-top: 1px solid #e0e0e0;

    &:hover {
        text-decoration: underline;
        background: #f4f4f4;
    }
`;

export default RealtimeActivityFeed;

