import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import styled, { keyframes } from 'styled-components';
import {
    Search, Filter, Check, X, ExternalLink, Zap, Settings,
    AlertCircle, CheckCircle2, Loader, Plug, ChevronRight,
    MessageSquare, Code2, Database, Briefcase, Mail, LayoutGrid,
    Clock, Copy
} from 'lucide-react';
import getIntegrationLogo from '../../components/IntegrationLogos';
import toast from '../../utils/toast';

const IntegrationsPage = () => {
    const [catalog, setCatalog] = useState([]);
    const [filteredCatalog, setFilteredCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [configModal, setConfigModal] = useState(null);
    const [configData, setConfigData] = useState({});
    const [testingConnection, setTestingConnection] = useState(false);
    const socket = useSocket();
    const { user } = useAuth();
    
    useEffect(() => {
        fetchCatalog();
    }, []);

    useEffect(() => {
        if (socket && user?.organizationId) {
            socket.emit('integrations:join', user.organizationId);
            
            socket.on('integration:update', (update) => {
                handleRealtimeUpdate(update);
            });

            return () => {
                socket.off('integration:update');
            };
        }
    }, [socket, user]);

    const handleRealtimeUpdate = (update) => {
        setCatalog(prev => prev.map(item => {
            if (item.id === update.service) {
                if (update.type === 'status_change') {
                    return { 
                        ...item, 
                        connectionStatus: update.status, 
                        connected: update.status === 'connected',
                        lastSync: update.lastSync || item.lastSync
                    };
                }
                if (update.type === 'activity') {
                    const newLogs = [update.entry, ...(item.activityLog || [])].slice(0, 50);
                    return { ...item, activityLog: newLogs };
                }
            }
            return item;
        }));
    };

    useEffect(() => {
        filterCatalog();
    }, [searchTerm, selectedCategory, catalog]);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const res = await api.get('/integrations/catalog');
            const catalogData = res.data?.data || [];
            setCatalog(catalogData);
            setFilteredCatalog(catalogData);
        } catch (error) {
            console.error('Error fetching integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterCatalog = () => {
        let filtered = catalog;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(int => int.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(int =>
                int.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                int.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredCatalog(filtered);
    };

    const openConfigModal = (integration) => {
        setConfigModal(integration);
        setConfigData({});
    };

    const closeConfigModal = () => {
        setConfigModal(null);
        setConfigData({});
        setTestingConnection(false);
    };

    const handleConfigChange = (field, value) => {
        setConfigData(prev => ({ ...prev, [field]: value }));
    };

    const handleConnect = async () => {
        const toastId = toast.loading(`Configuring ${configModal.name}...`);
        try {
            await api.post(`/integrations/${configModal.id}/connect`, { config: configData });
            toast.dismiss(toastId);
            toast.success(`${configModal.name} connected successfully!`);
            fetchCatalog();
            closeConfigModal();
        } catch (error) {
            toast.dismiss(toastId);
            toast.error('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleTest = async () => {
        const toastId = toast.loading('Testing connection...');
        try {
            setTestingConnection(true);
            const res = await api.post(`/integrations/${configModal.id}/test`);
            toast.dismiss(toastId);
            toast.success(res.data.message || 'Connection test successful!');
            fetchCatalog();
        } catch (error) {
            toast.dismiss(toastId);
            toast.error('Test failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setTestingConnection(false);
        }
    };

    const handleDisconnect = async (integration) => {
        if (!window.confirm(`Disconnect ${integration.name}?`)) return;

        const toastId = toast.loading(`Disconnecting ${integration.name}...`);
        try {
            await api.delete(`/integrations/${integration.id}`);
            toast.dismiss(toastId);
            toast.success(`${integration.name} disconnected`);
            fetchCatalog();
        } catch (error) {
            toast.dismiss(toastId);
            toast.error('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const categories = [
        { id: 'all', label: 'All Integrations', icon: <LayoutGrid size={16} />, color: '#6366f1' },
        { id: 'communication', label: 'Communication', icon: <MessageSquare size={16} />, color: '#ec4899' },
        { id: 'development', label: 'Development', icon: <Code2 size={16} />, color: '#f59e0b' },
        { id: 'storage', label: 'Storage', icon: <Database size={16} />, color: '#10b981' },
        { id: 'productivity', label: 'Productivity', icon: <Briefcase size={16} />, color: '#8b5cf6' },
        { id: 'email', label: 'Email', icon: <Mail size={16} />, color: '#0ea5e9' }
    ];

    const connectedCount = catalog.filter(i => i.connected).length;

    if (loading) {
        return (
            <Container>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <Loader size={48} className="spin" color="#6366f1" />
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading integrations marketplace...</p>
                </div>
            </Container>
        );
    }

    const connectedIntegrations = filteredCatalog.filter(i => i.connected);
    const availableIntegrations = filteredCatalog.filter(i => !i.connected);

    return (
        <Container>
            <HeaderSection>
                <Hero>
                    <HeroContent>
                        <HeroIconWrapper>
                            <Plug size={40} />
                        </HeroIconWrapper>
                        <HeroText>
                            <h1>Integrations Marketplace</h1>
                            <p>Supercharge your workflow by connecting with the tools you already use. Seamless integrations for communication, development, and productivity.</p>
                        </HeroText>
                    </HeroContent>
                    <HeroStats>
                        <StatBadge>
                            <StatValue>{connectedCount}</StatValue>
                            <StatLabel>Active</StatLabel>
                        </StatBadge>
                        <StatBadge>
                            <StatValue>{catalog.length}</StatValue>
                            <StatLabel>Available</StatLabel>
                        </StatBadge>
                    </HeroStats>
                </Hero>

                <Controls>
                    <SearchBar>
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search available integrations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </SearchBar>
                    <CategoryTabs>
                        {categories.map(cat => (
                            <CategoryTab
                                key={cat.id}
                                $active={selectedCategory === cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <CategoryIconWrapper $active={selectedCategory === cat.id} $color={cat.color}>
                                    {cat.icon}
                                </CategoryIconWrapper>
                                {cat.label}
                            </CategoryTab>
                        ))}
                    </CategoryTabs>
                </Controls>
            </HeaderSection>

            {connectedIntegrations.length > 0 && (
                <Section>
                    <SectionHeader>
                        <SectionTitle>Connected Integrations</SectionTitle>
                        <SectionMeta>{connectedIntegrations.length} active · {connectedIntegrations.filter(i => i.connectionStatus === 'connected').length} healthy</SectionMeta>
                    </SectionHeader>
                    <HealthBar>
                        {connectedIntegrations.map(i => (
                            <HealthSegment key={i.id} $status={i.connectionStatus} title={`${i.name}: ${i.connectionStatus}`} />
                        ))}
                    </HealthBar>
                    <IntegrationGrid>
                        {connectedIntegrations.map((integration, index) => (
                            <IntegrationCard key={integration.id} $delay={index * 0.05}>

                                <CardHeader>
                                    <IntegrationLogo>
                                        {getIntegrationLogo(integration.id) || integration.logo}
                                    </IntegrationLogo>
                                    <CardTitleArea>
                                        <IntegrationName>{integration.name}</IntegrationName>
                                        <CategoryLabel>{integration.category}</CategoryLabel>
                                    </CardTitleArea>
                                    {integration.connected && (
                                        <StatusBadge $status={integration.connectionStatus}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                            {integration.connectionStatus}
                                        </StatusBadge>
                                    )}
                                </CardHeader>

                                <IntegrationDescription>{integration.description}</IntegrationDescription>

                                {integration.lastSync && (
                                    <LastSync>
                                        <Clock size={12} />
                                        Last synced {new Date(integration.lastSync).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </LastSync>
                                )}

                                {integration.connected && (
                                    <ActivityLog>
                                        <LogHeader>
                                            <Zap size={12} />
                                            Live Activity
                                        </LogHeader>
                                        <LogList>
                                            {integration.activityLog?.length > 0 ? (
                                                integration.activityLog.slice(0, 3).map((log, i) => (
                                                    <LogItem key={i} $status={log.status}>
                                                        <LogDot $status={log.status} />
                                                        <LogText>
                                                            <strong>{log.event.replace(/_/g, ' ')}</strong>
                                                            <span>{log.message}</span>
                                                        </LogText>
                                                        <LogTime>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</LogTime>
                                                    </LogItem>
                                                ))
                                            ) : (
                                                <LogEmpty>No recent activity</LogEmpty>
                                            )}
                                        </LogList>
                                    </ActivityLog>
                                )}

                                <FeatureList>
                                    {integration.features?.slice(0, 3).map((feature, i) => (
                                        <Feature key={i}>
                                            <Check size={14} strokeWidth={3} />
                                            {feature}
                                        </Feature>
                                    ))}
                                </FeatureList>

                                <CardActions>
                                    {integration.comingSoon ? (
                                        <DisabledButton>Coming Soon</DisabledButton>
                                    ) : integration.connected ? (
                                        <>
                                            <SecondaryButton onClick={() => openConfigModal(integration)}>
                                                <Settings size={16} />
                                                Configure
                                            </SecondaryButton>
                                            <DangerButton onClick={() => handleDisconnect(integration)}>
                                                Disconnect
                                            </DangerButton>
                                        </>
                                    ) : (
                                        <PrimaryButton onClick={() => openConfigModal(integration)}>
                                            <Zap size={16} />
                                            Connect
                                        </PrimaryButton>
                                    )}
                                    {integration.documentation && (
                                        <DocLink href={integration.documentation} target="_blank" rel="noopener noreferrer" title="View Documentation">
                                            <ExternalLink size={18} />
                                        </DocLink>
                                    )}
                                </CardActions>
                            </IntegrationCard>
                        ))}
                    </IntegrationGrid>
                </Section>
            )}

            {availableIntegrations.length > 0 && (
                <Section>
                    <SectionHeader>
                        <SectionTitle>Available Integrations</SectionTitle>
                    </SectionHeader>
                    <IntegrationGrid>
                        {availableIntegrations.map((integration, index) => (
                            <IntegrationCard key={integration.id} $delay={index * 0.05}>
                                {integration.popular && <PopularBadge>Popular</PopularBadge>}
                                {integration.comingSoon && <ComingSoonBadge>Coming Soon</ComingSoonBadge>}

                                <CardHeader>
                                    <IntegrationLogo>
                                        {getIntegrationLogo(integration.id) || integration.logo}
                                    </IntegrationLogo>
                                    <CardTitleArea>
                                        <IntegrationName>{integration.name}</IntegrationName>
                                        <CategoryLabel>{integration.category}</CategoryLabel>
                                    </CardTitleArea>
                                    {integration.connected && (
                                        <StatusBadge $status={integration.connectionStatus}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                            {integration.connectionStatus}
                                        </StatusBadge>
                                    )}
                                </CardHeader>

                                <IntegrationDescription>{integration.description}</IntegrationDescription>

                                {integration.connected && (
                                    <ActivityLog>
                                        <LogHeader>
                                            <Zap size={12} />
                                            Live Activity
                                        </LogHeader>
                                        <LogList>
                                            {integration.activityLog?.length > 0 ? (
                                                integration.activityLog.slice(0, 3).map((log, i) => (
                                                    <LogItem key={i} $status={log.status}>
                                                        <LogDot $status={log.status} />
                                                        <LogText>
                                                            <strong>{log.event.replace(/_/g, ' ')}</strong>
                                                            <span>{log.message}</span>
                                                        </LogText>
                                                        <LogTime>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</LogTime>
                                                    </LogItem>
                                                ))
                                            ) : (
                                                <LogEmpty>No recent activity</LogEmpty>
                                            )}
                                        </LogList>
                                    </ActivityLog>
                                )}

                                <FeatureList>
                                    {integration.features?.slice(0, 3).map((feature, i) => (
                                        <Feature key={i}>
                                            <Check size={14} strokeWidth={3} />
                                            {feature}
                                        </Feature>
                                    ))}
                                </FeatureList>

                                <CardActions>
                                    {integration.comingSoon ? (
                                        <DisabledButton>Coming Soon</DisabledButton>
                                    ) : integration.connected ? (
                                        <>
                                            <SecondaryButton onClick={() => openConfigModal(integration)}>
                                                <Settings size={16} />
                                                Configure
                                            </SecondaryButton>
                                            <DangerButton onClick={() => handleDisconnect(integration)}>
                                                Disconnect
                                            </DangerButton>
                                        </>
                                    ) : (
                                        <PrimaryButton onClick={() => openConfigModal(integration)}>
                                            <Zap size={16} />
                                            Connect
                                        </PrimaryButton>
                                    )}
                                    {integration.documentation && (
                                        <DocLink href={integration.documentation} target="_blank" rel="noopener noreferrer" title="View Documentation">
                                            <ExternalLink size={18} />
                                        </DocLink>
                                    )}
                                </CardActions>
                            </IntegrationCard>
                        ))}
                    </IntegrationGrid>
                </Section>
            )}

            {filteredCatalog.length === 0 && (
                <EmptyState>
                    <Search size={64} style={{ opacity: 0.2 }} />
                    <p>No integrations found matching your criteria</p>
                    <small>Try adjusting your search filters or check back later</small>
                </EmptyState>
            )}

            {configModal && (
                <Modal onClick={closeConfigModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <div>
                                <ModalLogo>
                                    {getIntegrationLogo(configModal.id) || configModal.logo}
                                </ModalLogo>
                                <div>
                                    <ModalTitle>Connect {configModal.name}</ModalTitle>
                                    <ModalSubtitle>{configModal.description}</ModalSubtitle>
                                </div>
                            </div>
                            <CloseButton onClick={closeConfigModal}>
                                <X size={24} />
                            </CloseButton>
                        </ModalHeader>

                        <ModalBody>
                            {configModal.fields.length > 0 ? (
                                <>
                                    <SetupInstructions>
                                        <strong>📝 Setup Instructions</strong>
                                        <ol>
                                            {configModal.setupType === 'webhook' && (
                                                <>
                                                    <li>Go to your <b>{configModal.name}</b> settings page.</li>
                                                    <li>Create a new <b>Incoming Webhook</b>.</li>
                                                    <li>Copy the generated webhook URL.</li>
                                                    <li>Paste it into the field below and save.</li>
                                                </>
                                            )}
                                            {configModal.setupType === 'api_key' && (
                                                <>
                                                    <li>Go to your <b>{configModal.name}</b> developer settings.</li>
                                                    <li>Generate a new <b>API Key</b> (or Access Token).</li>
                                                    <li>Copy the key immediately as it might not be shown again.</li>
                                                    <li>Paste it locally here to secure the connection.</li>
                                                </>
                                            )}
                                        </ol>
                                    </SetupInstructions>

                                    {configModal.fields.map(field => (
                                        <FormGroup key={field.name}>
                                            <Label>
                                                {field.label}
                                                {field.required && <Required>*</Required>}
                                            </Label>
                                            <Input
                                                type={field.type === 'password' ? 'password' : 'text'}
                                                placeholder={field.placeholder}
                                                value={configData[field.name] || ''}
                                                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                                            />
                                        </FormGroup>
                                    ))}
                                </>
                            ) : (
                                <OAuthPlaceholder>
                                    <Zap size={48} strokeWidth={1} />
                                    <h3>OAuth 2.0 Integration</h3>
                                    <p>Safe and secure authentication via {configModal.name}.</p>
                                    <p><strong>Coming soon!</strong> Native OAuth flow will be available in the next release.</p>
                                </OAuthPlaceholder>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <SecondaryButton onClick={closeConfigModal}>Cancel</SecondaryButton>
                            {configModal.fields.length > 0 && (
                                <>
                                    {configModal.connected && (
                                        <SecondaryButton onClick={handleTest} disabled={testingConnection}>
                                            {testingConnection ? <Loader size={16} className="spin" /> : <Zap size={16} />}
                                            Test Connection
                                        </SecondaryButton>
                                    )}
                                    <PrimaryButton onClick={handleConnect}>
                                        <CheckCircle2 size={16} />
                                        Save Configuration
                                    </PrimaryButton>
                                </>
                            )}
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </Container>
    );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const logPulse = keyframes`
    0% { background: transparent; }
    10% { background: rgba(99, 102, 241, 0.1); }
    100% { background: transparent; }
`;

// Styled Components
const Container = styled.div`
    padding: 8px 0 40px 0;
    max-width: 1600px;
    margin: 0 auto;
    min-height: 100vh;
    background: transparent;
`;

const HeaderSection = styled.div`
    margin-bottom: 2.5rem;
`;

const Hero = styled.div`
    background: #ffffff;
    border-radius: 14px;
    padding: 2rem 2.5rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    position: relative;
    overflow: hidden;
`;

const HeroContent = styled.div`
    display: flex;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    z-index: 1;
`;

const HeroIconWrapper = styled.div`
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ecfdf5;
    color: #008060;
    flex-shrink: 0;
`;

const HeroText = styled.div`
    h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.02em;
        margin: 0 0 0.4rem 0;
    }

    p {
        font-size: 0.95rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
        max-width: 600px;
    }
`;

const HeroStats = styled.div`
    display: flex;
    gap: 1rem;
`;

const StatBadge = styled.div`
    background: #f8fafc;
    padding: 0.85rem 1.4rem;
    border-radius: 12px;
    text-align: left;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;

    &:hover {
        background: #f1f5f9;
    }
`;

const StatValue = styled.div`
    font-size: 1.4rem;
    font-weight: 700;
    color: #008060;
    line-height: 1;
    margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

const Controls = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
    flex-wrap: wrap;
`;

const SearchBar = styled.div`
    flex: 1;
    max-width: 440px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    padding: 0 1.2rem;
    height: 42px;
    transition: all 0.2s;

    &:focus-within {
        border-color: #008060;
        box-shadow: 0 0 0 3px rgba(0,128,96,0.1);
    }

    svg { color: #9ca3af; }

    input {
        width: 100%;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        color: #111827;
        outline: none;

        &::placeholder { color: #9ca3af; }
    }
`;

const CategoryTabs = styled.div`
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 2px;

    &::-webkit-scrollbar {
        height: 3px;
    }
    &::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 3px;
    }
`;

const CategoryTab = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1rem;
    height: 40px;
    background: ${props => props.$active ? '#ecfdf5' : '#ffffff'};
    color: ${props => props.$active ? '#008060' : '#4b5563'};
    border: 1px solid ${props => props.$active ? '#a7f3d0' : '#e5e7eb'};
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;

    &:hover {
        background: ${props => props.$active ? '#ecfdf5' : '#f8fafc'};
        border-color: ${props => props.$active ? '#a7f3d0' : '#cbd5e1'};
    }
`;

const CategoryIconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: ${props => props.$active ? '#008060' : props.$color};

    svg {
        width: 15px;
        height: 15px;
    }
`;

const IntegrationGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1.5rem;
`;

const IntegrationCard = styled.div`
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 22px;
    position: relative;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    transition: all 0.2s ease;
    animation: ${fadeIn} 0.4s ease-out;
    animation-delay: ${props => props.$delay}s;
    animation-fill-mode: backwards;
    display: flex;
    flex-direction: column;
    height: 100%;

    &:hover {
        border-color: #008060;
        box-shadow: 0 6px 18px rgba(0,128,96,0.06);
        transform: translateY(-2px);
    }
`;

const PopularBadge = styled.div`
    position: absolute;
    top: 16px;
    right: 16px;
    background: #ecfdf5;
    color: #008060;
    padding: 3px 10px;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 9999px;
`;

const ComingSoonBadge = styled.div`
    position: absolute;
    top: 16px;
    right: 16px;
    background: #f1f5f9;
    color: #64748b;
    padding: 3px 10px;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 9999px;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1.1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #f1f5f9;
`;

const IntegrationLogo = styled.div`
    width: 46px;
    height: 46px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    flex-shrink: 0;
`;

const CardTitleArea = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const IntegrationName = styled.h3`
    font-size: 1.05rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.01em;
`;

const CategoryLabel = styled.div`
    font-size: 0.65rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 6px;
    align-self: flex-start;
`;

const StatusBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 600;
    margin-top: 0.4rem;
    width: fit-content;
    
    ${props => props.$status === 'connected' && `
        background: #ecfdf5;
        color: #008060;
    `}
    
    ${props => props.$status === 'error' && `
        background: #fef2f2;
        color: #ef4444;
    `}
    
    ${props => props.$status === 'pending' && `
        background: #fffbeb;
        color: #d97706;
    `}
`;

const IntegrationDescription = styled.p`
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.55;
    margin: 0 0 1.25rem 0;
    flex-grow: 1;
`;

const FeatureList = styled.div`
    background: #f8fafc;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 20px;
    border: 1px solid #e5e7eb;
`;

const Feature = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.8rem;
    color: #4b5563;
    margin-bottom: 0.4rem;

    &:last-child { margin-bottom: 0; }

    svg {
        color: #008060;
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }
`;

const CardActions = styled.div`
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
    margin-top: auto;
`;

const PrimaryButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1.2rem;
    height: 40px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #008060;
        transform: translateY(-1px);
    }
`;

const SecondaryButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1.2rem;
    height: 40px;
    background: #ffffff;
    color: #111827;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
    }

    &:disabled {
        border-color: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
    }

    .spin { animation: ${spin} 1s linear infinite; }
`;

const DangerButton = styled(SecondaryButton)`
    color: #ef4444;
    border-color: #fee2e2;
    background: #fff5f5;

    &:hover {
        background: #fee2e2;
        color: #dc2626;
    }
`;

const DisabledButton = styled(SecondaryButton)`
    background: #f1f5f9;
    color: #9ca3af;
    border-color: #e5e7eb;
    cursor: not-allowed;

    &:hover {
        background: #f1f5f9;
        transform: none;
    }
`;

const DocLink = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    color: #6b7280;
    transition: all 0.2s;

    &:hover {
        color: #008060;
        border-color: #008060;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: #9ca3af;

    p {
        font-size: 1.1rem;
        color: #4b5563;
        margin: 1rem 0 0.5rem 0;
        font-weight: 500;
    }

    small {
        color: #9ca3af;
    }
`;

// Modal Components
const Modal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
    background: #ffffff;
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    > div {
        display: flex;
        gap: 1.25rem;
        align-items: center;
    }
`;

const ModalLogo = styled(IntegrationLogo)`
    width: 52px;
    height: 52px;
    font-size: 2rem;
    border-radius: 14px;
`;

const ModalTitle = styled.h2`
    font-size: 1.2rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
`;

const ModalSubtitle = styled.p`
    font-size: 0.85rem;
    color: #6b7280;
    margin: 0;
    max-width: 350px;
    line-height: 1.5;
`;

const CloseButton = styled.button`
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background: #f1f5f9;
        color: #111827;
    }
`;

const ModalBody = styled.div`
    padding: 1.5rem 2rem;
`;

const SetupInstructions = styled.div`
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;

    strong {
        display: block;
        color: #111827;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
    }

    ol {
        margin: 0;
        padding-left: 1.25rem;
        color: #4b5563;
        font-size: 0.85rem;
        line-height: 1.6;

        li {
            margin-bottom: 0.4rem;
            &:last-child { margin-bottom: 0; }
        }
    }
`;

const FormGroup = styled.div`
    margin-bottom: 1.25rem;
    &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.4rem;
`;

const Required = styled.span`
    color: #ef4444;
    margin-left: 0.25rem;
`;

const Input = styled.input`
    width: 100%;
    padding: 0 1rem;
    height: 44px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 0.875rem;
    color: #111827;
    background: #f8fafc;
    transition: all 0.2s;

    &:focus {
        outline: none;
        background: #ffffff;
        border-color: #008060;
        box-shadow: 0 0 0 3px rgba(0,128,96,0.1);
    }
    
    &::placeholder {
        color: #9ca3af;
    }
`;

const OAuthPlaceholder = styled.div`
    text-align: center;
    padding: 2rem 0;
    color: #6b7280;

    svg {
        color: #008060;
        margin-bottom: 1rem;
    }

    h3 {
        color: #111827;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }
`;

const ModalFooter = styled.div`
    padding: 1.25rem 2rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    background: #f8fafc;
`;

const ActivityLog = styled.div`
    background: #ffffff;
    border-radius: 10px;
    padding: 0.85rem;
    margin-bottom: 1.25rem;
    border: 1px solid #e5e7eb;
`;

const LogHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin-bottom: 0.6rem;
    
    svg { color: #008060; }
`;

const LogList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const LogItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    font-size: 0.8rem;
    padding: 0.2rem;
    border-radius: 4px;
    animation: ${logPulse} 2s ease-out;
`;

const LogDot = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 0.35rem;
    flex-shrink: 0;
    
    background: ${props => {
        switch(props.$status) {
            case 'success': return '#008060';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#008060';
        }
    }};
`;

const LogText = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    
    strong {
        color: #111827;
        text-transform: capitalize;
    }
    
    span {
        color: #6b7280;
        font-size: 0.72rem;
    }
`;

const LogTime = styled.div`
    font-size: 0.7rem;
    color: #9ca3af;
    white-space: nowrap;
`;

const LogEmpty = styled.div`
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
    text-align: center;
`;

const Section = styled.div`
    margin-bottom: 3.5rem;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.85rem;
    margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
    font-size: 1.2rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.01em;
`;

const SectionMeta = styled.span`
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
`;

const HealthBar = styled.div`
    display: flex;
    height: 6px;
    border-radius: 9999px;
    overflow: hidden;
    gap: 3px;
    margin-bottom: 1.5rem;
    background: #e5e7eb;
`;

const HealthSegment = styled.div`
    flex: 1;
    border-radius: 9999px;
    background: ${props => {
        switch(props.$status) {
            case 'connected': return '#008060';
            case 'error': return '#ef4444';
            case 'pending': return '#f59e0b';
            default: return '#94a3b8';
        }
    }};
    transition: opacity 0.2s;
    cursor: help;

    &:hover { opacity: 0.7; }
`;

const LastSync = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    color: #6b7280;
    margin-bottom: 0.85rem;
    padding: 2px 8px;
    background: #f1f5f9;
    border-radius: 6px;

    svg { flex-shrink: 0; color: #9ca3af; }
`;

export default IntegrationsPage;
