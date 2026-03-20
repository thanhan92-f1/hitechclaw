import { useNavigate } from 'react-router-dom';
import {
    Activity, Headphones, ShoppingCart, GraduationCap,
    Building2, Truck, ArrowRight,
} from 'lucide-react';

interface DemoModule {
    id: string;
    path: string;
    title: string;
    subtitle: string;
    description: string;
    icon: typeof Activity;
    color: string;
    gradient: string;
    tags: string[];
    status: 'live' | 'coming-soon';
}

const MODULES: DemoModule[] = [
    {
        id: 'his',
        path: '/his',
        title: 'HIS Mini',
        subtitle: 'Hospital Information System',
        description: 'Hệ thống quản lý bệnh viện: bệnh nhân, kê đơn, cảnh báo lâm sàng, FHIR R5, SOAP encounter, tích hợp AI chatbot.',
        icon: Activity,
        color: '#0ea5e9',
        gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
        tags: ['FHIR R5', 'Clinical Alerts', 'RBAC', 'AI Chatbot'],
        status: 'live',
    },
    {
        id: 'cs',
        path: '/cs',
        title: 'Customer Service',
        subtitle: 'Hệ thống CSKH',
        description: 'Quản lý ticket hỗ trợ, live chat tích hợp AI, knowledge base FAQ, phân tích khách hàng 360°.',
        icon: Headphones,
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        tags: ['Ticket System', 'Live Chat', 'FAQ', 'Customer 360'],
        status: 'live',
    },
    {
        id: 'ecommerce',
        path: '/ecommerce',
        title: 'E-Commerce',
        subtitle: 'Quản lý bán hàng',
        description: 'Quản lý đơn hàng, sản phẩm, inventory, thanh toán, tích hợp AI recommendation.',
        icon: ShoppingCart,
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        tags: ['Orders', 'Inventory', 'Payment', 'AI Recommend'],
        status: 'coming-soon',
    },
    {
        id: 'lms',
        path: '/lms',
        title: 'LMS',
        subtitle: 'Learning Management',
        description: 'Nền tảng học trực tuyến: khoá học, bài giảng, quiz, tiến độ học viên, AI tutor.',
        icon: GraduationCap,
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
        tags: ['Courses', 'Quiz', 'Progress', 'AI Tutor'],
        status: 'coming-soon',
    },
    {
        id: 'crm',
        path: '/crm',
        title: 'CRM',
        subtitle: 'Customer Relationship',
        description: 'Quản lý khách hàng, pipeline, deal, contact, báo cáo doanh thu, AI lead scoring.',
        icon: Building2,
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
        tags: ['Pipeline', 'Deals', 'Contacts', 'AI Scoring'],
        status: 'coming-soon',
    },
    {
        id: 'logistics',
        path: '/logistics',
        title: 'Logistics',
        subtitle: 'Quản lý vận chuyển',
        description: 'Theo dõi đơn vận, tối ưu tuyến đường, quản lý kho bãi, tích hợp AI routing.',
        icon: Truck,
        color: '#f97316',
        gradient: 'linear-gradient(135deg, #f97316, #eab308)',
        tags: ['Tracking', 'Routes', 'Warehouse', 'AI Routing'],
        status: 'coming-soon',
    },
];

export function DemoHub() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen" style={{ background: '#0f172a' }}>
            {/* Header */}
            <header className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>
                        <span className="text-white text-lg font-bold">x</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">xClaw Demo Hub</h1>
                        <p className="text-xs" style={{ color: 'rgba(148,163,184,0.7)' }}>
                            Demo tích hợp AI Agent vào các hệ thống thực tế
                        </p>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-6 pt-12 pb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Chọn module demo</h2>
                <p className="text-sm" style={{ color: 'rgba(148,163,184,0.8)' }}>
                    Mỗi module là một ứng dụng hoàn chỉnh, demo cách xClaw tích hợp AI
                    vào từng lĩnh vực cụ thể.
                </p>
            </section>

            {/* Module Grid */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {MODULES.map((mod) => {
                        const isLive = mod.status === 'live';
                        return (
                            <button
                                key={mod.id}
                                onClick={() => isLive && navigate(mod.path)}
                                disabled={!isLive}
                                className="text-left rounded-2xl p-6 transition-all group"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    cursor: isLive ? 'pointer' : 'default',
                                    opacity: isLive ? 1 : 0.5,
                                }}
                            >
                                {/* Icon + Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: mod.gradient }}>
                                        <mod.icon size={24} color="#fff" />
                                    </div>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)',
                                            color: isLive ? '#10b981' : 'rgba(148,163,184,0.6)',
                                        }}>
                                        {isLive ? 'Live' : 'Coming soon'}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-bold text-white mb-0.5">{mod.title}</h3>
                                <p className="text-[11px] font-medium mb-3" style={{ color: mod.color }}>{mod.subtitle}</p>

                                {/* Description */}
                                <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'rgba(148,163,184,0.8)' }}>
                                    {mod.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {mod.tags.map((tag) => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(148,163,184,0.7)' }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA */}
                                {isLive && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-medium transition-transform group-hover:translate-x-1"
                                        style={{ color: mod.color }}>
                                        Mở demo <ArrowRight size={14} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-6 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[11px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    xClaw Demo Integration App — <a href="https://github.com/xdev-asia-labs/xclaw-demo-integration-app" target="_blank" rel="noreferrer" className="underline">GitHub</a> — xDev Asia
                </p>
            </footer>
        </div>
    );
}
