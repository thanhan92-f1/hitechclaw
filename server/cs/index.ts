// ============================================================
// Customer Service — Backend API (Hono sub-router)
// Mounted at /api/cs/* in the main server
// ============================================================

import { Hono } from 'hono';
import crypto from 'node:crypto';

// ─── Types ──────────────────────────────────────────────────

interface CsUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    roleName: string;
}

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
    notes: string[];
}

interface FAQCategory {
    id: string;
    name: string;
    icon: string;
    items: { id: string; question: string; answer: string }[];
}

// ─── Seed Data ──────────────────────────────────────────────

const csUsers: CsUser[] = [
    { id: 'cs-u1', name: 'Nguyễn Quản Lý', email: 'manager@cs.local', password: 'manager123', role: 'manager', roleName: 'Manager' },
    { id: 'cs-u2', name: 'Trần Hỗ Trợ', email: 'agent@cs.local', password: 'agent123', role: 'agent', roleName: 'Agent' },
    { id: 'cs-u3', name: 'Lê Senior', email: 'senior@cs.local', password: 'senior123', role: 'senior', roleName: 'Senior Agent' },
    { id: 'cs-u4', name: 'Phạm Xem', email: 'viewer@cs.local', password: 'viewer123', role: 'viewer', roleName: 'Viewer' },
];

const customers: Customer[] = [
    {
        id: 'CUST-001', name: 'Nguyễn Văn An', email: 'an.nguyen@email.com', phone: '0901234567',
        address: '123 Nguyễn Huệ, Q.1, TP.HCM', createdAt: '2024-01-15', totalOrders: 12,
        totalSpent: 15_600_000, lastContact: '2025-01-10',
        tags: ['VIP', 'Loyal'], notes: ['Khách hàng thân thiết, ưu tiên hỗ trợ nhanh'],
    },
    {
        id: 'CUST-002', name: 'Trần Thị Bình', email: 'binh.tran@email.com', phone: '0912345678',
        address: '45 Lê Lợi, Q.3, TP.HCM', createdAt: '2024-03-20', totalOrders: 5,
        totalSpent: 4_200_000, lastContact: '2025-01-08',
        tags: ['New'], notes: [],
    },
    {
        id: 'CUST-003', name: 'Phạm Minh Cường', email: 'cuong.pham@email.com', phone: '0923456789',
        address: '78 Hai Bà Trưng, Hoàn Kiếm, Hà Nội', createdAt: '2023-11-01', totalOrders: 28,
        totalSpent: 42_500_000, lastContact: '2025-01-12',
        tags: ['VIP', 'Enterprise'], notes: ['Đại diện công ty ABC Corp', 'Cần hóa đơn VAT'],
    },
    {
        id: 'CUST-004', name: 'Lê Hoàng Dung', email: 'dung.le@email.com', phone: '0934567890',
        address: '12 Trần Phú, Q. Hải Châu, Đà Nẵng', createdAt: '2024-06-10', totalOrders: 3,
        totalSpent: 2_100_000, lastContact: '2025-01-05',
        tags: ['Returning'], notes: [],
    },
    {
        id: 'CUST-005', name: 'Võ Thị Hương', email: 'huong.vo@email.com', phone: '0945678901',
        address: '90 Nguyễn Trãi, Q. Thanh Xuân, Hà Nội', createdAt: '2024-08-22', totalOrders: 8,
        totalSpent: 9_800_000, lastContact: '2025-01-11',
        tags: ['Active'], notes: ['Thường hỏi về chính sách đổi trả'],
    },
];

