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
    padding: 2.5rem;
    max-width: 1600px;
    margin: 0 auto;
    min-height: 100vh;
    background: #f4f4f4; /* Carbon Gray 10 */
`;

const HeaderSection = styled.div`
    margin-bottom: 3rem;
`;

const Hero = styled.div`
    background: #ffffff;
    border-radius: 0; /* Carbon crisp edge */
    padding: 3rem;
    margin-bottom: 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #e0e0e0;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: #0f62fe; /* Carbon Blue 60 accent */
    }
`;

const HeroContent = styled.div`
    display: flex;
    align-items: center;
    gap: 2rem;
    position: relative;
    z-index: 1;
`;

const HeroIconWrapper = styled.div`
    width: 64px;
    height: 64px;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f62fe; /* Carbon Blue 60 */
    color: #ffffff;
    border: 1px solid #0043ce;
    position: relative;

    svg {
        position: relative;
        z-index: 1;
    }
`;

const HeroText = styled.div`
    h1 {
        font-size: 1.75rem;
        font-weight: 300; /* Carbon Light */
        color: #161616;
        letter-spacing: 0;
        margin: 0 0 0.5rem 0;
        font-family: inherit;
    }

    p {
        font-size: 1.125rem;
        color: ${props => props.theme.text.secondary};
        margin: 0;
        line-height: 1.5;
        max-width: 600px;
    }
`;

const HeroStats = styled.div`
    display: flex;
    gap: 2rem;
`;

const StatBadge = styled.div`
    background: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 0;
    text-align: left;
    border: 1px solid #e0e0e0;
    transition: background 0.2s ease;

    &:hover {
        background: #f4f4f4;
    }
`;

const StatValue = styled.div`
    font-size: 1.5rem;
    font-weight: 600;
    color: #0f62fe;
    line-height: 1;
    margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.theme.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const Controls = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
    gap: 2rem;
    background: #ffffff;
    padding: 0;
    border-radius: 0;
    border: none;
    box-shadow: none;
`;

const SearchBar = styled.div`
    flex: 1;
    max-width: 480px;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-bottom: 1px solid #8d8d8d; /* Carbon style bottom accent */
    border-radius: 0;
    padding: 0 1rem;
    height: 48px;
    transition: border 0.2s;

    &:focus-within {
        border-color: #0f62fe;
        box-shadow: inset 0 0 0 1px #0f62fe;
    }

    svg { color: #525252; }

    input {
        width: 100%;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        color: #161616;
        outline: none;

        &::placeholder { color: #8d8d8d; }
    }
`;

const CategoryTabs = styled.div`
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
        height: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: ${props => props.theme.border};
        border-radius: 4px;
    }
`;

const CategoryTab = styled.button`
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0 1rem;
    height: 48px;
    background: ${props => props.$active ? '#ffffff' : '#f4f4f4'};
    color: ${props => props.$active ? '#0f62fe' : '#525252'};
    border: 1px solid #e0e0e0;
    border-bottom: 2px solid ${props => props.$active ? '#0f62fe' : 'transparent'};
    border-radius: 0;
    font-weight: ${props => props.$active ? '600' : '400'};
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: ${props => props.$active ? '#ffffff' : '#e5e5e5'};
    }
`;

const CategoryIconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 0;
    background: transparent;
    color: ${props => props.$active ? '#0f62fe' : props.$color};
    transition: all 0.2s;

    svg {
        width: 16px;
        height: 16px;
    }
`;

const IntegrationGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 2rem;
`;

const IntegrationCard = styled.div`
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 0;
    padding: 24px;
    position: relative;
    transition: border 0.2s;
    animation: ${fadeIn} 0.4s ease-out;
    animation-delay: ${props => props.$delay}s;
    animation-fill-mode: backwards;
    display: flex;
    flex-direction: column;
    height: 100%;

    &:hover {
        border-color: #0f62fe;
    }
`;

const PopularBadge = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    background: #0f62fe;
    color: white;
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 0;
`;

const ComingSoonBadge = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    background: #e0e0e0;
    color: #161616;
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 0;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid ${props => props.theme.border};
`;

const IntegrationLogo = styled.div`
    width: 48px;
    height: 48px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    flex-shrink: 0;
