import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, Calendar, ShoppingBag, MessageSquare, TrendingUp } from 'lucide-react';
import { getCustomers, getCustomer } from '../api.js';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
    totalOrders: number;
    totalSpent: number;
    lastContact: string;
    tags: string[];
    tickets: { id: string; subject: string; status: string; createdAt: string }[];
    notes: string[];
}

export function Customer360Page() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getCustomers().then(res => setCustomers(res.customers || [])).catch(() => { });
    }, []);

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search),
    );

    const selectCustomer = async (id: string) => {
        setLoading(true);
        try {
            const res = await getCustomer(id);
            setSelected(res.customer || null);
        } catch { setSelected(null); }
        setLoading(false);
    };

    return (
        <div className="flex h-full">
            {/* Customer List */}
            <div className="w-[320px] shrink-0 flex flex-col border-r" style={{ borderColor: 'var(--cs-border)' }}>
                <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--cs-border)' }}>
                    <h2 className="text-[14px] font-bold mb-3" style={{ color: 'var(--cs-fg)' }}>Khách hàng</h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cs-fg-muted)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm khách hàng..."
                            className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none"
                            style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filtered.map(c => (
                        <button key={c.id} onClick={() => selectCustomer(c.id)}
                            className="w-full text-left px-4 py-3 border-b cursor-pointer transition-all"
                            style={{
                                borderColor: 'var(--cs-border)',
                                background: selected?.id === c.id ? 'var(--cs-primary-soft)' : 'transparent',
                            }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                    style={{ background: 'var(--cs-primary)' }}>
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--cs-fg)' }}>{c.name}</div>
                                    <div className="text-[10px] truncate" style={{ color: 'var(--cs-fg-muted)' }}>{c.email}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail Panel */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-[13px] animate-pulse" style={{ color: 'var(--cs-fg-muted)' }}>Đang tải...</div>
                    </div>
                ) : selected ? (
                    <div className="p-6 space-y-5 max-w-3xl">
                        {/* Profile Header */}
                        <div className="flex items-start gap-4 p-5 rounded-xl" style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)' }}>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold text-white shrink-0"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                                {selected.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--cs-fg)' }}>{selected.name}</h3>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {selected.tags.map(tag => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>{tag}</span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[12px]" style={{ color: 'var(--cs-fg-secondary)' }}>
                                    <div className="flex items-center gap-1.5"><Mail size={12} />{selected.email}</div>
                                    <div className="flex items-center gap-1.5"><Phone size={12} />{selected.phone}</div>
                                    <div className="flex items-center gap-1.5"><MapPin size={12} />{selected.address}</div>
                                    <div className="flex items-center gap-1.5"><Calendar size={12} />KH từ {new Date(selected.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: ShoppingBag, label: 'Đơn hàng', value: selected.totalOrders, color: '#3b82f6' },
                                { icon: TrendingUp, label: 'Tổng chi tiêu', value: `${(selected.totalSpent / 1_000_000).toFixed(1)}M`, color: '#10b981' },
                                { icon: MessageSquare, label: 'Tickets', value: selected.tickets.length, color: '#f59e0b' },
                            ].map(s => (
                                <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)' }}>
                                    <s.icon size={20} className="mx-auto mb-1.5" style={{ color: s.color }} />
                                    <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
                                    <div className="text-[10px]" style={{ color: 'var(--cs-fg-muted)' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Tickets */}
                        <div className="rounded-xl" style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)' }}>
                            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--cs-border)' }}>
                                <h4 className="text-[13px] font-bold" style={{ color: 'var(--cs-fg)' }}>Tickets gần đây</h4>
                            </div>
                            <div>
                                {selected.tickets.length === 0 ? (
                                    <div className="p-4 text-[12px] text-center" style={{ color: 'var(--cs-fg-muted)' }}>Không có ticket</div>
                                ) : selected.tickets.map(t => (
                                    <div key={t.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--cs-border)' }}>
                                        <div>
                                            <div className="text-[12px] font-medium" style={{ color: 'var(--cs-fg)' }}>{t.subject}</div>
                                            <div className="text-[10px]" style={{ color: 'var(--cs-fg-muted)' }}>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                            style={{
                                                background: t.status === 'resolved' ? 'rgba(16,185,129,0.12)' : t.status === 'open' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                                                color: t.status === 'resolved' ? '#10b981' : t.status === 'open' ? '#3b82f6' : '#f59e0b',
                                            }}>{t.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        {selected.notes.length > 0 && (
                            <div className="rounded-xl" style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)' }}>
                                <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--cs-border)' }}>
                                    <h4 className="text-[13px] font-bold" style={{ color: 'var(--cs-fg)' }}>Ghi chú</h4>
                                </div>
                                <div className="px-5 py-3 space-y-2">
                                    {selected.notes.map((n, i) => (
                                        <div key={i} className="text-[12px] p-2.5 rounded-lg" style={{ background: 'var(--cs-surface-alt)', color: 'var(--cs-fg-secondary)' }}>
                                            {n}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <User size={40} className="mx-auto mb-3" style={{ color: 'var(--cs-fg-muted)' }} />
                            <p className="text-[13px]" style={{ color: 'var(--cs-fg-muted)' }}>Chọn khách hàng để xem thông tin 360°</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
