import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react';
import { chatHiTechClawStream, loginHiTechClaw } from '../api.js';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export function LiveChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'system', content: 'Chào bạn! Tôi là trợ lý AI hỗ trợ khách hàng. Hãy hỏi bất kỳ câu hỏi nào.', timestamp: new Date() },
    ]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [aiEmail, setAiEmail] = useState('');
    const [aiPassword, setAiPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [sessionId] = useState(() => `cs-${Date.now()}`);
    const scrollRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleConnect = async () => {
        if (!aiEmail.trim() || !aiPassword.trim()) {
            setAuthError('Vui lòng nhập email và mật khẩu HiTechClaw.');
            return;
        }
        setAuthLoading(true);
        setAuthError('');
        try {
            const res = await loginHiTechClaw(aiEmail.trim(), aiPassword);
            if ('token' in res && res.token) {
                setToken(res.token);
                setAiPassword('');
                return;
            }
            setAuthError(res.error || 'Đăng nhập HiTechClaw thất bại.');
        } catch {
            setAuthError('Không thể kết nối tới HiTechClaw AI.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || streaming || !token) return;
        setInput('');

        const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
        const botId = `b-${Date.now()}`;
        const botMsg: Message = { id: botId, role: 'assistant', content: '', timestamp: new Date() };

        setMessages(prev => [...prev, userMsg, botMsg]);
        setStreaming(true);

        try {
            const { cancel, done } = chatHiTechClawStream(token, text, sessionId, (delta) => {
                setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: m.content + delta } : m));
            });
            cancelRef.current = cancel;
            await done;
        } catch {
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: m.content || 'Không thể kết nối đến AI. Vui lòng thử lại.' } : m));
        }
        cancelRef.current = null;
        setStreaming(false);
    };

    const handleReset = () => {
        if (cancelRef.current) cancelRef.current();
        setMessages([{ id: '0', role: 'system', content: 'Cuộc trò chuyện đã được làm mới. Tôi sẵn sàng hỗ trợ bạn!', timestamp: new Date() }]);
        setStreaming(false);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--cs-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                        <Sparkles size={18} color="#fff" />
                    </div>
                    <div>
                        <h2 className="text-[14px] font-bold" style={{ color: 'var(--cs-fg)' }}>AI Live Chat</h2>
                        <p className="text-[11px]" style={{ color: 'var(--cs-fg-muted)' }}>Trợ lý AI hỗ trợ khách hàng — powered by HiTechClaw</p>
                    </div>
                </div>
                <button onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                    style={{ background: 'var(--cs-surface-alt)', color: 'var(--cs-fg-muted)', border: '1px solid var(--cs-border)' }}>
                    <RotateCcw size={12} /> Làm mới
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map(m => {
                    if (m.role === 'system') {
                        return (
                            <div key={m.id} className="flex justify-center">
                                <div className="text-[11px] px-3 py-1.5 rounded-full" style={{ background: 'var(--cs-surface-alt)', color: 'var(--cs-fg-muted)' }}>
                                    {m.content}
                                </div>
                            </div>
                        );
                    }
                    const isUser = m.role === 'user';
                    return (
                        <div key={m.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: isUser ? 'var(--cs-primary)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                                {isUser ? <User size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
                            </div>
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                                style={{
                                    background: isUser ? 'var(--cs-primary)' : 'var(--cs-surface-alt)',
                                    color: isUser ? '#fff' : 'var(--cs-fg)',
                                    border: isUser ? 'none' : '1px solid var(--cs-border)',
                                }}>
                                {m.content || (streaming ? <span className="animate-pulse">...</span> : '')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--cs-border)' }}>
                {!token && (
                    <div className="mb-3 p-3 rounded-lg border" style={{ borderColor: 'var(--cs-border)', background: 'var(--cs-surface-alt)' }}>
                        <div className="text-[11px] mb-2" style={{ color: 'var(--cs-fg-muted)' }}>
                            Kết nối HiTechClaw AI để bắt đầu chat
                        </div>
                        <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
                            <input
                                type="email"
                                value={aiEmail}
                                onChange={e => setAiEmail(e.target.value)}
                                placeholder="Email HiTechClaw"
                                className="px-3 py-2 rounded-lg text-[12px] outline-none"
                                style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                            />
                            <input
                                type="password"
                                value={aiPassword}
                                onChange={e => setAiPassword(e.target.value)}
                                placeholder="Mật khẩu"
                                className="px-3 py-2 rounded-lg text-[12px] outline-none"
                                style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                            />
                            <button
                                onClick={handleConnect}
                                disabled={authLoading || !aiEmail.trim() || !aiPassword.trim()}
                                className="px-3 py-2 rounded-lg text-[12px] font-medium text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'var(--cs-primary)' }}
                            >
                                {authLoading ? 'Đang kết nối...' : 'Kết nối AI'}
                            </button>
                        </div>
                        {authError && (
                            <div className="text-[11px] mt-2" style={{ color: '#ef4444' }}>{authError}</div>
                        )}
                    </div>
                )}
                <div className="flex gap-2">
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Nhập tin nhắn hỗ trợ..."
                        disabled={!token || streaming}
                        className="flex-1 px-4 py-3 rounded-xl text-[13px] outline-none disabled:opacity-50"
                        style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                    />
                    <button onClick={handleSend} disabled={!input.trim() || streaming || !token}
                        className="px-4 py-3 rounded-xl text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'var(--cs-primary)' }}>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
