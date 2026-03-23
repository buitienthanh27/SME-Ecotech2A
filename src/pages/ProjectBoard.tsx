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
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { realtimeService } from '../services/RealtimeService';
import { 
  Sprint, 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskType, 
  ProjectMember,
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data
const MOCK_MEMBERS: ProjectMember[] = [
  { id: 'emp-1', name: 'Nguyễn Văn An', role: 'Frontend Dev', avatar: 'VA' },
  { id: 'emp-2', name: 'Trần Thị Bình', role: 'Backend Dev', avatar: 'TB' },
  { id: 'emp-3', name: 'Lê Văn Châu', role: 'Mobile Dev', avatar: 'VC' },
  { id: 'emp-4', name: 'Phạm Văn Dũng', role: 'DevOps', avatar: 'VD' },
];

const MOCK_SPRINTS: Sprint[] = [
  { 
    id: 'spr-1', 
    projectId: 'prj-001', 
    name: 'Sprint 1', 
    sprintNo: 1, 
    startDate: '2026-03-01', 
    endDate: '2026-03-14', 
    status: 'Completed', 
    goal: 'Xây dựng khung ứng dụng và module quản lý nhân sự.' 
  },
  { 
    id: 'spr-2', 
    projectId: 'prj-001', 
    name: 'Sprint 2', 
    sprintNo: 2, 
    startDate: '2026-03-15', 
    endDate: '2026-03-28', 
    status: 'Active', 
    goal: 'Hoàn thiện module quản lý dự án và tích hợp realtime.' 
  },
];

const MOCK_TASKS: Task[] = [
  { 
    id: 'task-1', 
    sprintId: 'spr-2', 
    title: 'Thiết kế màn hình Dashboard', 
    description: 'Thiết kế UI/UX cho màn hình tổng quan tài chính và dự án.', 
    priority: 'Cao', 
    type: 'Feature', 
    status: 'In Progress', 
    estimatedHours: 16, 
    actualHours: 10, 
    completionPercent: 65, 
    dueDate: '2026-03-22', 
    position: 1, 
    commentCount: 3,
    assigneeId: 'emp-1',
    isReviewedToday: true
  },
  { 
    id: 'task-2', 
    sprintId: 'spr-2', 
    title: 'Build API quản lý dự án', 
    description: 'Xây dựng các endpoint CRUD cho dự án, sprint và task.', 
    priority: 'Cao', 
    type: 'Feature', 
    status: 'In Progress', 
    estimatedHours: 24, 
    actualHours: 12, 
    completionPercent: 40, 
    dueDate: '2026-03-25', 
    position: 2, 
    commentCount: 1,
    assigneeId: 'emp-2',
    clonedFromTaskId: 'task-old-2'
  },
  { 
    id: 'task-3', 
    sprintId: 'spr-2', 
    title: 'Fix lỗi phân quyền role', 
    description: 'Sửa lỗi không hiển thị đúng menu cho role Lead.', 
    priority: 'Trung bình', 
    type: 'Bug', 
    status: 'In Review', 
    estimatedHours: 4, 
    actualHours: 5, 
    completionPercent: 90, 
    dueDate: '2026-03-19', 
    position: 1, 
    commentCount: 0,
    assigneeId: 'emp-3'
  },
  { 
    id: 'task-4', 
    sprintId: 'spr-2', 
    title: 'Viết unit test module lương', 
    description: 'Đảm bảo logic tính lương và thuế hoạt động chính xác.', 
    priority: 'Thấp', 
    type: 'Task', 
    status: 'Backlog', 
    estimatedHours: 8, 
    actualHours: 0, 
    completionPercent: 0, 
    dueDate: '2026-03-26', 
    position: 1, 
    commentCount: 2,
    assigneeId: 'emp-1'
  },
  { 
    id: 'task-5', 
    sprintId: 'spr-2', 
    title: 'Deploy staging environment', 
    description: 'Thiết lập CI/CD và deploy lên môi trường staging.', 
    priority: 'Cao', 
    type: 'Task', 
    status: 'Backlog', 
    estimatedHours: 6, 
    actualHours: 0, 
    completionPercent: 0, 
    dueDate: '2026-03-24', 
    position: 2, 
    commentCount: 0,
    assigneeId: 'emp-2'
  },
  { 
    id: 'task-6', 
    sprintId: 'spr-2', 
    title: 'Tài liệu API Swagger', 
    description: 'Cập nhật tài liệu API đầy đủ cho frontend team.', 
    priority: 'Thấp', 
    type: 'Research', 
    status: 'Done', 
    estimatedHours: 4, 
    actualHours: 4, 
    completionPercent: 100, 
    dueDate: '2026-03-18', 
    position: 1, 
    commentCount: 1,
    assigneeId: 'emp-3',
    isReviewedToday: true
  },
];

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'Backlog', title: 'Backlog', color: 'bg-gray-100 text-gray-700' },
  { id: 'In Progress', title: 'Đang làm', color: 'bg-blue-100 text-blue-700' },
  { id: 'In Review', title: 'Đang review', color: 'bg-amber-100 text-amber-700' },
  { id: 'Done', title: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
];

