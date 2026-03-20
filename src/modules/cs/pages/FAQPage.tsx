import { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';
import { getFaqCategories } from '../api.js';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

interface FAQCategory {
    id: string;
    name: string;
    icon: string;
    items: FAQItem[];
}

export function FAQPage() {
    const [categories, setCategories] = useState<FAQCategory[]>([]);
    const [search, setSearch] = useState('');
    const [expandedCat, setExpandedCat] = useState<string | null>(null);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    useEffect(() => {
        getFaqCategories().then(res => setCategories(res.categories || [])).catch(() => { });
    }, []);

    const filtered = search.trim()
        ? categories.map(cat => ({
            ...cat,
            items: cat.items.filter(it =>
                it.question.toLowerCase().includes(search.toLowerCase()) ||
                it.answer.toLowerCase().includes(search.toLowerCase()),
            ),
        })).filter(cat => cat.items.length > 0)
        : categories;

    return (
        <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--cs-border)' }}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                        <BookOpen size={18} color="#fff" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold" style={{ color: 'var(--cs-fg)' }}>FAQ & Knowledge Base</h2>
                        <p className="text-[11px]" style={{ color: 'var(--cs-fg-muted)' }}>Câu hỏi thường gặp và hướng dẫn sử dụng</p>
                    </div>
                </div>
                <div className="relative max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cs-fg-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm kiếm câu hỏi..."
                        className="w-full pl-8 pr-4 py-2.5 rounded-lg text-[13px] outline-none"
                        style={{ background: 'var(--cs-surface-alt)', border: '1px solid var(--cs-border)', color: 'var(--cs-fg)' }}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="px-6 py-4 space-y-3 max-w-3xl">
                {filtered.length === 0 ? (
                    <div className="py-12 text-center">
                        <MessageCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--cs-fg-muted)' }} />
                        <p className="text-[13px]" style={{ color: 'var(--cs-fg-muted)' }}>
                            {search ? 'Không tìm thấy kết quả' : 'Chưa có câu hỏi nào'}
                        </p>
                    </div>
                ) : filtered.map(cat => {
                    const isOpen = expandedCat === cat.id || !!search.trim();
                    return (
                        <div key={cat.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--cs-border)' }}>
                            <button
                                onClick={() => setExpandedCat(isOpen && !search ? null : cat.id)}
                                className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer transition-all hover:opacity-90"
                                style={{ background: 'var(--cs-surface)' }}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{cat.icon}</span>
                                    <span className="text-[13px] font-semibold" style={{ color: 'var(--cs-fg)' }}>{cat.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--cs-surface-alt)', color: 'var(--cs-fg-muted)' }}>
                                        {cat.items.length}
                                    </span>
                                </div>
                                {isOpen ? <ChevronDown size={16} style={{ color: 'var(--cs-fg-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--cs-fg-muted)' }} />}
                            </button>
                            {isOpen && (
                                <div className="border-t" style={{ borderColor: 'var(--cs-border)' }}>
                                    {cat.items.map(item => {
                                        const itemOpen = expandedItem === item.id;
                                        return (
                                            <div key={item.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--cs-border)' }}>
                                                <button onClick={() => setExpandedItem(itemOpen ? null : item.id)}
                                                    className="w-full flex items-start gap-3 px-5 py-3 text-left cursor-pointer transition-all hover:opacity-80"
                                                    style={{ background: itemOpen ? 'var(--cs-primary-soft)' : 'transparent' }}>
                                                    <MessageCircle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--cs-primary)' }} />
                                                    <span className="text-[13px] font-medium" style={{ color: 'var(--cs-fg)' }}>{item.question}</span>
                                                </button>
                                                {itemOpen && (
                                                    <div className="px-5 pb-4 pl-12">
                                                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--cs-fg-secondary)' }}>{item.answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