const tickets: Ticket[] = [
    {
        id: 'TK-001', customerId: 'CUST-001', customerName: 'Nguyễn Văn An',
        subject: 'Không nhận được email xác nhận đơn hàng',
        description: 'Tôi đã đặt hàng từ 2 ngày trước nhưng chưa nhận được email xác nhận. Mã đơn hàng: ORD-2025-0089',
        status: 'open', priority: 'high', category: 'billing',
        replies: [
            { id: 'r1', message: 'Chào anh An, tôi sẽ kiểm tra ngay. Anh vui lòng xác nhận email đăng ký?', author: 'Trần Hỗ Trợ', isInternal: false, createdAt: '2025-01-10T09:30:00Z' },
        ],
        createdAt: '2025-01-10T08:00:00Z', updatedAt: '2025-01-10T09:30:00Z',
    },
    {
        id: 'TK-002', customerId: 'CUST-003', customerName: 'Phạm Minh Cường',
        subject: 'Yêu cầu xuất hóa đơn VAT cho đơn hàng tháng 12',
        description: 'Công ty tôi cần hóa đơn VAT cho tất cả đơn hàng trong tháng 12/2024. Mã số thuế: 0312345678',
        status: 'in_progress', priority: 'medium', category: 'billing',
        assigneeId: 'cs-u3', assigneeName: 'Lê Senior',
        replies: [
            { id: 'r2', message: 'Đã tiếp nhận yêu cầu. Đang xử lý với phòng kế toán.', author: 'Lê Senior', isInternal: false, createdAt: '2025-01-09T14:00:00Z' },
            { id: 'r3', message: 'Note: Cần confirm MST với phòng kế toán trước khi xuất.', author: 'Lê Senior', isInternal: true, createdAt: '2025-01-09T14:05:00Z' },
        ],
        createdAt: '2025-01-08T10:00:00Z', updatedAt: '2025-01-09T14:05:00Z',
    },
    {
        id: 'TK-003', customerId: 'CUST-002', customerName: 'Trần Thị Bình',
        subject: 'Sản phẩm bị lỗi, muốn đổi trả',
        description: 'Sản phẩm nhận được bị vỡ nắp. Tôi muốn đổi sản phẩm mới hoặc hoàn tiền.',
        status: 'waiting', priority: 'high', category: 'returns',
        assigneeId: 'cs-u2', assigneeName: 'Trần Hỗ Trợ',
        replies: [
            { id: 'r4', message: 'Chị Bình vui lòng gửi ảnh sản phẩm lỗi để em xác nhận.', author: 'Trần Hỗ Trợ', isInternal: false, createdAt: '2025-01-08T11:00:00Z' },
        ],
        createdAt: '2025-01-07T16:00:00Z', updatedAt: '2025-01-08T11:00:00Z',
    },
    {
        id: 'TK-004', customerId: 'CUST-005', customerName: 'Võ Thị Hương',
        subject: 'Tư vấn chính sách bảo hành sản phẩm điện tử',
        description: 'Tôi muốn hỏi về chính sách bảo hành cho máy lọc không khí mua tháng trước.',
        status: 'resolved', priority: 'low', category: 'general',
        assigneeId: 'cs-u2', assigneeName: 'Trần Hỗ Trợ',
        replies: [
            { id: 'r5', message: 'Sản phẩm được bảo hành 24 tháng. Chị mang sản phẩm + hoá đơn đến TTBH gần nhất.', author: 'Trần Hỗ Trợ', isInternal: false, createdAt: '2025-01-06T10:00:00Z' },
            { id: 'r6', message: 'Cảm ơn, tôi đã hiểu rồi.', author: 'Võ Thị Hương', isInternal: false, createdAt: '2025-01-06T10:30:00Z' },
        ],
        createdAt: '2025-01-05T14:00:00Z', updatedAt: '2025-01-06T10:30:00Z',
    },
    {
        id: 'TK-005', customerId: 'CUST-004', customerName: 'Lê Hoàng Dung',
        subject: 'Đơn hàng giao chậm 3 ngày',
        description: 'Đơn hàng ORD-2025-0075 đã quá hạn giao 3 ngày. Đề nghị kiểm tra và xử lý gấp.',
        status: 'open', priority: 'urgent', category: 'shipping',
        replies: [],
        createdAt: '2025-01-12T08:30:00Z', updatedAt: '2025-01-12T08:30:00Z',
    },
    {
        id: 'TK-006', customerId: 'CUST-001', customerName: 'Nguyễn Văn An',
        subject: 'Hỏi về chương trình loyalty points',
        description: 'Tôi có bao nhiêu điểm tích luỹ? Có thể đổi thành voucher không?',
        status: 'resolved', priority: 'low', category: 'general',
        assigneeId: 'cs-u2', assigneeName: 'Trần Hỗ Trợ',
        replies: [
            { id: 'r7', message: 'Anh An hiện có 1,560 điểm. Có thể đổi voucher 100K tại menu "Ưu đãi".', author: 'Trần Hỗ Trợ', isInternal: false, createdAt: '2025-01-04T09:00:00Z' },
        ],
        createdAt: '2025-01-03T15:00:00Z', updatedAt: '2025-01-04T09:00:00Z',
    },
];

