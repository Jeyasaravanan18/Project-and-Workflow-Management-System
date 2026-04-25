import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Paperclip, Upload, X, FileText, Image as ImageIcon, Trash2, Download } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TaskAttachments = ({ taskId }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (taskId) {
            fetchAttachments();
        }

        // Socket.IO listener for real-time attachment updates
        if (socket) {
            socket.on('attachment:created', (data) => {
                if (data.taskId === taskId && data.uploader._id !== user._id) {
                    // Another user uploaded a file, refresh the list
                    fetchAttachments();
                }
            });

            socket.on('attachment:deleted', (data) => {
                if (data.taskId === taskId) {
                    setAttachments(prev => prev.filter(a => a._id !== data.attachmentId));
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('attachment:created');
                socket.off('attachment:deleted');
            }
        };
    }, [taskId, socket, user._id]);

    const fetchAttachments = async () => {
        try {
            const res = await api.get(`/attachments/Task/${taskId}`);
            setAttachments(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch attachments', error);
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input
        e.target.value = null;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', 'Task');
        formData.append('id', taskId);

        setUploading(true);
        try {
            const res = await api.post('/attachments', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Add to list (populate uploader manually for immediate display or refetch)
            const newAttachment = {
                ...res.data.data,
                uploader: { _id: user._id, name: user.name, avatar: user.avatar }
            };
            setAttachments(prev => [newAttachment, ...prev]);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId) => {
        if (!window.confirm('Delete this file?')) return;
        try {
            await api.delete(`/attachments/${attachmentId}`);
            setAttachments(prev => prev.filter(a => a._id !== attachmentId));
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleDownload = async (attachment) => {
        try {
            const response = await api.get(`/attachments/${attachment._id}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', attachment.originalName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) return <ImageIcon size={16} />;
        return <FileText size={16} />;
    };

    return (
        <Container>
            <Header>
                <Title>Attachments ({attachments.length})</Title>
                <UploadButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload size={14} />
                    {uploading ? 'Uploading...' : 'Upload File'}
                </UploadButton>
                <HiddenInput
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
            </Header>

            <List>
                {loading ? (
                    <LoadingText>Loading files...</LoadingText>
                ) : attachments.length === 0 ? (
                    <EmptyText>No attachments yet.</EmptyText>
                ) : (
                    attachments.map(file => (
                        <FileItem key={file._id}>
                            <FileIcon>
                                {getIcon(file.mimetype)}
                            </FileIcon>
                            <FileInfo>
                                <FileName onClick={() => handleDownload(file)}>{file.originalName}</FileName>
                                <FileMeta>
                                    {formatSize(file.size)} • Uploaded by {file.uploader?.name}
                                </FileMeta>
                            </FileInfo>

                            <Actions>
                                <ActionButton onClick={() => handleDownload(file)} title="Download">
                                    <Download size={14} />
                                </ActionButton>
                                {(user._id === file.uploader?._id || user.role === 'admin') && (
                                    <ActionButton $danger onClick={() => handleDelete(file._id)} title="Delete">
                                        <Trash2 size={14} />
                                    </ActionButton>
                                )}
                            </Actions>
                        </FileItem>
                    ))
                )}
            </List>
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
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

const UploadButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #475569;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #cbd5e1;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FileItem = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: background 0.2s;

    &:hover {
        background: white;
        border-color: #cbd5e1;
    }
`;

const FileIcon = styled.div`
    color: #64748b;
    display: flex;
    align-items: center;
`;

const FileInfo = styled.div`
    flex: 1;
    overflow: hidden;
`;

const FileName = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
        color: #667eea;
        text-decoration: underline;
    }
`;

const FileMeta = styled.div`
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
`;

const Actions = styled.div`
    display: flex;
    gap: 4px;
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: 4px;
    color: ${props => props.$danger ? '#ef4444' : '#64748b'};
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: ${props => props.$danger ? '#fee2e2' : '#f1f5f9'};
    }
`;

const LoadingText = styled.div`
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    padding: 10px;
`;

const EmptyText = styled.div`
    font-size: 13px;
    color: #94a3b8;
    font-style: italic;
    padding: 10px;
    text-align: center;
    border: 1px dashed #e2e8f0;
    border-radius: 8px;
`;

export default TaskAttachments;
