import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import styled, { keyframes, css } from 'styled-components';
import { Layers, FileText, Calendar, Clock, Loader2, Check, Users, AlertCircle, X, ChevronDown, UserPlus } from 'lucide-react';

const CreateTaskForm = ({ projectId, moduleId, onSuccess, onCancel }) => {
    const [modules, setModules] = useState([]);
    const [users, setUsers] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        moduleId: moduleId || '',
        assignedTo: [],
        priority: 'medium',
        dueDate: '',
        estimatedHours: 0
    });

    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);

    // Refs
    const userSelectRef = useRef(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modRes, usersRes] = await Promise.all([
                    api.get(`/modules?projectId=${projectId}`),
                    api.get('/users')
                ]);
                // Handle different response formats
                // Modules API returns array directly: [...]
                // Users API returns nested: {success: true, data: [...]}
                const modulesData = Array.isArray(modRes.data) ? modRes.data : (modRes.data.data || []);
                setModules(modulesData);

                const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.data || []);
                const activeUsers = usersData.filter(u => u.status === 'active');
                setUsers(activeUsers);
            } catch (e) {
                console.error('Error fetching data:', e);
            }
        };
        if (projectId) fetchData();
    }, [projectId]);

    useEffect(() => {
        if (moduleId) setFormData(prev => ({ ...prev, moduleId }));
    }, [moduleId]);

    // Outside Click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userSelectRef.current && !userSelectRef.current.contains(event.target)) {
                setIsUserSelectOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleUser = (userId) => {
        setFormData(prev => {
            const current = prev.assignedTo;
            if (current.includes(userId)) {
                return { ...prev, assignedTo: current.filter(id => id !== userId) };
            } else {
                return { ...prev, assignedTo: [...current, userId] };
            }
        });
    };

    const removeUser = (e, userId) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, assignedTo: prev.assignedTo.filter(id => id !== userId) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            // Clean up empty values to prevent validation errors
            const cleanedData = { ...formData, projectId };
            if (!cleanedData.moduleId) delete cleanedData.moduleId;
            if (!cleanedData.dueDate) delete cleanedData.dueDate;
            if (!cleanedData.assignedTo || cleanedData.assignedTo.length === 0) delete cleanedData.assignedTo;
            if (!cleanedData.estimatedHours || cleanedData.estimatedHours === 0) delete cleanedData.estimatedHours;

            await api.post('/tasks', cleanedData);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormContainer onSubmit={handleSubmit}>
            {/* Title Section */}
            <HeaderField delay={0.05}>
                <Label>TASK TITLE</Label>
                <TitleInput
                    placeholder="Enter task name..."
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    autoFocus
                    required
                />
            </HeaderField>

            <FormGroup delay={0.1}>
                {/* Description */}
                <StyledTextArea
                    placeholder="Add description..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                />
            </FormGroup>

            <Divider />

            <GridRow>
                {/* Module & Priority */}
                <CompactGroup delay={0.15}>
                    <Label><Layers size={14} /> Module</Label>
                    <SelectWrapper $disabled={!!moduleId}>
                        <StyledSelect
                            value={formData.moduleId}
                            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                            disabled={!!moduleId}
                        >
                            <option value="">Select Module</option>
                            {modules.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </StyledSelect>
                        {!moduleId && <ChevronDown size={14} className="icon" />}
                    </SelectWrapper>
                </CompactGroup>

                <CompactGroup delay={0.2}>
                    <Label><AlertCircle size={14} /> Priority</Label>
                    <SelectWrapper>
                        <StyledSelect
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </StyledSelect>
                        <ChevronDown size={14} className="icon" />
                    </SelectWrapper>
                </CompactGroup>
            </GridRow>

            {/* Custom Multi-Select with Floating Dropdown Fix */}
            <FormGroup
                delay={0.25}
                ref={userSelectRef}
                style={{ zIndex: isUserSelectOpen ? 100 : 10, position: 'relative' }} // Fix for overlapping
            >
                <Label><Users size={14} /> Assignees</Label>
                <MultiSelectContainer
                    onClick={() => setIsUserSelectOpen(!isUserSelectOpen)}
                    $active={isUserSelectOpen}
                >
                    {formData.assignedTo.length > 0 ? (
                        <AvatarStack>
                            {formData.assignedTo.map((id, index) => {
                                const user = users.find(u => u._id === id);
                                if (!user) return null;
                                return (
                                    <MiniTag key={id}>
                                        <TagAvatar>{user.name.charAt(0)}</TagAvatar>
                                        <span>{user.name.split(' ')[0]}</span>
                                        <X size={12} onClick={(e) => removeUser(e, id)} />
                                    </MiniTag>
                                );
                            })}
                        </AvatarStack>
                    ) : (
                        <Placeholder>
                            <UserPlus size={16} />
                            <span>Select team members...</span>
                        </Placeholder>
                    )}
                    <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />

                    <DropdownMenu $isOpen={isUserSelectOpen}>
                        {users.map(user => (
                            <DropdownItem
                                key={user._id}
                                onClick={(e) => { e.stopPropagation(); toggleUser(user._id); }}
                                $selected={formData.assignedTo.includes(user._id)}
                            >
                                <ItemAvatar>{user.name.charAt(0)}</ItemAvatar>
                                <div className="info">
                                    <div className="name">{user.name}</div>
                                    <div className="role">{user.role}</div>
                                </div>
                                {formData.assignedTo.includes(user._id) && <Check size={16} color="#f97316" />}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </MultiSelectContainer>
            </FormGroup>

            <GridRow>
                <CompactGroup delay={0.3}>
                    <Label><Calendar size={14} /> Due Date</Label>
                    <StyledInput
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                </CompactGroup>

                <CompactGroup delay={0.35}>
                    <Label><Clock size={14} /> Est. Hours</Label>
                    <StyledInput
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.estimatedHours}
                        onChange={e => setFormData({ ...formData, estimatedHours: e.target.value })}
                    />
                </CompactGroup>
            </GridRow>

            <Footer>
                <CancelButton type="button" onClick={onCancel}>Cancel</CancelButton>
                <SubmitButton type="submit" disabled={loading}>
                    {loading ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
                    {loading ? 'Creating...' : 'Create Task'}
                </SubmitButton>
            </Footer>
        </FormContainer>
    );
};

// --- Animations ---
const slideIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 10px;
`;

const HeaderField = styled.div`
    opacity: 0;
    animation: ${slideIn} 0.4s ease-out forwards;
    animation-delay: ${props => props.delay}s;
`;

const Label = styled.div`
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const TitleInput = styled.input`
    width: 100%;
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    border: none;
    border-bottom: 2px solid #e2e8f0;
    padding: 8px 0;
    background: transparent;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
        border-color: #f97316;
    }
    &::placeholder { color: #cbd5e1; }
`;

const StyledTextArea = styled.textarea`
    width: 100%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    font-size: 0.9375rem;
    color: #334155;
    outline: none;
    resize: none;
    transition: all 0.2s;
    font-family: inherit;

    &:focus {
        background: white;
        border-color: #f97316;
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.05);
    }
`;

const Divider = styled.div`
    height: 1px;
    background: #f1f5f9;
    margin: 0 -20px;
`;

const FormGroup = styled.div`
    opacity: 0;
    animation: ${slideIn} 0.4s ease-out forwards;
    animation-delay: ${props => props.delay}s;
`;

const CompactGroup = styled(FormGroup)`
    display: flex;
    flex-direction: column;
`;

const GridRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
`;

const SelectWrapper = styled.div`
    position: relative;
    background: ${props => props.$disabled ? '#f1f5f9' : '#f8fafc'};
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    transition: all 0.2s;
    overflow: hidden;

    &:hover {
        border-color: #cbd5e1;
    }

    .icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #94a3b8;
    }
`;

const StyledSelect = styled.select`
    width: 100%;
    padding: 12px;
    background: transparent;
    border: none;
    appearance: none;
    font-size: 0.9375rem;
    color: #0f172a;
    outline: none;
    cursor: pointer;
    
    &:disabled {
        color: #94a3b8;
        cursor: not-allowed;
    }
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    outline: none;
    font-size: 0.9375rem;
    color: #0f172a;
    transition: all 0.2s;

    &:focus {
        border-color: #f97316;
        background: white;
    }
`;

const MultiSelectContainer = styled.div`
    min-height: 52px;
    background: white;
    border: 1px solid ${props => props.$active ? '#f97316' : '#e2e8f0'};
    border-radius: 12px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;
    box-shadow: ${props => props.$active ? '0 0 0 4px rgba(249, 115, 22, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)'};
    transition: all 0.2s;
`;

const AvatarStack = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
`;

const MiniTag = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    background: #f1f5f9;
    padding: 4px 8px 4px 4px;
    border-radius: 20px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #334155;
    
    svg { cursor: pointer; color: #94a3b8; &:hover { color: #ef4444; } }
`;

const TagAvatar = styled.div`
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #cbd5e1;
    color: white;
    font-size: 0.625rem;
    display: flex; align-items: center; justifyContent: center;
    font-weight: 700;
`;

const Placeholder = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #94a3b8;
    font-size: 0.9375rem;
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: calc(100% + 8px);
    left: 0; right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.15);
    max-height: 240px;
    overflow-y: auto;
    z-index: 1000; // High Z-Index
    opacity: ${props => props.$isOpen ? 1 : 0};
    transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
    pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
`;

const DropdownItem = styled.div`
    padding: 10px 16px;
    display: flex; align-items: center; gap: 12px;
    cursor: pointer;
    background: ${props => props.$selected ? '#fff7ed' : 'transparent'};
    
    &:hover { background: #f8fafc; }

    .info {
        flex: 1;
        .name { font-size: 0.9375rem; font-weight: 500; color: #0f172a; }
        .role { font-size: 0.75rem; color: #64748b; }
    }
`;

const ItemAvatar = styled(TagAvatar)`
    width: 32px; height: 32px;
    font-size: 0.875rem;
`;

const Footer = styled.div`
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
`;

const Button = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9375rem;
`;

const CancelButton = styled(Button)`
    background: transparent;
    color: #64748b;
    border: none;
    &:hover { background: #f1f5f9; color: #0f172a; }
`;

const SubmitButton = styled(Button)`
    background: #0f172a;
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(15, 23, 42, 0.3);
    }
    
    &:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
`;

export default CreateTaskForm;
