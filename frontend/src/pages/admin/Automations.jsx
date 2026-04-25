import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';
import { Zap, Plus, Play, Pause, Trash2, Edit, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const Automations = () => {
    const navigate = useNavigate();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, enabled, disabled

    useEffect(() => {
        fetchAutomations();
    }, [filter]);

    const fetchAutomations = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter !== 'all') {
                params.enabled = filter === 'enabled';
            }
            const res = await api.get('/automations', { params });
            setAutomations(res.data.automations || []);
        } catch (error) {
            console.error('Error fetching automations:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAutomation = async (id) => {
        try {
            await api.post(`/automations/${id}/toggle`);
            fetchAutomations();
        } catch (error) {
            console.error('Error toggling automation:', error);
        }
    };

    const deleteAutomation = async (id) => {
        if (!window.confirm('Are you sure you want to delete this automation?')) return;

        try {
            await api.delete(`/automations/${id}`);
            fetchAutomations();
        } catch (error) {
            console.error('Error deleting automation:', error);
        }
    };

    const getTriggerLabel = (trigger) => {
        if (trigger.type === 'event') {
            return `Event: ${trigger.config.eventType}`;
        } else if (trigger.type === 'schedule') {
            return `Schedule: ${trigger.config.schedule}`;
        } else if (trigger.type === 'webhook') {
            return 'Webhook';
        }
        return trigger.type;
    };

    if (loading) {
        return (
            <Container>
                <Header>
                    <h1>Automations</h1>
                </Header>
                <LoadingState>Loading automations...</LoadingState>
            </Container>
        );
    }

    return (
        <Container>
            <Header>
                <div>
                    <h1><Zap size={32} /> Smart Automations</h1>
                    <Subtitle>Automate your workflow with no-code automation rules</Subtitle>
                </div>
                <HeaderActions>
                    <CreateButton onClick={() => navigate('/admin/automations/new')}>
                        <Plus size={20} />
                        Create Automation
                    </CreateButton>
                </HeaderActions>
            </Header>

            <FilterBar>
                <FilterButton $active={filter === 'all'} onClick={() => setFilter('all')}>
                    All ({automations.length})
                </FilterButton>
                <FilterButton $active={filter === 'enabled'} onClick={() => setFilter('enabled')}>
                    Enabled
                </FilterButton>
                <FilterButton $active={filter === 'disabled'} onClick={() => setFilter('disabled')}>
                    Disabled
                </FilterButton>
            </FilterBar>

            {automations.length === 0 ? (
                <EmptyState>
                    <Zap size={64} />
                    <h3>No automations yet</h3>
                    <p>Create your first automation to streamline your workflow</p>
                    <CreateButton onClick={() => navigate('/admin/automations/new')}>
                        <Plus size={20} />
                        Create Automation
                    </CreateButton>
                </EmptyState>
            ) : (
                <AutomationGrid>
                    {automations.map(automation => (
                        <AutomationCard key={automation._id} $enabled={automation.enabled}>
                            <CardHeader>
                                <CardTitle>
                                    <Zap size={20} />
                                    {automation.name}
                                </CardTitle>
                                <StatusBadge $enabled={automation.enabled}>
                                    {automation.enabled ? 'Enabled' : 'Disabled'}
                                </StatusBadge>
                            </CardHeader>

                            <CardDescription>{automation.description}</CardDescription>

                            <TriggerInfo>
                                <Clock size={16} />
                                {getTriggerLabel(automation.trigger)}
                            </TriggerInfo>

                            <Stats>
                                <StatItem>
                                    <TrendingUp size={16} />
                                    <span>{automation.runCount || 0} runs</span>
                                </StatItem>
                                {automation.lastRun && (
                                    <StatItem>
                                        {automation.lastRunStatus === 'success' ? (
                                            <CheckCircle size={16} color="#22c55e" />
                                        ) : (
                                            <XCircle size={16} color="#ef4444" />
                                        )}
                                        <span>Last run: {new Date(automation.lastRun).toLocaleDateString()}</span>
                                    </StatItem>
                                )}
                            </Stats>

                            <CardActions>
                                <ActionButton
                                    onClick={() => toggleAutomation(automation._id)}
                                    title={automation.enabled ? 'Disable' : 'Enable'}
                                >
                                    {automation.enabled ? <Pause size={18} /> : <Play size={18} />}
                                </ActionButton>
                                <ActionButton
                                    onClick={() => navigate(`/admin/automations/${automation._id}`)}
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </ActionButton>
                                <ActionButton
                                    onClick={() => deleteAutomation(automation._id)}
                                    title="Delete"
                                    $danger
                                >
                                    <Trash2 size={18} />
                                </ActionButton>
                            </CardActions>
                        </AutomationCard>
                    ))}
                </AutomationGrid>
            )}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;

    h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 0.75rem;
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

const CreateButton = styled.button`
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

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
    }
`;

const FilterBar = styled.div`
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 8px;
    width: fit-content;
`;

const FilterButton = styled.button`
    padding: 0.5rem 1rem;
    background: ${props => props.$active ? 'white' : 'transparent'};
    color: ${props => props.$active ? '#6366f1' : '#64748b'};
    border: none;
    border-radius: 6px;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: ${props => props.$active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};

    &:hover {
        background: white;
    }
`;

const AutomationGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
`;

const AutomationCard = styled.div`
    background: white;
    border: 2px solid ${props => props.$enabled ? '#e0e7ff' : '#e2e8f0'};
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s;
    opacity: ${props => props.$enabled ? 1 : 0.7};

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: ${props => props.$enabled ? '#6366f1' : '#cbd5e1'};
    }
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
`;

const CardTitle = styled.h3`
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const StatusBadge = styled.span`
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    background: ${props => props.$enabled ? '#dcfce7' : '#f1f5f9'};
    color: ${props => props.$enabled ? '#16a34a' : '#64748b'};
`;

const CardDescription = styled.p`
    color: #64748b;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    line-height: 1.5;
`;

const TriggerInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 0.85rem;
    color: #475569;
    margin-bottom: 1rem;
`;

const Stats = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
`;

const StatItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #64748b;
`;

const CardActions = styled.div`
    display: flex;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
`;

const ActionButton = styled.button`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: ${props => props.$danger ? '#fee2e2' : '#f8fafc'};
    color: ${props => props.$danger ? '#dc2626' : '#475569'};
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${props => props.$danger ? '#fecaca' : '#e2e8f0'};
        transform: scale(1.05);
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;

    svg {
        color: #cbd5e1;
        margin-bottom: 1rem;
    }

    h3 {
        font-size: 1.5rem;
        color: #475569;
        margin-bottom: 0.5rem;
    }

    p {
        margin-bottom: 2rem;
    }
`;

const LoadingState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
    font-size: 1.1rem;
`;

export default Automations;