`;

const CardTitleArea = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const IntegrationName = styled.h3`
    font-size: 1.125rem;
    font-weight: 600;
    color: #161616;
    margin: 0;
`;

const CategoryLabel = styled.div`
    font-size: 0.625rem;
    color: #525252;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    background: #f4f4f4;
    padding: 2px 8px;
    border-radius: 0;
    align-self: flex-start;
    border: 1px solid #e0e0e0;
`;

const StatusBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 4px 12px;
    border-radius: 0;
    font-size: 0.75rem;
    font-weight: 400;
    margin-top: 0.5rem;
    width: fit-content;
    
    ${props => props.$status === 'connected' && `
        background: #defbe6;
        color: #198038;
        border: 1px solid #8aef9a;
    `}
    
    ${props => props.$status === 'error' && `
        background: #fff1f1;
        color: #da1e28;
        border: 1px solid #ffb3b8;
    `}
    
    ${props => props.$status === 'pending' && `
        background: #fcf4d6;
        color: #8a3800;
        border: 1px solid #ffcf00;
    `}
`;

const IntegrationDescription = styled.p`
    font-size: 0.95rem;
    color: ${props => props.theme.text.secondary};
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
    flex-grow: 1;
`;

const FeatureList = styled.div`
    background: #f4f4f4;
    border-radius: 0;
    padding: 16px;
    margin-bottom: 24px;
    border: 1px solid #e0e0e0;
`;

const Feature = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: ${props => props.theme.text.secondary};
    margin-bottom: 0.5rem;

    &:last-child { margin-bottom: 0; }

    svg {
        color: #10b981;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
    }
`;

const CardActions = styled.div`
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    margin-top: auto;
`;

const PrimaryButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1rem;
    height: 48px;
    background: #0f62fe;
    color: white;
    border: none;
    border-radius: 0;
    font-weight: 400;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #0043ce;
    }
`;

const SecondaryButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1rem;
    height: 48px;
    background: #ffffff;
    color: #161616;
    border: 1px solid #161616;
    border-radius: 0;
    font-weight: 400;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #393939;
        color: white;
    }

    &:disabled {
        border-color: #c6c6c6;
        color: #c6c6c6;
        cursor: not-allowed;
    }

    .spin { animation: ${spin} 1s linear infinite; }
`;

const DangerButton = styled(SecondaryButton)`
    color: #da1e28;
    border-color: #da1e28;
    background: #ffffff;

    &:hover {
        background: #da1e28;
        color: white;
    }
`;

const DisabledButton = styled(SecondaryButton)`
    background: ${props => props.theme.bg.tertiary};
    color: ${props => props.theme.text.tertiary};
    border-color: ${props => props.theme.border};
    cursor: not-allowed;

    &:hover {
        background: ${props => props.theme.bg.tertiary};
        transform: none;
    }
`;

const DocLink = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 0;
    color: #525252;
    transition: all 0.2s;

    &:hover {
        color: #0f62fe;
        border-color: #0f62fe;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: ${props => props.theme.text.tertiary};

    p {
        font-size: 1.125rem;
        color: ${props => props.theme.text.secondary};
        margin: 1rem 0 0.5rem 0;
        font-weight: 500;
    }

    small {
        color: ${props => props.theme.text.tertiary};
    }
`;

// Modal Components
const Modal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(22, 22, 22, 0.7);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
    background: #ffffff;
    border-radius: 0;
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    border: 1px solid #e0e0e0;
`;

const ModalHeader = styled.div`
    padding: 2rem;
    border-bottom: 1px solid ${props => props.theme.border};
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    > div {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }
`;

const ModalLogo = styled(IntegrationLogo)`
    width: 56px;
    height: 56px;
    font-size: 2rem;
    border-radius: 0;
`;

const ModalTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 600;
    color: #161616;
    margin: 0 0 0.25rem 0;
`;

const ModalSubtitle = styled.p`
    font-size: 0.875rem;
    color: ${props => props.theme.text.secondary};
    margin: 0;
    max-width: 350px;
    line-height: 1.5;
`;

const CloseButton = styled.button`
    background: transparent;
    border: none;
    color: ${props => props.theme.text.tertiary};
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background: ${props => props.theme.bg.hover};
        color: ${props => props.theme.text.secondary};
    }
`;

