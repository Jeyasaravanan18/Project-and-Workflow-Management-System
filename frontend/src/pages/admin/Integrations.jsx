import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Key, Webhook, Trash2, Copy, Check, Plus, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const Integrations = () => {
    const [activeTab, setActiveTab] = useState('api-keys');
    const [keys, setKeys] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState(null); // To show the raw key after creation
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
                events: ['task.created', 'task.completed', 'comment.created'] // Default all for now
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
                {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
            </IconBtn>
        );
    };

    return (
        <Container>
            <PageHeader
                title="Integrations"
                description="Manage API keys and Webhooks for external connections."
            />

            <Tabs>
                <Tab
                    $active={activeTab === 'api-keys'}
                    onClick={() => setActiveTab('api-keys')}
                >
                    <Key size={16} /> API Keys
                </Tab>
                <Tab
                    $active={activeTab === 'webhooks'}
                    onClick={() => setActiveTab('webhooks')}
                >
                    <Webhook size={16} /> Webhooks
                </Tab>
            </Tabs>

            <Content>
                {activeTab === 'api-keys' && (
                    <>
                        <CreateSection>
                            <Input
                                placeholder="Key Name (e.g. CI/CD Pipeline)"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                            />
                            <Button onClick={handleCreateKey} disabled={!keyName}>Create API Key</Button>
                        </CreateSection>

                        {newKey && newKey.key && (
                            <NewKeyAlert>
                                <AlertCircle size={20} color="#f59e0b" />
                                <div>
                                    <h4>Save this key now!</h4>
                                    <p>This is the only time we'll show you the full API key.</p>
                                    <KeyDisplay>
                                        <code>{newKey.key}</code>
                                        <CopyButton text={newKey.key} />
                                    </KeyDisplay>
                                </div>
                            </NewKeyAlert>
                        )}

                        <List>
                            {loading ? <div>Loading...</div> : keys.map(key => (
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
                                placeholder="Webhook URL (https://...)"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                            />
                            <Button onClick={handleCreateWebhook} disabled={!webhookUrl}>Add Webhook</Button>
                        </CreateSection>

                        <List>
                            {loading ? <div>Loading...</div> : webhooks.map(hook => (
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
    padding: 24px;
`;

const Tabs = styled.div`
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e2e8f0;
`;

const Tab = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid ${props => props.$active ? '#0f172a' : 'transparent'};
    color: ${props => props.$active ? '#0f172a' : '#64748b'};
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        color: #0f172a;
    }
`;

const Content = styled.div`
    max-width: 800px;
`;

const CreateSection = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
`;

const Input = styled.input`
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;

    &:focus {
        outline: none;
        border-color: #64748b;
    }
`;

const Button = styled.button`
    padding: 10px 20px;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
`;

const Info = styled.div``;

const Name = styled.div`
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
`;

const Meta = styled.div`
    font-size: 13px;
    color: #64748b;
`;

const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const Status = styled.span`
    font-size: 12px;
    font-weight: 600;
    color: ${props => props.$active ? '#22c55e' : '#ef4444'};
    background: ${props => props.$active ? '#dcfce7' : '#fee2e2'};
    padding: 2px 8px;
    border-radius: 12px;
`;

const IconBtn = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: ${props => props.$danger ? '#ef4444' : '#64748b'};
    padding: 4px;
    border-radius: 4px;

    &:hover {
        background: ${props => props.$danger ? '#fee2e2' : '#f1f5f9'};
    }
`;

const NewKeyAlert = styled.div`
    background: #fffbeb;
    border: 1px solid #fcd34d;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    display: flex;
    gap: 16px;

    h4 { margin: 0 0 4px 0; color: #92400e; }
    p { margin: 0 0 12px 0; color: #b45309; font-size: 14px; }
`;

const KeyDisplay = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #fcd34d;
    
    code {
        font-family: monospace;
        color: #0f172a;
        font-weight: 600;
    }
`;

export default Integrations;
