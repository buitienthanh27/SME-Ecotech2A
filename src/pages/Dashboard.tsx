import React, { useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertCircle,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useStore } from '../store/useStore';
import { KPICard, StatusBadge, PageHeader } from '../components/ui';

const cashFlowData = [
  { month: 'Jan', revenue: 450000, expenses: 320000 },
  { month: 'Feb', revenue: 520000, expenses: 380000 },
  { month: 'Mar', revenue: 480000, expenses: 410000 },
  { month: 'Apr', revenue: 610000, expenses: 450000 },
  { month: 'May', revenue: 590000, expenses: 420000 },
  { month: 'Jun', revenue: 720000, expenses: 490000 },
];

const CHART_COLORS = ['#148922', '#50b00a', '#F59E0B', '#EF4444', '#3B82F6'];

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, contracts, approvalRequests, employees } = useStore();

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'Đang thực hiện').length;
    const pendingApprovals = approvalRequests.filter(a => a.status === 'Pending').length;
    const totalRevenue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalProfit = projects.reduce((sum, p) => {
      const actualIncome = p.actualIncome !== undefined ? p.actualIncome : (p.revenue || 0);
      const actualExpense = p.actualExpense !== undefined ? p.actualExpense : (p.expenses || 0);
      return sum + (actualIncome - actualExpense);
    }, 0);
    return { activeProjects, pendingApprovals, totalRevenue, totalProfit, signedContracts: contracts.length };
  }, [projects, contracts, approvalRequests]);

  const riskAlerts = useMemo(() => {
    const alerts: string[] = [];
    const today = new Date();
    for (const p of projects) {
      const tasks = p.tasks || [];
      const overdue = tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < today &&
          t.status !== 'Done' &&
          t.status !== 'Done'
      );
      if (overdue.length) alerts.push(`${p.name}: ${overdue.length} task quá hạn`);
      const planned = p.costPlan?.reduce((s, c) => s + c.plannedAmount, 0) || 0;
      if (planned > 0 && (p.actualExpense || 0) > planned) {
        alerts.push(`${p.name}: chi thực tế vượt kế hoạch chi phí`);
      }
    }
    return alerts.slice(0, 6);
  }, [projects]);

  const topProfitableProjects = useMemo(() => [...projects]
    .map(p => {
      const actualIncome = p.actualIncome !== undefined ? p.actualIncome : (p.revenue || 0);
      const actualExpense = p.actualExpense !== undefined ? p.actualExpense : (p.expenses || 0);
      const calculatedProfit = actualIncome - actualExpense;
      const calculatedMargin = actualIncome > 0 ? Number(((calculatedProfit / actualIncome) * 100).toFixed(1)) : 0;
      return { ...p, calculatedProfit, calculatedMargin };
    })
    .sort((a, b) => b.calculatedProfit - a.calculatedProfit)
    .slice(0, 5),
    [projects]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển Tài chính"
        description="Tổng quan về hiệu suất tài chính và tình trạng dự án của ECOTECH."
        actions={
          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-2 rounded-[8px] shadow-sm text-[13px] text-[#4A5568]">
            <Calendar className="w-4 h-4 text-[#718096]" />
            <span className="font-medium">Tháng 3, 2026</span>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Tổng Doanh thu Dự án" value={fmt(stats.totalRevenue)} change="12.5%" isPositive icon={TrendingUp} iconBg="#ECFDF5" iconColor="#148922" />
        <KPICard title="Lợi nhuận dự kiến" value={fmt(stats.totalProfit)} change="24.1%" isPositive icon={DollarSign} iconBg="#f0fdf4" iconColor="#50b00a" />
        <KPICard title="Hợp đồng đã ký" value={String(stats.signedContracts)} change="+3" isPositive icon={FileText} iconBg="#FEF3C7" iconColor="#F59E0B" />
        <KPICard title="Dự án đang hoạt động" value={String(stats.activeProjects)} change="+2" isPositive icon={Briefcase} iconBg="#DBEAFE" iconColor="#3B82F6" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { title: 'Hợp đồng', icon: FileText, bg: '#FEF3C7', color: '#D97706', link: '/contracts' },
          { title: 'Phê duyệt', icon: CheckCircle2, bg: '#FEE2E2', color: '#DC2626', link: '/approvals', badge: stats.pendingApprovals },
          { title: 'Thưởng hiệu suất', icon: DollarSign, bg: '#f0fdf4', color: '#166534', link: '/projects' },
          { title: 'Báo cáo Sprint', icon: TrendingUp, bg: '#ECFDF5', color: '#148922', link: '/projects' },
          { title: 'Xử lý Lương', icon: Briefcase, bg: '#F1F5F9', color: '#475569', link: '/payroll' },
        ].map(item => (
          <button
            key={item.title}
            onClick={() => navigate(item.link)}
            className="flex flex-col items-center gap-2.5 py-4 px-3 bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm hover:shadow-md hover:border-[#148922]/30 transition-all group relative"
          >
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {item.badge}
              </span>
            )}
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: item.bg }}>
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <span className="text-[11px] font-bold text-[#4A5568] uppercase tracking-wider text-center leading-tight">{item.title}</span>
          </button>
        ))}
      </div>

      {riskAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-[12px] p-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
            <AlertCircle className="w-4 h-4" /> Cảnh báo vận hành / tài chính
          </div>
          <ul className="list-disc list-inside text-[13px] text-amber-950 space-y-1">
            {riskAlerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[15px] text-[#1A202C]">Dòng tiền hàng tháng</h3>
            <div className="flex items-center gap-4 text-[12px]">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#148922] rounded-full" /><span className="text-[#718096]">Doanh thu</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#50b00a] rounded-full" /><span className="text-[#718096]">Chi phí</span></div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0' }} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }} />
                <Bar dataKey="revenue" fill="#148922" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#e8cd06ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
          <h3 className="font-bold text-[15px] text-[#1A202C] mb-5">Top Dự án theo Lợi nhuận</h3>
          <div className="overflow-x-auto h-[256px]">
            <table className="w-full text-[13px] text-left">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  <th className="py-2 text-[#718096] font-bold w-8">#</th>
                  <th className="py-2 text-[#718096] font-bold">Dự án</th>
                  <th className="py-2 text-right text-[#718096] font-bold">Lợi nhuận</th>
                  <th className="py-2 text-right text-[#718096] font-bold">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {topProfitableProjects.map((p, index) => {
                  const margin = p.calculatedMargin || 0;
                  const isPositive = margin >= 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 font-bold text-[#718096]">{index + 1}</td>
                      <td className="py-3 font-bold text-[#1A202C] truncate max-w-[120px]" title={p.name}>{p.name}</td>
                      <td className="py-3 text-right font-black text-[#1A202C]">{p.calculatedProfit?.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 text-right">
                        <div className={`inline-flex items-center justify-end gap-1 font-bold ${isPositive ? 'text-[#148922]' : 'text-[#EF4444]'}`}>
                          <span>{margin}%</span>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Projects Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-bold text-[15px] text-[#1A202C]">Cập nhật dự án gần đây</h3>
              <button onClick={() => navigate('/projects')} className="text-[13px] font-bold text-[#148922] hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Tên dự án</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Quản lý</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Trạng thái</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Doanh thu</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {projects.slice(0, 4).map(project => (
                    <tr key={project.id} onClick={() => navigate('/projects')} className="hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#1A202C]">{project.name}</td>
                      <td className="px-5 py-3 text-[#718096]">{employees.find(e => e.id === project.pmId)?.name || 'N/A'}</td>
                      <td className="px-5 py-3"><StatusBadge status={project.status} /></td>
                      <td className="px-5 py-3 text-[#1A202C] font-medium">{fmt(project.budget)}</td>
                      <td className="px-5 py-3 font-bold text-[#50b00a]">{fmt(project.profit || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Contracts Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-bold text-[15px] text-[#1A202C]">Hợp đồng mới ký</h3>
              <button onClick={() => navigate('/contracts')} className="text-[13px] font-bold text-[#148922] hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Mã HĐ</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Giá trị</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide">Ngày ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {contracts.slice(0, 3).map(contract => (
                    <tr key={contract.id} onClick={() => navigate('/contracts')} className="hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#1A202C]">{contract.id}</td>
                      <td className="px-5 py-3 font-bold text-[#50b00a]">{fmt(contract.value)}</td>
                      <td className="px-5 py-3 text-[#718096] text-[12px]">{contract.signedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[15px] text-[#1A202C]">Cảnh báo Tài chính</h3>
            <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div className="space-y-3">
            {stats.pendingApprovals > 0 && (
              <AlertItem title="Phê duyệt đang chờ" desc={`${stats.pendingApprovals} yêu cầu đang chờ xử lý.`} type="warning" onClick={() => navigate('/approvals')} />
            )}
            <AlertItem title="Vượt ngân sách" desc="Dự án Alpha vượt ngân sách tháng 15%." type="error" />
            <AlertItem title="Đến hạn trả lương" desc="Lương tháng 3 đến hạn trong 3 ngày." type="info" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ title, desc, type, onClick }: { title: string; desc: string; type: 'error' | 'warning' | 'info'; onClick?: () => void }) {
  const styles: Record<string, string> = {
    error: 'border-[#FEE2E2] bg-red-50 text-red-800',
    warning: 'border-[#FEF3C7] bg-amber-50 text-amber-800',
    info: 'border-[#ECFDF5] bg-green-50 text-green-800',
  };
  return (
    <div onClick={onClick} className={`p-3 rounded-[8px] border ${styles[type]} ${onClick ? 'cursor-pointer hover:shadow-sm transition-all' : ''}`}>
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-[13px]">{title}</h5>
        {onClick && <ArrowUpRight className="w-3.5 h-3.5" />}
      </div>
      <p className="text-[12px] mt-0.5 opacity-80">{desc}</p>
    </div>
  );
}
