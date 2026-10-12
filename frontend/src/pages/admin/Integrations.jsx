import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Key, Webhook, Trash2, Copy, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const Integrations = () => {
    const [activeTab, setActiveTab] = useState('api-keys');
    const [keys, setKeys] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState(null);
    const [keyName, setKeyName] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'api-keys') {
                const res = await api.get('/keys');
                setKeys(res.data.data);
            } else {
                const res = await api.get('/webhooks');
                setWebhooks(res.data.data);
            }
        } catch (error) {
            console.error('Fetch failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        try {
            const res = await api.post('/keys', { name: keyName });
            setNewKey(res.data.data);
            setKeys([res.data.data, ...keys]);
            setKeyName('');
        } catch (error) {
            console.error('Create key failed', error);
        }
    };

    const handleDeleteKey = async (id) => {
        if (!window.confirm('Revoke this API Key? It will stop working immediately.')) return;
        try {
            await api.delete(`/keys/${id}`);
            setKeys(keys.filter(k => k._id !== id));
        } catch (error) {
            console.error('Delete key failed', error);
        }
    };

    const handleCreateWebhook = async () => {
        try {
            const res = await api.post('/webhooks', {
                url: webhookUrl,
                events: ['task.created', 'task.completed', 'comment.created']
            });
            setWebhooks([res.data.data, ...webhooks]);
            setWebhookUrl('');
        } catch (error) {
            console.error('Create webhook failed', error);
        }
    };

    const handleDeleteWebhook = async (id) => {
        if (!window.confirm('Delete this Webhook?')) return;
        try {
            await api.delete(`/webhooks/${id}`);
            setWebhooks(webhooks.filter(w => w._id !== id));
        } catch (error) {
            console.error('Delete webhook failed', error);
        }
    };

    const CopyButton = ({ text }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = () => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };
        return (
            <IconBtn onClick={handleCopy} title="Copy">
                {copied ? <Check size={14} color="#008060" /> : <Copy size={14} />}
            </IconBtn>
        );
    };

    return (
        <Container>
            <PageHeader
                title="API & Webhooks"
                description="Manage developer API credentials and outgoing webhook subscriptions."
            />

            <Tabs>
                <Tab
                    $active={activeTab === 'api-keys'}
                    onClick={() => setActiveTab('api-keys')}
                >
                    <Key size={15} /> API Keys
                </Tab>
                <Tab
                    $active={activeTab === 'webhooks'}
                    onClick={() => setActiveTab('webhooks')}
                >
                    <Webhook size={15} /> Webhooks
                </Tab>
            </Tabs>

            <Content>
                {activeTab === 'api-keys' && (
                    <>
                        <CreateSection>
                            <Input
                                placeholder="Key Name (e.g. CI/CD Deployment Pipeline)"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                            />
                            <Button onClick={handleCreateKey} disabled={!keyName}>Create API Key</Button>
                        </CreateSection>

                        {newKey && newKey.key && (
                            <NewKeyAlert>
                                <AlertCircle size={20} color="#d97706" />
                                <div>
                                    <h4>Save this secret key now!</h4>
                                    <p>This is the only time the secret API key will be displayed in full.</p>
                                    <KeyDisplay>
                                        <code>{newKey.key}</code>
                                        <CopyButton text={newKey.key} />
                                    </KeyDisplay>
                                </div>
                            </NewKeyAlert>
                        )}

                        <List>
                            {loading ? <LoadingText>Loading API keys...</LoadingText> : keys.map(key => (
                                <ListItem key={key._id}>
                                    <Info>
                                        <Name>{key.name}</Name>
                                        <Meta>Prefix: {key.prefix} • Created: {new Date(key.createdAt).toLocaleDateString()}</Meta>
                                    </Info>
                                    <Actions>
                                        <Status $active={key.isActive}>{key.isActive ? 'Active' : 'Revoked'}</Status>
                                        <IconBtn $danger onClick={() => handleDeleteKey(key._id)}>
                                            <Trash2 size={16} />
                                        </IconBtn>
                                    </Actions>
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}

                {activeTab === 'webhooks' && (
                    <>
                        <CreateSection>
                            <Input
                                placeholder="Webhook Target URL (https://...)"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                            />
                            <Button onClick={handleCreateWebhook} disabled={!webhookUrl}>Add Webhook</Button>
                        </CreateSection>

                        <List>
                            {loading ? <LoadingText>Loading webhooks...</LoadingText> : webhooks.map(hook => (
                                <ListItem key={hook._id}>
                                    <Info>
                                        <Name>{hook.url}</Name>
                                        <Meta>Events: {hook.events.join(', ')} • Secret: {hook.secret.substring(0, 8)}...</Meta>
                                    </Info>
                                    <Actions>
                                        <Status $active={hook.isActive}>{hook.isActive ? 'Active' : 'Inactive'}</Status>
                                        <IconBtn $danger onClick={() => handleDeleteWebhook(hook._id)}>
                                            <Trash2 size={16} />
                                        </IconBtn>
                                    </Actions>
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
            </Content>
        </Container>
    );
};

const Container = styled.div`
    padding: 32px;
    background: #f8fafc;
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Tabs = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
`;

const Tab = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    background: ${props => props.$active ? '#008060' : '#ffffff'};
    color: ${props => props.$active ? '#ffffff' : '#374151'};
    border: 1px solid ${props => props.$active ? '#008060' : '#e5e7eb'};
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: ${props => props.$active ? '#008060' : '#f8fafc'};
        border-color: ${props => props.$active ? '#008060' : '#d1d5db'};
    }
`;

const Content = styled.div`
    max-width: 860px;
`;

const CreateSection = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

const Input = styled.input`
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 0.875rem;
    background: #ffffff;
    color: #111827;
    transition: all 0.15s ease;

    &:focus {
        outline: none;
        border-color: #008060;
        box-shadow: 0 0 0 3px rgba(0, 128, 96, 0.12);
    }
`;

const Button = styled.button`
    padding: 10px 20px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    
    &:hover:not(:disabled) {
        background: #008060;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    transition: all 0.15s ease;

    &:hover {
        border-color: #cbd5e1;
    }
`;

const Info = styled.div``;

const Name = styled.div`
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
    font-size: 0.9rem;
`;

const Meta = styled.div`
    font-size: 0.78rem;
    color: #64748b;
`;

const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const Status = styled.span`
    font-size: 0.72rem;
    font-weight: 600;
    color: ${props => props.$active ? '#008060' : '#dc2626'};
    background: ${props => props.$active ? '#ecfdf5' : '#fef2f2'};
    border: 1px solid ${props => props.$active ? '#a7f3d0' : '#fecaca'};
    padding: 3px 10px;
    border-radius: 9999px;
`;

const IconBtn = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: ${props => props.$danger ? '#dc2626' : '#64748b'};
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;

    &:hover {
        background: ${props => props.$danger ? '#fef2f2' : '#f1f5f9'};
    }
`;

const NewKeyAlert = styled.div`
    background: #fffbeb;
    border: 1px solid #fde68a;
    padding: 16px 20px;
    border-radius: 14px;
    margin-bottom: 20px;
    display: flex;
    gap: 14px;

    h4 { margin: 0 0 4px 0; color: #92400e; font-size: 0.9rem; }
    p { margin: 0 0 10px 0; color: #b45309; font-size: 0.8125rem; }
`;

const KeyDisplay = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #fde68a;
    
    code {
        font-family: monospace;
        color: #111827;
        font-weight: 600;
        font-size: 0.84rem;
    }
`;

const LoadingText = styled.div`
    padding: 24px;
    color: #64748b;
    text-align: center;
    font-size: 0.875rem;
`;

export default Integrations;