export function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeSprintId, setActiveSprintId] = useState('spr-2');
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [pulse, setPulse] = useState(false);

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

  const activeSprint = MOCK_SPRINTS.find(s => s.id === activeSprintId);
  const sprintTasks = tasks.filter(t => t.sprintId === activeSprintId);

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
      setTasks(prev => prev.map(t => t.id === data.taskId ? { ...t, status: data.newStatus } : t));
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    };

    const handleProgressLogged = (data: any) => {
      setTasks(prev => prev.map(t => t.id === data.taskId ? { 
        ...t, 
        completionPercent: data.progressPercent, 
        actualHours: t.actualHours + data.hoursWorked,
        isReviewedToday: true
      } : t));
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    };

    realtimeService.on('task.status_changed', handleStatusChange);
    realtimeService.on('task.progress_logged', handleProgressLogged);

    return () => {
      realtimeService.off('task.status_changed', handleStatusChange);
      realtimeService.off('task.progress_logged', handleProgressLogged);
    };
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // If dropping over a column
    const isOverAColumn = COLUMNS.some(col => col.id === overId);
    
    if (isOverAColumn) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t));
      }
      return;
    }

    // If dropping over another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: overTask.status } : t));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Determine final status
    let finalStatus = activeTask.status;
    const isOverAColumn = COLUMNS.some(col => col.id === overId);
    if (isOverAColumn) {
      finalStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) finalStatus = overTask.status;
    }

    // Trigger realtime event if status changed
    const originalTask = MOCK_TASKS.find(t => t.id === activeId);
    if (originalTask && originalTask.status !== finalStatus) {
      realtimeService.simulateEvent('task.status_changed', {
        taskId: activeId,
        newStatus: finalStatus,
        userName: 'Bạn'
      });
    }
  };

  const handleCreateTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    realtimeService.simulateEvent('task.created', {
      taskId: newTask.id,
      title: newTask.title,
      userName: 'Bạn'
    });
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

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
                {MOCK_SPRINTS.map(s => (
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
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
              <FileText className="w-4 h-4" />
              Sprint Report
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

      {/* Kanban Board */}
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
              onTaskClick={(task) => {
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
              <TaskCard task={activeTask} onClick={() => {}} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Sheet */}
      <TaskDetailSheet 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        task={selectedTask}
        onUpdate={(updatedTask) => {
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
          setSelectedTask(updatedTask);
        }}
        onSubstitution={() => setIsSubstitutionOpen(true)}
      />

      {/* Daily Review Panel */}
      <DailyReviewPanel 
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        tasks={sprintTasks}
        onSave={(logs) => {
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
        onConfirm={(newAssigneeId, reason) => {
          if (!selectedTask) return;
          // Logic for substitution
          const oldTask = { ...selectedTask, status: 'Closed' as TaskStatus };
          const newTask: Task = {
            ...selectedTask,
            id: `task-cloned-${Date.now()}`,
            title: `[Tiếp nối] ${selectedTask.title}`,
            assigneeId: newAssigneeId,
            clonedFromTaskId: selectedTask.id,
            actualHours: 0,
            commentCount: 0,
            isReviewedToday: false
          };
          setTasks(prev => [...prev.map(t => t.id === oldTask.id ? oldTask : t), newTask]);
          setIsSubstitutionOpen(false);
          setIsDetailOpen(false);
          // Simulate realtime
          realtimeService.simulateEvent('task.staff_changed', {
            taskId: selectedTask.id,
            newTaskId: newTask.id,
            oldAssignee: MOCK_MEMBERS.find(m => m.id === selectedTask.assigneeId)?.name,
            newAssignee: MOCK_MEMBERS.find(m => m.id === newAssigneeId)?.name
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
            members={MOCK_MEMBERS}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BoardColumn({ column, tasks, onTaskClick }: any) {
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
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, isOverlay }: { task: Task; onClick: () => void; isOverlay?: boolean; key?: React.Key }) {
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

  const assignee = MOCK_MEMBERS.find(m => m.id === task.assigneeId);
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
              {assignee?.avatar}
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
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6600] transition-all duration-500" 
            style={{ width: `${task.completionPercent}%` }}
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

function TaskDetailSheet({ isOpen, onClose, task, onUpdate, onSubstitution }: any) {
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
                        {MOCK_MEMBERS.find(m => m.id === task.assigneeId)?.avatar}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Người thực hiện</p>
                        <p className="text-sm font-bold text-gray-900">{MOCK_MEMBERS.find(m => m.id === task.assigneeId)?.name}</p>
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
                      <span className="text-gray-400">Tiến độ công việc</span>
                      <span className="text-[#FF6600]">{task.completionPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                      <div 
                        className="h-full bg-[#FF6600] transition-all duration-500" 
                        style={{ width: `${task.completionPercent}%` }}
                      ></div>
                    </div>
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

function DailyReviewPanel({ isOpen, onClose, tasks, onSave }: any) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(tasks.filter((t: any) => t.status !== 'Done' && t.status !== 'Closed').map((t: any) => ({
        taskId: t.id,
        title: t.title,
        assigneeName: MOCK_MEMBERS.find(m => m.id === t.assigneeId)?.name,
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

function SubstitutionDialog({ isOpen, onClose, task, onConfirm }: any) {
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen || !task) return null;

  const currentAssignee = MOCK_MEMBERS.find(m => m.id === task.assigneeId);

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
                  {currentAssignee?.avatar}
                </div>
                <span className="text-xs font-bold text-gray-600">{currentAssignee?.name}</span>
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
              {MOCK_MEMBERS.filter(m => m.id !== task.assigneeId).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
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
              Gửi phê duyệt
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
