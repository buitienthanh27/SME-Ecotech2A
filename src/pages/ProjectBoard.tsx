import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  TaskStatusLog,
  WorkShift,
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
import { Modal, Btn, ConfirmModal, showToast, StatusBadge } from '../components/ui';
import { useStore } from '../store/useStore';
import { getBoardSocket } from '../services/boardSocket';
import { hasProjectManagerPrivileges, canMoveTaskFromReviewToDone } from '../lib/permissions';
import { generateWorkShiftsFromTasks, mergeGeneratedWorkSchedules } from '../lib/workScheduleFromTasks';
import { mergeReorderedSubset } from '../lib/taskBoardMerge';
import { taskContributionPoints, taskWorkloadWeight } from '../lib/taskWorkloadWeight';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Project Board Component

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'Todo', title: 'Todo', color: 'bg-[#F1F5F9] text-[#64748B]' },
  { id: 'In Progress', title: 'Đang làm', color: 'bg-[#E0F2FE] text-[#0369A1]' },
  { id: 'Review', title: 'Review', color: 'bg-[#FEF3C7] text-[#B45309]' },
  { id: 'Done', title: 'Hoàn thành', color: 'bg-[#ECFDF5] text-[#148922]' },
];

// Mức tiến độ mặc định cho mỗi trạng thái
const STATUS_COMPLETION_MAP: Record<TaskStatus, number> = {
  Todo: 0,
  'In Progress': 25,
  Review: 75,
  Done: 100,
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
  const [isSendPersonnelApprovalOpen, setIsSendPersonnelApprovalOpen] = useState(false);
  const [inactivatingMember, setInactivatingMember] = useState<{ id: string; name: string } | null>(null);
  const [inactiveReason, setInactiveReason] = useState('');
  const [sprintScope, setSprintScope] = useState<string>('all');
  const [isSprintManageOpen, setIsSprintManageOpen] = useState(false);

  const { projects, employees, departments, updateProject, personnelRequests, updatePersonnelRequest, currentUser, addPersonnelRequest } =
    useStore();
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

  const updateProjectTasksSync = useCallback(
    (newTasks: Task[]) => {
      if (!project || !currentUser) return;
      const generated = generateWorkShiftsFromTasks(project.id, newTasks);
      const workSchedules = mergeGeneratedWorkSchedules(project.workSchedules, generated);
      updateProject(project.id, { tasks: newTasks, workSchedules });
      getBoardSocket().emit('emit-event', {
        event: 'task.board_sync',
        data: {
          projectId: project.id,
          tasks: newTasks,
          workSchedules,
          fromUserId: currentUser.id,
        },
        projectId: project.id,
      });
    },
    [project, currentUser, updateProject]
  );

  useEffect(() => {
    if (!project?.id || !currentUser?.id) return;
    const s = getBoardSocket();
    s.emit('join-project', {
      projectId: project.id,
      userId: currentUser.id,
      userName: currentUser.name,
    });
    const onRemoteTasks = (data: {
      projectId?: string;
      tasks?: Task[];
      workSchedules?: WorkShift[];
      fromUserId?: string;
    }) => {
      if (data.projectId !== project.id || data.fromUserId === currentUser.id || !data.tasks) return;
      const local = useStore.getState().projects.find((pr) => pr.id === project.id);
      const workSchedules =
        data.workSchedules ??
        mergeGeneratedWorkSchedules(
          local?.workSchedules,
          generateWorkShiftsFromTasks(project.id, data.tasks)
        );
      updateProject(project.id, { tasks: data.tasks, workSchedules });
    };
    s.on('task.board_sync', onRemoteTasks);
    return () => {
      s.off('task.board_sync', onRemoteTasks);
    };
  }, [project?.id, currentUser?.id, currentUser?.name, updateProject]);

  useEffect(() => {
    if (!project) return;
    const active = (project.sprints || []).find((s) => s.status === 'Active');
    setSprintScope(active ? active.id : 'all');
  }, [project?.id]);

  useEffect(() => {
    if (sprintScope === 'backlog') setSprintScope('all');
  }, [sprintScope]);

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

  const roleFilteredTasks = useMemo(() => {
    let tasks = projectTasks;
    if (!currentUser) return tasks;
    if (hasProjectManagerPrivileges(currentUser.role)) return tasks;
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

  const tasksForScope = useMemo(() => {
    if (sprintScope === 'all') return roleFilteredTasks;
    return roleFilteredTasks.filter((t) => t.sprintId === sprintScope);
  }, [roleFilteredTasks, sprintScope]);

  const visibleTasks = tasksForScope;

  /** Tiến độ trung bình toàn dự án (theo quyền xem task), không đổi theo Sprint */
  const projectWideStats = useMemo(() => {
    const tasks = roleFilteredTasks;
    const total = tasks.length;
    const sum = tasks.reduce((acc, t) => acc + (Number(t.completionPercent) || 0), 0);
    const avgProgress = total > 0 ? sum / total : 0;
    return {
      total,
      avgProgress: Number.isFinite(avgProgress) ? avgProgress : 0,
    };
  }, [roleFilteredTasks]);

  const workSchedulesForScope = useMemo(() => {
    const raw = project?.workSchedules || [];
    if (sprintScope === 'all') return raw;
    const ids = new Set(tasksForScope.map((t) => t.id));
    return raw.filter((ws) => {
      if (!ws.taskId) return false;
      return ids.has(ws.taskId);
    });
  }, [project?.workSchedules, sprintScope, tasksForScope]);

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const done = visibleTasks.filter((t) => t.status === 'Done').length;
    const inProgress = visibleTasks.filter((t) => t.status === 'In Progress').length;
    const review = visibleTasks.filter((t) => t.status === 'Review').length;
    const todo = visibleTasks.filter((t) => t.status === 'Todo').length;
    const sumProgress = visibleTasks.reduce((acc, t) => acc + (Number(t.completionPercent) || 0), 0);
    const avgProgress = total > 0 ? sumProgress / total : 0;
    return {
      total,
      done,
      inProgress,
      review,
      todo,
      avgProgress: Number.isFinite(avgProgress) ? avgProgress : 0,
    };
  }, [visibleTasks]);

  useEffect(() => {
    const handleStatusChange = (data: any) => {
      if (!project) return;
      const updatedTasks = projectTasks.map((t: Task) =>
        t.id === data.taskId ? { ...t, status: data.newStatus } : t
      );
      updateProjectTasksSync(updatedTasks);
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
      updateProjectTasksSync(updatedTasks);
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    };

    const handleNewTask = (task: Task) => {
      if (!project) return;
      updateProjectTasksSync([...projectTasks, task]);
    };

    realtimeService.on('task.status_changed', handleStatusChange);
    realtimeService.on('task.progress_logged', handleProgressLogged);
    realtimeService.on('task.created', handleNewTask);

    return () => {
      realtimeService.off('task.status_changed', handleStatusChange);
      realtimeService.off('task.progress_logged', handleProgressLogged);
      realtimeService.off('task.created', handleNewTask);
    };
  }, [project, projectTasks, updateProjectTasksSync]);

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
      if (
        activeTask.status === 'Review' &&
        targetStatus === 'Done' &&
        !canMoveTaskFromReviewToDone(currentUser.role)
      ) {
        showToast.error('Chỉ PM, Lead, CEO hoặc quản trị mới kéo task từ Review sang Hoàn thành.');
        return;
      }

      const statusIds = COLUMNS.map(c => c.id);
      const oldIdx = statusIds.indexOf(activeTask.status);
      const newIdx = statusIds.indexOf(targetStatus);
      const isForward = newIdx > oldIdx;

      const isPM = hasProjectManagerPrivileges(currentUser.role);

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

    // Handle same-status sorting immediately (trong phạm vi sprint đang xem)
    if (overTaskForMove) {
      const scopeSet = new Set(visibleTasks.map(t => t.id));
      if (!scopeSet.has(activeIdVal) || !scopeSet.has(overIdVal)) return;
      const colTasks = projectTasks.filter(
        t => scopeSet.has(t.id) && t.status === activeTask.status
      );
      const oldIdx = colTasks.findIndex(t => t.id === activeIdVal);
      const newIdx = colTasks.findIndex(t => t.id === overIdVal);
      if (oldIdx !== newIdx && oldIdx >= 0 && newIdx >= 0) {
        const newCol = arrayMove(colTasks, oldIdx, newIdx);
        const updatedTasks = mergeReorderedSubset(projectTasks, newCol);
        updateProjectTasksSync(updatedTasks);
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

    updateProjectTasksSync(updatedTasks);
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
    updateProjectTasksSync([...(project.tasks || []), newTask]);
    realtimeService.simulateEvent('task.created', {
      taskId: newTask.id,
      title: newTask.title,
      userName: 'Bạn'
    });
  };

  const canCreateTask =
    sprintScope !== 'all' && projectSprints.length > 0;

  const handleUpdateSprints = (newSprints: Sprint[]) => {
    if (!project) return;
    updateProject(project.id, {
      sprints: newSprints
    });
  };

  const activeTask = activeId ? projectTasks.find(t => t.id === activeId) : null;

  const handleAddMember = (newMember: ProjectMember) => {
    if (!project || !currentUser) return;

    const isDeptHead = departments.some((d) => d.headId === currentUser.id);
    const needsPmApproval = isDeptHead && !hasProjectManagerPrivileges(currentUser.role);

    const today = new Date().toISOString().split('T')[0];
    const normalized: ProjectMember = {
      ...newMember,
      startDate: newMember.startDate || today,
      endDate: newMember.endDate || project.endDate,
      allocation: Number.isFinite(newMember.allocation) ? newMember.allocation : 100,
    };

    const member: ProjectMember = needsPmApproval
      ? { ...normalized, approvalStatus: 'Pending' }
      : { ...normalized, approvalStatus: 'Approved' };

    updateProject(project.id, { members: [...project.members, member] });

    showToast.success(needsPmApproval ? 'Đã thêm nhân sự vào danh sách chờ duyệt.' : 'Đã thêm 1 nhân sự vào dự án.');
  };

  const handleRemovePendingMember = (memberId: string) => {
    if (!project || !currentUser) return;
    const isAdmin = currentUser.role === 'Admin';
    const isDeptHead = departments.some((d) => d.headId === currentUser.id);
    if (!isAdmin && !isDeptHead) return;

    const member = project.members.find((m) => m.id === memberId);
    if (!member) return;
    if (member.approvalStatus !== 'Pending') return;

    const hasPendingRequest = personnelRequests.some(
      (r) =>
        r.projectId === project.id &&
        r.status === 'Pending' &&
        r.employeeId === member.employeeId &&
        r.role === member.role
    );
    if (hasPendingRequest) {
      showToast.error('Nhân sự này đã được gửi duyệt. Vui lòng thao tác sau khi PM xử lý.');
      return;
    }

    updateProject(project.id, {
      members: project.members.filter((m) => m.id !== memberId),
    });
    showToast.success('Đã xóa nhân sự chờ duyệt.');
  };

  const handleSendPersonnelApproval = (memberIds: string[]) => {
    if (!project || !currentUser) return;
    const isAdmin = currentUser.role === 'Admin';
    const isDeptHead = departments.some((d) => d.headId === currentUser.id);
    if (!isAdmin && !isDeptHead) return;

    const selectedMembers = project.members.filter(
      (m) => memberIds.includes(m.id) && m.approvalStatus === 'Pending'
    );

    const existingPendingKeys = new Set(
      personnelRequests
        .filter((r) => r.projectId === project.id && r.status === 'Pending')
        .map((r) => `${r.employeeId}::${r.role}`)
    );

    selectedMembers.forEach((m) => {
      const key = `${m.employeeId}::${m.role}`;
      if (existingPendingKeys.has(key)) return;

      addPersonnelRequest({
        id: `pr-${Date.now()}-${m.id}`,
        projectId: project.id,
        requestedBy: currentUser.id,
        employeeId: m.employeeId,
        role: m.role,
        allocation: m.allocation,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      });
    });

    showToast.success('Đã gửi duyệt nhân sự lên PM.');
    setIsSendPersonnelApprovalOpen(false);
  };

  const handleToggleMemberStatus = (memberId: string, currentStatus: 'Active' | 'Inactive') => {
    if (!project) return;
    const member = project.members.find(m => m.id === memberId);
    if (!member) return;

    if (currentStatus === 'Active') {
      // Check if holding ANY active tasks
      const assignedTasks = projectTasks.filter(
        (t) => t.assigneeId === member.employeeId && t.status !== 'Done'
      );
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
    const scopeTasks = tasksForScope;
    const totalProjectTasks = scopeTasks.length;
    const totalWeight = scopeTasks.reduce((s, t) => {
      const w = taskWorkloadWeight(t);
      return s + (Number.isFinite(w) && w > 0 ? w : 1);
    }, 0);
    const totalProgressPoints = scopeTasks.reduce((s, t) => {
      const p = taskContributionPoints(t);
      return s + (Number.isFinite(p) ? p : 0);
    }, 0);

    return projectMembers.map(m => {
      const emp = employees.find((e) => e.id === m.employeeId);
      const memberTasks = scopeTasks.filter(t => t.assigneeId === m.employeeId);
      const memberTasksCount = memberTasks.length;
      const memberWeight = memberTasks.reduce((s, t) => {
        const w = taskWorkloadWeight(t);
        return s + (Number.isFinite(w) && w > 0 ? w : 1);
      }, 0);
      const memberProgressPoints = memberTasks.reduce((s, t) => {
        const p = taskContributionPoints(t);
        return s + (Number.isFinite(p) ? p : 0);
      }, 0);

      const calculatedAllocation =
        totalWeight > 0
          ? Math.round((memberWeight / totalWeight) * 100)
          : totalProjectTasks > 0
            ? Math.round((memberTasksCount / totalProjectTasks) * 100)
            : 0;

      let contributionShare = 0;
      if (totalProgressPoints > 0 && Number.isFinite(totalProgressPoints) && Number.isFinite(memberProgressPoints)) {
        contributionShare = Math.round((memberProgressPoints / totalProgressPoints) * 100);
      }
      if (!Number.isFinite(contributionShare)) contributionShare = 0;
      contributionShare = Math.min(100, Math.max(0, contributionShare));

      const allocation = Number.isFinite(calculatedAllocation)
        ? Math.min(100, Math.max(0, calculatedAllocation))
        : 0;

      return {
        ...m,
        employee: emp,
        allocation,
        contribution: contributionShare,
      };
    });
  }, [projectMembers, tasksForScope, employees]);

  const groupedPersonnel = useMemo(() => {
    const groups: Record<string, typeof projectPersonnel> = {};
    const managedDepartment = departments.find((d) => d.headId === currentUser?.id);
    if (managedDepartment) groups[managedDepartment.name] = [];

    projectPersonnel.forEach(m => {
      let dept = 'Khác';
      if (m.employee?.departmentId) {
        dept = departments.find((d) => d.id === m.employee.departmentId)?.name || 'Khác';
      } else if (m.employee?.department) {
        dept = m.employee.department;
      }

      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(m);
    });
    return groups;
  }, [projectPersonnel, currentUser, departments]);

  const leadDepartment = useMemo(() => {
    return departments.find((d) => d.headId === currentUser?.id) || null;
  }, [currentUser, departments]);

  const pendingMembersToSend = useMemo(() => {
    if (!project || !selectedDepartment || !currentUser) return [];

    const alreadyPendingKeys = new Set(
      personnelRequests
        .filter((r) => r.projectId === project.id && r.status === 'Pending')
        .map((r) => `${r.employeeId}::${r.role}`)
    );

    const isAdmin = currentUser.role === 'Admin';
    const isDeptHead = departments.some((d) => d.headId === currentUser.id);
    const canSendHere = isAdmin || (isDeptHead && leadDepartment?.name === selectedDepartment);
    if (!canSendHere) return [];

    return project.members
      .filter((m) => m.approvalStatus === 'Pending')
      .filter((m) => {
        const emp = employees.find((e) => e.id === m.employeeId);
        if (!emp) return false;
        const empDeptName =
          emp.departmentId
            ? departments.find((d) => d.id === emp.departmentId)?.name
            : emp.department;
        return empDeptName === selectedDepartment;
      })
      .filter((m) => {
        const key = `${m.employeeId}::${m.role}`;
        return !alreadyPendingKeys.has(key);
      });
  }, [project, selectedDepartment, currentUser, employees, departments, personnelRequests, leadDepartment?.name]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1920px] mx-auto w-full pb-6">
      {/* Thanh điều hướng + tên dự án */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="mt-0.5 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] shadow-sm hover:border-[#148922] hover:text-[#148922] transition-colors"
            title="Về danh sách dự án"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Không gian dự án</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black leading-tight text-[#1A202C] sm:text-2xl truncate max-w-full">
                {project?.name ?? 'Dự án'}
              </h1>
              {project?.code && (
                <span className="shrink-0 rounded-lg bg-[#F1F5F9] px-2 py-0.5 font-mono text-xs font-bold text-[#64748B]">
                  {project.code}
                </span>
              )}
              {project?.status && <StatusBadge status={project.status} />}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 shadow-sm">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isLive ? 'bg-emerald-500' : 'bg-gray-300',
                pulse && 'animate-ping'
              )}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Live</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-bold text-[#334155] shadow-sm transition-all hover:bg-[#F8FAFC]"
          >
            <FileText className="h-4 w-4" />
            Báo cáo
          </button>
        </div>
      </div>

      {/* Tóm tắt tiến độ + tài chính + timeline */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="border-b border-[#F1F5F9] p-4 sm:p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex shrink-0 items-center gap-4">
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <svg className="h-full w-full" viewBox="0 0 36 36">
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
                  <span className="text-[11px] font-black text-gray-900">{Math.round(stats.avgProgress)}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tiến độ (phạm vi đang xem)</p>
                <p className="text-sm font-black text-[#1A202C]">
                  {stats.done}/{stats.total} task hoàn thành
                </p>
              </div>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <div className="rounded-xl bg-[#F1F5F9] p-3">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Todo</p>
                <p className="text-xl font-black text-[#1A202C] sm:text-2xl">{stats.todo}</p>
              </div>
              <div className="rounded-xl bg-[#E0F2FE] p-3">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0369A1]">Đang làm</p>
                <p className="text-xl font-black text-[#1A202C] sm:text-2xl">{stats.inProgress}</p>
              </div>
              <div className="rounded-xl bg-[#FEF3C7] p-3">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#B45309]">Review</p>
                <p className="text-xl font-black text-[#1A202C] sm:text-2xl">{stats.review}</p>
              </div>
              <div className="rounded-xl bg-[#ECFDF5] p-3">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#148922]">Hoàn thành</p>
                <p className="text-xl font-black text-[#1A202C] sm:text-2xl">{stats.done}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[#148922]" />
              <span className="text-sm font-bold text-gray-800">Tài chính dự án</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <ArrowUpRight className="h-3 w-3 text-[#148922]" /> Doanh thu
                </p>
                <p className="text-xs font-semibold text-gray-500">Dự kiến: {plannedIncome.toLocaleString('vi-VN')} đ</p>
                <p className="text-sm font-black text-[#148922]">Thực: {actualIncome.toLocaleString('vi-VN')} đ</p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <ArrowDownRight className="h-3 w-3 text-red-500" /> Chi phí
                </p>
                <p className="text-xs font-semibold text-gray-500">Dự kiến: {plannedExpense.toLocaleString('vi-VN')} đ</p>
                <p className="text-sm font-black text-red-600">Thực: {actualExpense.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lãi/Lỗ tạm tính</span>
              <span
                className={`text-sm font-black ${provisionalProfit >= 0 ? 'text-[#148922]' : 'text-red-600'}`}
              >
                {(provisionalProfit > 0 ? '+' : '')}
                {provisionalProfit.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#148922]" />
                <span className="text-sm font-bold text-gray-800">Timeline</span>
              </div>
              <div className="flex items-center gap-4 text-right text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Bắt đầu</span>
                  <span className="font-black text-gray-900">{project?.startDate ?? '—'}</span>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Kết thúc</span>
                  <span className="font-black text-gray-900">{project?.endDate ?? '—'}</span>
                </div>
              </div>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 bg-[#148922] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, projectWideStats.avgProgress))}%` }}
              />
            </div>
            <p className="mt-2 text-right text-[10px] font-bold text-[#148922]">
              Tiến độ chung toàn dự án: {Math.round(Math.min(100, Math.max(0, projectWideStats.avgProgress)))}%
              <span className="ml-1 font-medium text-gray-400">({projectWideStats.total} task)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab + phạm vi sprint (hành động tạo task nằm dưới) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 sm:p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full min-w-0 flex-wrap gap-1 lg:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={cn(
              'flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all sm:flex-none sm:justify-start sm:px-5',
              activeTab === 'kanban'
                ? 'bg-white text-[#148922] shadow-sm shadow-[#148922]/10'
                : 'text-[#64748B] hover:bg-white/70 hover:text-[#1A202C]'
            )}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personnel')}
            className={cn(
              'flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all sm:flex-none sm:justify-start sm:px-5',
              activeTab === 'personnel'
                ? 'bg-white text-[#148922] shadow-sm shadow-[#148922]/10'
                : 'text-[#64748B] hover:bg-white/70 hover:text-[#1A202C]'
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            Nhân sự
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={cn(
              'flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all sm:flex-none sm:justify-start sm:px-5',
              activeTab === 'schedule'
                ? 'bg-white text-[#148922] shadow-sm shadow-[#148922]/10'
                : 'text-[#64748B] hover:bg-white/70 hover:text-[#1A202C]'
            )}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Lịch
          </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#E2E8F0] pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:border-t-0 sm:pt-0 lg:border-l lg:pl-4">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 shrink-0 text-[#64748B]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">Sprint</span>
            </div>
            <select
              value={sprintScope}
              onChange={(e) => setSprintScope(e.target.value)}
              className="min-h-[40px] min-w-0 flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-bold text-[#1A202C] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#148922]/20 sm:min-w-[220px] sm:flex-none"
            >
              <option value="all">Toàn bộ dự án</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => setIsSprintManageOpen(true)}
                className="min-h-[40px] shrink-0 rounded-xl border border-[#148922]/40 bg-white px-4 py-2 text-sm font-bold text-[#148922] transition-colors hover:bg-[#ECFDF5]"
              >
                Quản lý Sprint
              </button>
            </div>
          </div>
        </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          disabled={!canCreateTask}
          title={
            !canCreateTask
              ? sprintScope === 'all'
                ? 'Chọn một Sprint ở ô Phạm vi — không tạo task khi đang xem toàn bộ dự án'
                : 'Thêm ít nhất một Sprint trong Quản lý Sprint'
              : 'Tạo task mới trong phạm vi đang chọn'
          }
          onClick={() => {
            if (!canCreateTask) {
              showToast.error(
                sprintScope === 'all'
                  ? 'Vui lòng chọn một Sprint ở ô Phạm vi trước khi tạo task.'
                  : 'Cần có ít nhất một Sprint để tạo task.'
              );
              return;
            }
            setIsCreateTaskOpen(true);
          }}
          className="min-h-[40px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#148922] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#148922]/20 transition-all hover:bg-[#0E6318] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Plus className="h-4 w-4" />
          Tạo task
        </button>
      </div>

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
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[13px] leading-snug text-[#475569]">
            <span className="font-bold text-[#148922]">Phạm vi % Allocation / % Contribution:</span>{' '}
            {sprintScope === 'all'
              ? 'Toàn dự án — tính trên mọi task bạn được xem; trọng số = giờ ước tính (nếu có) hoặc số ngày từ ngày bắt đầu đến hạn chót.'
              : `${projectSprints.find((s) => s.id === sprintScope)?.name ?? 'Sprint'} — chỉ các task gán sprint này.`}
          </div>
          {hasProjectManagerPrivileges(currentUser?.role ?? 'Employee') && project && (
            <PersonnelRequestsPanel
              projectId={project.id}
              onApprove={(req: any) => {
                const matched = project.members.find(
                  (m) => m.employeeId === req.employeeId && m.role === req.role
                );

                if (matched) {
                  updateProject(project.id, {
                    members: project.members.map((m) =>
                      m.id === matched.id
                        ? { ...m, status: 'Active', approvalStatus: 'Approved', endDate: project.endDate }
                        : m
                    ),
                  });
                } else {
                  // Fallback: nếu member chưa tồn tại trong project (tùy dữ liệu), thêm mới ở trạng thái Approved
                  const newMember: ProjectMember = {
                    id: `m-${Date.now()}`,
                    employeeId: req.employeeId,
                    projectId: req.projectId,
                    role: req.role,
                    allocation: req.allocation,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: project.endDate,
                    status: 'Active',
                    approvalStatus: 'Approved',
                  };
                  updateProject(project.id, { members: [...project.members, newMember] });
                }

                updatePersonnelRequest(req.id, {
                  status: 'Approved',
                  processedBy: currentUser.id,
                  processedAt: new Date().toISOString(),
                });
                showToast.success('Đã duyệt nhân sự dự án.');
              }}
              onReject={(req: any) => {
                updateProject(project.id, {
                  members: project.members.map((m) =>
                    m.employeeId === req.employeeId && m.role === req.role
                      ? { ...m, approvalStatus: 'Rejected' }
                      : m
                  ),
                });

                updatePersonnelRequest(req.id, {
                  status: 'Rejected',
                  processedBy: currentUser.id,
                  processedAt: new Date().toISOString(),
                });
                showToast.success('Đã từ chối bổ sung nhân sự.');
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
                  {(hasProjectManagerPrivileges(currentUser?.role ?? 'Employee') ||
                    leadDepartment?.name === selectedDepartment) && (
                    <button
                      onClick={() => setIsAddPersonnelOpen(true)}
                      className="flex items-center gap-2 bg-[#148922] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0b6b17] transition-all shadow-lg shadow-[#148922]/20"
                    >
                      <UserPlus className="w-4 h-4" />
                      Thêm nhân sự
                    </button>
                  )}4
                  {pendingMembersToSend.length > 0 && (
                      <button
                        onClick={() => setIsSendPersonnelApprovalOpen(true)}
                        className="flex items-center gap-2 bg-[#F59E0B] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#D97706] transition-all shadow-lg shadow-[#F59E0B]/20"
                      >
                        <Send className="w-4 h-4" />
                        Gửi duyệt nhân sự ({pendingMembersToSend.length})
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
                                  type="button"
                                  disabled={m.approvalStatus !== 'Approved'}
                                  onClick={() => {
                                    if (m.approvalStatus === 'Approved') {
                                      handleToggleMemberStatus(m.id, m.status);
                                    }
                                  }}
                                  className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                    m.approvalStatus === 'Pending'
                                      ? "bg-amber-100 text-amber-700"
                                      : m.approvalStatus === 'Rejected'
                                        ? "bg-red-100 text-red-600"
                                        : m.status === 'Active'
                                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  )}
                                >
                                  {m.approvalStatus === 'Pending'
                                    ? 'Pending'
                                    : m.approvalStatus === 'Rejected'
                                      ? 'Rejected'
                                      : m.status}
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
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {leadDepartment
                        ? Object.entries(groupedPersonnel).filter(
                            ([deptName]) =>
                              leadDepartment?.name === deptName
                          ).length
                        : Object.keys(groupedPersonnel).length}
                      {' '}phòng ban được thêm vào
                    </p>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(groupedPersonnel)
                    .filter(([deptName]) => {
                      if (!leadDepartment) return true;
                      return leadDepartment.name === deptName;
                    })
                    .map(([deptName, membersList]) => {
                    const members = membersList as any[];
                    const isManaged = leadDepartment?.name === deptName;
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
          schedules={workSchedulesForScope}
          tasks={tasksForScope}
          employees={employees}
          project={project}
          updateProject={updateProject}
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
          updateProjectTasksSync(updatedTasks);
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
          updateProjectTasksSync(updatedTasks);
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
        {isCreateTaskOpen && project && (
          <TaskCreateModal
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            onCreate={handleCreateTask}
            sprints={projectSprints.map((s) => ({
              id: s.id,
              name: s.name,
              startDate: s.startDate,
              endDate: s.endDate,
            }))}
            projectStartDate={project.startDate}
            projectEndDate={project.endDate}
            initialSprintId={sprintScope !== 'all' ? sprintScope : undefined}
            members={projectMembers.filter((m) => m.status === 'Active')}
          />
        )}
      </AnimatePresence>

      {project && (
        <SprintManagementModal
          isOpen={isSprintManageOpen}
          onClose={() => setIsSprintManageOpen(false)}
          sprints={projectSprints}
          onUpdate={handleUpdateSprints}
          projectId={project.id}
          projectStartDate={project.startDate}
          projectEndDate={project.endDate}
        />
      )}

      {/* Project Personnel Add Modal */}
      <AnimatePresence>
        {isAddPersonnelOpen && (
          <PersonnelAddModal
            isOpen={isAddPersonnelOpen}
            onClose={() => setIsAddPersonnelOpen(false)}
            projectId={project?.id || ''}
            onAdd={handleAddMember}
            existingMemberIds={projectMembers.map((m) => String(m.employeeId))}
            departmentId={
              selectedDepartment
                ? departments.find((d) => d.name === selectedDepartment)?.id
                : undefined
            }
            departmentName={selectedDepartment ?? undefined}
          />
        )}
      </AnimatePresence>

      {/* Lead: Gửi duyệt nhân sự */}
      <SendPersonnelApprovalModal
        isOpen={isSendPersonnelApprovalOpen}
        onClose={() => setIsSendPersonnelApprovalOpen(false)}
        pendingMembers={pendingMembersToSend}
        employees={employees}
        onRemovePendingMember={handleRemovePendingMember}
        onSend={handleSendPersonnelApproval}
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
        task.status === 'Done' &&
          (task.completionPercent ?? 0) < 100 &&
          'opacity-50 grayscale',
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
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          child.status === 'Done'
                            ? 'bg-emerald-500'
                            : child.status === 'In Progress'
                              ? 'bg-blue-500'
                              : child.status === 'Review'
                                ? 'bg-amber-500'
                                : 'bg-gray-300'
                        )}
                      />
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
                          const labels: Record<string, string> = {
                            Todo: 'Todo',
                            'In Progress': 'Đang làm',
                            Review: 'Review',
                            Done: 'Hoàn thành',
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
      setLogs(tasks.filter((t: any) => t.status !== 'Done').map((t: any) => ({
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

function WorkScheduleTab({ schedules, tasks, employees, project, updateProject }: { schedules: any[], tasks: Task[], employees: Employee[], project?: any, updateProject?: (id: string, data: any) => void }) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('all');
  const [showAddOTModal, setShowAddOTModal] = useState(false);

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
      if (task.status === 'Done') return;

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
          {updateProject && project && (
            <button
              onClick={() => setShowAddOTModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#148922] hover:bg-[#0E6318] text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm ca OT
            </button>
          )}
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

      {/* Add OT Shift Modal */}
      {showAddOTModal && project && updateProject && (
        <AddOTShiftModal
          employees={employees}
          tasks={tasks}
          onClose={() => setShowAddOTModal(false)}
          onSave={(newShift: any) => {
            const newSchedules = [...(project.workSchedules || []), newShift];
            updateProject(project.id, { workSchedules: newSchedules });
            setShowAddOTModal(false);
          }}
        />
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
                              "bg-emerald-100 text-emerald-700"
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

function ScheduleCalendarView({ schedules, employees }: { schedules: any[], employees: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get all days in current month
  const daysInMonth = useMemo(() => {
    const days: string[] = [];
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= daysCount; i++) {
      const date = new Date(currentYear, currentMonth, i);
      if (date.getDay() !== 0) { // Skip Sundays
        days.push(format(date, 'yyyy-MM-dd'));
      }
    }
    return days;
  }, [currentMonth, currentYear]);

  // Get week days for header
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const goToPrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Group schedules by day
  const groupedSchedules = useMemo(() => {
    const acc: Record<string, any[]> = {};
    daysInMonth.forEach(d => acc[d] = []);

    schedules.forEach((s: any) => {
      const { date } = s;
      if (!acc[date]) return;
      acc[date].push(s);
    });
    return acc;
  }, [schedules, daysInMonth]);

  // Count shifts by type for each day
  const shiftCounts = useMemo(() => {
    const counts: Record<string, { Sáng: number; Chiều: number; OT: number }> = {};
    daysInMonth.forEach(d => {
      counts[d] = { Sáng: 0, Chiều: 0, OT: 0 };
    });

    schedules.forEach((s: any) => {
      const { date, type } = s;
      if (!counts[date]) return;
      if (type === 'Sáng') counts[date].Sáng++;
      else if (type === 'Chiều') counts[date].Chiều++;
      else if (type === 'OT') counts[date].OT++;
    });
    return counts;
  }, [schedules, daysInMonth]);

  // Get employees working on selected day
  const selectedDayEmployees = useMemo(() => {
    if (!selectedDay) return [];
    const dayShifts = groupedSchedules[selectedDay] || [];
    return dayShifts.map((s: any) => ({
      ...s,
      employee: employees.find((e: any) => e.id === s.employeeId)
    }));
  }, [selectedDay, groupedSchedules, employees]);

  const handleDayClick = (day: string) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  // Calculate grid start offset (empty cells before first day)
  const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay() - 1;

  return (
    <div className="space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 hover:border-gray-300"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-bold text-gray-700">Tháng trước</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-gray-900 min-w-[180px] text-center">
            Tháng {currentMonth + 1} / {currentYear}
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[#148922] text-white rounded-xl text-sm font-bold hover:bg-[#0E6318] transition-colors shadow-sm shadow-[#148922]/20"
          >
            Hôm nay
          </button>
          <button
            onClick={goToNextMonth}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 hover:border-gray-300"
          >
            <span className="text-sm font-bold text-gray-700">Tháng sau</span>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid - Month View */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-[#148922] to-[#0E6318]">
          {weekDays.map((day, idx) => (
            <div key={idx} className="p-3 text-center text-xs font-black text-white uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-gray-30 min-h-[100px] border-r border-b border-gray-50" />
          ))}

          {daysInMonth.map(day => {
            const isToday = format(parseISO(day), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const counts = shiftCounts[day] || { Sáng: 0, Chiều: 0, OT: 0 };
            const totalShifts = counts.Sáng + counts.Chiều + counts.OT;
            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "min-h-[110px] p-2 border-r border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50",
                  isToday && "bg-[#148922]/5",
                  isSelected && "bg-[#148922]/10 ring-2 ring-inset ring-[#148922]"
                )}
              >
                {/* Day number */}
                <div className={cn(
                  "text-sm font-black mb-2",
                  isToday ? "text-[#148922]" : "text-gray-700"
                )}>
                  {format(parseISO(day), 'd')}
                </div>

                {/* Shift counts */}
                {totalShifts > 0 ? (
                  <div className="space-y-1.5">
                    {counts.Sáng > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-[22px] h-5 rounded-lg bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">
                          {counts.Sáng}
                        </span>
                        <span className="text-[10px] font-medium text-gray-600">Sáng</span>
                      </div>
                    )}
                    {counts.Chiều > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-[22px] h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">
                          {counts.Chiều}
                        </span>
                        <span className="text-[10px] font-medium text-gray-600">Chiều</span>
                      </div>
                    )}
                    {counts.OT > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-[22px] h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                          {counts.OT}
                        </span>
                        <span className="text-[10px] font-medium text-gray-600">OT</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-300 font-medium">—</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-in slide-in-from-bottom-4 shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#148922] text-white flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-lg">
                  Lịch làm việc
                </h4>
                <p className="text-sm font-medium text-gray-500">
                  {format(parseISO(selectedDay), 'EEEE, dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {selectedDayEmployees.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Không có ca làm việc</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDayEmployees.map((s: any) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all hover:shadow-md",
                    s.isPlanned
                      ? "bg-gray-50 border-gray-100 border-dashed"
                      : s.isProductive
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-amber-50 border-amber-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#148922] to-[#0E6318] text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {s.employee?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-black text-gray-900">{s.employee?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase",
                          s.type === 'Sáng' ? "bg-blue-100 text-blue-700" :
                            s.type === 'Chiều' ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {s.type}
                        </span>
                        {s.isPlanned && (
                          <span className="text-[10px] font-bold text-gray-400">Kế hoạch</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!s.isPlanned && (
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-900">{s.efficiency}%</span>
                      <p className="text-[10px] font-bold text-gray-500">{s.isProductive ? 'Đạt' : 'Không đạt'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
  const approvedRequests = requests.filter(r => r.projectId === projectId && r.status === 'Approved');
  const rejectedRequests = requests.filter(r => r.projectId === projectId && r.status === 'Rejected');

  if (pendingRequests.length === 0 && approvedRequests.length === 0 && rejectedRequests.length === 0) return null;

  return (
    <div className="bg-[#FEF3C7] rounded-[2.5rem] border border-[#F59E0B] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 mb-6">
      <div className="p-8 border-b border-[#F59E0B] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#B45309]" />
          <h3 className="text-xl font-black text-[#B45309] uppercase tracking-tight">
            Nhân sự chờ duyệt / đã xử lý
          </h3>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {pendingRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-[#B45309]" />
                <h4 className="text-sm font-black text-[#B45309] uppercase tracking-widest">
                  Chờ duyệt ({pendingRequests.length})
                </h4>
              </div>
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
          )}

          {approvedRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-[#148922]" />
                <h4 className="text-sm font-black text-[#148922] uppercase tracking-widest">
                  Đã duyệt ({approvedRequests.length})
                </h4>
              </div>
              <div className="space-y-4">
                {approvedRequests.map(req => {
                  const requester = employees.find(e => e.id === req.requestedBy);
                  const targetEmp = employees.find(e => e.id === req.employeeId);
                  return (
                    <div key={req.id} className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          <span className="text-emerald-700">{requester?.name}</span> đã được duyệt thêm <span className="text-emerald-700">{targetEmp?.name}</span>
                        </p>
                        <div className="flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <span>Vai trò: {req.role}</span>
                          <span>Phân bổ: {req.allocation}%</span>
                          <span>Duyệt lúc: {req.processedAt ? new Date(req.processedAt).toLocaleDateString('vi-VN') : '—'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Approved
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rejectedRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <X className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-black text-red-500 uppercase tracking-widest">
                  Bị từ chối ({rejectedRequests.length})
                </h4>
              </div>
              <div className="space-y-4">
                {rejectedRequests.map(req => {
                  const requester = employees.find(e => e.id === req.requestedBy);
                  const targetEmp = employees.find(e => e.id === req.employeeId);
                  return (
                    <div key={req.id} className="bg-white p-4 rounded-xl border border-red-100 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          <span className="text-red-600">{requester?.name}</span> bị từ chối thêm <span className="text-red-600">{targetEmp?.name}</span>
                        </p>
                        <div className="flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <span>Vai trò: {req.role}</span>
                          <span>Phân bổ: {req.allocation}%</span>
                          <span>Từ chối lúc: {req.processedAt ? new Date(req.processedAt).toLocaleDateString('vi-VN') : '—'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                        Rejected
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SendPersonnelApprovalModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  pendingMembers: ProjectMember[];
  employees: Employee[];
  onRemovePendingMember: (memberId: string) => void;
  onSend: (memberIds: string[]) => void;
}> = ({ isOpen, onClose, pendingMembers, employees, onRemovePendingMember, onSend }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(pendingMembers.map((m) => m.id));
  }, [isOpen, pendingMembers]);

  if (!isOpen) return null;

  const toggle = (memberId: string) => {
    setSelectedIds((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 18 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FEF3C7] rounded-xl">
              <Send className="w-5 h-5 text-[#B45309]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Gửi duyệt nhân sự</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Chọn các nhân sự pending để PM duyệt
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-xl transition-all">
            <X className="w-5 h-5 text-orange-400" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {pendingMembers.length === 0 ? (
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-sm font-bold text-amber-800">Không có nhân sự pending để gửi.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pendingMembers.map((m) => {
                  const emp = employees.find((e) => e.id === m.employeeId);
                  const checked = selectedIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'bg-white rounded-2xl border p-4 flex items-center justify-between gap-4',
                        checked ? 'border-[#F59E0B]/50 bg-[#FEF3C7]/30' : 'border-[#E2E8F0] bg-white'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(m.id)}
                          className="w-4 h-4 accent-[#F59E0B]"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">{emp?.name ?? 'Nhân viên'}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">
                            Vai trò: {m.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                          Allocation {m.allocation}%
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemovePendingMember(m.id)}
                          className="p-2 rounded-xl text-orange-500 hover:bg-orange-50 border border-orange-100 transition-all"
                          title="Xóa khỏi danh sách pending"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-8 border-t border-[#E2E8F0] bg-white flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={() => onSend(selectedIds)}
            disabled={selectedIds.length === 0 || pendingMembers.length === 0}
            className="flex-1 py-4 bg-[#F59E0B] text-white rounded-2xl text-sm font-bold hover:bg-[#D97706] transition-all shadow-lg shadow-[#F59E0B]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi duyệt ({selectedIds.length})
          </button>
        </div>
      </motion.div>
    </div>
  );
};

function ShiftEvaluationModal({ shift, employees, tasks, onClose, onSave }: any) {
  const [performanceRating, setPerformanceRating] = useState(shift.evaluationResult || (shift.isProductive ? 'Đạt' : 'Không đạt'));
  const [comment, setComment] = useState(shift.pmComment || '');
  const [timeOffType, setTimeOffType] = useState<'Phép' | 'Không phép' | null>(shift.type === 'Nghỉ' ? shift.reason as any : null);
  const [selectedShiftType, setSelectedShiftType] = useState(shift.slotType || shift.type || 'Sáng');

  const emp = employees.find((e: any) => e.id === shift.employeeId);
  const task = tasks.find((t: any) => t.id === shift.taskId);

  const handleSave = () => {
    let updatedShift: any = {
      ...shift,
      pmComment: comment,
      evaluationResult: performanceRating,
      isProductive: performanceRating !== 'Không đạt',
      type: selectedShiftType,
      slotType: selectedShiftType
    };

    if (timeOffType) {
      // User selected leave (Phép or Không phép)
      updatedShift.originalType = shift.type; // Save original type for lookup
      updatedShift.type = 'Nghỉ';
      updatedShift.reason = timeOffType;
    } else if (shift.type === 'Nghỉ') {
      // User wants to change from leave to working - restore original type
      // Clear the reason and originalType since they're now working
      updatedShift.reason = undefined;
      updatedShift.originalType = undefined;
    }

    onSave(updatedShift);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#148922] to-[#0E6318] text-white p-6 flex items-center justify-between rounded-t-2xl">
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
          {/* Shift Type - Editable */}
          <div>
            <label className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3 block">Chọn loại ca</label>
            <div className="grid grid-cols-3 gap-2">
              {['Sáng', 'Chiều', 'OT'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedShiftType(type)}
                  className={cn(
                    "p-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all border-2",
                    selectedShiftType === type
                      ? type === 'Sáng'
                        ? "bg-blue-100 text-blue-700 border-blue-500"
                        : type === 'Chiều'
                          ? "bg-orange-100 text-orange-700 border-orange-500"
                          : "bg-emerald-100 text-emerald-700 border-emerald-500"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  Ca {type}
                </button>
              ))}
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

function AddOTShiftModal({ employees, tasks, onClose, onSave }: { employees: any[], tasks: any[], onClose: () => void, onSave: (shift: any) => void }) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const handleSave = () => {
    if (!selectedEmployee || !selectedDate) return;

    const newShift = {
      id: `ot-${Date.now()}`,
      employeeId: selectedEmployee,
      taskId: selectedTask || undefined,
      date: selectedDate,
      type: 'OT',
      slotType: 'OT',
      efficiency: 100,
      isProductive: true,
      notes: 'OT',
      isPlanned: false
    };

    onSave(newShift);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-[#148922] to-[#0E6318] text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold">Thêm ca OT</h2>
            <p className="text-emerald-100 text-xs mt-1">Thêm ca làm việc ngoài giờ</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-2 block">Nhân viên</label>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-bold bg-[#F8FAFC] text-[#1A202C] outline-none focus:ring-2 focus:ring-[#148922]/20 focus:border-[#148922]"
            >
              <option value="">Chọn nhân viên</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-2 block">Ngày làm việc</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-bold bg-[#F8FAFC] text-[#1A202C] outline-none focus:ring-2 focus:ring-[#148922]/20 focus:border-[#148922]"
            />
          </div>

          {/* Task Selection (Optional) */}
          <div>
            <label className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-2 block">Task (không bắt buộc)</label>
            <select
              value={selectedTask}
              onChange={e => setSelectedTask(e.target.value)}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-bold bg-[#F8FAFC] text-[#1A202C] outline-none focus:ring-2 focus:ring-[#148922]/20 focus:border-[#148922]"
            >
              <option value="">Chọn task (nếu có)</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-[#E2E8F0] flex gap-3 justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] text-gray-600 bg-white hover:bg-gray-50 font-bold text-sm uppercase tracking-widest rounded-lg transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedEmployee || !selectedDate}
            className="px-4 py-2 bg-[#148922] hover:bg-[#0E6318] text-white font-bold text-sm uppercase tracking-widest rounded-lg shadow-md shadow-[#148922]/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Thêm ca OT
          </button>
        </div>
      </div>
    </div>
  );
}

