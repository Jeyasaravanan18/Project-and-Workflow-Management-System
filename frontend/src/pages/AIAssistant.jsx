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
                    <BotAvatarBadge>
                        <Bot size={22} color="#008060" />
                    </BotAvatarBadge>
                    <HeaderText>
                        <h2>IT Support AI Assistant</h2>
                        <p>Ask me anything about workflows, troubleshooting, or best practices</p>
                    </HeaderText>
                </ChatHeader>

                <Messages>
                    {messages.length === 0 ? (
                        <Welcome>
                            <WelcomeIconWrap>
                                <Bot size={44} color="#008060" />
                            </WelcomeIconWrap>
                            <WelcomeTitle>How can I help you today?</WelcomeTitle>
                            <WelcomeSub>Select a prompt below or type your question to get instant guidance</WelcomeSub>
                            <SugGrid>
                                {[
                                    ['How do I create a new project?', 'Creating projects'],
                                    ['What should I do if I get a permission denied error?', 'Troubleshooting errors'],
                                    ['How do I assign tasks effectively?', 'Task management'],
                                    ['How can I understand workload analytics?', 'Analytics insights'],
                                ].map(([prompt, label]) => (
                                    <Sug key={label} onClick={() => setInputMessage(prompt)}>
                                        <FileText size={16} color="#008060" />
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
                                            <Loader className="spin" size={15} color="#008060" />
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
                        {loading ? <Loader className="spin" size={18} /> : <Send size={18} />}
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
    margin: -28px -32px;
    height: calc(100vh - 65px);
    overflow: hidden;
    background: #f8fafc;
`;

// ─── Conversation Panel ───────────────────────────────────────────────────────
const ConvPanel = styled.div`
    width: 290px;
    min-width: 240px;
    background: #ffffff;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
`;

const ConvHeader = styled.div`
    padding: 18px 20px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
`;

const ConvTitle = styled.h3`
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.01em;
`;

const NewChatBtn = styled.button`
    width: 34px; height: 34px;
    border-radius: 9999px;
    border: none;
    background: #111827;
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #008060; transform: scale(1.05); }
`;

const ConvList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
`;

const ConvItem = styled.div`
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 4px;
    cursor: pointer;
    background: ${p => p.$active ? '#ecfdf5' : 'transparent'};
    border: 1px solid ${p => p.$active ? '#a7f3d0' : 'transparent'};
    position: relative;
    transition: all 0.15s;
    &:hover { background: ${p => p.$active ? '#ecfdf5' : '#f8fafc'}; }
`;

const ConvName = styled.div`
    font-size: 0.85rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 24px;
`;

const ConvMeta = styled.div`
    font-size: 0.72rem;
    color: #6b7280;
`;

const DelBtn = styled.button`
    position: absolute; top: 10px; right: 10px;
    width: 22px; height: 22px;
    border-radius: 6px; border: none;
    background: transparent;
    color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s;
    ${ConvItem}:hover & { opacity: 1; }
    &:hover { background: #fee2e2; color: #ef4444; }
`;

const MutedText = styled.div`
    text-align: center;
    padding: 24px;
    color: #9ca3af;
    font-size: 0.85rem;
`;

// ─── Chat Panel ───────────────────────────────────────────────────────────────
const ChatPanel = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
    min-width: 0;
    overflow: hidden;
`;

const ChatHeader = styled.div`
    padding: 16px 28px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    background: #ffffff;
`;

const BotAvatarBadge = styled.div`
    width: 40px; height: 40px;
    border-radius: 12px;
    background: #ecfdf5;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
`;

const HeaderText = styled.div`
    h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.01em;
    }
    p {
        margin: 2px 0 0;
        font-size: 0.8rem;
        color: #6b7280;
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
    &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
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

const WelcomeIconWrap = styled.div`
    width: 72px; height: 72px;
    border-radius: 20px;
    background: #ecfdf5;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
`;

const WelcomeTitle = styled.h2`
    margin: 12px 0 6px;
    font-size: 1.4rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.02em;
`;

const WelcomeSub = styled.p`
    margin: 0 0 24px;
    color: #6b7280;
    font-size: 0.9rem;
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
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
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
        color: #111827;
    }
    &:hover {
        border-color: #008060;
        background: #ecfdf5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,128,96,0.08);
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
    background: ${p => p.$isUser ? '#111827' : '#ecfdf5'};
    color: ${p => p.$isUser ? '#ffffff' : '#008060'};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
`;

const MsgBody = styled.div`
    flex: 1;
    max-width: 70%;
    display: flex;
    flex-direction: column;
`;

const Bubble = styled.div`
    padding: 12px 18px;
    border-radius: 16px;
    ${p => p.$isUser
        ? `background: #111827; color: white; border-bottom-right-radius: 4px; font-weight: 450;`
        : `background: #ffffff;
           color: ${p.$error ? '#dc2626' : '#1f2937'};
           border: 1px solid #e5e7eb;
           box-shadow: 0 1px 3px rgba(0,0,0,0.04);
           border-bottom-left-radius: 4px;`}
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: pre-wrap;
`;

const ThinkingBubble = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 0.85rem;
    .spin { animation: ${spin} 1s linear infinite; }
`;

// ─── Citations ────────────────────────────────────────────────────────────────
const CitationBox = styled.div`
    margin-top: 10px;
    padding: 12px 14px;
    background: #ecfdf5;
    border-left: 3px solid #008060;
    border-radius: 8px;
`;

const CitHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #065f46;
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
    background: #d1fae5;
    color: #065f46;
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
    color: #065f46;
`;

const CitExcerpt = styled.div`
    margin-top: 3px;
    font-size: 0.72rem;
    color: #047857;
    opacity: 0.9;
`;

const MsgMeta = styled.div`
    margin-top: 5px;
    font-size: 0.7rem;
    color: #9ca3af;
`;

// ─── Input Bar ────────────────────────────────────────────────────────────────
const InputRow = styled.form`
    padding: 16px 28px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 12px;
    background: #ffffff;
    flex-shrink: 0;
`;

const ChatInput = styled.input`
    flex: 1;
    padding: 12px 20px;
    border-radius: 9999px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    color: #111827;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s;
    &::placeholder { color: #9ca3af; }
    &:focus { border-color: #008060; background: #ffffff; box-shadow: 0 0 0 3px rgba(0,128,96,0.1); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SendBtn = styled.button`
    width: 44px; height: 44px;
    border-radius: 9999px;
    border: none;
    background: #111827;
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover:not(:disabled) { background: #008060; transform: translateY(-1px); }
    &:disabled { background: #f1f5f9; color: #9ca3af; cursor: not-allowed; }
    .spin { animation: ${spin} 1s linear infinite; }
`;

export default AIAssistant;
