import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
  PieChart as PieChartIcon,
  LayoutGrid,
  Briefcase,
  MoreVertical,
  Banknote
} from 'lucide-react';
import { ProjectCreateModal } from '../components/project/ProjectCreateModal';
import { AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import { PageHeader, FilterBar, StatusBadge, EmptyState, Btn } from '../components/ui';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');

  const handleEditProject = (project: Project) => {
    setInitialData(project);
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    if (location.state?.fromContract) {
      setInitialData(location.state.fromContract);
      setIsCreateModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Tất cả trạng thái' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý dự án"
        description="Theo dõi và quản lý tất cả các dự án ECOTECH và sức khỏe tài chính."
        actions={
          <Btn icon={Plus} onClick={() => setIsCreateModalOpen(true)}>Tạo dự án mới</Btn>
        }
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tên dự án..."
        filters={[
          {
            key: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Tất cả trạng thái', value: 'Tất cả trạng thái' },
              { label: 'Đang thực hiện', value: 'Đang thực hiện' },
              { label: 'Đã hoàn thành', value: 'Đã hoàn thành' },
              { label: 'Tạm dừng', value: 'Tạm dừng' },
              { label: 'Đang chờ', value: 'Đang chờ' },
            ]
          }
        ]}
      />

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Không có dự án"
          description="Chưa có dự án nào phù hợp với bộ lọc."
          action={<Btn icon={Plus} onClick={() => setIsCreateModalOpen(true)}>Tạo dự án mới</Btn>}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onEdit={() => handleEditProject(project)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {isCreateModalOpen && (
          <ProjectCreateModal
            isOpen={isCreateModalOpen}
            onClose={() => { setIsCreateModalOpen(false); setInitialData(null); }}
            initialData={initialData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const ProjectCard: React.FC<{ project: Project; onEdit: () => void }> = ({ project, onEdit }) => {
  const navigate = useNavigate();
  const { employees } = useStore();
  const pm = employees.find(e => e.id === project.pmId);

  const actualIncome = project.actualIncome !== undefined ? project.actualIncome : (project.revenue || 0);
  const actualExpense = project.actualExpense !== undefined ? project.actualExpense : (project.expenses || 0);
  const actualProfit = actualIncome - actualExpense;
  const actualMargin = actualIncome > 0 ? Number(((actualProfit / actualIncome) * 100).toFixed(1)) : 0;

  const isNegativeProfit = actualProfit < 0;

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
      onClick={() => { if (project.status !== 'Tạm dừng') navigate(`/projects/${project.id}/board`); }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#ECFDF5] rounded-[10px] flex items-center justify-center text-[#148922] font-bold text-lg group-hover:bg-[#148922] group-hover:text-white transition-all">
              {project.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-[15px] text-[#1A202C]">{project.name}</h3>
                {project.contractId && (
                  <span className="px-1.5 py-0.5 bg-[#D1FAE5] text-[#148922] rounded text-[9px] font-bold uppercase tracking-widest">Hợp đồng</span>
                )}
              </div>
              <p className="text-[13px] text-[#718096] flex items-center gap-1">
                <Users className="w-3 h-3" /> PM: {pm?.name || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.status === 'Đang thực hiện' && (
              <div className="flex items-center bg-[#F8FAFC] rounded-[8px] p-0.5 border border-[#E2E8F0]">
                <button onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/board`); }} className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-white rounded-[6px] transition-all" title="Bảng Kanban">
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/bonuses`); }} className="p-1.5 text-[#718096] hover:text-[#F59E0B] hover:bg-white rounded-[6px] transition-all" title="Thưởng">
                  <Banknote className="w-4 h-4 text-[#718096]" />
                </button>
                <button onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/sprint-report`); }} className="p-1.5 text-[#718096] hover:text-[#10B981] hover:bg-white rounded-[6px] transition-all" title="Sprint">
                  <PieChartIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-[#F8FAFC] rounded-[8px]">
            <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-1">Doanh thu dự kiến</p>
            <p className="text-[13px] font-bold text-[#1A202C]">{fmt(project.budget)}</p>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-[8px]">
            <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-1">Chi phí dự kiến</p>
            <p className="text-[13px] font-bold text-[#1A202C]">{fmt(actualExpense)}</p>
          </div>
          <div className={`p-3 rounded-[8px] ${isNegativeProfit ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isNegativeProfit ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>Lợi nhuận</p>
            <p className={`text-[13px] font-bold ${isNegativeProfit ? 'amount-negative' : 'amount-positive'}`}>{fmt(actualProfit)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-1.5 text-[#718096]">
            <Calendar className="w-3.5 h-3.5" />
            <span>{project.startDate} → {project.endDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#148922] rounded-full" style={{ width: `${actualMargin}%` }} />
            </div>
            <span className="text-[12px] font-bold text-[#4A5568]">{actualMargin}%</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((m, i) => {
            const emp = employees.find(e => e.id === m.employeeId);
            return (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-[#ECFDF5] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#148922]">{emp?.name?.charAt(0) || '?'}</span>
              </div>
            );
          })}
          {project.members.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-[#F8FAFC] flex items-center justify-center text-[9px] font-bold text-[#718096]">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}/board`); }}
          className="flex items-center gap-1 text-[13px] font-bold text-[#148922] hover:gap-2 transition-all"
        >
          Vào không gian làm việc <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
