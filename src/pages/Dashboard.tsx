import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  LayoutGrid,
  FileText,
  Plus,
  Clock,
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

const cashFlowData = [
  { month: 'Jan', revenue: 450000, expenses: 320000 },
  { month: 'Feb', revenue: 520000, expenses: 380000 },
  { month: 'Mar', revenue: 480000, expenses: 410000 },
  { month: 'Apr', revenue: 610000, expenses: 450000 },
  { month: 'May', revenue: 590000, expenses: 420000 },
  { month: 'Jun', revenue: 720000, expenses: 490000 },
];

const COLORS = ['#003366', '#FF6600', '#00C49F', '#FFBB28', '#FF8042'];

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, contracts, approvalRequests, employees } = useStore();

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'Đang thực hiện').length;
    const pendingApprovals = approvalRequests.filter(a => a.status === 'Pending').length;
    const totalRevenue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalProfit = projects.reduce((sum, p) => sum + (p.profit || 0), 0);

    return {
      activeProjects,
      pendingApprovals,
      totalRevenue,
      totalProfit,
      signedContracts: contracts.length
    };
  }, [projects, contracts, approvalRequests]);

  const projectProfitData = useMemo(() => {
    return projects
      .filter(p => p.status === 'Đang thực hiện' || p.status === 'Đã hoàn thành')
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        profit: p.profit || 0
      }));
  }, [projects]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bảng điều khiển Tài chính</h2>
          <p className="text-gray-500">Tổng quan về hiệu suất tài chính và tình trạng dự án của ECOTECH.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Tháng 3, 2026</span>
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          <button className="text-xs font-bold text-[#003366] hover:underline">Thay đổi kỳ</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng Ngân sách Dự án" 
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.totalRevenue)} 
          change="+12.5%" 
          isPositive={true} 
          icon={TrendingUp}
          color="blue"
        />
        <StatCard 
          title="Lợi nhuận dự kiến" 
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.totalProfit)} 
          change="+24.1%" 
          isPositive={true} 
          icon={DollarSign}
          color="emerald"
        />
        <StatCard 
          title="Hợp đồng đã ký" 
          value={stats.signedContracts.toString()} 
          change="+3" 
          isPositive={true} 
          icon={FileText}
          color="orange"
        />
        <StatCard 
          title="Dự án đang hoạt động" 
          value={stats.activeProjects.toString()} 
          change="+2" 
          isPositive={true} 
          icon={Briefcase}
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <QuickAction 
          title="Hợp đồng" 
          icon={FileText} 
          color="bg-orange-50 text-orange-600" 
          link="/contracts"
        />
        <QuickAction 
          title="Phê duyệt" 
          icon={CheckCircle2} 
          color="bg-amber-50 text-amber-600" 
          link="/approvals"
          badge={stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined}
        />
        <QuickAction 
          title="Thưởng hiệu suất" 
          icon={DollarSign} 
          color="bg-emerald-50 text-emerald-600" 
          link="/projects"
        />
        <QuickAction 
          title="Báo cáo Sprint" 
          icon={TrendingUp} 
          color="bg-indigo-50 text-indigo-600" 
          link="/projects"
        />
        <QuickAction 
          title="Xử lý Lương" 
          icon={Briefcase} 
          color="bg-gray-50 text-gray-600" 
          link="/payroll"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Dòng tiền hàng tháng</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[#003366] rounded-full"></div>
                <span className="text-gray-500">Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[#FF6600] rounded-full"></div>
                <span className="text-gray-500">Chi phí</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#003366" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#FF6600" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Top Dự án theo Lợi nhuận</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProfitData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#4b5563'}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="profit" fill="#003366" radius={[0, 4, 4, 0]}>
                  {projectProfitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Alerts and Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Cập nhật dự án gần đây</h3>
              <button 
                onClick={() => navigate('/projects')}
                className="text-sm font-bold text-[#003366] hover:underline"
              >
                Xem tất cả
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Tên dự án</th>
                    <th className="px-6 py-4">Quản lý dự án</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Ngân sách</th>
                    <th className="px-6 py-4">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.slice(0, 4).map(project => (
                    <ProjectRow 
                      key={project.id}
                      project={project}
                      pm={employees.find(e => e.id === project.pmId)?.name || 'N/A'}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Hợp đồng mới ký</h3>
              <button 
                onClick={() => navigate('/contracts')}
                className="text-sm font-bold text-[#FF6600] hover:underline"
              >
                Xem tất cả
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Mã HĐ</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Giá trị</th>
                    <th className="px-6 py-4">Ngày ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contracts.slice(0, 3).map(contract => (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/contracts')}>
                      <td className="px-6 py-4 font-semibold text-gray-900">{contract.id}</td>
                      <td className="px-6 py-4 text-gray-600">VinGroup</td>
                      <td className="px-6 py-4 text-gray-900 font-bold">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(contract.value)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{contract.signedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Cảnh báo Tài chính</h3>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            {stats.pendingApprovals > 0 && (
              <AlertItem 
                title="Phê duyệt đang chờ" 
                desc={`Có ${stats.pendingApprovals} yêu cầu phê duyệt đang chờ bạn xử lý.`} 
                type="warning"
                onClick={() => navigate('/approvals')}
              />
            )}
            <AlertItem 
              title="Vượt ngân sách" 
              desc="Dự án Alpha đã vượt ngân sách hàng tháng 15%." 
              type="error"
            />
            <AlertItem 
              title="Đến hạn trả lương" 
              desc="Lương tháng 3 sẽ đến hạn thanh toán trong 3 ngày tới." 
              type="info"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function ProjectRow({ project, pm }: any) {
  const navigate = useNavigate();
  const statusColors: any = {
    'Đang thực hiện': "bg-blue-100 text-blue-700",
    'Đã hoàn thành': "bg-emerald-100 text-emerald-700",
    'Tạm dừng': "bg-orange-100 text-orange-700",
    'Chờ duyệt': "bg-amber-100 text-amber-700",
    'Draft': "bg-gray-100 text-gray-500",
  };

  return (
    <tr 
      onClick={() => navigate(`/projects`)}
      className="hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4 font-semibold text-gray-900">{project.name}</td>
      <td className="px-6 py-4 text-gray-600">{pm}</td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-900 font-medium">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(project.budget)}
      </td>
      <td className="px-6 py-4 text-emerald-600 font-bold">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(project.profit || 0)}
      </td>
    </tr>
  );
}

function AlertItem({ title, desc, type, onClick }: any) {
  const typeStyles: any = {
    error: "border-red-100 bg-red-50 text-red-800",
    warning: "border-orange-100 bg-orange-50 text-orange-800",
    info: "border-blue-100 bg-blue-50 text-blue-800",
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border ${typeStyles[type]} ${onClick ? 'cursor-pointer hover:shadow-sm transition-all' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-sm">{title}</h5>
        {onClick && <ArrowUpRight className="w-3 h-3" />}
      </div>
      <p className="text-xs mt-1 opacity-80">{desc}</p>
    </div>
  );
}

function QuickAction({ title, icon: Icon, color, link, badge }: any) {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(link)}
      className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#003366]/20 transition-all group relative"
    >
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          {badge}
        </span>
      )}
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{title}</span>
    </button>
  );
}
