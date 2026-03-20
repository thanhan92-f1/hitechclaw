import { useState, useEffect } from 'react';
import {
    Headphones, LayoutDashboard, MessageSquare, BookOpen, User as UserIcon,
    LogOut, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';
import { TicketDashboard } from './pages/TicketDashboard.js';
import { LiveChatPage } from './pages/LiveChatPage.js';
import { FAQPage } from './pages/FAQPage.js';
import { Customer360Page } from './pages/Customer360Page.js';
import { csLogin, csLogout, csGetMe, setCsAuthToken } from './api.js';
import { useNavigate } from 'react-router-dom';

interface CsUser {
    id: string;
    name: string;
    email: string;
    role: string;
    roleName: string;
}

type Page = 'tickets' | 'chat' | 'faq' | 'customers';

const NAV: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'tickets', label: 'Ticket Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Live Chat', icon: MessageSquare },
    { id: 'faq', label: 'FAQ / Knowledge', icon: BookOpen },
    { id: 'customers', label: 'Customer 360°', icon: UserIcon },
];

// ─── Login Screen ───

function LoginScreen({ onLogin }: { onLogin: (user: CsUser) => void }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await csLogin(email, password);
            if (res.token && res.user) {
                setCsAuthToken(res.token);
                onLogin(res.user);
            } else {
                setError(res.error || 'Đăng nhập thất bại');
            }
        } catch {
            setError('Không thể kết nối tới server');
        }
        setLoading(false);
    };

    return (
        <div className="h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
            <div className="w-[400px] rounded-2xl p-8 shadow-2xl" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-[12px] font-medium mb-6 cursor-pointer transition-opacity hover:opacity-80"
                    style={{ color: '#a855f7' }}>
                    <ArrowLeft size={14} /> Quay lại Demo Hub
                </button>

                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                        <Headphones size={28} color="#fff" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">Customer Service</div>
                        <div className="text-[11px] font-medium" style={{ color: '#a855f7' }}>Hệ thống CSKH</div>
                    </div>
                </div>

                <h2 className="text-[16px] font-bold text-center mb-1 text-white">Đăng nhập</h2>
                <p className="text-[13px] text-center mb-6" style={{ color: 'rgba(148,163,184,0.7)' }}>Nhập tài khoản để tiếp tục</p>

                {error && (
                    <div className="mb-4 p-3 rounded-lg text-[13px] text-center"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'rgba(148,163,184,0.7)' }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="agent@cs.local"
                            autoFocus
                            className="w-full px-4 py-2.5 rounded-lg text-[13px] outline-none text-white"
                            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'rgba(148,163,184,0.7)' }}>Mật khẩu</label>
                        <div className="relative">
                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••"
                                className="w-full px-4 py-2.5 pr-10 rounded-lg text-[13px] outline-none text-white"
                                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer"
                                style={{ color: 'rgba(148,163,184,0.6)' }}>
                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="mt-6 p-3 rounded-lg" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="text-[11px] font-semibold mb-2" style={{ color: 'rgba(148,163,184,0.6)' }}>Tài khoản demo:</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]" style={{ color: 'rgba(148,163,184,0.7)' }}>
                        {[
                            { email: 'manager@cs.local', pw: 'manager123', role: 'Manager' },
                            { email: 'agent@cs.local', pw: 'agent123', role: 'Agent' },
                            { email: 'senior@cs.local', pw: 'senior123', role: 'Senior Agent' },
                            { email: 'viewer@cs.local', pw: 'viewer123', role: 'Viewer' },
                        ].map(a => (
                            <button key={a.email}
                                onClick={() => { setEmail(a.email); setPassword(a.pw); }}
                                className="text-left px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ background: '#1e293b' }}>
                                <div className="font-medium" style={{ color: '#a855f7' }}>{a.role}</div>
                                <div>{a.email}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main CS App ───

export function CSApp() {
    const navigate = useNavigate();
    const [user, setUser] = useState<CsUser | null>(null);
    const [checking, setChecking] = useState(true);
    const [page, setPage] = useState<Page>('tickets');

    useEffect(() => {
        const saved = sessionStorage.getItem('cs_token');
        if (saved) {
            setCsAuthToken(saved);
            csGetMe().then(res => {
                if (res.user) setUser(res.user);
                else setCsAuthToken(null);
                setChecking(false);
            }).catch(() => { setCsAuthToken(null); setChecking(false); });
        } else {
            setChecking(false);
        }
    }, []);

    const handleLogout = async () => {
        await csLogout();
        setUser(null);
        setPage('tickets');
    };

    if (checking) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
                <div className="text-center">
                    <Headphones size={40} className="mx-auto mb-3 animate-pulse" style={{ color: '#a855f7' }} />
                    <div className="text-[13px]" style={{ color: 'rgba(148,163,184,0.8)' }}>Đang kiểm tra đăng nhập...</div>
                </div>
            </div>
        );
    }

    if (!user) return <LoginScreen onLogin={setUser} />;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="flex flex-col w-[220px] shrink-0" style={{ background: '#0f172a' }}>
                <div className="px-4 h-14 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => navigate('/')}
                        className="p-1.5 rounded-md cursor-pointer transition-opacity hover:opacity-80"
                        style={{ color: 'rgba(148,163,184,0.6)' }} title="Quay lại Demo Hub">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                        <Headphones size={14} color="#fff" />
                    </div>
                    <span className="text-[13px] font-bold text-white">CS Center</span>
                </div>

                <nav className="flex-1 py-3 px-2.5 space-y-0.5">
                    {NAV.map(item => {
                        const active = page === item.id;
                        return (
                            <button key={item.id} onClick={() => setPage(item.id)}
                                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer"
                                style={{
                                    background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                                    color: active ? '#c4b5fd' : '#94a3b8',
                                }}>
                                <item.icon size={16} style={{ color: active ? '#a855f7' : '#94a3b8' }} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="px-2.5 pb-2">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-white truncate">{user.name}</div>
                            <div className="text-[9px] truncate" style={{ color: 'rgba(148,163,184,0.6)' }}>{user.roleName}</div>
                        </div>
                        <button onClick={handleLogout}
                            className="p-1 rounded-md cursor-pointer transition-opacity hover:opacity-80"
                            style={{ color: 'rgba(148,163,184,0.5)' }} title="Đăng xuất">
                            <LogOut size={13} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-hidden" style={{ background: 'var(--cs-bg, #f8fafc)' }}>
                {page === 'tickets' && <TicketDashboard />}
                {page === 'chat' && <LiveChatPage />}
                {page === 'faq' && <FAQPage />}
                {page === 'customers' && <Customer360Page />}
            </main>
        </div>
    );
}
