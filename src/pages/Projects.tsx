import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Users,
  ChevronRight,
  PieChart as PieChartIcon,
  LayoutGrid,
  Briefcase,
  Banknote,
  FolderKanban,
} from 'lucide-react';
import { ProjectCreateModal } from '../components/project/ProjectCreateModal';
import { AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import { PageHeader, FilterBar, StatusBadge, EmptyState, Btn } from '../components/ui';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

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
    const q = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !q ||
        project.name.toLowerCase().includes(q) ||
        project.code.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'Tất cả trạng thái' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'Đang thực hiện').length;
    const filtered = filteredProjects.length;
    return { total, active, filtered };
  }, [projects, filteredProjects]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <PageHeader
        breadcrumb="Tổng quan"
        title="Quản lý dự án"
        description="Theo dõi dự án, tài chính và truy cập nhanh không gian làm việc (Kanban, thưởng, báo cáo sprint)."
        actions={
          <Btn icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
            Tạo dự án mới
          </Btn>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#148922]">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Tổng dự án</p>
            <p className="text-xl font-black text-[#1A202C]">{summary.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#0369A1]">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Đang thực hiện</p>
            <p className="text-xl font-black text-[#1A202C]">{summary.active}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B]">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Sau lọc</p>
            <p className="text-xl font-black text-[#1A202C]">{summary.filtered}</p>
          </div>
        </div>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên hoặc mã dự án..."
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
            ],
          },
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onEdit={() => handleEditProject(project)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {isCreateModalOpen && (
          <ProjectCreateModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setInitialData(null);
            }}
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
  const pm = employees.find((e) => e.id === project.pmId);

  const plannedIncome = project.budget || 0;
  const plannedExpense = project.costPlan?.reduce((sum, item) => sum + item.plannedAmount, 0) || 0;
  const plannedProfit = plannedIncome - plannedExpense;
  const plannedMargin = plannedIncome > 0 ? Number(((plannedProfit / plannedIncome) * 100).toFixed(1)) : 0;

  const isNegativeProfit = plannedProfit < 0;
  const projectMembers = project.members || [];
  const canOpen = project.status !== 'Tạm dừng';

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-all hover:border-[#148922]/30 hover:shadow-md"
      role="button"
      tabIndex={0}
      onClick={() => {
        if (canOpen) navigate(`/projects/${project.id}/board`);
      }}
      onKeyDown={(e) => {
        if (canOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          navigate(`/projects/${project.id}/board`);
        }
      }}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5] text-lg font-bold text-[#148922] transition-colors group-hover:bg-[#148922] group-hover:text-white">
              {project.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-bold text-[#1A202C]">{project.name}</h3>
                {project.contractId && (
                  <span className="shrink-0 rounded bg-[#D1FAE5] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#148922]">
                    Hợp đồng
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] font-bold text-[#94A3B8]">{project.code}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#718096]">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">PM: {pm?.name ?? 'N/A'}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={project.status} />
            {project.status === 'Đang thực hiện' && (
              <div className="flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}/board`);
                  }}
                  className="rounded-md p-1.5 text-[#718096] transition-colors hover:bg-white hover:text-[#148922]"
                  title="Bảng Kanban"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}/bonuses`);
                  }}
                  className="rounded-md p-1.5 text-[#718096] transition-colors hover:bg-white hover:text-[#F59E0B]"
                  title="Thưởng"
                >
                  <Banknote className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}/sprint-report`);
                  }}
                  className="rounded-md p-1.5 text-[#718096] transition-colors hover:bg-white hover:text-[#10B981]"
                  title="Sprint report"
                >
                  <PieChartIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#F8FAFC] p-2.5">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#718096]">DT dự kiến</p>
            <p className="line-clamp-2 text-[11px] font-bold leading-tight text-[#1A202C]">{fmt(plannedIncome)}</p>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] p-2.5">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[#718096]">CP dự kiến</p>
            <p className="line-clamp-2 text-[11px] font-bold leading-tight text-[#1A202C]">{fmt(plannedExpense)}</p>
          </div>
          <div
            className={`rounded-xl p-2.5 ${isNegativeProfit ? 'bg-red-50' : 'bg-emerald-50'}`}
          >
            <p
              className={`mb-1 text-[9px] font-bold uppercase tracking-wider ${isNegativeProfit ? 'text-[#EF4444]' : 'text-[#10B981]'}`}
            >
              LN dự kiến
            </p>
            <p
              className={`line-clamp-2 text-[11px] font-bold leading-tight ${isNegativeProfit ? 'amount-negative' : 'amount-positive'}`}
            >
              {fmt(plannedProfit)}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <div className="flex items-center gap-1.5 text-[#718096]">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {project.startDate} → {project.endDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E8F0]">
              <div className="h-full rounded-full bg-[#148922]" style={{ width: `${Math.min(plannedMargin, 100)}%` }} />
            </div>
            <span className="text-[11px] font-bold text-[#4A5568]">{plannedMargin}%</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#F1F5F9] bg-[#FAFAFA] px-4 py-3">
        <div className="flex -space-x-2">
          {projectMembers.slice(0, 4).map((m, i) => {
            const emp = employees.find((e) => e.id === m.employeeId);
            return (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#ECFDF5] text-[9px] font-bold text-[#148922]"
              >
                {emp?.name?.charAt(0) ?? '?'}
              </div>
            );
          })}
          {projectMembers.length > 4 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#F8FAFC] text-[9px] font-bold text-[#718096]">
              +{projectMembers.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-[12px] font-bold text-[#94A3B8] underline-offset-2 hover:text-[#148922] hover:underline"
          >
            Sửa
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project.id}/board`);
            }}
            className="flex items-center gap-1 rounded-lg bg-[#148922] px-3 py-1.5 text-[12px] font-bold text-white transition-all hover:bg-[#0E6318]"
          >
            Vào board
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
