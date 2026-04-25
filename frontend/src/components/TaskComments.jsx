import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, MoreVertical, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TaskComments = ({ taskId }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const commentsEndRef = useRef(null);

    useEffect(() => {
        if (taskId) {
            fetchComments();
        }

        // Socket.IO listener for real-time comment updates
        if (socket) {
            socket.on('comment:created', (data) => {
                if (data.taskId === taskId && data.comment.userId._id !== user._id) {
                    // Another user posted a comment
                    setComments(prev => [data.comment, ...prev]);
                    scrollToBottom();
                }
            });

            socket.on('comment:updated', (data) => {
                if (data.taskId === taskId) {
                    setComments(prev => prev.map(c =>
                        c._id === data.comment._id ? data.comment : c
                    ));
                }
            });

            socket.on('comment:deleted', (data) => {
                if (data.taskId === taskId) {
                    setComments(prev => prev.filter(c => c._id !== data.commentId));
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('comment:created');
                socket.off('comment:updated');
                socket.off('comment:deleted');
            }
        };
    }, [taskId, socket, user._id]);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/tasks/${taskId}/comments`);
            setComments(res.data.data);
            setLoading(false);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to fetch comments', error);
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const res = await api.post(`/tasks/${taskId}/comments`, { content: newComment });
            setComments(prev => [res.data.data, ...prev]); // Add new comment to top or bottom? usually bottom for chat.
            // API returns comment populated.
            // Let's verify sort order from backend. Backend sorts createdAt: -1 (newest first).
            // So default list should be newest first? Or chat style (oldest first)?
            // Backend `getComments` sorts createdAt: -1.
            // So `comments` array has newest at index 0.
            // If we want chat style (newest at bottom), we should reverse it or sort createdAt: 1.
            // Let's keep newest at top for "Comment threads" usually vs "Chat".
            // Actually, usually comments are top-down (oldest first) or newest first.
            // Let's stick to Newest First as per backend.
            setNewComment('');
        } catch (error) {
            console.error('Failed to post comment', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (error) {
            console.error('Failed to delete comment', error);
        }
    };

    const startEdit = (comment) => {
        setEditingId(comment._id);
        setEditContent(comment.content);
    };

    const handleUpdate = async () => {
        try {
            const res = await api.patch(`/comments/${editingId}`, { content: editContent });
            setComments(prev => prev.map(c =>
                c._id === editingId ? res.data.data : c
            ));
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update comment', error);
        }
    };

    return (
        <Container>
            <CommentForm onSubmit={handleSubmit}>
                <TextArea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={submitting}
                />
                <ActionRow>
                    <SubmitButton type="submit" disabled={submitting || !newComment.trim()}>
                        <Send size={16} />
                        Post Comment
                    </SubmitButton>
                </ActionRow>
            </CommentForm>

            <CommentsList>
                {loading ? (
                    <LoadingText>Loading comments...</LoadingText>
                ) : comments.length === 0 ? (
                    <EmptyText>No comments yet.</EmptyText>
                ) : (
                    comments.map(comment => (
                        <CommentItem key={comment._id}>
                            <Avatar>
                                {comment.userId?.avatar ? (
                                    <AvatarImg src={comment.userId.avatar} />
                                ) : (
                                    <AvatarPlaceholder>
                                        {comment.userId?.name?.charAt(0) || '?'}
                                    </AvatarPlaceholder>
                                )}
                            </Avatar>
                            <CommentContent>
                                <CommentHeader>
                                    <UserName>{comment.userId?.name || 'Unknown User'}</UserName>
                                    <TimeAgo>{formatDistanceToNow(new Date(comment.createdAt))} ago</TimeAgo>
                                </CommentHeader>

                                {editingId === comment._id ? (
                                    <EditBox>
                                        <TextArea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                        <EditActions>
                                            <Button size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                                            <Button size="sm" $primary onClick={handleUpdate}>Save</Button>
                                        </EditActions>
                                    </EditBox>
                                ) : (
                                    <>
                                        <Message>{comment.content}</Message>
                                        {comment.edited && <EditedLabel>(edited)</EditedLabel>}
                                    </>
                                )}
                            </CommentContent>

                            {(user._id === comment.userId?._id || user.role === 'admin') && !editingId && (
                                <CommentActions>
                                    <ActionButton onClick={() => startEdit(comment)}>
                                        <Edit2 size={14} />
                                    </ActionButton>
                                    <ActionButton $danger onClick={() => handleDelete(comment._id)}>
                                        <Trash2 size={14} />
                                    </ActionButton>
                                </CommentActions>
                            )}
                        </CommentItem>
                    ))
                )}
                <div ref={commentsEndRef} />
            </CommentsList>
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 20px;
`;

const CommentForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 12px;
`;

const TextArea = styled.textarea`
    width: 100%;
    min-height: 80px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    resize: vertical;
    font-family: inherit;
    font-size: 14px;
    &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
`;

const ActionRow = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const SubmitButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    background: #667eea;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    &:hover:not(:disabled) {
        background: #5a67d8;
    }
`;

const CommentsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const CommentItem = styled.div`
    display: flex;
    gap: 12px;
`;

const Avatar = styled.div`
    flex-shrink: 0;
`;

const AvatarPlaceholder = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #64748b;
    font-size: 12px;
`;

const AvatarImg = styled.img`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
`;

const CommentContent = styled.div`
    flex: 1;
    background: #fff;
    padding: 12px;
    border-radius: 0 12px 12px 12px;
    border: 1px solid #f1f5f9;
`;

const CommentHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
`;

const UserName = styled.span`
    font-weight: 600;
    font-size: 14px;
    color: #1e293b;
`;

const TimeAgo = styled.span`
    font-size: 11px;
    color: #94a3b8;
`;

const Message = styled.p`
    font-size: 14px;
    color: #334155;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
`;

const EditedLabel = styled.span`
    font-size: 11px;
    color: #94a3b8;
    margin-left: 6px;
`;

const CommentActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    opacity: 0;
    ${CommentItem}:hover & {
        opacity: 1;
    }
`;

const ActionButton = styled.button`
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: ${props => props.$danger ? '#ef4444' : '#64748b'};
    opacity: 0.6;
    &:hover {
        opacity: 1;
    }
`;

const LoadingText = styled.div`
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
    padding: 20px;
`;

const EmptyText = styled.div`
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
`;

const EditBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const EditActions = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;

const Button = styled.button`
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid ${props => props.$primary ? '#667eea' : '#cbd5e1'};
    background: ${props => props.$primary ? '#667eea' : 'white'};
    color: ${props => props.$primary ? 'white' : '#64748b'};
    cursor: pointer;
    &:hover {
        opacity: 0.9;
    }
`;

export default TaskComments;