const ModalBody = styled.div`
    padding: 2rem;
`;

const SetupInstructions = styled.div`
    background: #f4f4f4;
    border: 1px solid #e0e0e0;
    border-radius: 0;
    padding: 1.5rem;
    margin-bottom: 2rem;

    strong {
        display: block;
        color: ${props => props.theme.text.primary};
        margin-bottom: 1rem;
        font-size: 0.95rem;
    }

    ol {
        margin: 0;
        padding-left: 1.25rem;
        color: ${props => props.theme.text.secondary};
        font-size: 0.95rem;
        line-height: 1.6;

        li {
            margin-bottom: 0.5rem;
            &:last-child { margin-bottom: 0; }
        }
    }
`;

const FormGroup = styled.div`
    margin-bottom: 1.5rem;
    &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.theme.text.primary};
    margin-bottom: 0.5rem;
`;

const Required = styled.span`
    color: #ef4444;
    margin-left: 0.25rem;
`;

const Input = styled.input`
    width: 100%;
    padding: 0 1rem;
    height: 48px;
    border: 1px solid #e0e0e0;
    border-bottom: 1px solid #8d8d8d;
    border-radius: 0;
    font-size: 0.875rem;
    color: #161616;
    background: #ffffff;
    transition: border 0.2s;

    &:focus {
        outline: none;
        border-color: #0f62fe;
        box-shadow: inset 0 0 0 1px #0f62fe;
    }
    
    &::placeholder {
        color: #8d8d8d;
    }
`;

const OAuthPlaceholder = styled.div`
    text-align: center;
    padding: 2rem 0;
    color: ${props => props.theme.text.secondary};

    svg {
        color: ${props => props.theme.text.tertiary};
        margin-bottom: 1rem;
    }

    h3 {
        color: ${props => props.theme.text.primary};
        font-size: 1.125rem;
        margin-bottom: 0.5rem;
    }
`;

const ModalFooter = styled.div`
    padding: 1.5rem 2rem;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    background: #f4f4f4;
`;

const ActivityLog = styled.div`
    background: #ffffff;
    border-radius: 0;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e0e0e0;
`;

const LogHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${props => props.theme.text.tertiary};
    margin-bottom: 0.75rem;
    
    svg { color: #f59e0b; }
`;

const LogList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const LogItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.8125rem;
    padding: 0.25rem;
    border-radius: 4px;
    animation: ${logPulse} 2s ease-out;
`;

const LogDot = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 0.375rem;
    flex-shrink: 0;
    
    background: ${props => {
        switch(props.$status) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#6366f1';
        }
    }};
`;

const LogText = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    
    strong {
        color: ${props => props.theme.text.primary};
        text-transform: capitalize;
    }
    
    span {
        color: ${props => props.theme.text.secondary};
        font-size: 0.75rem;
    }
`;

const LogTime = styled.div`
    font-size: 0.7rem;
    color: ${props => props.theme.text.tertiary};
    white-space: nowrap;
`;

const LogEmpty = styled.div`
    font-size: 0.75rem;
    color: ${props => props.theme.text.tertiary};
    font-style: italic;
    text-align: center;
`;

const Section = styled.div`
    margin-bottom: 4rem;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid ${props => props.theme.border};
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 600;
    color: #161616;
    margin: 0;
`;

const SectionMeta = styled.span`
    font-size: 0.875rem;
    color: ${props => props.theme.text.tertiary};
    font-weight: 500;
`;

const HealthBar = styled.div`
    display: flex;
    height: 8px;
    border-radius: 0;
    overflow: hidden;
    gap: 4px;
    margin-bottom: 2rem;
    background: #e0e0e0;
`;

const HealthSegment = styled.div`
    flex: 1;
    border-radius: 100px;
    background: ${props => {
        switch(props.$status) {
            case 'connected': return '#10b981';
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
    gap: 0.375rem;
    font-size: 0.625rem;
    color: #525252;
    margin-bottom: 1rem;
    padding: 2px 8px;
    background: #f4f4f4;
    border-radius: 0;
    border: 1px solid #e0e0e0;

    svg { flex-shrink: 0; }
`;

export default IntegrationsPage;
