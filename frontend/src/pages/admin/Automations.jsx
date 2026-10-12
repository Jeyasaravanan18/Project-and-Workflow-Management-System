import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';
import { Zap, Plus, Play, Pause, Trash2, Edit, Clock, CheckCircle, XCircle, TrendingUp, Search, ChevronDown, Crown, Square } from 'lucide-react';

const Automations = () => {
    const navigate = useNavigate();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, paused, inactive
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAutomations();
    }, []);

    const fetchAutomations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/automations');
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
        if (!trigger) return 'Custom';
        if (trigger.type === 'event') {
            return `Event: ${trigger.config?.eventType || 'Workflow'}`;
        } else if (trigger.type === 'schedule') {
            return `Schedule: ${trigger.config?.schedule || 'Cron'}`;
        } else if (trigger.type === 'webhook') {
            return 'Webhook';
        }
        return trigger.type;
    };

    // Filter logic
    const filteredAutomations = automations.filter(auto => {
        const matchesSearch = !searchQuery || 
            auto.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (auto.description && auto.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (!matchesSearch) return false;

        if (filter === 'active') return auto.enabled === true;
        if (filter === 'paused') return auto.enabled === false;
        if (filter === 'inactive') return auto.enabled === false;
        return true;
    });

    return (
        <Container>
            {/* Top Header */}
            <PageHeader>
                <Title>Automations</Title>
                <CreateButton onClick={() => navigate('/admin/automations/new')}>
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Create an automation</span>
                </CreateButton>
            </PageHeader>

            {/* Brevo Tabs: All, Active, Paused, Inactive */}
            <TabsNav>
                <TabButton $active={filter === 'all'} onClick={() => setFilter('all')}>
                    All
                </TabButton>
                <TabButton $active={filter === 'active'} onClick={() => setFilter('active')}>
                    <Play size={13} fill={filter === 'active' ? '#4F46E5' : 'none'} />
                    Active
                </TabButton>
                <TabButton $active={filter === 'paused'} onClick={() => setFilter('paused')}>
                    <Pause size={13} />
                    Paused
                </TabButton>
                <TabButton $active={filter === 'inactive'} onClick={() => setFilter('inactive')}>
                    <Square size={12} />
                    Inactive
                </TabButton>
            </TabsNav>

            {/* Filter and Search Bar */}
            <FilterRow>
                <SearchInputWrapper>
                    <Search size={16} color="#9CA3AF" />
                    <input 
                        type="text" 
                        placeholder="Search for an automation" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </SearchInputWrapper>

                <TagFilterSelect>
                    <span>Select tags</span>
                    <ChevronDown size={14} color="#6B7280" />
                </TagFilterSelect>

                <CrownBadge title="Premium Features">
                    <Crown size={15} color="#D97706" />
                </CrownBadge>
            </FilterRow>

            {/* Content Area */}
            {loading ? (
                <LoadingState>Loading automations...</LoadingState>
            ) : filteredAutomations.length === 0 ? (
                /* Brevo Screenshot 2 Empty State */
                <BrevoEmptyState>
                    <IllustrationWrapper>
                        <svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="illustration-svg">
                            {/* Sun/Moon circle */}
                            <circle cx="270" cy="70" r="28" fill="#FEF3C7" opacity="0.7"/>
                            {/* Trees / Leaves */}
                            <path d="M70 160 C70 100, 110 80, 130 160 Z" fill="#1E40AF" />
                            <path d="M110 160 C120 110, 160 90, 180 160 Z" fill="#D1FAE5" />
                            <path d="M250 160 C260 120, 290 100, 310 160 Z" fill="#A7F3D0" />
                            {/* Rolling hill */}
                            <path d="M20 170 Q 180 130, 340 170 L340 200 L20 200 Z" fill="#EFF6FF" />
                            <path d="M20 180 Q 180 150, 340 180" stroke="#1E40AF" strokeWidth="1.5" fill="none" />
                            {/* Sitting character stylized */}
                            <circle cx="210" cy="105" r="12" fill="#D1FAE5" stroke="#1E40AF" strokeWidth="1.5" />
                            <path d="M202 118 C202 118, 205 142, 225 142" stroke="#1E40AF" strokeWidth="1.5" fill="none" />
                            <path d="M202 122 L220 122 L225 150" fill="#1E40AF" />
                            <path d="M195 150 L225 150 L245 165" stroke="#1E40AF" strokeWidth="1.5" fill="none" />
                            {/* Sparkles */}
                            <path d="M260 95 L263 90 L266 95 L271 98 L266 101 L263 106 L260 101 L255 98 Z" fill="#34D399" />
                        </svg>
                    </IllustrationWrapper>
                    <EmptyText>You don't have any {filter !== 'all' ? filter : ''} automation.</EmptyText>
                    <CreateButton onClick={() => navigate('/admin/automations/new')} style={{ margin: '16px auto 0' }}>
                        <Plus size={16} />
                        <span>Create an automation</span>
                    </CreateButton>
                </BrevoEmptyState>
            ) : (
                <AutomationGrid>
                    {filteredAutomations.map(automation => (
                        <AutomationCard key={automation._id} $enabled={automation.enabled}>
                            <CardHeader>
                                <CardTitle>
                                    <IconBox $enabled={automation.enabled}>
                                        <Zap size={18} color={automation.enabled ? '#1E40AF' : '#9CA3AF'} />
                                    </IconBox>
                                    <div>
                                        <NameText>{automation.name}</NameText>
                                        <TriggerInfo>
                                            <Clock size={12} />
                                            <span>{getTriggerLabel(automation.trigger)}</span>
                                        </TriggerInfo>
                                    </div>
                                </CardTitle>
                                <StatusPill $enabled={automation.enabled}>
                                    {automation.enabled ? 'Active' : 'Paused'}
                                </StatusPill>
                            </CardHeader>

                            {automation.description && (
                                <CardDescription>{automation.description}</CardDescription>
                            )}

                            <CardFooter>
                                <Stats>
                                    <StatItem>
                                        <TrendingUp size={14} color="#6B7280" />
                                        <span>{automation.runCount || 0} executions</span>
                                    </StatItem>
                                    {automation.lastRun && (
                                        <StatItem>
                                            {automation.lastRunStatus === 'success' ? (
                                                <CheckCircle size={14} color="#1E40AF" />
                                            ) : (
                                                <XCircle size={14} color="#EF4444" />
                                            )}
                                            <span>{new Date(automation.lastRun).toLocaleDateString()}</span>
                                        </StatItem>
                                    )}
                                </Stats>

                                <CardActions>
                                    <SwitchToggle 
                                        $checked={automation.enabled}
                                        onClick={() => toggleAutomation(automation._id)}
                                        title={automation.enabled ? 'Pause automation' : 'Activate automation'}
                                    >
                                        <div className="slider" />
                                    </SwitchToggle>
                                    <ActionButton
                                        onClick={() => navigate(`/admin/automations/${automation._id}`)}
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </ActionButton>
                                    <ActionButton
                                        onClick={() => deleteAutomation(automation._id)}
                                        title="Delete"
                                        $danger
                                    >
                                        <Trash2 size={16} />
                                    </ActionButton>
                                </CardActions>
                            </CardFooter>
                        </AutomationCard>
                    ))}
                </AutomationGrid>
            )}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    max-width: 1300px;
    margin: 0 auto;
`;

const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const Title = styled.h1`
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.02em;
`;

const CreateButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #111827; /* Dark black pill as in Brevo */
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
        background: #1F2937;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
`;

const TabsNav = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    border-bottom: 1px solid #E5E7EB;
    margin-bottom: 24px;
`;

const TabButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 2px;
    background: transparent;
    border: none;
    border-bottom: 2px solid ${props => props.$active ? '#4F46E5' : 'transparent'};
    color: ${props => props.$active ? '#4F46E5' : '#4B5563'};
    font-size: 0.875rem;
    font-weight: ${props => props.$active ? '600' : '500'};
    cursor: pointer;
    transition: all 0.15s ease;
    margin-bottom: -1px;

    &:hover {
        color: #111827;
    }
`;

const FilterRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
`;

const SearchInputWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 9999px;
    width: 280px;
    transition: border-color 0.2s;

    &:focus-within {
        border-color: #1E40AF;
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 0.875rem;
        color: #111827;
        width: 100%;

        &::placeholder {
            color: #9CA3AF;
        }
    }
`;

const TagFilterSelect = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 9999px;
    font-size: 0.875rem;
    color: #4B5563;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #F9FAFB;
        border-color: #D1D5DB;
    }
`;

const CrownBadge = styled.div`
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #FEF3C7;
    border: 1px solid #FDE68A;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const BrevoEmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
`;

const IllustrationWrapper = styled.div`
    width: 100%;
    max-width: 440px;
    margin-bottom: 20px;

    .illustration-svg {
        width: 100%;
        height: auto;
    }
`;

const EmptyText = styled.h3`
    font-size: 1.15rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
`;

const LoadingState = styled.div`
    text-align: center;
    padding: 48px;
    color: #6B7280;
    font-size: 0.9375rem;
`;

const AutomationGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
`;

const AutomationCard = styled.div`
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 20px;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &:hover {
        border-color: #D1D5DB;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
`;

const CardTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const IconBox = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: ${props => props.$enabled ? '#EFF6FF' : '#F3F4F6'};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const NameText = styled.div`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
`;

const TriggerInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: #6B7280;
    margin-top: 2px;
`;

const StatusPill = styled.span`
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: ${props => props.$enabled ? '#EFF6FF' : '#F3F4F6'};
    color: ${props => props.$enabled ? '#1E40AF' : '#6B7280'};
`;

const CardDescription = styled.p`
    font-size: 0.8125rem;
    color: #4B5563;
    line-height: 1.5;
    margin: 0 0 16px 0;
`;

const CardFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 14px;
    border-top: 1px solid #F3F4F6;
`;

const Stats = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const StatItem = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: #6B7280;
`;

const CardActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const SwitchToggle = styled.button`
    width: 36px;
    height: 20px;
    border-radius: 9999px;
    background: ${props => props.$checked ? '#1E40AF' : '#D1D5DB'};
    border: none;
    position: relative;
    cursor: pointer;
    transition: background 0.2s ease;
    padding: 2px;

    .slider {
        width: 16px;
        height: 16px;
        background: #ffffff;
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: ${props => props.$checked ? '18px' : '2px'};
        transition: left 0.2s ease;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
`;

const ActionButton = styled.button`
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: ${props => props.$danger ? '#DC2626' : '#6B7280'};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: ${props => props.$danger ? '#FEE2E2' : '#F3F4F6'};
        color: ${props => props.$danger ? '#B91C1C' : '#111827'};
    }
`;

export default Automations;
