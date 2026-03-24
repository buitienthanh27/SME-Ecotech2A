import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Star,
  MessageSquare,
  MessageCircle,
  ArrowRightLeft,
  Play,
  FileText,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  X,
  Send,
  UserPlus,
  List,
  Grid3X3,
  TrendingUp,
  TrendingDown,
  Check,
  Edit2
} from 'lucide-react';
import { format, parseISO, addDays, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { realtimeService } from '../services/RealtimeService';
import {
  Sprint,
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  ProjectMember,
  Employee,
  DailyProgressLog,
  SubstitutionLog,
  TaskStatusLog
} from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TaskCreateModal } from '../components/project/TaskCreateModal';
import { PersonnelAddModal } from '../components/project/PersonnelAddModal';
import { SprintManagementModal } from '../components/project/SprintManagementModal';
import { Modal, Btn, ConfirmModal, showToast } from '../components/ui';
import { useStore } from '../store/useStore';
import { INITIAL_DEPARTMENTS, INITIAL_PERSONNEL } from './Personnel';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Project Board Component

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'Backlog', title: 'Khởi tạo', color: 'bg-[#F1F5F9] text-[#64748B]' },
  { id: 'In Progress', title: 'Đang làm', color: 'bg-[#E0F2FE] text-[#0369A1]' },
  { id: 'In Review', title: 'Đang review', color: 'bg-[#FEF3C7] text-[#B45309]' },
  { id: 'Done', title: 'Hoàn thành', color: 'bg-[#ECFDF5] text-[#148922]' },
];

// Mức tiến độ mặc định cho mỗi trạng thái
const STATUS_COMPLETION_MAP: Record<TaskStatus, number> = {
  'Backlog': 0,
  'In Progress': 25,
  'In Review': 75,
  'Done': 100,
  'Closed': 100,
};

