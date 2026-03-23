import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  Users, 
  DollarSign,
  ChevronRight,
  PieChart as PieChartIcon,
  LayoutGrid,
  AlertCircle,
  Clock
} from 'lucide-react';
import { ProjectCreateModal } from '../components/project/ProjectCreateModal';
import { AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Project } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
      // Clear state after reading
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý dự án</h2>
          <p className="text-gray-500">Theo dõi và quản lý tất cả các dự án ECOTECH và sức khỏe tài chính của chúng.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
        >
          <Plus className="w-5 h-5" />
          Tạo dự án mới
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên dự án..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
          <Filter className="w-4 h-4" />
          Bộ lọc
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Trạng thái:</span>
          <select 
            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Tất cả trạng thái</option>
            <option>Đang thực hiện</option>
            <option>Đã hoàn thành</option>
            <option>Tạm dừng</option>
            <option>Đang chờ</option>
            <option>Draft</option>
            <option>Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onEdit={() => handleEditProject(project)}
          />
        ))}
      </div>

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
  
  const statusColors: any = {
    'Đang thực hiện': "bg-blue-100 text-blue-700",
    'Đã hoàn thành': "bg-emerald-100 text-emerald-700",
    'Tạm dừng': "bg-orange-100 text-orange-700",
    'Đang chờ': "bg-gray-100 text-gray-700",
    'Draft': "bg-gray-100 text-gray-500",
    'Chờ duyệt': "bg-amber-100 text-amber-700",
  };

  const pm = employees.find(e => e.id === project.pmId);
  const budgetFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.budget);
  const isNegativeProfit = (project.profit || 0) < 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
      {/* Status Banners */}
      {project.status === 'Chờ duyệt' && (
        <div className="bg-amber-50 px-6 py-2 border-b border-amber-100 flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          Dự án đang chờ CEO phê duyệt. Chưa thể giao task.
        </div>
      )}
      {project.status === 'Draft' && project.rejectionNote && (
        <div className="bg-red-50 px-6 py-2 border-b border-red-100 flex items-center gap-2 text-red-700 text-[10px] font-bold uppercase tracking-wider">
          <AlertCircle className="w-3 h-3" />
          Kế hoạch bị từ chối: {project.rejectionNote}. Vui lòng chỉnh sửa và gửi lại.
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#003366] font-bold text-xl group-hover:bg-[#003366] group-hover:text-white transition-all">
              {project.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                {project.contractId && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-widest border border-blue-100">
                    Hợp đồng
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> PM: {pm?.name || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[project.status]}`}>
              {project.status}
            </span>
            {project.status === 'Đang thực hiện' && (
              <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}/board`);
                  }}
                  className="p-2 text-gray-400 hover:text-[#003366] hover:bg-white rounded-lg transition-all"
                  title="Bảng Kanban"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}/bonuses`);
                  }}
                  className="p-2 text-gray-400 hover:text-[#FF6600] hover:bg-white rounded-lg transition-all"
                  title="Thưởng hiệu suất"
                >
                  <DollarSign className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}/sprint-report`);
                  }}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all"
                  title="Báo cáo Sprint"
                >
                  <PieChartIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ngân sách</p>
            <p className="text-sm font-bold text-gray-900">{budgetFormatted}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Chi phí</p>
            <p className="text-sm font-bold text-gray-900">${(project.expenses || 0).toFixed(0)}k</p>
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            isNegativeProfit ? "bg-red-50" : "bg-emerald-50"
          )}>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-wider mb-1",
              isNegativeProfit ? "text-red-600" : "text-emerald-600"
            )}>Lợi nhuận</p>
            <p className={cn(
              "text-sm font-bold",
              isNegativeProfit ? "text-red-700" : "text-emerald-700"
            )}>
              {isNegativeProfit ? '-' : '+'}${(Math.abs(project.profit || 0)).toFixed(0)}k
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{project.startDate} - {project.endDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FF6600]" 
                style={{ width: `${project.margin || 0}%` }}
              ></div>
            </div>
            <span className="font-bold text-gray-700">{project.margin || 0}% Biên lợi nhuận</span>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((m, i) => {
            const emp = employees.find(e => e.id === m.employeeId);
            return (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                {emp?.avatar ? (
                  <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-gray-600">{emp?.name.charAt(0)}</span>
                )}
              </div>
            );
          })}
          {project.members.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-white flex items-center justify-center text-[10px] font-bold text-gray-400">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {project.status === 'Draft' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1 text-sm font-bold text-[#FF6600] hover:underline"
            >
              Chỉnh sửa & Gửi duyệt
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => navigate(`/projects/${project.id}/board`)}
            disabled={project.status !== 'Đang thực hiện'}
            className={`flex items-center gap-1 text-sm font-bold transition-all ${
              project.status === 'Đang thực hiện' ? "text-[#003366] hover:gap-2" : "text-gray-300 cursor-not-allowed"
            }`}
          >
            Xem chi tiết
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
