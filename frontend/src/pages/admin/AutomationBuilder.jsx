import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';
import { Zap, Save, Play, ArrowRight, Plus, Trash2, ChevronDown, X } from 'lucide-react';

const AutomationBuilder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [automation, setAutomation] = useState({
        name: '',
        description: '',
        trigger: {
            type: 'event',
            config: { eventType: 'task.created' }
        },
        conditions: [],
        actions: []
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchAutomation();
        }
        fetchUsers();
    }, [id]);

    const fetchAutomation = async () => {
        try {
            const res = await api.get(`/automations/${id}`);
            setAutomation(res.data.automation);
        } catch (error) {
            console.error('Error fetching automation:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            // Handle nested data structure: {success: true, data: [...]} or direct array
            const usersData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]); // Set empty array on error
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            if (id) {
                await api.put(`/automations/${id}`, automation);
            } else {
                await api.post('/automations', automation);
            }
            navigate('/admin/automations');
        } catch (error) {
            console.error('Error saving automation:', error);
            alert('Error saving automation: ' + error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        try {
            await api.post(`/automations/${id}/test`, {
                testData: {
                    task: {
                        _id: 'test',
                        title: 'Test Task',
                        priority: 'High'
                    }
                }
            });
            alert('Test triggered! Check execution history.');
        } catch (error) {
            console.error('Error testing automation:', error);
        }
    };

    const addCondition = () => {
        setAutomation({
            ...automation,
            conditions: [
                ...automation.conditions,
                { field: 'task.priority', operator: 'equals', value: '', logicOperator: 'AND' }
            ]
        });
    };

    const updateCondition = (index, field, value) => {
        const newConditions = [...automation.conditions];
        newConditions[index][field] = value;
        setAutomation({ ...automation, conditions: newConditions });
    };

    const removeCondition = (index) => {
        setAutomation({
            ...automation,
            conditions: automation.conditions.filter((_, i) => i !== index)
        });
    };

    const addAction = (type) => {
        const actionConfigs = {
            send_notification: { recipient: '', message: '', title: 'Notification' },
            create_task: { title: '', projectId: '', priority: 'Medium' },
            update_task: { taskId: 'context.task._id', status: '' },
            assign_task: { taskId: 'context.task._id', assignee: '' },
            send_email: { to: '', subject: '', body: '' },
            create_comment: { taskId: 'context.task._id', text: '' }
        };

        setAutomation({
            ...automation,
            actions: [
                ...automation.actions,
                { type, config: actionConfigs[type] || {}, order: automation.actions.length }
            ]
        });
    };

    const updateAction = (index, field, value) => {
        const newActions = [...automation.actions];
        newActions[index].config[field] = value;
        setAutomation({ ...automation, actions: newActions });
    };

    const removeAction = (index) => {
        setAutomation({
            ...automation,
            actions: automation.actions.filter((_, i) => i !== index)
        });
    };

    return (
        <Container>
            <Header>
                <div>
                    <h1><Zap size={28} /> {id ? 'Edit' : 'Create'} Automation</h1>
                    <Subtitle>Build your workflow automation step by step</Subtitle>
                </div>
                <HeaderActions>
                    {id && (
                        <TestButton onClick={handleTest}>
                            <Play size={18} />
                            Test
                        </TestButton>
                    )}
                    <SaveButton onClick={handleSave} disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save'}
                    </SaveButton>
                </HeaderActions>
            </Header>

            <BuilderContainer>
                {/* Basic Info */}
                <Section>
                    <SectionTitle>Basic Information</SectionTitle>
                    <FormGroup>
                        <Label>Automation Name *</Label>
                        <Input
                            value={automation.name}
                            onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                            placeholder="e.g., Auto-assign high priority tasks"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Description</Label>
                        <TextArea
                            value={automation.description}
                            onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
                            placeholder="Describe what this automation does..."
                            rows={3}
                        />
                    </FormGroup>
                </Section>

                {/* Trigger */}
                <Section>
                    <SectionTitle>
                        <StepNumber>1</StepNumber>
                        Trigger - When should this run?
                    </SectionTitle>
                    <FormGroup>
                        <Label>Trigger Type</Label>
                        <Select
                            value={automation.trigger.type}
                            onChange={(e) => setAutomation({
                                ...automation,
                                trigger: {
                                    type: e.target.value,
                                    config: e.target.value === 'event'
                                        ? { eventType: 'task.created' }
                                        : { schedule: '0 9 * * *' }
                                }
                            })}
                        >
                            <option value="event">Event</option>
                            <option value="schedule">Schedule</option>
                        </Select>
                    </FormGroup>

                    {automation.trigger.type === 'event' && (
                        <FormGroup>
                            <Label>Event Type</Label>
                            <Select
                                value={automation.trigger.config.eventType}
                                onChange={(e) => setAutomation({
                                    ...automation,
                                    trigger: {
                                        ...automation.trigger,
                                        config: { eventType: e.target.value }
                                    }
                                })}
                            >
                                <option value="task.created">Task Created</option>
                                <option value="task.updated">Task Updated</option>
                                <option value="task.status_changed">Task Status Changed</option>
                                <option value="task.assigned">Task Assigned</option>
                                <option value="project.created">Project Created</option>
                                <option value="comment.created">Comment Created</option>
                            </Select>
                        </FormGroup>
                    )}

                    {automation.trigger.type === 'schedule' && (
                        <FormGroup>
                            <Label>Schedule (Cron Expression)</Label>
                            <Input
                                value={automation.trigger.config.schedule}
                                onChange={(e) => setAutomation({
                                    ...automation,
                                    trigger: {
                                        ...automation.trigger,
                                        config: { ...automation.trigger.config, schedule: e.target.value }
                                    }
                                })}
                                placeholder="0 9 * * * (Daily at 9 AM)"
                            />
                            <Hint>Examples: "0 9 * * *" (daily 9am), "0 17 * * 5" (Friday 5pm)</Hint>
                        </FormGroup>
                    )}
                </Section>

                <Arrow><ArrowRight size={24} /></Arrow>

                {/* Conditions */}
                <Section>
                    <SectionTitle>
                        <StepNumber>2</StepNumber>
                        Conditions - Filter when to run (Optional)
                    </SectionTitle>

                    {automation.conditions.map((condition, index) => (
                        <ConditionRow key={index}>
                            <Select
                                value={condition.field}
                                onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            >
                                <option value="task.priority">Task Priority</option>
                                <option value="task.status">Task Status</option>
                                <option value="task.title">Task Title</option>
                                <option value="task.assignee.role">Assignee Role</option>
                            </Select>

                            <Select
                                value={condition.operator}
                                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                            >
                                <option value="equals">Equals</option>
                                <option value="not_equals">Not Equals</option>
                                <option value="contains">Contains</option>
                                <option value="in">In</option>
                                <option value="greater_than">Greater Than</option>
                                <option value="less_than">Less Than</option>
                            </Select>

                            <Input
                                value={condition.value}
                                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                placeholder="Value"
                            />

                            <IconButton onClick={() => removeCondition(index)} $danger>
                                <X size={18} />
                            </IconButton>
                        </ConditionRow>
                    ))}

                    <AddButton onClick={addCondition}>
                        <Plus size={18} />
                        Add Condition
                    </AddButton>
                </Section>

                <Arrow><ArrowRight size={24} /></Arrow>

                {/* Actions */}
                <Section>
                    <SectionTitle>
                        <StepNumber>3</StepNumber>
                        Actions - What should happen?
                    </SectionTitle>

                    {automation.actions.map((action, index) => (
                        <ActionCard key={index}>
                            <ActionHeader>
                                <ActionTitle>Action {index + 1}: {action.type.replace(/_/g, ' ')}</ActionTitle>
                                <IconButton onClick={() => removeAction(index)} danger>
                                    <Trash2 size={18} />
                                </IconButton>
                            </ActionHeader>

                            {action.type === 'send_notification' && (
                                <>
                                    <FormGroup>
                                        <Label>Title</Label>
                                        <Input
                                            value={action.config.title}
                                            onChange={(e) => updateAction(index, 'title', e.target.value)}
                                            placeholder="Notification title"
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Message</Label>
                                        <TextArea
                                            value={action.config.message}
                                            onChange={(e) => updateAction(index, 'message', e.target.value)}
                                            placeholder="Use {{task.title}} for dynamic values"
                                            rows={3}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Recipient</Label>
                                        <Select
                                            value={action.config.recipient}
                                            onChange={(e) => updateAction(index, 'recipient', e.target.value)}
                                        >
                                            <option value="">Select recipient</option>
                                            <option value="context.task.project.manager">Project Manager</option>
                                            <option value="context.task.assignee">Task Assignee</option>
                                            {users.map(user => (
                                                <option key={user._id} value={user._id}>{user.name}</option>
                                            ))}
                                        </Select>
                                    </FormGroup>
                                </>
                            )}

                            {action.type === 'create_task' && (
                                <>
                                    <FormGroup>
                                        <Label>Task Title</Label>
                                        <Input
                                            value={action.config.title}
                                            onChange={(e) => updateAction(index, 'title', e.target.value)}
                                            placeholder="New task title"
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Priority</Label>
                                        <Select
                                            value={action.config.priority}
                                            onChange={(e) => updateAction(index, 'priority', e.target.value)}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </Select>
                                    </FormGroup>
                                </>
                            )}

                            {action.type === 'update_task' && (
                                <FormGroup>
                                    <Label>New Status</Label>
                                    <Input
                                        value={action.config.status}
                                        onChange={(e) => updateAction(index, 'status', e.target.value)}
                                        placeholder="e.g., In Progress, Done"
                                    />
                                </FormGroup>
                            )}

                            {action.type === 'assign_task' && (
                                <FormGroup>
                                    <Label>Assign To</Label>
                                    <Select
                                        value={action.config.assignee}
                                        onChange={(e) => updateAction(index, 'assignee', e.target.value)}
                                    >
                                        <option value="">Select user</option>
                                        {users.map(user => (
                                            <option key={user._id} value={user._id}>{user.name}</option>
                                        ))}
                                    </Select>
                                </FormGroup>
                            )}

                            {action.type === 'send_email' && (
                                <>
                                    <FormGroup>
                                        <Label>To (Email or User ID)</Label>
                                        <Input
                                            value={action.config.to}
                                            onChange={(e) => updateAction(index, 'to', e.target.value)}
                                            placeholder="email@example.com or context.task.assignee"
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Subject</Label>
                                        <Input
                                            value={action.config.subject}
                                            onChange={(e) => updateAction(index, 'subject', e.target.value)}
                                            placeholder="Email subject"
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Body</Label>
                                        <TextArea
                                            value={action.config.body}
                                            onChange={(e) => updateAction(index, 'body', e.target.value)}
                                            placeholder="Email body"
                                            rows={4}
                                        />
                                    </FormGroup>
                                </>
                            )}

                            {action.type === 'create_comment' && (
                                <FormGroup>
                                    <Label>Comment Text</Label>
                                    <TextArea
                                        value={action.config.text}
                                        onChange={(e) => updateAction(index, 'text', e.target.value)}
                                        placeholder="Comment text"
                                        rows={3}
                                    />
                                </FormGroup>
                            )}
                        </ActionCard>
                    ))}

                    <ActionSelector>
                        <Label>Add Action:</Label>
                        <ActionButtons>
                            <ActionTypeButton onClick={() => addAction('send_notification')}>
                                📢 Notify
                            </ActionTypeButton>
                            <ActionTypeButton onClick={() => addAction('create_task')}>
                                ➕ Create Task
                            </ActionTypeButton>
                            <ActionTypeButton onClick={() => addAction('update_task')}>
                                ✏️ Update Task
                            </ActionTypeButton>
                            <ActionTypeButton onClick={() => addAction('assign_task')}>
                                👤 Assign Task
                            </ActionTypeButton>
                            <ActionTypeButton onClick={() => addAction('send_email')}>
                                📧 Send Email
                            </ActionTypeButton>
                            <ActionTypeButton onClick={() => addAction('create_comment')}>
                                💬 Add Comment
                            </ActionTypeButton>
                        </ActionButtons>
                    </ActionSelector>
                </Section>
            </BuilderContainer>

            <VariableHint>
                💡 <strong>Tip:</strong> Use variables like <code>{'{{task.title}}'}</code>, <code>{'{{user.name}}'}</code>, <code>{'{{task.priority}}'}</code> in messages
            </VariableHint>
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;

    h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
    }
`;

const Subtitle = styled.p`
    color: #64748b;
    margin-top: 0.5rem;
    font-size: 0.95rem;
`;

const HeaderActions = styled.div`
    display: flex;
    gap: 1rem;
`;

const SaveButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const TestButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: white;
    color: #6366f1;
    border: 2px solid #6366f1;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f0f0ff;
    }
`;

const BuilderContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const Section = styled.div`
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
`;

const SectionTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
`;

const StepNumber = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border-radius: 50%;
    font-size: 0.9rem;
    font-weight: 700;
`;

const FormGroup = styled.div`
    margin-bottom: 1.25rem;

    &:last-child {
        margin-bottom: 0;
    }
`;

const Label = styled.label`
    display: block;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
`;

const Input = styled.input`
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.95rem;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
`;

const Select = styled.select`
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.95rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
`;

const Hint = styled.p`
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 0.5rem;
`;

const Arrow = styled.div`
    display: flex;
    justify-content: center;
    color: #cbd5e1;
`;

const ConditionRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
`;

const AddButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f8fafc;
    color: #6366f1;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;

    &:hover {
        background: #f0f0ff;
        border-color: #6366f1;
    }
`;

const ActionCard = styled.div`
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1rem;
`;

const ActionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
`;

const ActionTitle = styled.h3`
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    text-transform: capitalize;
`;

const IconButton = styled.button`
    padding: 0.5rem;
    background: ${props => props.$danger ? '#fee2e2' : '#f8fafc'};
    color: ${props => props.$danger ? '#dc2626' : '#475569'};
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${props => props.$danger ? '#fecaca' : '#e2e8f0'};
    }
`;

const ActionSelector = styled.div`
    margin-top: 1rem;
`;

const ActionButtons = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
`;

const ActionTypeButton = styled.button`
    padding: 0.75rem 1rem;
    background: white;
    color: #475569;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #6366f1;
        color: #6366f1;
        transform: translateY(-2px);
    }
`;

const VariableHint = styled.div`
    background: #eff6ff;
    border: 2px solid #bfdbfe;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 2rem;
    color: #1e40af;
    font-size: 0.9rem;

    code {
        background: #dbeafe;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
    }
`;

export default AutomationBuilder;
