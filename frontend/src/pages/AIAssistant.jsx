import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { MessageSquare, Send, Loader, Bot, User, FileText, Trash2, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AIAssistant = () => {
    const { user } = useAuth();
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
                    <Bot size={26} color="#3b82f6" />
                    <HeaderText>
                        <h2>IT Support AI Assistant</h2>
                        <p>Ask me anything about workflows, troubleshooting, or best practices</p>
                    </HeaderText>
                </ChatHeader>

                <Messages>
                    {messages.length === 0 ? (
                        <Welcome>
                            <Bot size={60} color="#3b82f6" />
                            <WelcomeTitle>Welcome to AI Assistant!</WelcomeTitle>
                            <WelcomeSub>I can help you with:</WelcomeSub>
                            <SugGrid>
                                {[
                                    ['How do I create a new project?', 'Creating projects'],
                                    ['What should I do if I get a permission denied error?', 'Troubleshooting errors'],
                                    ['How do I assign tasks effectively?', 'Task management'],
                                    ['How can I understand workload analytics?', 'Analytics insights'],
                                ].map(([prompt, label]) => (
                                    <Sug key={label} onClick={() => setInputMessage(prompt)}>
                                        <FileText size={18} color="#3b82f6" />
                                        <span>{label}</span>
                                    </Sug>
                                ))}
                            </SugGrid>
                        </Welcome>
                    ) : (
                        messages.map((msg, idx) => (
                            <Msg key={idx} $isUser={msg.role === 'user'}>
                                <MsgAvatar $isUser={msg.role === 'user'}>
                                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </MsgAvatar>
                                <MsgBody>
                                    {msg.loading ? (
                                        <ThinkingBubble>
                                            <Loader className="spin" size={15} />
                                            <span>Thinking...</span>
                                        </ThinkingBubble>
                                    ) : (
                                        <>
                                            <Bubble $isUser={msg.role === 'user'} $error={msg.error}>
                                                {msg.content}
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
                        placeholder="Ask me anything..."
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        disabled={loading}
                    />
                    <SendBtn type="submit" disabled={loading || !inputMessage.trim()}>
                        {loading ? <Loader className="spin" size={20} /> : <Send size={20} />}
                    </SendBtn>
                </InputRow>
            </ChatPanel>
        </Container>
    );
};

// ─── Animations ─────────────────────────────────────────────────────────────
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const slideUp = keyframes`from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); }`;

// ─── Layout ──────────────────────────────────────────────────────────────────
const Container = styled.div`
    display: flex;
    /* bleed out of MainContent's 24px padding on all 4 sides */
    margin: -24px;
    /* viewport - (24px top + 24px bottom padding from MainContent) */
    height: calc(100vh - 48px);
    overflow: hidden;
    background: ${p => p.theme.bg.primary};
`;

// ─── Conversation Panel ───────────────────────────────────────────────────────
const ConvPanel = styled.div`
    width: 280px;
    min-width: 220px;
    background: ${p => p.theme.bg.card};
    border-right: 1px solid ${p => p.theme.border};
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
`;

const ConvHeader = styled.div`
    padding: 20px 16px;
    border-bottom: 1px solid ${p => p.theme.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
`;

const ConvTitle = styled.h3`
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: ${p => p.theme.text.primary};
`;

const NewChatBtn = styled.button`
    width: 34px; height: 34px;
    border-radius: 8px;
    border: none;
    background: #3b82f6;
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #2563eb; transform: scale(1.05); }
`;

const ConvList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${p => p.theme.border}; border-radius: 4px; }
`;

const ConvItem = styled.div`
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 4px;
    cursor: pointer;
    background: ${p => p.$active
        ? (p.theme.mode === 'dark' ? 'rgba(59,130,246,0.18)' : '#eff6ff')
        : 'transparent'};
    border: 1px solid ${p => p.$active ? '#3b82f6' : 'transparent'};
    position: relative;
    transition: all 0.15s;
    &:hover { background: ${p => p.theme.bg.hover}; }
`;

const ConvName = styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    color: ${p => p.theme.text.primary};
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 24px;
`;

const ConvMeta = styled.div`
    font-size: 0.72rem;
    color: ${p => p.theme.text.tertiary};
`;

const DelBtn = styled.button`
    position: absolute; top: 8px; right: 8px;
    width: 22px; height: 22px;
    border-radius: 4px; border: none;
    background: transparent;
    color: ${p => p.theme.text.tertiary};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s;
    ${ConvItem}:hover & { opacity: 1; }
    &:hover { background: ${p => p.theme.mode === 'dark' ? 'rgba(239,68,68,0.2)' : '#fee2e2'}; color: #ef4444; }
`;

const MutedText = styled.div`
    text-align: center;
    padding: 20px;
    color: ${p => p.theme.text.tertiary};
    font-size: 0.85rem;
`;

// ─── Chat Panel ───────────────────────────────────────────────────────────────
const ChatPanel = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: ${p => p.theme.bg.primary};
    min-width: 0;
    overflow: hidden;
`;

const ChatHeader = styled.div`
    padding: 18px 24px;
    border-bottom: 1px solid ${p => p.theme.border};
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    background: ${p => p.theme.bg.card};
`;

const HeaderText = styled.div`
    h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: ${p => p.theme.text.primary};
    }
    p {
        margin: 3px 0 0;
        font-size: 0.82rem;
        color: ${p => p.theme.text.tertiary};
    }
`;

const Messages = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { background: ${p => p.theme.border}; border-radius: 4px; }
`;

// ─── Welcome Screen ───────────────────────────────────────────────────────────
const Welcome = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    animation: ${slideUp} 0.4s ease;
`;

const WelcomeTitle = styled.h2`
    margin: 16px 0 8px;
    font-size: 1.5rem;
    font-weight: 700;
    color: ${p => p.theme.text.primary};
`;

const WelcomeSub = styled.p`
    margin: 0 0 24px;
    color: ${p => p.theme.text.secondary};
    font-size: 0.95rem;
`;

const SugGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 560px;
    width: 100%;
`;

const Sug = styled.button`
    padding: 16px 18px;
    border-radius: 14px;
    border: 1px solid ${p => p.theme.border};
    background: ${p => p.theme.bg.card};
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    span {
        font-size: 0.875rem;
        font-weight: 500;
        color: ${p => p.theme.text.primary};
    }
    &:hover {
        border-color: #3b82f6;
        background: ${p => p.theme.mode === 'dark' ? 'rgba(59,130,246,0.1)' : '#eff6ff'};
        transform: translateY(-2px);
        box-shadow: 0 4px 14px rgba(59,130,246,0.12);
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
    width: 34px; height: 34px;
    border-radius: 50%;
    background: ${p => p.$isUser
        ? (p.theme.mode === 'dark' ? 'rgba(249,115,22,0.2)' : '#fff7ed')
        : (p.theme.mode === 'dark' ? 'rgba(59,130,246,0.2)' : '#eff6ff')};
    color: ${p => p.$isUser ? '#f97316' : '#3b82f6'};
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
    padding: 12px 16px;
    border-radius: 16px;
    ${p => p.$isUser
        ? `background: #3b82f6; color: white; border-bottom-right-radius: 4px;`
        : `background: ${p.theme.bg.card};
           color: ${p.$error ? '#dc2626' : p.theme.text.primary};
           border: 1px solid ${p.theme.border};
           border-bottom-left-radius: 4px;`}
    font-size: 0.9375rem;
    line-height: 1.65;
    white-space: pre-wrap;
`;

const ThinkingBubble = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.theme.border};
    color: ${p => p.theme.text.secondary};
    font-size: 0.875rem;
    .spin { animation: ${spin} 1s linear infinite; }
`;

// ─── Citations ────────────────────────────────────────────────────────────────
const CitationBox = styled.div`
    margin-top: 10px;
    padding: 12px;
    background: ${p => p.theme.mode === 'dark' ? 'rgba(245,158,11,0.1)' : '#fffbeb'};
    border-left: 3px solid #f59e0b;
    border-radius: 8px;
`;

const CitHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    font-weight: 700;
    color: ${p => p.theme.mode === 'dark' ? '#fbbf24' : '#92400e'};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
`;

const CitItem = styled.div`
    margin-bottom: 6px;
    &:last-child { margin-bottom: 0; }
`;

const CitTag = styled.span`
    display: inline-block;
    padding: 1px 6px;
    background: ${p => p.theme.mode === 'dark' ? 'rgba(245,158,11,0.2)' : '#fef3c7'};
    color: ${p => p.theme.mode === 'dark' ? '#fbbf24' : '#92400e'};
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
    color: ${p => p.theme.mode === 'dark' ? '#fcd34d' : '#78350f'};
`;

const CitExcerpt = styled.div`
    margin-top: 3px;
    font-size: 0.72rem;
    color: ${p => p.theme.mode === 'dark' ? '#d97706' : '#92400e'};
    opacity: 0.85;
`;

const MsgMeta = styled.div`
    margin-top: 5px;
    font-size: 0.7rem;
    color: ${p => p.theme.text.tertiary};
`;

// ─── Input Bar ────────────────────────────────────────────────────────────────
const InputRow = styled.form`
    padding: 16px 20px;
    border-top: 1px solid ${p => p.theme.border};
    display: flex;
    gap: 10px;
    background: ${p => p.theme.bg.card};
    flex-shrink: 0;
`;

const ChatInput = styled.input`
    flex: 1;
    padding: 13px 18px;
    border-radius: 14px;
    border: 1.5px solid ${p => p.theme.border};
    background: ${p => p.theme.bg.primary};
    color: ${p => p.theme.text.primary};
    font-size: 0.9375rem;
    outline: none;
    transition: all 0.2s;
    &::placeholder { color: ${p => p.theme.text.tertiary}; }
    &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SendBtn = styled.button`
    width: 48px; height: 48px;
    border-radius: 14px;
    border: none;
    background: #3b82f6;
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
    &:disabled { background: ${p => p.theme.bg.hover}; color: ${p => p.theme.text.tertiary}; cursor: not-allowed; }
    .spin { animation: ${spin} 1s linear infinite; }
`;

export default AIAssistant;
