import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Play, Square, Clock, List as ListIcon } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';

const TimeTracker = ({ taskId }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [entries, setEntries] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (taskId) {
            fetchTimeData();
        }

        // Socket.IO listener for real-time time tracking updates
        if (socket) {
            socket.on('time:started', (data) => {
                if (data.taskId === taskId) {
                    fetchTimeData();
                }
            });

            socket.on('time:stopped', (data) => {
                if (data.taskId === taskId) {
                    fetchTimeData();
                }
            });
        }

        return () => {
            clearInterval(intervalRef.current);
            if (socket) {
                socket.off('time:started');
                socket.off('time:stopped');
            }
        };
    }, [taskId, socket]);

    useEffect(() => {
        if (activeTimer) {
            const startTime = new Date(activeTimer.startTime).getTime();
            intervalRef.current = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
            setElapsed(0);
        }
        return () => clearInterval(intervalRef.current);
    }, [activeTimer]);

    const fetchTimeData = async () => {
        try {
            // Fetch entries for this task
            const entriesRes = await api.get(`/time?taskId=${taskId}`);
            setEntries(entriesRes.data.data);

            // Check for active timer globally or for this task?
            // Usually global active timer check is good, but here we focus on task context.
            // But if user has active timer on ANOTHER task, we should know?
            // For now, let's just check if active timer belongs to this task.
            const activeRes = await api.get('/time/active');
            if (activeRes.data.data && activeRes.data.data.taskId._id === taskId) {
                setActiveTimer(activeRes.data.data);
                const startTime = new Date(activeRes.data.data.startTime).getTime();
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            } else {
                setActiveTimer(null);
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch time data', error);
            setLoading(false);
        }
    };

    const handleStart = async () => {
        try {
            console.log('Starting timer for task:', taskId);
            const res = await api.post('/time/start', { taskId });
            console.log('Timer started successfully:', res.data);
            setActiveTimer(res.data.data);
            // Emit socket event if available
            if (socket) {
                socket.emit('time:start', { taskId, userId: user._id });
            }
        } catch (error) {
            console.error('Failed to start timer:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error details:', error.response?.data?.error);
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Failed to start timer';
            alert(errorMessage);
        }
    };

    const handleStop = async () => {
        try {
            const res = await api.post('/time/stop');
            setActiveTimer(null);
            setEntries(prev => [res.data.data, ...prev]);
        } catch (error) {
            console.error('Failed to stop timer', error);
        }
    };

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const totalSeconds = entries.reduce((acc, curr) => acc + (curr.duration || 0), 0);

    return (
        <Container>
            <Header>
                <Title>Time Tracking</Title>
                <TotalTime>Total: {formatDuration(totalSeconds)}</TotalTime>
            </Header>

            <Controls>
                {activeTimer ? (
                    <TimerButton $stop onClick={handleStop}>
                        <Square size={16} fill="white" />
                        Stop Timer ({formatDuration(elapsed)})
                    </TimerButton>
                ) : (
                    <TimerButton onClick={handleStart}>
                        <Play size={16} fill="white" />
                        Start Timer
                    </TimerButton>
                )}
            </Controls>

            <EntriesList>
                {loading ? (
                    <LoadingText>Loading...</LoadingText>
                ) : entries.length === 0 ? (
                    <EmptyText>No time entries recorded.</EmptyText>
                ) : (
                    entries.slice(0, 5).map(entry => (
                        <EntryItem key={entry._id}>
                            <EntryLeft>
                                <EntryDate>{format(new Date(entry.startTime), 'MMM d, HH:mm')}</EntryDate>
                                {entry.description && <EntryDesc>{entry.description}</EntryDesc>}
                            </EntryLeft>
                            <EntryDuration>{formatDuration(entry.duration)}</EntryDuration>
                        </EntryItem>
                    ))
                )}
                {entries.length > 5 && <MoreText>+ {entries.length - 5} more entries</MoreText>}
            </EntriesList>
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Title = styled.h4`
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin: 0;
`;

const TotalTime = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
`;

const Controls = styled.div``;

const TimerButton = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    background: ${props => props.$stop ? '#ef4444' : '#22c55e'};
    color: white;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.9;
    }
`;

const EntriesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const EntryItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: white;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
    font-size: 13px;
`;

const EntryLeft = styled.div`
    display: flex;
    flex-direction: column;
`;

const EntryDate = styled.span`
    color: #334155;
    font-weight: 500;
`;

const EntryDesc = styled.span`
    color: #94a3b8;
    font-size: 11px;
`;

const EntryDuration = styled.span`
    font-family: monospace;
    font-weight: 600;
    color: #64748b;
`;

const LoadingText = styled.div`
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
`;

const EmptyText = styled.div`
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    padding: 8px;
`;

const MoreText = styled.div`
    font-size: 11px;
    color: #64748b;
    text-align: center;
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`;

export default TimeTracker;