const faqCategories: FAQCategory[] = [
    {
        id: 'faq-order', name: 'Đơn hàng & Giao hàng', icon: '📦',
        items: [
            { id: 'f1', question: 'Thời gian giao hàng là bao lâu?', answer: 'Đơn hàng nội thành TP.HCM & Hà Nội: 1-2 ngày. Tỉnh thành khác: 3-5 ngày làm việc. Đơn hàng quốc tế: 7-14 ngày.' },
            { id: 'f2', question: 'Làm sao theo dõi đơn hàng?', answer: 'Đăng nhập tài khoản → Mục "Đơn hàng" → Nhấn vào đơn hàng cần theo dõi. Hoặc nhập mã đơn hàng tại trang Tracking.' },
            { id: 'f3', question: 'Phí vận chuyển bao nhiêu?', answer: 'Miễn phí cho đơn hàng trên 500,000đ. Đơn dưới 500K: nội thành 25,000đ, ngoại thành 35,000đ.' },
        ],
    },
    {
        id: 'faq-return', name: 'Đổi trả & Hoàn tiền', icon: '🔄',
        items: [
            { id: 'f4', question: 'Chính sách đổi trả như thế nào?', answer: 'Đổi trả miễn phí trong 30 ngày kể từ ngày nhận hàng. Sản phẩm phải còn nguyên tem, nhãn mác và chưa qua sử dụng.' },
            { id: 'f5', question: 'Bao lâu nhận được tiền hoàn?', answer: 'Hoàn tiền qua ví điện tử: 1-3 ngày. Chuyển khoản ngân hàng: 5-7 ngày làm việc. Thẻ tín dụng: 7-14 ngày.' },
        ],
    },
    {
        id: 'faq-account', name: 'Tài khoản & Bảo mật', icon: '🔐',
        items: [
            { id: 'f6', question: 'Quên mật khẩu phải làm sao?', answer: 'Nhấn "Quên mật khẩu" tại trang đăng nhập → Nhập email → Kiểm tra email và làm theo hướng dẫn đặt lại mật khẩu.' },
            { id: 'f7', question: 'Làm sao bật xác thực 2 lớp?', answer: 'Vào Cài đặt tài khoản → Bảo mật → Bật "Xác thực 2 lớp" → Quét QR code bằng Google Authenticator.' },
        ],
    },
    {
        id: 'faq-payment', name: 'Thanh toán', icon: '💳',
        items: [
            { id: 'f8', question: 'Hỗ trợ những phương thức thanh toán nào?', answer: 'COD, chuyển khoản ngân hàng, Visa/Mastercard, MoMo, ZaloPay, VNPay, Apple Pay.' },
            { id: 'f9', question: 'Thanh toán trả góp có được không?', answer: 'Hỗ trợ trả góp 0% qua Visa/Mastercard cho đơn hàng từ 3,000,000đ. Kỳ hạn 3-12 tháng tuỳ ngân hàng.' },
        ],
    },
    {
        id: 'faq-warranty', name: 'Bảo hành', icon: '🛡️',
        items: [
            { id: 'f10', question: 'Thời gian bảo hành bao lâu?', answer: 'Thiết bị điện tử: 24 tháng. Phụ kiện: 6-12 tháng. Đồ gia dụng: 12 tháng. Xem chi tiết trên từng sản phẩm.' },
            { id: 'f11', question: 'Mang sản phẩm bảo hành ở đâu?', answer: 'Mang sản phẩm + hoá đơn đến bất kỳ TTBH uỷ quyền. Danh sách TTBH xem tại website mục "Bảo hành".' },
        ],
    },
];

// ─── Token management ───

const tokenStore = new Map<string, CsUser>();

function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

function getUserFromToken(authHeader?: string): CsUser | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return tokenStore.get(authHeader.slice(7)) ?? null;
}

// ─── Router ─────────────────────────────────────────────────

export const csRouter = new Hono();