export function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [pendingTaskMove, setPendingTaskMove] = useState<{
    task: Task;
    newStatus: TaskStatus;
    newIndex?: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'kanban' | 'personnel' | 'schedule'>('kanban');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [isAddPersonnelOpen, setIsAddPersonnelOpen] = useState(false);
  const [inactivatingMember, setInactivatingMember] = useState<{ id: string; name: string } | null>(null);
  const [inactiveReason, setInactiveReason] = useState('');

  const { projects, employees, updateProject, personnelRequests, updatePersonnelRequest, currentUser } = useStore();
  const project = id ? projects.find(p => p.id === id) : projects[0];
  const projectMembers = project?.members || [];
  const projectSprints = project?.sprints || [];
  const projectTasks = project?.tasks || [];
  const plannedIncome = project?.budget || 0;
  const plannedExpense = (project?.costPlan?.reduce((sum, item) => sum + item.plannedAmount, 0))
    || ((project?.expenses || 0) * 1000);
  const actualIncome = project?.actualIncome !== undefined
    ? project.actualIncome
    : ((project?.revenue || 0) * 1000);
  const actualExpense = project?.actualExpense !== undefined
    ? project.actualExpense
    : ((project?.expenses || 0) * 1000);
  const provisionalProfit = actualIncome - actualExpense;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeSprint = null;
  const visibleTasks = useMemo(() => {
    let tasks = projectTasks;
    if (!currentUser) return tasks;
    if (currentUser.role === 'PM' || currentUser.role === 'CEO') return tasks;
    if (currentUser.role === 'Lead') {
      const currentEmp = employees.find(e => e.id === currentUser.id);
      return tasks.filter(t => {
        if (!t.assigneeId) return true;
        const assignee = employees.find(e => e.id === t.assigneeId);
        return assignee?.department === currentEmp?.department;
      });
    }
    return tasks.filter(t => t.assigneeId === currentUser.id);
  }, [projectTasks, currentUser, employees]);

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const done = visibleTasks.filter(t => t.status === 'Done').length;
    const inProgress = visibleTasks.filter(t => t.status === 'In Progress').length;
    const inReview = visibleTasks.filter(t => t.status === 'In Review').length;
    const backlog = visibleTasks.filter(t => t.status === 'Backlog').length;
    const avgProgress = total > 0 ? visibleTasks.reduce((acc, t) => acc + t.completionPercent, 0) / total : 0;
    return { total, done, inProgress, inReview, backlog, avgProgress };
  }, [visibleTasks]);

  useEffect(() => {
    const handleStatusChange = (data: any) => {
      if (!project) return;
      const updatedTasks = projectTasks.map((t: Task) =>
        t.id === data.taskId ? { ...t, status: data.newStatus } : t
      );
      updateProject(project.id, { tasks: updatedTasks });
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    };

    const handleProgressLogged = (data: any) => {
      if (!project) return;
      const updatedTasks = projectTasks.map((t: Task) => t.id === data.taskId ? {
        ...t,
        completionPercent: data.progressPercent,
        actualHours: t.actualHours + data.hoursWorked,
        isReviewedToday: true
      } : t);
      updateProject(project.id, { tasks: updatedTasks });
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    };

    const handleNewTask = (task: Task) => {
      if (!project) return;
      updateProject(project.id, { tasks: [...projectTasks, task] });
    };

    realtimeService.on('task.status_changed', handleStatusChange);
    realtimeService.on('task.progress_logged', handleProgressLogged);
    realtimeService.on('task.created', handleNewTask);

    return () => {
      realtimeService.off('task.status_changed', handleStatusChange);
      realtimeService.off('task.progress_logged', handleProgressLogged);
      realtimeService.off('task.created', handleNewTask);
    };
  }, [project, projectTasks, updateProject]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !project) return;

    const activeIdVal = active.id as string;
    const overIdVal = over.id as string;

    const activeTaskDrag = projectTasks.find(t => t.id === activeIdVal);
    if (!activeTaskDrag) return;

    // Only handle visual sorting in handleDragOver, status changes move to handleDragEnd
    const overTaskDrag = projectTasks.find(t => t.id === overIdVal);
    if (overTaskDrag && activeTaskDrag.status !== overTaskDrag.status) {
      // Don't update status here to avoid breaking confirmation flow
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !project) return;

    const activeIdVal = active.id as string;
    const overIdVal = over.id as string;

    const activeTask = projectTasks.find(t => t.id === activeIdVal);
    if (!activeTask) return;

    // Determine target status
    let targetStatus = activeTask.status;
    const isOverAColumn = COLUMNS.some(col => col.id === overIdVal);
    if (isOverAColumn) {
      targetStatus = overIdVal as TaskStatus;
    } else {
      const overTask = projectTasks.find(t => t.id === overIdVal);
      if (overTask) targetStatus = overTask.status;
    }

    const overTaskForMove = projectTasks.find(t => t.id === overIdVal);
    const newIndex = overTaskForMove ? projectTasks.findIndex(t => t.id === overIdVal) : undefined;

    // If status changed, enforce rules
    if (activeTask.status !== targetStatus) {
      const statusIds = COLUMNS.map(c => c.id);
      const oldIdx = statusIds.indexOf(activeTask.status);
      const newIdx = statusIds.indexOf(targetStatus);
      const isForward = newIdx > oldIdx;

      const isPM = currentUser.role === 'PM' || currentUser.role === 'CEO';

      if (isForward) {
        // Forward: Execute immediately without confirmation
        executeStatusChangeDirectly(activeTask, targetStatus, newIndex);
      } else {
        // Backward
        if (!isPM) {
          showToast.error('Nhân viên không được kéo task ngược lại trạng thái trước đó. Vui lòng liên hệ PM.');
          return;
        }
        // PM: Show confirmation modal with reason
        setPendingTaskMove({ task: activeTask, newStatus: targetStatus, newIndex });
      }
      return;
    }

    // Handle same-status sorting immediately
    if (overTaskForMove) {
      const oldIdx = projectTasks.findIndex(t => t.id === activeIdVal);
      const newIdx = projectTasks.findIndex(t => t.id === overIdVal);
      if (oldIdx !== newIdx) {
        const updatedTasks = arrayMove([...projectTasks], oldIdx, newIdx);
        updateProject(project.id, { tasks: updatedTasks });
      }
    }
  };

  const executeStatusChangeDirectly = (task: Task, newStatus: TaskStatus, newIndex?: number, reason?: string) => {
    if (!project) return;

    const newLog: TaskStatusLog = {
      id: `tsl-${Date.now()}`,
      fromStatus: task.status,
      toStatus: newStatus,
      changedById: currentUser.id,
      changedByName: employees.find(e => e.id === currentUser.id)?.name || 'N/A',
      timestamp: new Date().toISOString(),
      note: reason
    };

    // Lấy mức tiến độ mặc định cho trạng thái mới
    const newCompletionPercent = STATUS_COMPLETION_MAP[newStatus] ?? task.completionPercent;

    let updatedTasks = projectTasks.map(t =>
      t.id === task.id
        ? {
          ...t,
          status: newStatus,
          completionPercent: newCompletionPercent,
          statusLogs: [...(t.statusLogs || []), newLog]
        }
        : t
    );

    if (newIndex !== undefined) {
      const oldIdx = updatedTasks.findIndex(t => t.id === task.id);
      updatedTasks = arrayMove(updatedTasks, oldIdx, newIndex);
    }

    updateProject(project.id, { tasks: updatedTasks });
    realtimeService.simulateEvent('task.status_changed', {
      taskId: task.id,
      newStatus,
      userName: employees.find(e => e.id === currentUser.id)?.name || 'Bạn'
    });

    if (reason) {
      showToast.success(`Đã chuyển ngược trạng thái sang ${COLUMNS.find(c => c.id === newStatus)?.title}`);
    } else {
      showToast.success(`Đã chuyển trạng thái sang ${COLUMNS.find(c => c.id === newStatus)?.title}`);
    }
  };

  const executeStatusChange = () => {
    if (!pendingTaskMove) return;
    executeStatusChangeDirectly(
      pendingTaskMove.task,
      pendingTaskMove.newStatus,
      pendingTaskMove.newIndex,
      statusChangeReason
    );
    setPendingTaskMove(null);
    setStatusChangeReason('');
  };

  const handleCreateTask = (newTask: Task) => {
    if (!project) return;
    updateProject(project.id, {
      tasks: [...(project.tasks || []), newTask]
    });
    realtimeService.simulateEvent('task.created', {
      taskId: newTask.id,
      title: newTask.title,
      userName: 'Bạn'
    });
  };

  const handleUpdateSprints = (newSprints: Sprint[]) => {
    if (!project) return;
    updateProject(project.id, {
      sprints: newSprints
    });
  };

  const activeTask = activeId ? projectTasks.find(t => t.id === activeId) : null;

  const handleAddMember = (newMember: ProjectMember) => {
    if (!project) return;
    updateProject(project.id, {
      members: [...project.members, newMember]
    });
  };

  const handleToggleMemberStatus = (memberId: string, currentStatus: 'Active' | 'Inactive') => {
    if (!project) return;
    const member = project.members.find(m => m.id === memberId);
    if (!member) return;

    if (currentStatus === 'Active') {
      // Check if holding ANY active tasks
      const assignedTasks = projectTasks.filter(t => t.assigneeId === member.employeeId && t.status !== 'Done' && t.status !== 'Closed');
      if (assignedTasks.length > 0) {
        alert('Không thể chuyển Inactive nhân sự đang giữ task chưa hoàn thành. Vui lòng gỡ hoặc thay thế nhân sự này khỏi task trước.');
        return;
      }

      setInactivatingMember({ id: memberId, name: employees.find(e => e.id === member.employeeId)?.name || 'Nhân viên' });
    } else {
      // Simple reactivate
      updateProject(project.id, {
        members: project.members.map(m => m.id === memberId ? { ...m, status: 'Active' as const } : m)
      });
    }
  };

  const confirmInactivate = () => {
    if (!project || !inactivatingMember || !inactiveReason) return;
    updateProject(project.id, {
      members: project.members.map(m => m.id === inactivatingMember.id ? {
        ...m,
        status: 'Inactive' as const,
        inactiveReason
      } : m)
    });
    setInactivatingMember(null);
    setInactiveReason('');
  };

  const projectPersonnel = useMemo(() => {
    const totalProjectTasks = projectTasks.length;
    // Total potential progress points is totalTasks * 100
    const totalPotentialProgress = totalProjectTasks * 100;

    return projectMembers.map(m => {
      const emp = INITIAL_PERSONNEL.find(e => e.id === String(m.employeeId).replace('e', '')) || employees.find(e => e.id === m.employeeId);
      const memberTasks = projectTasks.filter(t => t.assigneeId === m.employeeId);
      const memberTasksCount = memberTasks.length;

      // Calculate work contribution (total progress points contributed)
      const contributedProgress = memberTasks.reduce((acc, t) => {
        return acc + (t.completionPercent - (t.startingPercent || 0));
      }, 0);

      // We also find tasks cloned from this person to get their previous work
      const previousContributions = projectTasks
        .filter(t => t.clonedFromTaskId)
        .map(t => {
          const original = projectTasks.find(ot => ot.id === t.clonedFromTaskId);
          return original?.assigneeId === m.employeeId ? t.startingPercent || 0 : 0;
        })
        .reduce((acc, val) => acc + val, 0);

      const totalContribution = contributedProgress + previousContributions;
      const contributionPercent = totalPotentialProgress > 0
        ? Math.round((totalContribution / totalPotentialProgress) * 100)
        : 0;

      const calculatedAllocation = totalProjectTasks > 0
        ? Math.round((memberTasksCount / totalProjectTasks) * 100)
        : 0;

      return {
        ...m,
        employee: emp,
        allocation: calculatedAllocation,
        contribution: contributionPercent
      };
    });
  }, [projectMembers, projectTasks, employees]);

  const groupedPersonnel = useMemo(() => {
    const groups: Record<string, typeof projectPersonnel> = {};
    const managedDepartment = INITIAL_DEPARTMENTS.find(d => d.headId === currentUser?.id.replace('e', ''));
    if (managedDepartment) groups[managedDepartment.name] = [];

    projectPersonnel.forEach(m => {
      let dept = 'Khác';
      if (m.employee?.departmentId) {
        dept = INITIAL_DEPARTMENTS.find(d => d.id === m.employee.departmentId)?.name || 'Khác';
      } else if (m.employee?.department) {
        dept = m.employee.department;
      }

      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(m);
    });
    return groups;
  }, [projectPersonnel, currentUser]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isLive ? "bg-emerald-500" : "bg-gray-300",
                pulse && "animate-ping"
              )}></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
              <FileText className="w-4 h-4" />
              Báo cáo
            </button>
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="flex items-center gap-2 bg-[#148922] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-[#148922]/20 hover:bg-[#0E6318] transition-all"
            >
              <Plus className="w-4 h-4" />
              Tạo task mới
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-1 flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="#E2E8F0"
                  strokeDasharray="100, 100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#148922]"
                  strokeDasharray={`${stats.avgProgress}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-gray-900">{Math.round(stats.avgProgress)}%</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiến độ dự án</p>
              <p className="text-sm font-black text-gray-900">{stats.done}/{stats.total} Task hoàn thành</p>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-4 gap-4">
            <div className="bg-[#F1F5F9] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Khởi tạo</p>
              <p className="text-2xl font-black text-[#1A202C]">{stats.backlog}</p>
            </div>
            <div className="bg-[#E0F2FE] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#0369A1] uppercase tracking-widest mb-1">Đang làm</p>
              <p className="text-2xl font-black text-[#1A202C]">{stats.inProgress}</p>
            </div>
            <div className="bg-[#FEF3C7] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#B45309] uppercase tracking-widest mb-1">Đang review</p>
              <p className="text-2xl font-black text-[#1A202C]">{stats.inReview}</p>
            </div>
            <div className="bg-[#ECFDF5] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#148922] uppercase tracking-widest mb-1">Hoàn thành</p>
              <p className="text-2xl font-black text-[#1A202C]">{stats.done}</p>
            </div>
          </div>
        </div>

        {/* Financial and Timeline Summary Row */}
        <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col xl:flex-row gap-8">
          {/* Financial Summary */}
          <div className="flex-1 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-4 h-4 text-[#148922]" />
              <span className="text-sm font-bold text-gray-700">Tài chính dự án</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-[#148922]" /> Doanh thu dự kiến / Thực tế
                </p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-500">Dự kiến: {plannedIncome.toLocaleString('vi-VN')} đ</span>
                  <span className="text-sm font-black text-[#148922]">Thực: {actualIncome.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-red-500" /> Chi dự kiến / Thực tế
                </p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-500">Dự kiến: {plannedExpense.toLocaleString('vi-VN')} đ</span>
                  <span className="text-sm font-black text-red-600">Thực: {actualExpense.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lãi/Lỗ tạm tính</span>
              <span className={`text-base font-black ${provisionalProfit >= 0 ? 'text-[#148922]' : 'text-red-600'}`}>
                {(provisionalProfit > 0 ? '+' : '')}{provisionalProfit.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Timeline visualization */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#148922]" />
                <span className="text-sm font-bold text-gray-700">Timeline dự án</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bắt đầu</span>
                  <span className="text-xs font-black text-gray-900">{project?.startDate || 'N/A'}</span>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kết thúc</span>
                  <span className="text-xs font-black text-gray-900">{project?.endDate || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mt-6">
              <div
                className="absolute inset-y-0 left-0 bg-[#148922] transition-all duration-1000 ease-out"
                style={{ width: `${stats.avgProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-bold text-gray-400">Tỉ lệ hoàn thành task: </span>
              <span className="text-[10px] font-bold text-[#148922]">{Math.round(stats.avgProgress)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mt-8 flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-2xl w-fit border border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('kanban')}
          className={cn(
            "flex items-center gap-3 px-6 py-2 rounded-xl text-sm font-black transition-all",
            activeTab === 'kanban'
              ? "bg-white text-[#148922] shadow-sm shadow-[#148922]/5"
              : "text-[#718096] hover:text-[#1A202C] hover:bg-white/50"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Bảng Kanban
        </button>
        <button
          onClick={() => setActiveTab('personnel')}
          className={cn(
            "flex items-center gap-3 px-6 py-2 rounded-xl text-sm font-black transition-all",
            activeTab === 'personnel'
              ? "bg-white text-[#148922] shadow-sm shadow-[#148922]/5"
              : "text-[#718096] hover:text-[#1A202C] hover:bg-white/50"
          )}
        >
          <Users className="w-4 h-4" />
          Nhân sự
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={cn(
            "flex items-center gap-3 px-6 py-2 rounded-xl text-sm font-black transition-all",
            activeTab === 'schedule'
              ? "bg-white text-[#148922] shadow-sm shadow-[#148922]/5"
              : "text-[#718096] hover:text-[#1A202C] hover:bg-white/50"
          )}
        >
          <Calendar className="w-4 h-4" />
          Lịch làm việc
        </button>
      </div>

      {activeTab === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
            {COLUMNS.map(col => (
              <BoardColumn
                key={col.id}
                column={col}
                tasks={visibleTasks.filter(t => t.status === col.id)}
                employees={employees}
                onTaskClick={(task: any) => {
                  setSelectedTask(task);
                  setIsDetailOpen(true);
                }}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeTask ? (
              <div className="w-[300px] rotate-3 scale-105 transition-transform">
                <TaskCard task={activeTask} onClick={() => { }} employees={employees} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : activeTab === 'personnel' ? (
        <div className="space-y-6">
          {(currentUser?.role === 'PM' || currentUser?.role === 'CEO') && project && (
            <PersonnelRequestsPanel
              projectId={project.id}
              onApprove={(req: any) => {
                const newMember: ProjectMember = {
                  id: `m-${Date.now()}`,
                  employeeId: req.employeeId,
                  projectId: req.projectId,
                  role: req.role,
                  allocation: req.allocation,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: project.endDate,
                  status: 'Active'
                };
                updateProject(project.id, { members: [...project.members, newMember] });
                updatePersonnelRequest(req.id, { status: 'Approved', processedBy: currentUser.id, processedAt: new Date().toISOString() });
              }}
              onReject={(req: any) => {
                updatePersonnelRequest(req.id, { status: 'Rejected', processedBy: currentUser.id, processedAt: new Date().toISOString() });
              }}
              employees={employees}
              requests={personnelRequests || []}
            />
          )}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {selectedDepartment ? (
              <div className="flex flex-col">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedDepartment(null)}
                      className="p-2.5 bg-white border border-gray-200 hover:border-[#148922] hover:text-[#148922] rounded-xl transition-all shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                        Nhân sự {selectedDepartment}
                      </h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {groupedPersonnel[selectedDepartment]?.length || 0} thành viên
                      </p>
                    </div>
                  </div>
                  {INITIAL_DEPARTMENTS.find(d => d.headId === currentUser?.id.replace('e', ''))?.name === selectedDepartment && (
                    <button
                      onClick={() => setIsAddPersonnelOpen(true)}
                      className="flex items-center gap-2 bg-[#148922] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0b6b17] transition-all shadow-lg shadow-[#148922]/20"
                    >
                      <UserPlus className="w-4 h-4" />
                      Thêm nhân sự
                    </button>
                  )}
                </div>

                <div className="p-8">
                  {(groupedPersonnel[selectedDepartment]?.length || 0) === 0 ? (
                    <div className="p-10 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">Chưa có nhân sự nào từ phòng này tham gia dự án.</p>
                      <p className="text-xs text-gray-400 mt-2">Trưởng phòng có thể thêm nhân sự để bắt đầu công việc.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-l-xl w-[30%]">Họ tên & Vai trò</th>
                            <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">% Allocation</th>
                            <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">% Contribution</th>
                            <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Thời gian</th>
                            <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                            <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-r-xl"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {groupedPersonnel[selectedDepartment].map(m => (
                            <tr key={m.id} className={cn("group hover:bg-gray-50/50 transition-all", m.status === 'Inactive' && "opacity-60")}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center font-black text-[#148922]">
                                    {m.employee?.name.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <p className="text-[13px] font-bold text-gray-900">{m.employee?.name}</p>
                                    <p className="text-[10px] font-black text-[#148922] uppercase tracking-widest">{m.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-[13px] font-black text-gray-900">{m.allocation}%</span>
                                  <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-[#148922]" style={{ width: `${m.allocation}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-[13px] font-black text-[#148922]">{m.contribution}%</span>
                                  <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-[#148922]" style={{ width: `${m.contribution}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-bold text-gray-400">{m.startDate}</span>
                                  <ArrowRightLeft className="w-3 h-3 text-gray-300 rotate-90" />
                                  <span className="text-[10px] font-bold text-gray-400">{m.endDate}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleToggleMemberStatus(m.id, m.status)}
                                  className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                    m.status === 'Active'
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  )}
                                >
                                  {m.status}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button className="p-1.5 text-gray-300 hover:text-gray-900 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/10">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Các bộ phận tham gia dự án</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{Object.keys(groupedPersonnel).length} phòng ban được thêm vào</p>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(groupedPersonnel).map(([deptName, membersList]) => {
                    const members = membersList as any[];
                    const isManaged = INITIAL_DEPARTMENTS.find(d => d.headId === currentUser?.id.replace('e', ''))?.name === deptName;
                    return (
                      <div
                        key={deptName}
                        onClick={() => setSelectedDepartment(deptName)}
                        className={cn(
                          "bg-white rounded-[2rem] border p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group",
                          isManaged ? "border-[#148922]/30 hover:border-[#148922] shadow-md shadow-[#148922]/5" : "border-gray-200 hover:border-gray-300 shadow-sm"
                        )}
                      >
                        <div className="flex items-center justify-between mb-5">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-colors",
                            isManaged ? "bg-[#ECFDF5] text-[#148922]" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600"
                          )}>
                            <Users className="w-6 h-6" />
                          </div>
                          {isManaged && (
                            <span className="px-3 py-1.5 bg-[#148922]/10 text-[#148922] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#148922]/20">Phòng của bạn</span>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-gray-900 mb-2 truncate group-hover:text-[#148922] transition-colors">{deptName}</h4>
                        <div className="flex items-center justify-between mt-8">
                          <p className="text-sm font-bold text-gray-400">
                            <span className="text-[#148922] font-black text-xl mr-1">{members.length}</span> nhân sự
                          </p>
                          <div className="flex -space-x-3">
                            {members.slice(0, 3).map((m, i) => (
                              <div key={i} className="w-9 h-9 rounded-full border-[3px] border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-[#148922] uppercase z-10 shadow-sm" style={{ zIndex: 3 - i }}>
                                {m.employee?.name.charAt(0) || '?'}
                              </div>
                            ))}
                            {members.length > 3 && (
                              <div className="w-9 h-9 rounded-full border-[3px] border-white bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 z-0 shadow-sm">
                                +{members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <WorkScheduleTab
          schedules={project?.workSchedules || []}
          tasks={projectTasks}
          employees={employees}
        />
      )}

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        task={selectedTask}
        onUpdate={(updatedTask) => {
          if (!project) return;
          const updatedTasks = projectTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
          updateProject(project.id, { tasks: updatedTasks });
          setSelectedTask(updatedTask);
        }}
        onSubstitution={() => setIsSubstitutionOpen(true)}
        employees={employees}
        currentUser={currentUser}
      />
      {/* Substitution Dialog */}
      <SubstitutionDialog
        isOpen={isSubstitutionOpen}
        onClose={() => setIsSubstitutionOpen(false)}
        task={selectedTask}
        employees={employees}
        onConfirm={(newAssigneeId: string, reason: string) => {
          if (!selectedTask || !project) return;
          // Cập nhật người thực hiện & log progressHistory
          const historyEntry = {
            id: `ph-${Date.now()}`,
            date: new Date().toISOString(),
            fromAssigneeId: selectedTask.assigneeId || '',
            toAssigneeId: newAssigneeId,
            percentAtTransfer: selectedTask.completionPercent,
            reason: reason
          };
          const updatedTask: Task = {
            ...selectedTask,
            assigneeId: newAssigneeId,
            startingPercent: selectedTask.completionPercent,
            progressHistory: [...(selectedTask.progressHistory || []), historyEntry]
          };
          const updatedTasks = projectTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
          updateProject(project.id, { tasks: updatedTasks });
          setSelectedTask(updatedTask);
          setIsSubstitutionOpen(false);
          // Realtime notify
          realtimeService.simulateEvent('task.staff_changed', {
            taskId: selectedTask.id,
            newTaskId: updatedTask.id,
            oldAssignee: employees.find(e => e.id === selectedTask.assigneeId)?.name || 'N/A',
            newAssignee: employees.find(e => e.id === newAssigneeId)?.name || 'N/A'
          });
        }}
      />

      {/* Task Create Modal */}
      <AnimatePresence>
        {isCreateTaskOpen && (
          <TaskCreateModal
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            onCreate={handleCreateTask}
            sprintId={''}
            members={projectMembers.filter(m => m.status === 'Active').map(m => {
              const emp = employees.find(e => e.id === m.employeeId);
              return {
                id: m.employeeId,
                name: emp?.name || 'N/A',
                role: m.role,
                avatar: emp?.name.charAt(0) || '?'
              };
            })}
          />
        )}
      </AnimatePresence>

      {/* Project Personnel Add Modal */}
      <AnimatePresence>
        {isAddPersonnelOpen && (
          <PersonnelAddModal
            isOpen={isAddPersonnelOpen}
            onClose={() => setIsAddPersonnelOpen(false)}
            projectId={project?.id || ''}
            onAdd={handleAddMember}
            existingMemberIds={projectMembers.map(m => String(m.employeeId).replace('e', ''))}
          />
        )}
      </AnimatePresence>


      {/* Confirmation for Inactivation */}
      <AnimatePresence>
        {inactivatingMember && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setInactivatingMember(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase">Xác nhận</h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Bạn đang chuyển trạng thái nhân sự <span className="font-bold text-gray-900">{inactivatingMember.name}</span> sang <span className="font-bold text-red-600">Inactive</span>.
                Vui lòng nhập lý do để tiếp tục.
              </p>

              <textarea
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-600/20 mb-6"
                placeholder="Nhập lý do chuyển Inactive..."
                value={inactiveReason}
                onChange={(e) => setInactiveReason(e.target.value)}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setInactivatingMember(null)}
                  className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmInactivate}
                  disabled={!inactiveReason}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!pendingTaskMove}
        onClose={() => { setPendingTaskMove(null); setStatusChangeReason(''); }}
        title="Xác nhận chuyển trạng thái ngược lại"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => { setPendingTaskMove(null); setStatusChangeReason(''); }}>Hủy</Btn>
            <Btn
              variant="primary"
              onClick={executeStatusChange}
              disabled={!statusChangeReason.trim()}
            >Xác nhận</Btn>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Cảnh báo chuyển ngược trạng thái</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bạn đang chuyển task <span className="font-bold">"{pendingTaskMove?.task.title}"</span>
                về trạng thái <span className="font-bold text-[#148922]">"{COLUMNS.find(c => c.id === pendingTaskMove?.newStatus)?.title}"</span>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Lý do chuyển ngược lại (Bắt buộc):</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#148922]/20 transition-all"
              placeholder="Nhập lý do tại đây..."
              autoFocus
              value={statusChangeReason}
              onChange={(e) => setStatusChangeReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BoardColumn({ column, tasks, onTaskClick, employees, allTasks }: any) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const topLevelTasks = tasks.filter((t: any) => !t.parentId);

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px] flex flex-col gap-4">
      <div className={cn("p-3 rounded-xl flex items-center justify-between", column.color)}>
        <h3 className="text-sm font-black uppercase tracking-widest">{column.title}</h3>
        <span className="text-xs font-bold opacity-70">{topLevelTasks.length}</span>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <SortableContext items={topLevelTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
          {topLevelTasks.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              allTasks={allTasks}
              onClick={() => onTaskClick(task)}
              onTaskClick={onTaskClick}
              employees={employees}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, isOverlay, employees, allTasks, onTaskClick }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: isOverlay
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const assignee = employees.find(e => e.id === task.assigneeId);
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Done';

  const priorityColors: Record<string, string> = {
    'Cao': 'bg-red-50 text-red-600',
    'Trung bình': 'bg-amber-50 text-amber-600',
    'Thấp': 'bg-gray-50 text-gray-500',
  };

  const typeColors: Record<string, string> = {
    'Feature': 'bg-[#ECFDF5] text-[#148922]',
    'Bug': 'bg-red-50 text-red-600',
    'Task': 'bg-[#F8FAFC] text-[#718096]',
    'Research': 'bg-blue-50 text-blue-600',
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-50 h-[150px] rounded-2xl border-2 border-dashed border-gray-200"
      />
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layoutId={task.id}
      onClick={onClick}
      className={cn(
        "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#148922]/20 transition-all group",
        task.status === 'Closed' && "opacity-50 grayscale",
        isOverlay && "cursor-grabbing shadow-xl border-[#148922]/30"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider", priorityColors[task.priority])}>
            {task.priority}
          </span>
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider", typeColors[task.type])}>
            {task.type}
          </span>
        </div>
        <button className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#148922] transition-colors">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 bg-[#ECFDF5] rounded-full flex items-center justify-center text-[10px] font-black text-[#148922] border border-[#D1FAE5]">
              {assignee?.name.charAt(0) || '?'}
            </div>
            {task.clonedFromTaskId && (
              <div className="absolute -right-1 -bottom-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                <ArrowRightLeft className="w-2 h-2 text-[#148922]" />
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{assignee?.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-gray-300" />
          <span className="text-[10px] font-bold text-gray-400">{task.commentCount}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className={cn(isOverdue ? "text-red-500" : "text-gray-400")}>
            {isOverdue ? 'Quá hạn' : 'Hạn chót'}: {task.dueDate}
          </span>
          <span className="text-gray-900">{task.completionPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
          {task.startingPercent && task.startingPercent > 0 && (
            <div
              className="h-full bg-gray-300"
              style={{ width: `${task.startingPercent}%` }}
              title={`Người trước: ${task.startingPercent}%`}
            ></div>
          )}
          <div
            className="h-full bg-[#148922] transition-all duration-500"
            style={{ width: `${task.completionPercent - (task.startingPercent || 0)}%` }}
            title={`Hiện tại: ${task.completionPercent - (task.startingPercent || 0)}%`}
          ></div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="text-[10px] font-bold text-[#148922] hover:underline flex items-center gap-1"
        >
          Xem chi tiết
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {allTasks && allTasks.filter((t: any) => t.parentId === task.id).length > 0 && (
        <>
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
            <button
              className="flex items-center gap-1"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
              {allTasks.filter((t: any) => t.parentId === task.id).length} subtasks
            </button>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 pl-2 border-l-2 border-gray-100 flex flex-col gap-2 overflow-hidden"
              >
                {allTasks.filter((t: any) => t.parentId === task.id).map((child: any) => (
                  <div
                    key={child.id}
                    onClick={(e) => { e.stopPropagation(); onTaskClick?.(child); }}
                    className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", child.status === 'Done' ? "bg-emerald-500" : child.status === 'In Progress' ? "bg-blue-500" : "bg-gray-300")} />
                      <span className="line-clamp-1">{child.title}</span>
                    </div>
                    <span className="text-[#148922]">{child.completionPercent}%</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// Sub-components (simplified for initial implementation)

function TaskDetailSheet({ isOpen, onClose, task, onUpdate, onSubstitution, employees, currentUser }: any) {
  const [commentText, setCommentText] = useState('');
  if (!task) return null;

  const isEmployee = currentUser?.role === 'Employee';

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      taskId: task.id,
      userId: currentUser.id,
      userName: employees.find((e_obj: any) => e_obj.id === currentUser.id)?.name || 'Bạn',
      text: commentText,
      timestamp: new Date().toISOString()
    };
    onUpdate({
      ...task,
      comments: [...(task.comments || []), newComment]
    });
    setCommentText('');
    showToast.success('Đã gửi bình luận');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[520px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <LayoutGrid className="w-5 h-5 text-[#148922]" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Chi tiết Task</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <input
                    className="text-2xl font-black text-gray-900 w-full bg-transparent border-none focus:ring-0 p-0 mb-4 disabled:opacity-70"
                    defaultValue={task.title}
                    disabled={isEmployee}
                    onChange={(e) => {
                      if (!isEmployee) {
                        onUpdate({ ...task, title: e.target.value });
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-3">
                    <select
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#148922]/20"
                      value={task.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as TaskStatus;
                        onUpdate({ ...task, status: newStatus });
                        realtimeService.simulateEvent('task.status_changed', {
                          taskId: task.id,
                          newStatus,
                          userName: 'Bạn'
                        });
                      }}
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <select
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#148922]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      value={task.priority}
                      disabled={isEmployee}
                      onChange={(e) => {
                        onUpdate({ ...task, priority: e.target.value as TaskPriority });
                      }}
                    >
                      <option value="Cao">Cao</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Thấp">Thấp</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 bg-[#F8FAFC] rounded-[2rem] border border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ECFDF5] border border-[#D1FAE5] rounded-full flex items-center justify-center text-sm font-black text-[#148922]">
                        {employees.find((e: any) => e.id === task.assigneeId)?.name.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Người thực hiện</p>
                        <p className="text-sm font-bold text-gray-900">{employees.find((e: any) => e.id === task.assigneeId)?.name || 'N/A'}</p>
                      </div>
                    </div>
                    {!isEmployee && (
                      <button
                        onClick={onSubstitution}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#148922] hover:bg-[#ECFDF5] transition-all"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Thay thế
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-400">Phân bổ tiến độ</span>
                      <span className="text-[#148922]">{task.completionPercent}% Tổng</span>
                    </div>
                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-gray-100 flex">
                      {task.startingPercent && task.startingPercent > 0 && (
                        <div
                          className="h-full bg-gray-200 transition-all duration-500 relative group"
                          style={{ width: `${task.startingPercent}%` }}
                          title="Tiến độ người cũ"
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-400 font-black">
                            {task.startingPercent}%
                          </span>
                        </div>
                      )}
                      <div
                        className="h-full bg-[#148922] transition-all duration-500 relative"
                        style={{ width: `${task.completionPercent - (task.startingPercent || 0)}%` }}
                        title="Tiến độ người mới"
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-black">
                          {task.completionPercent - (task.startingPercent || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold mt-1.5">
                      <span className="text-gray-400">Người cũ: {task.startingPercent}%</span>
                      <span className="text-[#148922]">Người mới: {task.completionPercent - task.startingPercent}%</span>
                    </div>
                  </div>

                  {task.progressHistory && task.progressHistory.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lịch sử thay đổi nhân sự</p>
                      {task.progressHistory.map((ph: any) => {
                        const fromEmp = employees.find((e: any) => e.id === ph.fromAssigneeId);
                        const toEmp = employees.find((e: any) => e.id === ph.toAssigneeId);
                        return (
                          <div key={ph.id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              <span className="text-gray-500">{new Date(ph.date).toLocaleString('vi-VN')}</span>
                              <span className="text-[#148922]">({ph.percentAtTransfer}% hoàn thành)</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                              <span>{fromEmp?.name || 'N/A'}</span>
                              <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                              <span>{toEmp?.name || 'N/A'}</span>
                            </div>
                            {ph.reason && <p className="text-xs text-gray-500 italic mt-1">"{ph.reason}"</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Ước tính" value={`${task.estimatedHours}h`} icon={Clock} />
                  <DetailItem label="Thực tế" value={`${task.actualHours}h`} icon={Activity} />
                  <DetailItem label="Hạn chót" value={task.dueDate} icon={Calendar} />
                  <DetailItem label="Người tạo" value="PM Nguyễn" icon={Users} />
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mô tả</h3>
                  <div className="p-6 bg-white border border-gray-100 rounded-3xl text-sm text-gray-600 leading-relaxed">
                    {task.description}
                  </div>
                </div>

                {/* Status History */}
                {task.statusLogs && task.statusLogs.length > 0 && (
                  <div className="pt-8 border-t border-gray-100 pb-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Lịch sử trạng thái
                    </h4>
                    <div className="space-y-6">
                      {task.statusLogs.map((log: any) => {
                        const getStatusLabel = (s: string) => {
                          const labels: any = {
                            'Backlog': 'Khởi tạo',
                            'In Progress': 'Đang làm',
                            'In Review': 'Đang review',
                            'Done': 'Hoàn thành',
                            'Closed': 'Đã đóng'
                          };
                          return labels[s] || s;
                        };
                        return (
                          <div key={log.id} className="flex gap-4">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center border border-[#D1FAE5]">
                                <CheckCircle2 className="w-4 h-4 text-[#148922]" />
                              </div>
                              <div className="absolute top-8 bottom-[-24px] left-1/2 w-[1px] bg-gray-100 last:hidden" />
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-bold text-gray-900 leading-none">
                                  {getStatusLabel(log.fromStatus)} → {getStatusLabel(log.toStatus)}
                                </p>
                                <span className="text-[10px] font-medium text-gray-400">{new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                <span className="font-bold text-gray-700">{log.changedByName}:</span> {log.note || 'Cập nhật trạng thái thông thường'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Thảo luận ({task.comments?.length || 0})
                  </h3>
                  <div className="space-y-6 mb-8">
                    {task.comments && task.comments.length > 0 ? (
                      task.comments.map((comment: any) => (
                        <CommentItem
                          key={comment.id}
                          name={comment.userName}
                          text={comment.text}
                          time={new Date(comment.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          avatar={comment.userName.charAt(0)}
                        />
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic text-center py-4">Chưa có bình luận nào.</p>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      placeholder="Nhập nội dung thảo luận..."
                      className="w-full pl-6 pr-12 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[1.25rem] text-sm focus:outline-none focus:ring-2 focus:ring-[#148922]/20 focus:border-[#148922] transition-all"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                          handleSendComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendComment}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#148922] text-white rounded-xl hover:bg-[#0E6318] transition-all disabled:opacity-50"
                      disabled={!commentText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailItem({ label, value, icon: Icon }: any) {
  return (
    <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3 text-[#148922]" />
        <span className="text-[10px] font-bold text-[#718096] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-[#1A202C]">{value}</p>
    </div>
  );
}

function CommentItem({ name, text, time, avatar }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full flex items-center justify-center text-[10px] font-black text-[#148922] shrink-0">
        {avatar}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-900">{name}</span>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  );
}

function DailyReviewPanel({ isOpen, onClose, tasks, onSave, employees }: any) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(tasks.filter((t: any) => t.status !== 'Done' && t.status !== 'Closed').map((t: any) => ({
        taskId: t.id,
        title: t.title,
        assigneeName: employees.find((e: any) => e.id === t.assigneeId)?.name || 'N/A',
        hoursWorked: 0,
        progressPercent: t.completionPercent,
        rating: 0,
        comment: '',
        isReviewed: t.isReviewedToday
      })));
    }
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-4xl rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#E2E8F0]"
      >
        <div className="p-8 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <h3 className="text-xl font-black text-[#1A202C] uppercase tracking-tight">Đánh giá cuối ngày</h3>
            <p className="text-xs font-bold text-[#718096] uppercase tracking-widest mt-1">Ngày {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-xl transition-all text-[#718096]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {logs.map((log, idx) => (
            <div key={log.taskId} className={cn(
              "p-6 rounded-3xl border transition-all",
              log.isReviewed ? "bg-emerald-50 border-emerald-100 opacity-60" : "bg-white border-gray-100 shadow-sm"
            )}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center text-[#148922] font-black">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{log.title}</h4>
                    <p className="text-xs text-gray-500 font-medium">Người thực hiện: {log.assigneeName}</p>
                  </div>
                </div>
                {log.isReviewed && (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã hoàn thành
                  </div>
                )}
              </div>

              {!log.isReviewed && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Giờ làm (h)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
                      value={log.hoursWorked}
                      onChange={(e) => {
                        const newLogs = [...logs];
                        newLogs[idx].hoursWorked = parseFloat(e.target.value);
                        setLogs(newLogs);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Tiến độ ({log.progressPercent}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full h-2 bg-[#F1F5F9] rounded-full appearance-none cursor-pointer accent-[#148922]"
                      value={log.progressPercent}
                      onChange={(e) => {
                        const newLogs = [...logs];
                        newLogs[idx].progressPercent = parseInt(e.target.value);
                        setLogs(newLogs);
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mt-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            const newLogs = [...logs];
                            newLogs[idx].rating = s;
                            setLogs(newLogs);
                          }}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              "w-5 h-5",
                              s <= log.rating ? "text-amber-400 fill-amber-400" : "text-[#E2E8F0]"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <textarea
                      placeholder="Ghi chú đánh giá..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[80px]"
                      value={log.comment}
                      onChange={(e) => {
                        const newLogs = [...logs];
                        newLogs[idx].comment = e.target.value;
                        setLogs(newLogs);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-8 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-[#718096] hover:text-[#1A202C]">Hủy bỏ</button>
          <button
            onClick={() => onSave(logs.filter(l => !l.isReviewed))}
            className="px-8 py-3 bg-[#148922] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#148922]/20 hover:bg-[#0E6318] transition-all"
          >
            Lưu tất cả đánh giá
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SubstitutionDialog({ isOpen, onClose, task, onConfirm, employees }: any) {
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen || !task) return null;

  const currentAssignee = employees.find((e: any) => e.id === task.assigneeId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ECFDF5] rounded-xl">
              <ArrowRightLeft className="w-5 h-5 text-[#148922]" />
            </div>
            <h3 className="text-xl font-black text-[#1A202C] uppercase tracking-tight">Thay thế nhân sự</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-xl transition-all text-orange-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">Task hiện tại</p>
            <p className="text-sm font-bold text-[#1A202C] mb-3">{task.title}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#ECFDF5] border border-[#D1FAE5] rounded-full flex items-center justify-center text-[8px] font-black text-[#148922]">
                  {currentAssignee?.name.charAt(0) || '?'}
                </div>
                <span className="text-xs font-bold text-[#4A5568]">{currentAssignee?.name || 'N/A'}</span>
              </div>
              <span className="text-xs font-black text-[#148922]">{task.completionPercent}% hoàn thành</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Chọn người thay thế</label>
            <select
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#148922]/20 appearance-none"
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.filter(e => e.id !== task.assigneeId).map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Lý do thay thế</label>
            <textarea
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#148922]/20"
              placeholder="Nhập lý do thay thế nhân sự..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Task hiện tại sẽ được đóng lại ở <span className="font-bold">{task.completionPercent}%</span> hoàn thành.
              Task mới sẽ được tạo cho nhân viên mới bắt đầu từ <span className="font-bold">{task.completionPercent}%</span>.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Hủy bỏ</button>
            <button
              onClick={() => onConfirm(newAssigneeId, reason)}
              disabled={!newAssigneeId || !reason}
              className="flex-1 py-4 bg-[#148922] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#148922]/20 hover:bg-[#0E6318] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận thay thế
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Work Schedule Components ---

function WorkScheduleTab({ schedules, tasks, employees }: { schedules: any[], tasks: Task[], employees: Employee[] }) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('all');

  const derivedSchedules = useMemo(() => {
    const result: any[] = [];

    // Helper: find existing log by generated ID or by taskId+date+originalType
    const findExistingLog = (taskId: string, dateStr: string, originalType: string) => {
      // First try exact match by generated ID
      const generatedId = `${taskId}-${dateStr}-${originalType}`;
      const byId = schedules.find(s => s.id === generatedId);
      if (byId) return byId;
      // Then try match by taskId+date+type (exact type)
      const byType = schedules.find(s => s.taskId === taskId && s.date === dateStr && s.type === originalType);
      if (byType) return byType;
      // Also check if original slot was changed to 'Nghỉ' (time off) - match by taskId+date and original generated ID pattern
      const byTimeOff = schedules.find(s => s.taskId === taskId && s.date === dateStr && s.type === 'Nghỉ' && (s.originalType === originalType || s.id === generatedId));
      return byTimeOff || null;
    };

    // Generate planned shifts from tasks
    tasks.forEach(task => {
      if (!task.startDate || !task.dueDate || !task.assigneeId) return;
      if (task.status === 'Closed') return;

      let current = parseISO(task.startDate);
      const end = parseISO(task.dueDate);

      while (current <= end) {
        const dayOfWeek = getDay(current);
        const dateStr = format(current, 'yyyy-MM-dd');

        const existingMorningLog = findExistingLog(task.id, dateStr, 'Sáng');
        const existingAfternoonLog = findExistingLog(task.id, dateStr, 'Chiều');

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          result.push({
            taskId: task.id,
            employeeId: task.assigneeId,
            date: dateStr,
            type: 'Sáng',
            slotType: 'Sáng', // Permanent slot identifier
            efficiency: 100,
            isProductive: true,
            notes: 'Kế hoạch',
            // Spread ALL fields from existing log to pick up pmComment, reason, type changes, etc.
            ...(existingMorningLog ? existingMorningLog : {}),
            id: existingMorningLog?.id || `${task.id}-${dateStr}-Sáng`,
            isPlanned: !existingMorningLog
          });
          result.push({
            taskId: task.id,
            employeeId: task.assigneeId,
            date: dateStr,
            type: 'Chiều',
            slotType: 'Chiều',
            efficiency: 100,
            isProductive: true,
            notes: 'Kế hoạch',
            ...(existingAfternoonLog ? existingAfternoonLog : {}),
            id: existingAfternoonLog?.id || `${task.id}-${dateStr}-Chiều`,
            isPlanned: !existingAfternoonLog
          });
        } else if (dayOfWeek === 6) {
          result.push({
            taskId: task.id,
            employeeId: task.assigneeId,
            date: dateStr,
            type: 'Sáng',
            slotType: 'Sáng',
            efficiency: 100,
            isProductive: true,
            notes: 'Kế hoạch',
            ...(existingMorningLog ? existingMorningLog : {}),
            id: existingMorningLog?.id || `${task.id}-${dateStr}-Sáng`,
            isPlanned: !existingMorningLog
          });
        }
        current = addDays(current, 1);
      }
    });

    // Add standalone OT shifts
    schedules.filter(s => s.type === 'OT').forEach(ot => {
      result.push({ ...ot, id: ot.id || `ot-${Date.now()}`, isPlanned: false });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, schedules]);

  const filteredSchedules = useMemo(() => {
    if (selectedEmpId === 'all') return derivedSchedules;
    return derivedSchedules.filter(s => s.employeeId === selectedEmpId);
  }, [derivedSchedules, selectedEmpId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              viewMode === 'list' ? "bg-white text-[#148922] shadow-sm" : "text-[#718096] hover:text-[#1A202C]"
            )}
          >
            <List className="w-4 h-4" />
            Danh sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              viewMode === 'calendar' ? "bg-white text-[#148922] shadow-sm" : "text-[#718096] hover:text-[#1A202C]"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
            Bảng biểu
          </button>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
            className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm font-bold bg-[#F8FAFC] text-[#1A202C] outline-none focus:ring-2 focus:ring-[#148922]/20"
          >
            <option value="all">Tất cả nhân viên</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="hidden md:flex items-center gap-4 border-l border-gray-200 pl-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Đạt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Không đạt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300 border-dashed"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kế hoạch</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ScheduleListView schedules={filteredSchedules} employees={employees} tasks={tasks} />
      ) : (
        <ScheduleCalendarView schedules={filteredSchedules} employees={employees} />
      )}
    </div>
  );
}

function ScheduleListView({ schedules, employees, tasks }: any) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingShift, setEditingShift] = useState<any>(null);
  const { projects, updateProject } = useStore();
  const { id } = useParams();

  if (schedules.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
        <Calendar className="w-12 h-12 text-gray-200 mb-4" />
        <h4 className="text-lg font-black text-gray-900 mb-2">Không có lịch làm việc</h4>
        <p className="text-sm font-medium text-gray-500 max-w-sm">Chưa có task nào được giao trong timeline này hoặc chưa có lịch được ghi nhận.</p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(schedules.length / pageSize);
  const paged = schedules.slice((page - 1) * pageSize, page * pageSize);
  const showPagination = schedules.length > 10;

  return (
    <>
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-[11px] font-bold text-[#718096] uppercase tracking-wide">Ngày & Ca</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#718096] uppercase tracking-wide">Nhân viên</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#718096] uppercase tracking-wide">Task công việc</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#718096] uppercase tracking-wide text-center">Trạng thái</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#718096] uppercase tracking-wide">Nhận xét PM</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#718096] uppercase tracking-wide text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {paged.map((s: any) => {
                const emp = employees.find((e: any) => e.id === s.employeeId);
                const task = tasks.find((t: any) => t.id === s.taskId);
                return (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 text-[#1A202C]">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{format(parseISO(s.date), 'dd/MM/yyyy')}</p>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          (s.slotType || s.type) === 'Sáng' ? "bg-blue-100 text-blue-700" :
                            (s.slotType || s.type) === 'Chiều' ? "bg-orange-100 text-orange-700" :
                              "bg-purple-100 text-purple-700"
                        )}>
                          Ca {s.slotType || s.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A202C]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center font-black text-[#148922] text-xs uppercase shadow-sm">
                          {emp?.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{emp?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A202C]">
                      <p className="text-sm font-bold text-gray-900">{task?.title || '—'}</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase truncate max-w-[200px]">{task?.description}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1A202C] text-center">
                      {s.type === 'Nghỉ' ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                          Nghỉ {s.reason ? `(${s.reason})` : ''}
                        </span>
                      ) : s.isPlanned ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 border border-gray-200 border-dashed">
                          Kế hoạch
                        </span>
                      ) : (
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          (s.evaluationResult || (s.isProductive ? 'Đạt' : 'Không đạt')) === 'Đạt'
                            ? "bg-emerald-100 text-emerald-700"
                            : (s.evaluationResult || (s.isProductive ? 'Đạt' : 'Không đạt')) === 'Trung bình'
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        )}>
                          {s.evaluationResult || (s.isProductive ? 'Đạt' : 'Không đạt')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#1A202C]">
                      {s.pmComment ? (
                        <span className="text-[11px] text-gray-700 font-medium max-w-xs truncate">{s.pmComment}</span>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#1A202C] text-center">
                      <button
                        onClick={() => setEditingShift(s)}
                        className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showPagination && (
          <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-[13px] text-[#718096]">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="border border-[#E2E8F0] rounded-[6px] px-2 py-1 text-[13px] text-[#1A202C] focus:outline-none focus:border-[#148922]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>/ {schedules.length} bản ghi</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-[6px] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pg = i + 1;
                if (totalPages > 5 && page > 3) pg = page - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-[6px] text-[13px] font-medium transition-colors ${page === pg
                      ? 'bg-[#148922] text-white'
                      : 'hover:bg-[#F1F5F9] text-[#718096]'
                      }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-[6px] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shift Evaluation Modal */}
      {editingShift && (
        <ShiftEvaluationModal
          shift={editingShift}
          employees={employees}
          tasks={tasks}
          onClose={() => setEditingShift(null)}
          onSave={(updatedShift: any) => {
            const project = projects.find(p => p.id === id);
            if (!project) return;

            const newSchedules = [...(project.workSchedules || [])];
            const index = newSchedules.findIndex((s: any) => s.id === updatedShift.id);
            if (index !== -1) {
              newSchedules[index] = { ...newSchedules[index], ...updatedShift };
            } else {
              delete updatedShift.isPlanned; // Remove temporary UI flag before saving
              newSchedules.push(updatedShift);
            }

            updateProject(project.id, { workSchedules: newSchedules });
            setEditingShift(null);
          }}
        />
      )}
    </>
  );
}

function ScheduleCalendarView({ schedules, employees }: any) {
  const days = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];

    // Find min date and max date
    const allDates = schedules.map((s: any) => s.date).sort();
    const minDate = parseISO(allDates[0]);
    const maxDate = parseISO(allDates[allDates.length - 1]);

    let current = minDate;
    const result = [];
    while (current <= maxDate) {
      if (getDay(current) !== 0) { // Skip Sunday completely
        result.push(format(current, 'yyyy-MM-dd'));
      }
      current = addDays(current, 1);
    }
    return result;
  }, [schedules]);

  if (days.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
        <Grid3X3 className="w-12 h-12 text-gray-200 mb-4" />
        <h4 className="text-lg font-black text-gray-900 mb-2">Chưa có lịch biểu</h4>
        <p className="text-sm font-medium text-gray-500 max-w-sm">Timeline dự án trống hoặc bị lọc hết.</p>
      </div>
    );
  }

  // Group schedules by day and then by employee
  const groupedSchedules = useMemo(() => {
    const acc: Record<string, Record<string, any[]>> = {};
    days.forEach(d => acc[d] = {}); // initialize all dates

    schedules.forEach((s: any) => {
      const { date, employeeId } = s;
      if (!acc[date]) return; // ignore Sundays if any got through
      if (!acc[date][employeeId]) {
        acc[date][employeeId] = [];
      }
      acc[date][employeeId].push(s);
    });
    return acc;
  }, [schedules, days]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {days.map(day => {
        const empShifts = groupedSchedules[day] || {};
        const activeEmployees = Object.keys(empShifts);

        return (
          <div key={day} className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* Header Date */}
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="block text-xl font-black text-gray-900">{format(parseISO(day), 'dd/MM')}</span>
                <span className="text-[10px] font-bold text-gray-400 capitalize">{format(parseISO(day), 'EEEE', { locale: vi })}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-grow flex flex-col gap-4">
              {activeEmployees.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center opacity-30 grayscale min-h-[100px]">
                  <Calendar className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trống</span>
                </div>
              ) : (
                activeEmployees.map(empId => {
                  const emp = employees.find((e: any) => e.id === empId);
                  const shifts = empShifts[empId].sort((a, b) => {
                    const order = { 'Sáng': 1, 'Chiều': 2, 'OT': 3 };
                    return (order[a.type as keyof typeof order] || 4) - (order[b.type as keyof typeof order] || 4);
                  });

                  return (
                    <div key={empId} className="flex flex-col gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                      {/* Employee Info */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                        <div className="w-6 h-6 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] text-[#148922] flex items-center justify-center font-black text-[10px] uppercase shadow-inner">
                          {emp?.name.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-gray-900 line-clamp-1 flex-1" title={emp?.name}>{emp?.name}</span>
                      </div>

                      {/* Shifts */}
                      <div className="space-y-1.5">
                        {shifts.map(s => (
                          <div key={s.id} className={cn(
                            "flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] font-bold",
                            s.isPlanned
                              ? "bg-gray-50 border-gray-200 border-dashed text-gray-500"
                              : s.isProductive
                                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                                : "bg-amber-50 border-amber-100 text-amber-800"
                          )}>
                            <span className={cn(
                              "uppercase tracking-wider mr-2",
                              s.type === 'Sáng' ? "text-blue-600" :
                                s.type === 'Chiều' ? "text-orange-600" :
                                  "text-purple-600"
                            )}>
                              {s.type}
                            </span>
                            {!s.isPlanned && <span>{s.efficiency}%</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- New Components ---
const PersonnelRequestsPanel: React.FC<{
  projectId: string;
  onApprove: (r: any) => void;
  onReject: (r: any) => void;
  requests: any[];
  employees: any[];
}> = ({ projectId, onApprove, onReject, requests, employees }) => {
  const pendingRequests = requests.filter(r => r.projectId === projectId && r.status === 'Pending');

  if (pendingRequests.length === 0) return null;

  return (
    <div className="bg-[#FEF3C7] rounded-[2.5rem] border border-[#F59E0B] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 mb-6">
      <div className="p-8 border-b border-[#F59E0B] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#B45309]" />
          <h3 className="text-xl font-black text-[#B45309] uppercase tracking-tight">Yêu cầu thêm nhân sự chờ duyệt ({pendingRequests.length})</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {pendingRequests.map(req => {
            const requester = employees.find(e => e.id === req.requestedBy);
            const targetEmp = employees.find(e => e.id === req.employeeId);
            return (
              <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    <span className="text-amber-600">{requester?.name}</span> yêu cầu thêm <span className="text-blue-600">{targetEmp?.name}</span> vào dự án
                  </p>
                  <div className="flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Vai trò: {req.role}</span>
                    <span>Phân bổ: {req.allocation}%</span>
                    <span>Vào lúc: {new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReject(req)}
                    className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs uppercase tracking-widest rounded-lg transition-all"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => onApprove(req)}
                    className="px-4 py-2 bg-[#148922] hover:bg-[#0E6318] text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-md shadow-[#148922]/20 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Phê duyệt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function ShiftEvaluationModal({ shift, employees, tasks, onClose, onSave }: any) {
  const [performanceRating, setPerformanceRating] = useState(shift.evaluationResult || (shift.isProductive ? 'Đạt' : 'Không đạt'));
  const [comment, setComment] = useState(shift.pmComment || '');
  const [timeOffType, setTimeOffType] = useState<'Phép' | 'Không phép' | null>(shift.type === 'Nghỉ' ? shift.reason as any : null);

  const emp = employees.find((e: any) => e.id === shift.employeeId);
  const task = tasks.find((t: any) => t.id === shift.taskId);

  const handleSave = () => {
    let updatedShift: any = {
      ...shift,
      pmComment: comment,
      evaluationResult: performanceRating,
      isProductive: performanceRating !== 'Không đạt'
    };

    if (timeOffType) {
      // User selected leave (Phép or Không phép)
      updatedShift.originalType = shift.type; // Save original type for lookup
      updatedShift.type = 'Nghỉ';
      updatedShift.reason = timeOffType;
    } else if (shift.type === 'Nghỉ') {
      // User wants to change from leave to working - restore original type
      if (shift.originalType) {
        updatedShift.type = shift.originalType;
      } else {
        // Fallback: try to infer from shift.slotType or use a default
        updatedShift.type = shift.slotType || 'Sáng';
      }
      // Clear the reason and originalType since they're now working
      updatedShift.reason = undefined;
      updatedShift.originalType = undefined;
    }

    onSave(updatedShift);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#148922] to-[#0E6318] text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Đánh giá ca làm</h2>
            <p className="text-[12px] text-emerald-100 mt-1">{emp?.name} - {format(parseISO(shift.date), 'dd/MM/yyyy')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Shift Type - Read Only */}
          <div>
            <label className="text-sm font-bold text-gray-600 uppercase tracking-widest">Loại ca</label>
            <div className="mt-2 px-3 py-2 bg-gray-50 border border-[#E2E8F0] rounded-lg">
              <p className="text-sm font-bold text-gray-900">
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-black uppercase tracking-widest",
                  (shift.slotType || shift.type) === 'Sáng' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                )}>
                  Ca {shift.slotType || shift.type}
                </span>
              </p>
            </div>
          </div>

          {/* Time Off Option - shown first */}
          <div className="border-b border-[#E2E8F0] pb-4">
            <label className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3 block">Có nghỉ ca này?</label>
            <div className="grid grid-cols-2 gap-2">
              {['Phép', 'Không phép'].map(type => (
                <button
                  key={type}
                  onClick={() => setTimeOffType(timeOffType === type ? null : (type as 'Phép' | 'Không phép'))}
                  className={cn(
                    "p-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all border-2",
                    timeOffType === type
                      ? type === 'Phép'
                        ? "bg-blue-100 text-blue-700 border-blue-500"
                        : "bg-red-100 text-red-700 border-red-500"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Rating + PM Comment - only show when NOT on leave */}
          {!timeOffType ? (
            <>
              {/* Performance Rating */}
              <div>
                <label className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3 block">Đánh giá hiệu suất</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Đạt', 'Trung bình', 'Không đạt'].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setPerformanceRating(rating)}
                      className={cn(
                        "p-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all border-2",
                        performanceRating === rating
                          ? rating === 'Đạt'
                            ? "bg-emerald-100 text-emerald-700 border-emerald-500"
                            : rating === 'Trung bình'
                              ? "bg-amber-100 text-amber-700 border-amber-500"
                              : "bg-red-100 text-red-700 border-red-500"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              {/* PM Comment */}
              <div>
                <label className="text-sm font-bold text-gray-600 uppercase tracking-widest">Nhận xét PM</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Nhập nhận xét của bạn..."
                  className="mt-2 w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1A202C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#148922]/20 focus:border-[#148922]"
                  rows={2}
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800 font-medium">
                Nhân viên nghỉ <span className="font-bold">{timeOffType}</span> ca này — không cần đánh giá hiệu suất.
              </p>
            </div>
          )}

          {/* Task Info */}
          {task && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Task</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{task.title}</p>
              <p className="text-[11px] text-gray-600 mt-1">{task.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-6 border-t border-[#E2E8F0] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] text-gray-600 bg-white hover:bg-gray-50 font-bold text-sm uppercase tracking-widest rounded-lg transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#148922] hover:bg-[#0E6318] text-white font-bold text-sm uppercase tracking-widest rounded-lg shadow-md shadow-[#148922]/20 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Lưu đánh giá
          </button>
        </div>
      </div>
    </div>
  );
}

