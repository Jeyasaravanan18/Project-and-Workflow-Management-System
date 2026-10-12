import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { MessageSquare, Send, Loader, Bot, User, FileText, Trash2, Plus, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import GetStartedWidget from '../components/GetStartedWidget';

const AIAssistant = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            setLoadingConversations(true);
            const res = await api.get('/ai-assistant/conversations');
            setConversations(res.data.conversations || []);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoadingConversations(false);
        }
    };

    const loadConversation = async (conversationId) => {
        try {
            const res = await api.get(`/ai-assistant/conversations/${conversationId}`);
            setCurrentConversation(res.data.conversation);
            setMessages(res.data.conversation.messages || []);
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const startNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
        setInputMessage('');
    };

    const deleteConversation = async (conversationId, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this conversation?')) return;
        try {
            await api.delete(`/ai-assistant/conversations/${conversationId}`);
            setConversations(prev => prev.filter(c => c._id !== conversationId));
            if (currentConversation?._id === conversationId) startNewConversation();
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || loading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');

        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: '',
            loading: true,
            timestamp: new Date()
        }]);

        try {
            setLoading(true);
            const res = await api.post('/ai-assistant/chat', {
                message: userMessage,
                conversationId: currentConversation?._id
            });

            setMessages(prev => prev.filter(m => !m.loading));
            setMessages(prev => [...prev, res.data.message]);

            if (!currentConversation && res.data.conversationId) {
                setCurrentConversation({ _id: res.data.conversationId });
                loadConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(m => !m.loading));
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                error: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const primaryColor = theme?.primary || '#1E40AF';

    return (
        <Container>
            {/* Left: Conversation List */}
            <ConvPanel>
                <ConvHeader>
                    <ConvTitle>Conversations</ConvTitle>
                    <NewChatBtn onClick={startNewConversation} title="New chat">
                        <Plus size={18} />
                    </NewChatBtn>
                </ConvHeader>

                <ConvList>
                    {loadingConversations ? (
                        <MutedText>Loading...</MutedText>
                    ) : conversations.length === 0 ? (
                        <MutedText style={{ padding: '40px 20px' }}>No conversations yet</MutedText>
                    ) : (
                        conversations.map(conv => (
                            <ConvItem
                                key={conv._id}
                                $active={currentConversation?._id === conv._id}
                                onClick={() => loadConversation(conv._id)}
                            >
                                <ConvName>{conv.title}</ConvName>
                                <ConvMeta>{conv.messageCount} messages</ConvMeta>
                                <DelBtn onClick={(e) => deleteConversation(conv._id, e)}>
                                    <Trash2 size={14} />
                                </DelBtn>
                            </ConvItem>
                        ))
                    )}
                </ConvList>
            </ConvPanel>

            {/* Right: Chat Area */}
            <ChatPanel>
                <ChatHeader>
                    <BotAvatarBadge>
                        <Bot size={22} color={primaryColor} />
                    </BotAvatarBadge>
                    <HeaderText>
                        <h2>IT Support AI Assistant</h2>
                        <p>Ask me anything about workflows, troubleshooting, or best practices</p>
                    </HeaderText>
                </ChatHeader>

                <Messages>
                    {messages.length === 0 ? (
                        <Welcome>
                            <WidgetWrapper>
                                <GetStartedWidget
                                    title="Get started with AI Assistant"
                                    actionLabel="Ask Question"
                                    onActionClick={() => setInputMessage('How do I create an automated workflow?')}
                                    steps={[
                                        {
                                            number: 1,
                                            title: 'Ask natural language queries',
                                            description: 'Analyze project progress, pinpoint bottlenecks, or resolve permissions quickly with real-time system context.',
                                            linkText: 'Sample queries guide',
                                            linkUrl: '#',
                                        },
                                        {
                                            number: 2,
                                            title: 'Execute workflows & actions',
                                            description: 'Request automated task reassignments, bug triage, and instant project scaffolder generation directly.',
                                            linkText: 'Browse workflow automations',
                                            linkUrl: '/admin/automations',
                                        }
                                    ]}
                                />
                            </WidgetWrapper>

                            <WelcomeTitle>Popular Inquiries</WelcomeTitle>
                            <WelcomeSub>Click any prompt below or type your question below</WelcomeSub>
                            <SugGrid>
                                {[
                                    ['How do I create a new project with templates?', 'Creating projects'],
                                    ['What should I do if I get a permission denied error?', 'Troubleshooting errors'],
                                    ['How do I assign tasks and configure sprint automations?', 'Task & Sprint management'],
                                    ['How can I understand workload analytics & SLAs?', 'Analytics & SLAs'],
                                ].map(([prompt, label]) => (
                                    <Sug key={label} onClick={() => setInputMessage(prompt)}>
                                        <Sparkles size={16} color={primaryColor} />
                                        <span>{label}</span>
                                    </Sug>
                                ))}
                            </SugGrid>
                        </Welcome>
                    ) : (
                        messages.map((msg, idx) => (
                            <Msg key={idx} $isUser={msg.role === 'user'}>
                                <MsgAvatar $isUser={msg.role === 'user'}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </MsgAvatar>
                                <MsgBody>
                                    {msg.loading ? (
                                        <ThinkingBubble>
                                            <Loader className="spin" size={15} color={primaryColor} />
                                            <span>Thinking...</span>
                                        </ThinkingBubble>
                                    ) : (
                                        <>
                                            <Bubble $isUser={msg.role === 'user'} $error={msg.error}>
                                                {msg.role === 'user' || msg.error ? (
                                                    msg.content
                                                ) : (
                                                    <MarkdownContent>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </MarkdownContent>
                                                )}
                                            </Bubble>
                                            {msg.citations?.length > 0 && (
                                                <CitationBox>
                                                    <CitHeader><FileText size={12} /> Sources</CitHeader>
                                                    {msg.citations.map((c, i) => (
                                                        <CitItem key={i}>
                                                            <CitTag>{c.type}</CitTag>
                                                            <CitName>{c.title}</CitName>
                                                            {c.excerpt && <CitExcerpt>{c.excerpt}</CitExcerpt>}
                                                        </CitItem>
                                                    ))}
                                                </CitationBox>
                                            )}
                                            {msg.metadata?.responseTime && (
                                                <MsgMeta>
                                                    {(msg.metadata.responseTime / 1000).toFixed(2)}s
                                                    {msg.metadata.documentsRetrieved > 0 && ` · ${msg.metadata.documentsRetrieved} docs`}
                                                </MsgMeta>
                                            )}
                                        </>
                                    )}
                                </MsgBody>
                            </Msg>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </Messages>

                <InputRow onSubmit={sendMessage}>
                    <ChatInput
                        type="text"
                        placeholder="Ask me anything about your projects or workflows..."
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        disabled={loading}
                    />
                    <SendBtn type="submit" disabled={loading || !inputMessage.trim()}>
                        {loading ? <Loader className="spin" size={18} /> : <Send size={18} />}
                    </SendBtn>
                </InputRow>
            </ChatPanel>
        </Container>
    );
};// ─── Animations ─────────────────────────────────────────────────────────────
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const slideUp = keyframes`from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); }`;

// ─── Layout ──────────────────────────────────────────────────────────────────
const Container = styled.div`
    display: flex;
    margin: -28px -32px;
    height: calc(100vh - 65px);
    overflow: hidden;
    background: ${p => p.theme.bg?.primary || '#f8fafc'};
`;

// ─── Conversation Panel ───────────────────────────────────────────────────────
const ConvPanel = styled.div`
    width: 290px;
    min-width: 240px;
    background: ${p => p.theme.bg?.card || '#ffffff'};
    border-right: 1px solid ${p => p.theme.border || '#e5e7eb'};
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
`;

const ConvHeader = styled.div`
    padding: 18px 20px;
    border-bottom: 1px solid ${p => p.theme.border || '#f1f5f9'};
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
`;

const ConvTitle = styled.h3`
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: ${p => p.theme.text?.primary || '#111827'};
    letter-spacing: -0.01em;
`;

const NewChatBtn = styled.button`
    width: 34px; height: 34px;
    border-radius: 9999px;
    border: none;
    background: ${p => p.theme.primary || '#1E40AF'};
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: ${p => p.theme.primaryHover || '#1E3A8A'}; transform: scale(1.05); }
`;

const ConvList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${p => p.theme.border || '#e2e8f0'}; border-radius: 4px; }
`;

const ConvItem = styled.div`
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 4px;
    cursor: pointer;
    background: ${p => p.$active ? (p.theme.primaryLight || '#EFF6FF') : 'transparent'};
    border: 1px solid ${p => p.$active ? (p.theme.primary || '#BFDBFE') : 'transparent'};
    position: relative;
    transition: all 0.15s;
    &:hover { background: ${p => p.$active ? (p.theme.primaryLight || '#EFF6FF') : (p.theme.bg?.hover || '#f8fafc')}; }
`;

const ConvName = styled.div`
    font-size: 0.85rem;
    font-weight: 600;
    color: ${p => p.theme.text?.primary || '#111827'};
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 24px;
`;

const ConvMeta = styled.div`
    font-size: 0.72rem;
    color: ${p => p.theme.text?.muted || '#6b7280'};
`;

const DelBtn = styled.button`
    position: absolute; top: 10px; right: 10px;
    width: 22px; height: 22px;
    border-radius: 6px; border: none;
    background: transparent;
    color: ${p => p.theme.text?.muted || '#9ca3af'};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s;
    ${ConvItem}:hover & { opacity: 1; }
    &:hover { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
`;

const MutedText = styled.div`
    text-align: center;
    padding: 24px;
    color: ${p => p.theme.text?.muted || '#9ca3af'};
    font-size: 0.85rem;
`;

// ─── Chat Panel ───────────────────────────────────────────────────────────────
const ChatPanel = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: ${p => p.theme.bg?.primary || '#f8fafc'};
    min-width: 0;
    overflow: hidden;
`;

const ChatHeader = styled.div`
    padding: 16px 28px;
    border-bottom: 1px solid ${p => p.theme.border || '#e5e7eb'};
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    background: ${p => p.theme.bg?.card || '#ffffff'};
`;

const BotAvatarBadge = styled.div`
    width: 40px; height: 40px;
    border-radius: 12px;
    background: ${p => p.theme.primaryLight || '#EFF6FF'};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
`;

const HeaderText = styled.div`
    h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: ${p => p.theme.text?.primary || '#111827'};
        letter-spacing: -0.01em;
    }
    p {
        margin: 2px 0 0;
        font-size: 0.8rem;
        color: ${p => p.theme.text?.muted || '#6b7280'};
    }
`;

const Messages = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { background: ${p => p.theme.border || '#e2e8f0'}; border-radius: 4px; }
`;

// ─── Welcome Screen ───────────────────────────────────────────────────────────
const Welcome = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 0 24px;
    min-height: 100%;
    text-align: center;
    animation: ${slideUp} 0.4s ease;
`;

const WidgetWrapper = styled.div`
    width: 100%;
    max-width: 820px;
    margin-bottom: 24px;
    text-align: left;
`;

const WelcomeTitle = styled.h2`
    margin: 8px 0 6px;
    font-size: 1.15rem;
    font-weight: 700;
    color: ${p => p.theme.text?.primary || '#111827'};
    letter-spacing: -0.01em;
`;

const WelcomeSub = styled.p`
    margin: 0 0 16px;
    color: ${p => p.theme.text?.muted || '#6b7280'};
    font-size: 0.85rem;
`;

const SugGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 820px;
    width: 100%;
`;

const Sug = styled.button`
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid ${p => p.theme.border || '#e5e7eb'};
    background: ${p => p.theme.bg?.card || '#ffffff'};
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    span {
        font-size: 0.85rem;
        font-weight: 500;
        color: ${p => p.theme.text?.primary || '#111827'};
    }
    &:hover {
        border-color: ${p => p.theme.primary || '#1E40AF'};
        background: ${p => p.theme.primaryLight || '#EFF6FF'};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(30,64,175,0.08);
    }
`;

// ─── Messages ─────────────────────────────────────────────────────────────────
const Msg = styled.div`
    display: flex;
    gap: 12px;
    align-items: flex-start;
    flex-direction: ${p => p.$isUser ? 'row-reverse' : 'row'};
    animation: ${slideUp} 0.25s ease;
`;

const MsgAvatar = styled.div`
    width: 32px; height: 32px;
    border-radius: 50%;
    background: ${p => p.$isUser ? (p.theme.primary || '#1E40AF') : (p.theme.primaryLight || '#EFF6FF')};
    color: ${p => p.$isUser ? '#ffffff' : (p.theme.primary || '#1E40AF')};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
`;

const MsgBody = styled.div`
    flex: 1;
    max-width: 72%;
    display: flex;
    flex-direction: column;
`;

const Bubble = styled.div`
    padding: 12px 18px;
    border-radius: 16px;
    ${p => p.$isUser
        ? `background: ${p.theme.primary || '#1E40AF'}; color: #ffffff; border-bottom-right-radius: 4px; font-weight: 450;`
        : `background: ${p.theme.bg?.card || '#ffffff'};
           color: ${p.$error ? '#ef4444' : (p.theme.text?.primary || '#1f2937')};
           border: 1px solid ${p.theme.border || '#e5e7eb'};
           box-shadow: 0 1px 3px rgba(0,0,0,0.04);
           border-bottom-left-radius: 4px;`}
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: ${p => p.$isUser ? 'pre-wrap' : 'normal'};
`;

const MarkdownContent = styled.div`
    font-size: 0.9rem;
    line-height: 1.65;
    color: ${p => p.theme.text?.primary || '#1f2937'};

    h1, h2, h3, h4, h5, h6 {
        color: ${p => p.theme.text?.primary || '#111827'};
        font-weight: 700;
        margin-top: 14px;
        margin-bottom: 8px;
        line-height: 1.35;
        &:first-child {
            margin-top: 0;
        }
    }
    h1 { font-size: 1.18rem; }
    h2 { font-size: 1.05rem; }
    h3 { font-size: 0.95rem; }
    h4 { font-size: 0.9rem; }

    p {
        margin: 0 0 10px 0;
        &:last-child {
            margin-bottom: 0;
        }
    }

    ul, ol {
        margin: 0 0 10px 0;
        padding-left: 22px;
        &:last-child {
            margin-bottom: 0;
        }
    }
    ol {
        list-style-type: decimal;
    }
    ul {
        list-style-type: disc;
    }
    li {
        margin-bottom: 4px;
        &:last-child {
            margin-bottom: 0;
        }
        & > p {
            margin-bottom: 4px;
        }
    }

    strong {
        font-weight: 650;
        color: ${p => p.theme.text?.primary || '#111827'};
    }
    em {
        font-style: italic;
    }

    code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.85em;
        background: ${p => p.theme.bg?.secondary || '#f1f5f9'};
        color: ${p => p.theme.text?.primary || '#0f172a'};
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid ${p => p.theme.border || '#e2e8f0'};
    }
    pre {
        background: #0f172a;
        color: #f8fafc;
        padding: 12px 14px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 10px 0;
        code {
            background: transparent;
            color: inherit;
            padding: 0;
            border: none;
            font-size: 0.82rem;
        }
    }

    blockquote {
        margin: 8px 0;
        padding: 6px 14px;
        border-left: 3px solid ${p => p.theme.primary || '#1E40AF'};
        background: ${p => p.theme.bg?.secondary || '#f8fafc'};
        color: ${p => p.theme.text?.secondary || '#4b5563'};
        font-style: italic;
        border-radius: 0 4px 4px 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 0.82rem;
    }
    th, td {
        border: 1px solid ${p => p.theme.border || '#e5e7eb'};
        padding: 8px 10px;
        text-align: left;
    }
    th {
        background: ${p => p.theme.bg?.secondary || '#f9fafb'};
        font-weight: 600;
        color: ${p => p.theme.text?.primary || '#111827'};
    }

    a {
        color: ${p => p.theme.primary || '#1E40AF'};
        text-decoration: underline;
        &:hover {
            color: ${p => p.theme.primaryHover || '#1E3A8A'};
        }
    }

    hr {
        border: none;
        border-top: 1px solid ${p => p.theme.border || '#e5e7eb'};
        margin: 12px 0;
    }
`;

const ThinkingBubble = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    background: ${p => p.theme.bg?.card || '#ffffff'};
    border: 1px solid ${p => p.theme.border || '#e5e7eb'};
    color: ${p => p.theme.text?.muted || '#6b7280'};
    font-size: 0.85rem;
    .spin { animation: ${spin} 1s linear infinite; }
`;

// ─── Citations ────────────────────────────────────────────────────────────────
const CitationBox = styled.div`
    margin-top: 10px;
    padding: 12px 14px;
    background: ${p => p.theme.primaryLight || '#EFF6FF'};
    border-left: 3px solid ${p => p.theme.primary || '#1E40AF'};
    border-radius: 8px;
`;

const CitHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    font-weight: 700;
    color: ${p => p.theme.primary || '#1E40AF'};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
`;

const CitItem = styled.div`
    margin-bottom: 6px;
    &:last-child { margin-bottom: 0; }
`;

const CitTag = styled.span`
    display: inline-block;
    padding: 1px 6px;
    background: ${p => p.theme.primaryLight || '#DBEAFE'};
    color: ${p => p.theme.primary || '#1E40AF'};
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-right: 6px;
`;

const CitName = styled.div`
    display: inline;
    font-size: 0.8rem;
    font-weight: 600;
    color: ${p => p.theme.text?.primary || '#1E40AF'};
`;

const CitExcerpt = styled.div`
    margin-top: 3px;
    font-size: 0.72rem;
    color: ${p => p.theme.text?.secondary || '#1D4ED8'};
    opacity: 0.9;
`;

const MsgMeta = styled.div`
    margin-top: 5px;
    font-size: 0.7rem;
    color: ${p => p.theme.text?.muted || '#9ca3af'};
`;

// ─── Input Bar ────────────────────────────────────────────────────────────────
const InputRow = styled.form`
    padding: 16px 28px;
    border-top: 1px solid ${p => p.theme.border || '#e5e7eb'};
    display: flex;
    gap: 12px;
    background: ${p => p.theme.bg?.card || '#ffffff'};
    flex-shrink: 0;
`;

const ChatInput = styled.input`
    flex: 1;
    padding: 12px 20px;
    border-radius: 9999px;
    border: 1px solid ${p => p.theme.border || '#e5e7eb'};
    background: ${p => p.theme.bg?.secondary || '#f8fafc'};
    color: ${p => p.theme.text?.primary || '#111827'};
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s;
    &::placeholder { color: ${p => p.theme.text?.muted || '#9ca3af'}; }
    &:focus {
        border-color: ${p => p.theme.primary || '#1E40AF'};
        background: ${p => p.theme.bg?.card || '#ffffff'};
        box-shadow: 0 0 0 3px rgba(30,64,175,0.12);
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SendBtn = styled.button`
    width: 44px; height: 44px;
    border-radius: 9999px;
    border: none;
    background: ${p => p.theme.primary || '#1E40AF'};
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover:not(:disabled) {
        background: ${p => p.theme.primaryHover || '#1E3A8A'};
        transform: translateY(-1px);
    }
    &:disabled {
        background: ${p => p.theme.border || '#f1f5f9'};
        color: ${p => p.theme.text?.muted || '#9ca3af'};
        cursor: not-allowed;
    }
    .spin { animation: ${spin} 1s linear infinite; }
`;
export default AIAssistant;