// ── Auth ──
csRouter.post('/api/cs/auth/login', async (c) => {
    const { email, password } = await c.req.json<{ email: string; password: string }>();
    const user = csUsers.find(u => u.email === email && u.password === password);
    if (!user) return c.json({ error: 'Sai email hoặc mật khẩu' }, 401);
    const token = generateToken();
    tokenStore.set(token, user);
    return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, roleName: user.roleName } });
});

csRouter.get('/api/cs/auth/me', (c) => {
    const user = getUserFromToken(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    return c.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, roleName: user.roleName } });
});

// ── Stats ──
csRouter.get('/api/cs/stats', (c) => {
    return c.json({
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        waitingTickets: tickets.filter(t => t.status === 'waiting').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        totalCustomers: customers.length,
    });
});

// ── Tickets ──
csRouter.get('/api/cs/tickets', (c) => {
    const status = c.req.query('status');
    let list = [...tickets];
    if (status) list = list.filter(t => t.status === status);
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return c.json({ tickets: list, total: list.length });
});

csRouter.get('/api/cs/tickets/:id', (c) => {
    const ticket = tickets.find(t => t.id === c.req.param('id'));
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    return c.json({ ticket });
});

csRouter.post('/api/cs/tickets', async (c) => {
    const { customerId, subject, description, priority, category } = await c.req.json<{
        customerId: string; subject: string; description: string; priority?: string; category?: string;
    }>();
    const customer = customers.find(cu => cu.id === customerId);
    const now = new Date().toISOString();
    const newTicket: Ticket = {
        id: `TK-${String(tickets.length + 1).padStart(3, '0')}`,
        customerId,
        customerName: customer?.name ?? customerId,
        subject,
        description: description || '',
        status: 'open',
        priority: (priority as Ticket['priority']) || 'medium',
        category: category || 'general',
        replies: [],
        createdAt: now,
        updatedAt: now,
    };
    tickets.push(newTicket);
    return c.json({ ticket: newTicket }, 201);
});

csRouter.put('/api/cs/tickets/:id', async (c) => {
    const ticket = tickets.find(t => t.id === c.req.param('id'));
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const body = await c.req.json<{ status?: string; assigneeId?: string; priority?: string }>();
    if (body.status) ticket.status = body.status as Ticket['status'];
    if (body.priority) ticket.priority = body.priority as Ticket['priority'];
    if (body.assigneeId) {
        ticket.assigneeId = body.assigneeId;
        const agent = csUsers.find(u => u.id === body.assigneeId);
        if (agent) ticket.assigneeName = agent.name;
    }
    ticket.updatedAt = new Date().toISOString();
    return c.json({ ticket });
});

csRouter.post('/api/cs/tickets/:id/replies', async (c) => {
    const ticket = tickets.find(t => t.id === c.req.param('id'));
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
    const { message, isInternal } = await c.req.json<{ message: string; isInternal?: boolean }>();
    const user = getUserFromToken(c.req.header('Authorization'));
    const reply = {
        id: `r-${crypto.randomBytes(4).toString('hex')}`,
        message,
        author: user?.name ?? 'System',
        isInternal: isInternal ?? false,
        createdAt: new Date().toISOString(),
    };
    ticket.replies.push(reply);
    ticket.updatedAt = reply.createdAt;
    return c.json({ reply }, 201);
});

// ── Customers ──
csRouter.get('/api/cs/customers', (c) => {
    const q = c.req.query('q')?.toLowerCase();
    let list = [...customers];
    if (q) list = list.filter(cu => cu.name.toLowerCase().includes(q) || cu.email.toLowerCase().includes(q) || cu.phone.includes(q));
    return c.json({ customers: list, total: list.length });
});

csRouter.get('/api/cs/customers/:id', (c) => {
    const customer = customers.find(cu => cu.id === c.req.param('id'));
    if (!customer) return c.json({ error: 'Customer not found' }, 404);
    const custTickets = tickets.filter(t => t.customerId === customer.id).map(t => ({
        id: t.id, subject: t.subject, status: t.status, createdAt: t.createdAt,
    }));
    return c.json({ customer: { ...customer, tickets: custTickets } });
});

// ── FAQ ──
csRouter.get('/api/cs/faq', (c) => {
    return c.json({ categories: faqCategories });
});
