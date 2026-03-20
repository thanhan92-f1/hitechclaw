import { useState, useEffect } from 'react';
import {
    Plus, Search, Clock, CheckCircle, AlertCircle, ArrowUpCircle,
    Filter, MessageSquare, User,
} from 'lucide-react';
import { getTickets, getCsStats, createTicket, updateTicket, addTicketReply } from '../api.js';

interface Ticket {
    id: string;
    customerId: string;
    customerName: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    assigneeId?: string;
    assigneeName?: string;
    replies: { id: string; message: string; author: string; isInternal: boolean; createdAt: string }[];
    createdAt: string;
    updatedAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
    open: { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6', label: 'Mở' },
    in_progress: { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', label: 'Đang xử lý' },
    waiting: { bg: 'rgba(168,85,247,0.12)', fg: '#a855f7', label: 'Chờ phản hồi' },
    resolved: { bg: 'rgba(16,185,129,0.12)', fg: '#10b981', label: 'Đã giải quyết' },
    closed: { bg: 'rgba(148,163,184,0.12)', fg: '#94a3b8', label: 'Đóng' },
};

const PRIORITY_COLORS: Record<string, { bg: string; fg: string }> = {
    low: { bg: 'rgba(148,163,184,0.12)', fg: '#94a3b8' },
    medium: { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6' },
    high: { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b' },
    urgent: { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444' },
};

export function TicketDashboard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newTicket, setNewTicket] = useState({ customerId: '', subject: '', description: '', priority: 'medium', category: 'general' });

    const load = async () => {
        const [tRes, sRes] = await Promise.all([
            getTickets(filterStatus === 'all' ? undefined : filterStatus),
            getCsStats(),
        ]);
        setTickets(tRes.tickets || []);
        setStats(sRes);
    };

    useEffect(() => { load(); }, [filterStatus]);

    const filtered = tickets.filter(t =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName.toLowerCase().includes(search.toLowerCase()),
    );

    const handleCreate = async () => {
        if (!newTicket.subject.trim() || !newTicket.customerId.trim()) return;
        await createTicket(newTicket);
        setShowCreate(false);
        setNewTicket({ customerId: '', subject: '', description: '', priority: 'medium', category: 'general' });
        load();
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        await addTicketReply(selectedTicket.id, { message: replyText });
        setReplyText('');
        const updated = await getTickets(filterStatus === 'all' ? undefined : filterStatus);
        setTickets(updated.tickets || []);
        const found = (updated.tickets || []).find((t: Ticket) => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
    };

    const handleStatusChange = async (id: string, status: string) => {
        await updateTicket(id, { status });
        load();
        if (selectedTicket?.id === id) {
            const updated = await getTickets(filterStatus === 'all' ? undefined : filterStatus);
            const found = (updated.tickets || []).find((t: Ticket) => t.id === id);
            if (found) setSelectedTicket(found);
        }
    };

    return (
        <div className="flex h-full">
            {/* Ticket List */}
            <div className="w-[420px] shrink-0 flex flex-col border-r" style={{ borderColor: 'var(--cs-border)' }}>
                {/* Header */}
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--cs-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[15px] font-bold" style={{ color: 'var(--cs-fg)' }}>Tickets</h2>
                        <button onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                            style={{ background: 'var(--cs-primary)' }}>
                            <Plus size={14} /> Tạo ticket
                        </button>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-2 mb-3">
                        {[
                            { label: 'Mở', val: stats.openTickets ?? 0, color: '#3b82f6' },
                            { label: 'Đang xử lý', val: stats.inProgressTickets ?? 0, color: '#f59e0b' },
                            { label: 'Đã xong', val: stats.resolvedTickets ?? 0, color: '#10b981' },
                        ].map(s => (
                            <div key={s.label} className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--cs-surface-alt)' }}>
                                <div className="text-[16px] font-bold" style={{ color: s.color }}>{s.val}</div>
                                <div className="text-[10px]" style={{ color: 'var(--cs-fg-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Search + Filter */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cs-fg-muted)' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm ticket..."
                                className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none"
                                style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                            />
                        </div>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="px-2 py-2 rounded-lg text-[12px] outline-none cursor-pointer"
                            style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}>
                            <option value="all">Tất cả</option>
                            <option value="open">Mở</option>
                            <option value="in_progress">Đang xử lý</option>
                            <option value="waiting">Chờ phản hồi</option>
                            <option value="resolved">Đã giải quyết</option>
                            <option value="closed">Đóng</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-[13px]" style={{ color: 'var(--cs-fg-muted)' }}>
                            Không có ticket nào
                        </div>
                    ) : filtered.map(t => {
                        const sc = STATUS_COLORS[t.status] || STATUS_COLORS.open;
                        const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
                        const active = selectedTicket?.id === t.id;
                        return (
                            <button key={t.id} onClick={() => setSelectedTicket(t)}
                                className="w-full text-left px-5 py-3.5 border-b transition-all cursor-pointer"
                                style={{
                                    borderColor: 'var(--cs-border)',
                                    background: active ? 'var(--cs-primary-soft)' : 'transparent',
                                }}>
                                <div className="flex items-start justify-between mb-1">
                                    <span className="text-[13px] font-semibold line-clamp-1" style={{ color: 'var(--cs-fg)' }}>{t.subject}</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-2"
                                        style={{ background: pc.bg, color: pc.fg }}>{t.priority}</span>
                                </div>
                                <div className="text-[11px] mb-1.5" style={{ color: 'var(--cs-fg-muted)' }}>
                                    <User size={10} className="inline mr-1" />{t.customerName}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.fg }}>{sc.label}</span>
                                    <span className="text-[10px]" style={{ color: 'var(--cs-fg-muted)' }}>
                                        <Clock size={10} className="inline mr-0.5" />{new Date(t.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                    {t.replies.length > 0 && (
                                        <span className="text-[10px]" style={{ color: 'var(--cs-fg-muted)' }}>
                                            <MessageSquare size={10} className="inline mr-0.5" />{t.replies.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Detail Panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedTicket ? (
                    <>
                        {/* Ticket Header */}
                        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--cs-border)' }}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-[15px] font-bold mb-1" style={{ color: 'var(--cs-fg)' }}>{selectedTicket.subject}</h3>
                                    <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--cs-fg-muted)' }}>
                                        <span><User size={11} className="inline mr-1" />{selectedTicket.customerName}</span>
                                        <span>{selectedTicket.category}</span>
                                        <span>{new Date(selectedTicket.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={selectedTicket.status}
                                        onChange={e => handleStatusChange(selectedTicket.id, e.target.value)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-semibold outline-none cursor-pointer"
                                        style={{ background: STATUS_COLORS[selectedTicket.status]?.bg, color: STATUS_COLORS[selectedTicket.status]?.fg, border: 'none' }}>
                                        <option value="open">Mở</option>
                                        <option value="in_progress">Đang xử lý</option>
                                        <option value="waiting">Chờ phản hồi</option>
                                        <option value="resolved">Đã giải quyết</option>
                                        <option value="closed">Đóng</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {/* Original description */}
                            <div className="p-4 rounded-xl" style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)' }}>
                                <div className="text-[11px] font-semibold mb-2" style={{ color: 'var(--cs-fg-muted)' }}>Mô tả</div>
                                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--cs-fg)' }}>{selectedTicket.description}</p>
                            </div>

                            {/* Replies */}
                            {selectedTicket.replies.map(r => (
                                <div key={r.id} className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                        style={{ background: r.isInternal ? '#6366f1' : 'var(--cs-primary)' }}>
                                        {r.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[12px] font-semibold" style={{ color: 'var(--cs-fg)' }}>{r.author}</span>
                                            {r.isInternal && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>Nội bộ</span>}
                                            <span className="text-[10px]" style={{ color: 'var(--cs-fg-muted)' }}>{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <div className="text-[13px] leading-relaxed p-3 rounded-lg" style={{ background: 'var(--cs-surface-alt)', color: 'var(--cs-fg)' }}>
                                            {r.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        <div className="px-6 py-3 border-t" style={{ borderColor: 'var(--cs-border)' }}>
                            <div className="flex gap-2">
                                <input value={replyText} onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                                    placeholder="Nhập phản hồi..."
                                    className="flex-1 px-4 py-2.5 rounded-lg text-[13px] outline-none"
                                    style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                                />
                                <button onClick={handleReply}
                                    className="px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                                    style={{ background: 'var(--cs-primary)' }}>
                                    Gửi
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <MessageSquare size={40} className="mx-auto mb-3" style={{ color: 'var(--cs-fg-muted)' }} />
                            <p className="text-[13px]" style={{ color: 'var(--cs-fg-muted)' }}>Chọn ticket để xem chi tiết</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="w-[480px] rounded-2xl p-6" style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)' }}>
                        <h3 className="text-[15px] font-bold mb-4" style={{ color: 'var(--cs-fg)' }}>Tạo ticket mới</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--cs-fg-muted)' }}>Mã khách hàng</label>
                                <input value={newTicket.customerId} onChange={e => setNewTicket({ ...newTicket, customerId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                                    style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                                    placeholder="CUST-001"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--cs-fg-muted)' }}>Tiêu đề</label>
                                <input value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                                    style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                                    placeholder="Mô tả ngắn vấn đề..."
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--cs-fg-muted)' }}>Mô tả chi tiết</label>
                                <textarea value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
                                    style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--cs-fg-muted)' }}>Mức ưu tiên</label>
                                    <select value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer"
                                        style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}>
                                        <option value="low">Thấp</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--cs-fg-muted)' }}>Danh mục</label>
                                    <select value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer"
                                        style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}>
                                        <option value="general">Chung</option>
                                        <option value="billing">Thanh toán</option>
                                        <option value="technical">Kỹ thuật</option>
                                        <option value="returns">Đổi trả</option>
                                        <option value="shipping">Vận chuyển</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setShowCreate(false)}
                                className="px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                                style={{ color: 'var(--cs-fg-muted)' }}>Huỷ</button>
                            <button onClick={handleCreate}
                                className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                                style={{ background: 'var(--cs-primary)' }}>Tạo ticket</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
