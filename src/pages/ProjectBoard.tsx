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
  LayoutGrid,
  Star,
  MessageSquare,
  ArrowRightLeft,
  Play,
  FileText,
  Activity,
  X,
  Send,
  UserPlus,
  List,
  Grid3X3,
  TrendingUp,
  TrendingDown
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
  SubstitutionLog
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
import { useStore } from '../store/useStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Project Board Component

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'Backlog', title: 'Backlog', color: 'bg-gray-100 text-gray-700' },
  { id: 'In Progress', title: 'Đang làm', color: 'bg-blue-100 text-blue-700' },
  { id: 'In Review', title: 'Đang review', color: 'bg-amber-100 text-amber-700' },
  { id: 'Done', title: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
];

export function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isSprintManagementOpen, setIsSprintManagementOpen] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [activeTab, setActiveTab] = useState<'kanban' | 'personnel' | 'schedule'>('kanban');
  const [isAddPersonnelOpen, setIsAddPersonnelOpen] = useState(false);
  const [inactivatingMember, setInactivatingMember] = useState<{ id: string; name: string } | null>(null);
  const [inactiveReason, setInactiveReason] = useState('');

  const { projects, employees, updateProject } = useStore();
  const project = projects.find(p => p.id === id || p.id === '1'); 
  const projectMembers = project?.members || [];
  const projectSprints = project?.sprints || [];
  const projectTasks = project?.tasks || [];

  // Local state for activeSprintId only
  const [activeSprintId, setActiveSprintId] = useState('');

  // Initialize active sprint if not set
  useEffect(() => {
    if (!activeSprintId && projectSprints.length > 0) {
      const current = projectSprints.find(s => s.status === 'Active') || projectSprints[0];
      setActiveSprintId(current.id);
    }
  }, [projectSprints, activeSprintId]);

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

  const activeSprint = projectSprints.find(s => s.id === activeSprintId);
  const sprintTasks = projectTasks.filter(t => t.sprintId === activeSprintId);

  const stats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter(t => t.status === 'Done').length;
    const inProgress = sprintTasks.filter(t => t.status === 'In Progress').length;
    const backlog = sprintTasks.filter(t => t.status === 'Backlog').length;
    const avgProgress = total > 0 ? sprintTasks.reduce((acc, t) => acc + t.completionPercent, 0) / total : 0;
    return { total, done, inProgress, backlog, avgProgress };
  }, [sprintTasks]);

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

    // If dropping over a column
    const isOverAColumn = COLUMNS.some(col => col.id === overIdVal);
    
    if (isOverAColumn) {
      const newStatus = overIdVal as TaskStatus;
      if (activeTaskDrag.status !== newStatus) {
        const updatedTasks = projectTasks.map(t => 
          t.id === activeIdVal ? { ...t, status: newStatus } : t
        );
        updateProject(project.id, { tasks: updatedTasks });
      }
      return;
    }

    // If dropping over another task
    const overTaskDrag = projectTasks.find(t => t.id === overIdVal);
    if (overTaskDrag && activeTaskDrag.status !== overTaskDrag.status) {
      const updatedTasks = projectTasks.map(t => 
        t.id === activeIdVal ? { ...t, status: overTaskDrag.status } : t
      );
      updateProject(project.id, { tasks: updatedTasks });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !project) return;

    const activeIdVal = active.id as string;
    const overIdVal = over.id as string;

    const activeTaskDragEnd = projectTasks.find(t => t.id === activeIdVal);
    if (!activeTaskDragEnd) return;

    // Determine final status
    let finalStatus = activeTaskDragEnd.status;
    const isOverAColumn = COLUMNS.some(col => col.id === overIdVal);
    if (isOverAColumn) {
      finalStatus = overIdVal as TaskStatus;
    } else {
      const overTaskDragEnd = projectTasks.find(t => t.id === overIdVal);
      if (overTaskDragEnd) finalStatus = overTaskDragEnd.status;
    }

    // Update positions if same category, or status change
    const oldIndex = projectTasks.indexOf(activeTaskDragEnd);
    let updatedTasks = [...projectTasks];
    
    if (activeTaskDragEnd.status !== finalStatus) {
       updatedTasks = projectTasks.map(t => t.id === activeIdVal ? { ...t, status: finalStatus } : t);
       realtimeService.simulateEvent('task.status_changed', {
         taskId: activeIdVal,
         newStatus: finalStatus,
         userName: 'Bạn'
       });
    }

    // Handle position move
    const overTaskForMove = projectTasks.find(t => t.id === overIdVal);
    if (overTaskForMove) {
      const newIndex = projectTasks.indexOf(overTaskForMove);
      updatedTasks = arrayMove(updatedTasks, oldIndex, newIndex);
    }
    
    updateProject(project.id, { tasks: updatedTasks });
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
      // Check if holding ANY tasks
      const assignedTasks = projectTasks.filter(t => t.assigneeId === member.employeeId);
      if (assignedTasks.length > 0) {
        alert('Không thể chuyển Inactive nhân sự đang giữ task. Vui lòng gỡ hoặc thay thế nhân sự này khỏi toàn bộ task trước.');
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
      const emp = employees.find(e => e.id === m.employeeId);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <select 
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none pr-10"
                value={activeSprintId}
                onChange={(e) => setActiveSprintId(e.target.value)}
              >
                {projectSprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.startDate} → {s.endDate}</option>
                ))}
              </select>
              <LayoutGrid className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
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
            <button 
              onClick={() => setIsSprintManagementOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#003366] hover:bg-gray-50 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Quản lý Sprint
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
              <FileText className="w-4 h-4" />
              Báo cáo
            </button>
            <button 
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Activity className="w-4 h-4" />
              Daily Review
            </button>
            <button 
              onClick={() => setIsCreateTaskOpen(true)}
              className="flex items-center gap-2 bg-[#003366] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
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
                  className="text-gray-100"
                  strokeDasharray="100, 100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#FF6600]"
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
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiến độ Sprint</p>
              <p className="text-sm font-black text-gray-900">{stats.done}/{stats.total} Task hoàn thành</p>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mục tiêu Sprint</span>
              </div>
                <p className="text-xs font-medium text-gray-600 italic">"{activeSprint?.goal}"</p>
              </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
        <div className="mt-8 flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100">
          <button 
            onClick={() => setActiveTab('kanban')}
            className={cn(
              "flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === 'kanban' 
                ? "bg-white text-[#003366] shadow-sm shadow-[#003366]/5" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Bảng Kanban
          </button>
            <button 
              onClick={() => setActiveTab('personnel')}
              className={cn(
                "flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                activeTab === 'personnel' 
                  ? "bg-white text-[#003366] shadow-sm shadow-[#003366]/5" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
              )}
            >
              <Users className="w-4 h-4" />
              Nhân sự
            </button>
            <button 
              onClick={() => setActiveTab('schedule')}
              className={cn(
                "flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                activeTab === 'schedule' 
                  ? "bg-white text-[#003366] shadow-sm shadow-[#003366]/5" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
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
              tasks={sprintTasks.filter(t => t.status === col.id)}
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
              <TaskCard task={activeTask} onClick={() => {}} employees={employees} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      ) : activeTab === 'personnel' ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Danh sách nhân sự</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{projectPersonnel.length} thành viên tham gia</p>
            </div>
            <button 
              onClick={() => setIsAddPersonnelOpen(true)}
              className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#002244] transition-all shadow-lg shadow-[#003366]/20"
            >
              <UserPlus className="w-4 h-4" />
              Thêm nhân sự
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Họ tên & Vai trò</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Phòng ban</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">% Allocation</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">% Contribution</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Thời gian</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projectPersonnel.map((m) => (
                  <tr key={m.id} className={cn("group hover:bg-gray-50/50 transition-all", m.status === 'Inactive' && "opacity-60")}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-[#003366] border border-gray-100 uppercase">
                          {m.employee?.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{m.employee?.name}</p>
                          <p className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest">{m.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-gray-600 text-center">{m.employee?.department}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-gray-900">{m.allocation}%</span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-[#003366]" style={{ width: `${m.allocation}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-[#FF6600]">{m.contribution}%</span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-[#FF6600]" style={{ width: `${m.contribution}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-400">{m.startDate}</span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-300 rotate-90" />
                        <span className="text-[10px] font-bold text-gray-400">{m.endDate}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => handleToggleMemberStatus(m.id, m.status)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          m.status === 'Active' 
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {m.status}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-300 hover:text-gray-900 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      />

      {/* Daily Review Panel */}
      <DailyReviewPanel 
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        tasks={sprintTasks}
        employees={employees}
        onSave={(logs: any) => {
          // In a real app, we'd send logs to backend
          logs.forEach(log => {
            realtimeService.simulateEvent('task.progress_logged', {
              taskId: log.taskId,
              progressPercent: log.progressPercent,
              hoursWorked: log.hoursWorked
            });
          });
          setIsReviewOpen(false);
        }}
      />

      {/* Substitution Dialog */}
      <SubstitutionDialog 
        isOpen={isSubstitutionOpen}
        onClose={() => setIsSubstitutionOpen(false)}
        task={selectedTask}
        employees={employees}
        onConfirm={(newAssigneeId: string, reason: string) => {
          if (!selectedTask || !project) return;
          // Logic for immediate substitution
          const oldTask = { ...selectedTask, status: 'Closed' as TaskStatus };
          const newTask: Task = {
            ...selectedTask,
            id: `task-cloned-${Date.now()}`,
            title: `[Tiếp nối] ${selectedTask.title}`,
            assigneeId: newAssigneeId,
            clonedFromTaskId: selectedTask.id,
            startingPercent: selectedTask.completionPercent,
            actualHours: 0,
            commentCount: 0,
            isReviewedToday: false
          };
          const updatedTasks = [...projectTasks.map(t => t.id === oldTask.id ? oldTask : t), newTask];
          updateProject(project.id, { tasks: updatedTasks });
          setIsSubstitutionOpen(false);
          setIsDetailOpen(false);
          // Realtime notify
          realtimeService.simulateEvent('task.staff_changed', {
            taskId: selectedTask.id,
            newTaskId: newTask.id,
            oldAssignee: employees.find(e => e.id === selectedTask.assigneeId)?.name,
            newAssignee: employees.find(e => e.id === newAssigneeId)?.name
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
            sprintId={activeSprintId}
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
          />
        )}
      </AnimatePresence>

      <SprintManagementModal 
        isOpen={isSprintManagementOpen}
        onClose={() => setIsSprintManagementOpen(false)}
        sprints={projectSprints}
        onUpdate={handleUpdateSprints}
        projectId={project?.id || ''}
      />

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
    </div>
  );
}

function BoardColumn({ column, tasks, onTaskClick, employees }: any) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px] flex flex-col gap-4">
      <div className={cn("p-3 rounded-xl flex items-center justify-between", column.color)}>
        <h3 className="text-sm font-black uppercase tracking-widest">{column.title}</h3>
        <span className="text-xs font-bold opacity-70">{tasks.length}</span>
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              employees={employees}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, isOverlay, employees }: { task: Task; onClick: () => void; isOverlay?: boolean; key?: React.Key; employees: Employee[] }) {
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

  const priorityColors = {
    'Cao': 'bg-red-100 text-red-700',
    'Trung bình': 'bg-amber-100 text-amber-700',
    'Thấp': 'bg-gray-100 text-gray-700',
  };

  const typeColors = {
    'Feature': 'bg-blue-50 text-blue-600',
    'Bug': 'bg-red-50 text-red-600',
    'Task': 'bg-gray-50 text-gray-600',
    'Research': 'bg-purple-50 text-purple-600',
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
        "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#003366]/20 transition-all group",
        task.status === 'Closed' && "opacity-50 grayscale",
        isOverlay && "cursor-grabbing shadow-xl border-[#003366]/30"
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

      <h4 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#003366] transition-colors">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 bg-[#003366] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {assignee?.name.charAt(0) || '?'}
            </div>
            {task.clonedFromTaskId && (
              <div className="absolute -right-1 -bottom-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                <ArrowRightLeft className="w-2 h-2 text-[#FF6600]" />
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
            className="h-full bg-[#FF6600] transition-all duration-500" 
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
          className="text-[10px] font-bold text-[#003366] hover:underline flex items-center gap-1"
        >
          Xem chi tiết
          <ChevronRight className="w-3 h-3" />
        </button>
        {task.isReviewedToday && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn("w-3 h-3", s <= 4 ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Sub-components (simplified for initial implementation)

function TaskDetailSheet({ isOpen, onClose, task, onUpdate, onSubstitution, employees }: any) {
  if (!task) return null;

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
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <LayoutGrid className="w-5 h-5 text-[#003366]" />
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
                    className="text-2xl font-black text-gray-900 w-full bg-transparent border-none focus:ring-0 p-0 mb-4"
                    defaultValue={task.title}
                  />
                  <div className="flex flex-wrap gap-3">
                    <select 
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
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
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                      value={task.priority}
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

                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {employees.find(e => e.id === task.assigneeId)?.name.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Người thực hiện</p>
                        <p className="text-sm font-bold text-gray-900">{employees.find(e => e.id === task.assigneeId)?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={onSubstitution}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#FF6600] hover:bg-orange-50 transition-all"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Thay thế
                    </button>
                  </div>

                   <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-400">Phân bổ tiến độ</span>
                      <span className="text-[#FF6600]">{task.completionPercent}% Tổng</span>
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
                        className="h-full bg-[#FF6600] transition-all duration-500 relative" 
                        style={{ width: `${task.completionPercent - (task.startingPercent || 0)}%` }}
                        title="Tiến độ người mới"
                      >
                         <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-black">
                            {task.completionPercent - (task.startingPercent || 0)}%
                          </span>
                      </div>
                    </div>
                    {task.startingPercent && task.startingPercent > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-400">Người cũ: {task.startingPercent}%</span>
                        <span className="text-[#FF6600]">Người mới: {task.completionPercent - task.startingPercent}%</span>
                      </div>
                    )}
                  </div>
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

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Thảo luận</h3>
                  <div className="space-y-6 mb-8">
                    <CommentItem name="Trần Thị Bình" text="Tôi đã cập nhật API, An kiểm tra giúp nhé." time="10:30 AM" avatar="TB" />
                    <CommentItem name="Nguyễn Văn An" text="Ok, để mình check rồi báo lại." time="11:15 AM" avatar="VA" />
                  </div>
                  <div className="relative">
                    <input 
                      placeholder="Viết bình luận..."
                      className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#003366] text-white rounded-xl hover:bg-[#002244] transition-all">
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
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function CommentItem({ name, text, time, avatar }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
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
        className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Đánh giá cuối ngày</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Ngày {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400">
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
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-[#003366] font-bold">
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
                      className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#FF6600]"
                      value={log.progressPercent}
                      onChange={(e) => {
                        const newLogs = [...logs];
                        newLogs[idx].progressPercent = parseInt(e.target.value);
                        setLogs(newLogs);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Đánh giá</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star 
                          key={s} 
                          onClick={() => {
                            const newLogs = [...logs];
                            newLogs[idx].rating = s;
                            setLogs(newLogs);
                          }}
                          className={cn(
                            "w-5 h-5 cursor-pointer transition-all",
                            s <= log.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 hover:text-amber-200"
                          )} 
                        />
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

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">Hủy bỏ</button>
          <button 
            onClick={() => onSave(logs.filter(l => !l.isReviewed))}
            className="px-8 py-3 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
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
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <ArrowRightLeft className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Thay thế nhân sự</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-xl transition-all text-orange-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Task hiện tại</p>
            <p className="text-sm font-bold text-gray-900 mb-3">{task.title}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#003366] rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                  {currentAssignee?.name.charAt(0) || '?'}
                </div>
                <span className="text-xs font-bold text-gray-600">{currentAssignee?.name || 'N/A'}</span>
              </div>
              <span className="text-xs font-black text-[#FF6600]">{task.completionPercent}% hoàn thành</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Chọn người thay thế</label>
            <select 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none"
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
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
              className="flex-1 py-4 bg-[#003366] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    
    // Generate planned shifts from tasks
    tasks.forEach(task => {
      if (!task.startDate || !task.dueDate || !task.assigneeId) return;
      if (task.status === 'Closed') return; // Optionally skip closed tasks

      let current = parseISO(task.startDate);
      const end = parseISO(task.dueDate);
      
      while (current <= end) {
        const dayOfWeek = getDay(current); // 0=Sun, 1=Mon, ..., 6=Sat
        const dateStr = format(current, 'yyyy-MM-dd');
        
        // Find if there's logged actual data for this day/task
        const existingMorningLog = schedules.find(s => s.taskId === task.id && s.date === dateStr && s.type === 'Sáng');
        const existingAfternoonLog = schedules.find(s => s.taskId === task.id && s.date === dateStr && s.type === 'Chiều');
        
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          result.push({
            id: existingMorningLog?.id || `${task.id}-${dateStr}-Sáng`,
            taskId: task.id,
            employeeId: task.assigneeId,
            date: dateStr,
            type: 'Sáng',
            efficiency: existingMorningLog?.efficiency || 100,
            isProductive: existingMorningLog ? existingMorningLog.isProductive : true,
            notes: existingMorningLog?.notes || 'Kế hoạch',
            isPlanned: !existingMorningLog
          });
          result.push({
            id: existingAfternoonLog?.id || `${task.id}-${dateStr}-Chiều`,
            taskId: task.id,
            employeeId: task.assigneeId,
            date: dateStr,
            type: 'Chiều',
            efficiency: existingAfternoonLog?.efficiency || 100,
            isProductive: existingAfternoonLog ? existingAfternoonLog.isProductive : true,
            notes: existingAfternoonLog?.notes || 'Kế hoạch',
            isPlanned: !existingAfternoonLog
          });
        } else if (dayOfWeek === 6) {
          result.push({
            id: existingMorningLog?.id || `${task.id}-${dateStr}-Sáng`,
            taskId: task.id,
            employeeId: task.assigneeId,
            date: dateStr,
            type: 'Sáng',
            efficiency: existingMorningLog?.efficiency || 100,
            isProductive: existingMorningLog ? existingMorningLog.isProductive : true,
            notes: existingMorningLog?.notes || 'Kế hoạch',
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
              viewMode === 'list' ? "bg-white text-[#003366] shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <List className="w-4 h-4" />
            Danh sách
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              viewMode === 'calendar' ? "bg-white text-[#003366] shadow-sm" : "text-gray-400 hover:text-gray-600"
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
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 outline-none focus:ring-2 focus:ring-[#003366]/20"
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
  if (schedules.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
        <Calendar className="w-12 h-12 text-gray-200 mb-4" />
        <h4 className="text-lg font-black text-gray-900 mb-2">Không có lịch làm việc</h4>
        <p className="text-sm font-medium text-gray-500 max-w-sm">Chưa có task nào được giao trong timeline này hoặc chưa có lịch được ghi nhận.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày & Ca</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhân viên</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Task công việc</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Hiệu suất</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
              <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {schedules.map((s: any) => {
              const emp = employees.find((e: any) => e.id === s.employeeId);
              const task = tasks.find((t: any) => t.id === s.taskId);
              return (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{format(parseISO(s.date), 'dd/MM/yyyy')}</p>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                        s.type === 'Sáng' ? "bg-blue-100 text-blue-700" :
                        s.type === 'Chiều' ? "bg-orange-100 text-orange-700" :
                        "bg-purple-100 text-purple-700"
                      )}>
                        Ca {s.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#003366] text-xs uppercase shadow-sm">
                        {emp?.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{emp?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-gray-900">{task?.title || '—'}</p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase truncate max-w-[200px]">{task?.description}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {s.isPlanned ? (
                      <span className="text-sm font-bold text-gray-300">—</span>
                    ) : (
                      <div className="inline-flex flex-col items-center">
                        <div className="flex items-center gap-1 text-sm font-black text-gray-900">
                          {s.efficiency}%
                          {s.efficiency >= 90 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                        </div>
                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className={cn("h-full", s.efficiency >= 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${s.efficiency}%` }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    {s.isPlanned ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 border border-gray-200 border-dashed">
                        Kế hoạch
                      </span>
                    ) : (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        s.isProductive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {s.isProductive ? 'Đạt' : 'Không đạt'}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <p className={cn(
                      "text-xs max-w-[150px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all",
                      s.isPlanned ? "text-gray-300 italic" : "text-gray-500"
                    )}>
                      {s.notes || '—'}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
                  const shifts = empShifts[empId].sort((a,b) => {
                    const order = { 'Sáng': 1, 'Chiều': 2, 'OT': 3 };
                    return (order[a.type as keyof typeof order] || 4) - (order[b.type as keyof typeof order] || 4);
                  });

                  return (
                    <div key={empId} className="flex flex-col gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                      {/* Employee Info */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                        <div className="w-6 h-6 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-inner">
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

