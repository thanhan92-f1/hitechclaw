import { useState, useEffect } from 'react';
import {
    BarChart3, Users, Pill, AlertTriangle, Stethoscope,
    TrendingUp, RefreshCw,
} from 'lucide-react';

// ─── API helpers ───

const API = '';
let _token: string | null = null;
function getToken() {
    if (!_token) _token = sessionStorage.getItem('his_token');
    return _token;
}

async function fetchReport(endpoint: string) {
    const res = await fetch(`${API}/api/his/reports/${endpoint}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
}

// ─── Simple Bar Chart (SVG) ───

function BarChartSVG({ labels, values, color = 'var(--his-primary)' }: {
    labels: string[]; values: number[]; color?: string;
}) {
    const max = Math.max(...values, 1);
    const crowded = labels.length > 8;
    const barW = Math.max(16, Math.min(60, 400 / labels.length));
    const h = 160;
    const labelH = crowded ? 60 : 30;
    const w = labels.length * (barW + 8) + 40;
    const maxLabelLen = crowded ? 6 : 12;

    return (
        <svg width="100%" viewBox={`0 0 ${w} ${h + labelH}`} className="overflow-visible">
            {values.map((v, i) => {
                const barH = (v / max) * h;
                const x = i * (barW + 8) + 20;
                return (
                    <g key={i}>
                        <rect x={x} y={h - barH} width={barW} height={barH} rx={4}
                            fill={color} opacity={0.85} />
                        <text x={x + barW / 2} y={h - barH - 6} textAnchor="middle"
                            fontSize="11" fill="var(--his-fg)" fontWeight="600">{v}</text>
                        {crowded ? (
                            <text
                                x={x + barW / 2} y={h + 6}
                                textAnchor="end" fontSize="9" fill="var(--his-fg-muted)"
                                transform={`rotate(-45, ${x + barW / 2}, ${h + 6})`}>
                                {labels[i].length > maxLabelLen ? labels[i].slice(0, maxLabelLen) + '…' : labels[i]}
                            </text>
                        ) : (
                            <text x={x + barW / 2} y={h + 16} textAnchor="middle"
                                fontSize="10" fill="var(--his-fg-muted)">
                                {labels[i].length > maxLabelLen ? labels[i].slice(0, maxLabelLen) + '…' : labels[i]}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Donut Chart (SVG) ───

function DonutChart({ labels, values, colors }: {
    labels: string[]; values: number[]; colors: string[];
}) {
    const total = values.reduce((s, v) => s + v, 0) || 1;
    const r = 60;
    const cx = 80;
    const cy = 80;
    let cumAngle = -90;

    // Filter out zero-value slices for rendering
    const nonZero = values.filter(v => v > 0);

    const slices = values.map((v, i) => {
        const angle = (v / total) * 360;
        const startAngle = cumAngle;
        cumAngle += angle;
        const endAngle = cumAngle;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const largeArc = angle > 180 ? 1 : 0;
        // When angle is ~360° (single category), SVG arc fails — use circle instead
        const isFull = angle >= 359.99;
        const d = isFull ? '' : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return { d, isFull, color: colors[i % colors.length], label: labels[i], value: v, pct: Math.round((v / total) * 100) };
    });

    return (
        <div className="flex items-center gap-4">
            <svg width="160" height="160" viewBox="0 0 160 160">
                {slices.map((s, i) => (
                    s.value > 0 && (
                        s.isFull
                            ? <circle key={i} cx={cx} cy={cy} r={r} fill={s.color} opacity={0.85} />
                            : <path key={i} d={s.d} fill={s.color} opacity={0.85} />
                    )
                ))}
                <circle cx={cx} cy={cy} r={35} fill="var(--his-bg-card)" />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="16" fontWeight="700"
                    fill="var(--his-fg)">{total}</text>
            </svg>
            <div className="space-y-1.5">
                {slices.filter(s => s.value > 0).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                        <div className="w-3 h-3 rounded" style={{ background: s.color }} />
                        <span style={{ color: 'var(--his-fg-muted)' }}>{s.label}</span>
                        <span className="font-semibold" style={{ color: 'var(--his-fg)' }}>{s.value} ({s.pct}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Stat Card ───

function StatCard({ label, value, icon: Icon, color, bg }: {
    label: string; value: string | number; icon: typeof Users; color: string; bg: string;
}) {
    return (
        <div className="rounded-xl p-4 border" style={{ background: 'var(--his-surface)', borderColor: 'var(--his-border)' }}>
            <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--his-fg)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--his-fg-muted)' }}>{label}</p>
        </div>
    );
}

// ─── Chart Card ───

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border p-5" style={{ background: 'var(--his-surface)', borderColor: 'var(--his-border)' }}>
            <h3 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--his-fg)' }}>{title}</h3>
            {children}
        </div>
    );
}

// ─── Main Reports Page ───

const DONUT_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ReportsPage() {
    const [overview, setOverview] = useState<any>(null);
    const [rxReport, setRxReport] = useState<any>(null);
    const [alertReport, setAlertReport] = useState<any>(null);
    const [encReport, setEncReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [ov, rx, al, en] = await Promise.all([
                fetchReport('overview'),
                fetchReport('prescriptions'),
                fetchReport('alerts'),
                fetchReport('encounters'),
            ]);
            setOverview(ov);
            setRxReport(rx);
            setAlertReport(al);
            setEncReport(en);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { loadAll(); }, []);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--his-primary)' }} />
            </div>
        );
    }

    const s = overview?.summary;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--his-primary-soft)' }}>
                        <BarChart3 size={20} style={{ color: 'var(--his-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: 'var(--his-fg)' }}>Báo cáo & Thống kê</h1>
                        <p className="text-xs" style={{ color: 'var(--his-fg-muted)' }}>Dashboard cho Ban Giám Đốc</p>
                    </div>
                </div>
                <button onClick={loadAll}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                    style={{ background: 'var(--his-primary-soft)', color: 'var(--his-primary)' }}>
                    <RefreshCw size={14} /> Làm mới
                </button>
            </div>

            {/* Summary Cards */}
            {s && (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
                    <StatCard label="Bệnh nhân" value={s.totalPatients} icon={Users} color="var(--his-primary)" bg="var(--his-primary-soft)" />
                    <StatCard label="Đơn thuốc" value={s.totalPrescriptions} icon={Pill} color="var(--his-success)" bg="var(--his-success-soft)" />
                    <StatCard label="Đơn đang hoạt động" value={s.activePrescriptions} icon={Pill} color="var(--his-info)" bg="#ecfeff" />
                    <StatCard label="Lượt khám" value={s.totalEncounters} icon={Stethoscope} color="#8b5cf6" bg="#f3e8ff" />
                    <StatCard label="Cảnh báo" value={s.totalAlerts} icon={AlertTriangle} color="var(--his-warning)" bg="var(--his-warning-soft)" />
                    <StatCard label="Cảnh báo nghiêm trọng" value={s.criticalAlerts} icon={AlertTriangle} color="var(--his-danger)" bg="var(--his-danger-soft)" />
                    <StatCard label="Nhân viên" value={s.totalUsers} icon={Users} color="#0d9488" bg="#ccfbf1" />
                </div>
            )}

            {/* Charts Row 1: Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {overview?.charts?.genderDistribution && (
                    <ChartCard title="Phân bố giới tính bệnh nhân">
                        <DonutChart
                            labels={overview.charts.genderDistribution.labels.map((l: string) =>
                                l === 'male' ? 'Nam' : l === 'female' ? 'Nữ' : l === 'other' ? 'Khác' : 'Chưa rõ'
                            )}
                            values={overview.charts.genderDistribution.values}
                            colors={['#0ea5e9', '#ec4899', '#f59e0b', '#94a3b8']}
                        />
                    </ChartCard>
                )}

                {overview?.charts?.ageGroups && (
                    <ChartCard title="Phân bố nhóm tuổi">
                        <BarChartSVG
                            labels={overview.charts.ageGroups.labels}
                            values={overview.charts.ageGroups.values}
                            color="#8b5cf6"
                        />
                    </ChartCard>
                )}
            </div>

            {/* Charts Row 2: Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {overview?.charts?.departmentStaff && (
                    <ChartCard title="Nhân sự theo phòng ban">
                        <BarChartSVG
                            labels={overview.charts.departmentStaff.labels}
                            values={overview.charts.departmentStaff.values}
                            color="#0d9488"
                        />
                    </ChartCard>
                )}

                {encReport?.charts?.byStatus && (
                    <ChartCard title="Trạng thái lượt khám">
                        <DonutChart
                            labels={encReport.charts.byStatus.labels.map((l: string) =>
                                l === 'completed' ? 'Hoàn thành' : l === 'in-progress' ? 'Đang khám' : l
                            )}
                            values={encReport.charts.byStatus.values}
                            colors={DONUT_COLORS}
                        />
                    </ChartCard>
                )}
            </div>

            {/* Charts Row 3: Prescriptions & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {rxReport?.charts?.byMedication && rxReport.charts.byMedication.labels.length > 0 && (
                    <ChartCard title="Đơn thuốc theo loại thuốc">
                        <BarChartSVG
                            labels={rxReport.charts.byMedication.labels}
                            values={rxReport.charts.byMedication.values}
                            color="var(--his-success)"
                        />
                    </ChartCard>
                )}

                {alertReport?.charts?.bySeverity && alertReport.charts.bySeverity.labels.length > 0 && (
                    <ChartCard title="Cảnh báo theo mức độ">
                        <DonutChart
                            labels={alertReport.charts.bySeverity.labels.map((l: string) =>
                                l === 'critical' ? 'Nghiêm trọng' : l === 'high' ? 'Cao' : l === 'moderate' ? 'Trung bình' : l
                            )}
                            values={alertReport.charts.bySeverity.values}
                            colors={['#ef4444', '#f59e0b', '#0ea5e9', '#22c55e']}
                        />
                    </ChartCard>
                )}
            </div>

            {/* Charts Row 4: Top patients & Encounter timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {encReport?.charts?.topPatients && encReport.charts.topPatients.labels.length > 0 && (
                    <ChartCard title="Bệnh nhân khám nhiều nhất">
                        <BarChartSVG
                            labels={encReport.charts.topPatients.labels}
                            values={encReport.charts.topPatients.values}
                            color="#0ea5e9"
                        />
                    </ChartCard>
                )}

                {encReport?.charts?.byDate && encReport.charts.byDate.labels.length > 0 && (
                    <ChartCard title="Lượt khám theo ngày">
                        <BarChartSVG
                            labels={encReport.charts.byDate.labels}
                            values={encReport.charts.byDate.values}
                            color="#8b5cf6"
                        />
                    </ChartCard>
                )}
            </div>

            {/* Prescription Summary */}
            {rxReport?.summary && (
                <div className="rounded-xl border p-5 mb-4" style={{ background: 'var(--his-surface)', borderColor: 'var(--his-border)' }}>
                    <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--his-fg)' }}>
                        <TrendingUp size={14} className="inline mr-2" />
                        Tóm tắt đơn thuốc
                    </h3>
                    <div className="flex gap-6 text-[13px]">
                        <div>
                            <span style={{ color: 'var(--his-fg-muted)' }}>Tổng đơn: </span>
                            <span className="font-semibold" style={{ color: 'var(--his-fg)' }}>{rxReport.summary.total}</span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--his-fg-muted)' }}>Đơn có override cảnh báo: </span>
                            <span className="font-semibold" style={{ color: 'var(--his-danger)' }}>{rxReport.summary.overridden}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
