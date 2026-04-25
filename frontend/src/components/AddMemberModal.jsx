import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Search, UserPlus, Check, Loader2, Users } from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';

const AddMemberModal = ({ isOpen, onClose, projectId, onSuccess }) => {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setSearchTerm('');
            setSelectedUsers([]);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [usersRes, membersRes] = await Promise.all([
                api.get('/users'),
                api.get(`/projects/${projectId}/members`)
            ]);

            const existingMemberIds = [
                ...membersRes.data.members.map(m => m._id),
                membersRes.data.manager ? membersRes.data.manager._id : null
            ].filter(Boolean);

            // Handle both array and nested object response formats
            const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.data || []);
            const availableUsers = usersData.filter(
                user => !existingMemberIds.includes(user._id)
            );

            setUsers(availableUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async () => {
        if (selectedUsers.length === 0) return;

        setSubmitting(true);
        try {
            await Promise.all(
                selectedUsers.map(userId =>
                    api.post(`/projects/${projectId}/members`, { userId })
                )
            );

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding members:', error);
            alert(error.response?.data?.message || 'Failed to add members');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Team Members">
            <Container>
                <SearchWrapper>
                    <SearchIcon>
                        <Search size={18} />
                    </SearchIcon>
                    <SearchInput
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </SearchWrapper>

                <UserList>
                    {loading ? (
                        <LoadingState>
                            <Loader2 size={24} className="animate-spin" />
                            <span>Loading available users...</span>
                        </LoadingState>
                    ) : filteredUsers.length === 0 ? (
                        <EmptyState>
                            <div className="icon">
                                <Users size={32} />
                            </div>
                            <p>{searchTerm ? 'No matching users found' : 'No available users to add'}</p>
                            <span>{searchTerm ? 'Try a different search term' : 'All users are already in this team'}</span>
                        </EmptyState>
                    ) : (
                        filteredUsers.map((user, index) => (
                            <UserItem
                                key={user._id}
                                $selected={selectedUsers.includes(user._id)}
                                onClick={() => handleToggleUser(user._id)}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <Checkbox $checked={selectedUsers.includes(user._id)}>
                                    {selectedUsers.includes(user._id) && <Check size={12} strokeWidth={3} />}
                                </Checkbox>

                                <Avatar>
                                    {user.name.charAt(0)}
                                </Avatar>

                                <UserInfo>
                                    <UserName>{user.name}</UserName>
                                    <UserEmail>{user.email}</UserEmail>
                                </UserInfo>

                                <RoleBadge>{user.role}</RoleBadge>
                            </UserItem>
                        ))
                    )}
                </UserList>

                <Footer>
                    <CancelButton onClick={onClose}>
                        Cancel
                    </CancelButton>
                    <SubmitButton
                        onClick={handleSubmit}
                        disabled={selectedUsers.length === 0 || submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Add {selectedUsers.length > 0 ? `${selectedUsers.length} Members` : 'Selected'}
                            </>
                        )}
                    </SubmitButton>
                </Footer>
            </Container>
        </Modal>
    );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 60vh;
`;

const SearchWrapper = styled.div`
    position: relative;
    margin-bottom: 16px;
`;

const SearchIcon = styled.div`
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 12px 12px 40px;
    background: #f8fafc;
    border: 2px solid transparent;
    border-radius: 12px;
    font-size: 0.9375rem;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
        background: white;
        border-color: #f97316;
        box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
    }

    &::placeholder {
        color: #94a3b8;
    }
`;

const UserList = styled.div`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 4px;
    margin-bottom: 24px;
    min-height: 200px;
`;

const LoadingState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #64748b;
    gap: 12px;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
    color: #94a3b8;

    .icon {
        width: 64px;
        height: 64px;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        color: #cbd5e1;
    }

    p {
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 4px;
    }
    
    span {
        font-size: 0.875rem;
    }
`;

const UserItem = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: ${props => props.$selected ? '#fff7ed' : 'white'};
    border: 1px solid ${props => props.$selected ? '#fdba74' : '#e2e8f0'};
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    animation: ${fadeIn} 0.3s ease-out;
    animation-fill-mode: backwards;

    &:hover {
        border-color: #f97316;
        transform: translateX(4px);
        background: ${props => props.$selected ? '#fff7ed' : '#f8fafc'};
    }
`;

const Checkbox = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid ${props => props.$checked ? '#f97316' : '#cbd5e1'};
    background: ${props => props.$checked ? '#f97316' : 'white'};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 0.2s ease;
`;

const Avatar = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
`;

const UserInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const UserName = styled.div`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 2px;
`;

const UserEmail = styled.div`
    font-size: 0.75rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RoleBadge = styled.span`
    padding: 4px 10px;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
`;

const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
`;

const Button = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
`;

const CancelButton = styled(Button)`
    background: transparent;
    color: #64748b;
    border: none;

    &:hover {
        background: #f1f5f9;
        color: #0f172a;
    }
`;

const SubmitButton = styled(Button)`
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3);

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px -1px rgba(249, 115, 22, 0.4);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
`;

export default AddMemberModal;
