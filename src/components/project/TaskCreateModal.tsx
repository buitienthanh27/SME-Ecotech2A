import React, { useState, useMemo, useEffect } from 'react';
import { LayoutGrid, Type, AlertCircle, Calendar, Users, AlignLeft, Plus } from 'lucide-react';
import { Task, TaskPriority, TaskType, ProjectMember, isMemberAssignableForTask } from '../../types';
import { useStore } from '../../store/useStore';
import { hasProjectManagerPrivileges } from '../../lib/permissions';
import { Modal, Btn, showToast } from '../ui';
import { sprintDateBoundsForTask } from '../../lib/dateBounds';

export type SprintOption = { id: string; name: string; startDate: string; endDate: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  members: ProjectMember[];
  sprints: SprintOption[];
  projectStartDate: string;
  projectEndDate: string;
  /** Sprint gợi ý khi mở (vd. đang lọc đúng sprint đó) */
  initialSprintId?: string;
}

export const TaskCreateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreate,
  members,
  sprints,
  projectStartDate,
  projectEndDate,
  initialSprintId,
}) => {
  const { currentUser, employees } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Trung bình');
  const [type, setType] = useState<TaskType>('Task');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [chosenSprintId, setChosenSprintId] = useState('');

  const boundsForSprint = useMemo(() => {
    const sp = sprints.find((s) => s.id === chosenSprintId);
    if (!sp) return { min: projectStartDate, max: projectEndDate };
    return sprintDateBoundsForTask(projectStartDate, projectEndDate, sp.startDate, sp.endDate);
  }, [chosenSprintId, sprints, projectStartDate, projectEndDate]);

  const filteredMembers = useMemo(() => {
    const activeMembers = members.filter((m) => m.status === 'Active' && isMemberAssignableForTask(m));

    if (!currentUser) return activeMembers;
    if (hasProjectManagerPrivileges(currentUser.role)) return activeMembers;

    if (currentUser.role === 'Lead') {
      const currentEmp = employees.find((e) => e.id === currentUser.id);
      return activeMembers.filter((m) => {
        const emp = employees.find((e) => e.id === m.employeeId);
        return emp?.department === currentEmp?.department;
      });
    }

    return activeMembers.filter((m) => m.employeeId === currentUser.id);
  }, [members, currentUser, employees]);

  const applySprintDates = (sprintId: string) => {
    const sp = sprints.find((s) => s.id === sprintId);
    if (!sp) return;
    const { min, max } = sprintDateBoundsForTask(
      projectStartDate,
      projectEndDate,
      sp.startDate,
      sp.endDate
    );
    setStartDate(min);
    setDueDate(min);
  };

  useEffect(() => {
    if (!isOpen || sprints.length === 0) return;
    const preferred =
      initialSprintId && sprints.some((s) => s.id === initialSprintId)
        ? initialSprintId
        : sprints[0].id;
    setChosenSprintId(preferred);
    applySprintDates(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reset form khi mở modal
  }, [isOpen, sprints, initialSprintId, projectStartDate, projectEndDate]);

  if (!isOpen) return null;

  const dateMin = boundsForSprint.min;
  const dateMax = boundsForSprint.max;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sprints.length === 0) {
      showToast.error('Dự án cần có ít nhất một Sprint để tạo task.');
      return;
    }
    if (!chosenSprintId) {
      showToast.error('Vui lòng chọn Sprint.');
      return;
    }
    const start = startDate || dateMin;
    const due = dueDate || start;
    if (start < dateMin || start > dateMax || due < dateMin || due > dateMax) {
      showToast.error('Ngày bắt đầu và hạn chót phải nằm trong timeline dự án và sprint đã chọn.');
      return;
    }
    if (due < start) {
      showToast.error('Hạn chót không được trước ngày bắt đầu.');
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      sprintId: chosenSprintId,
      title,
      description,
      priority,
      type,
      status: 'Todo',
      estimatedHours: 0,
      actualHours: 0,
      completionPercent: 0,
      dueDate: due,
      position: 0,
      commentCount: 0,
      assigneeId: assigneeId || undefined,
      startDate: start,
    };
    onCreate(newTask);
    onClose();
    setTitle('');
    setDescription('');
    setPriority('Trung bình');
    setType('Task');
    setDueDate('');
    setAssigneeId('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Task mới"
      size="lg"
      footer={
        <div className="flex w-full gap-3">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>
            Hủy
          </Btn>
          <Btn
            className="flex-[2]"
            onClick={handleSubmit as any}
            icon={Plus}
            disabled={sprints.length === 0}
          >
            Tạo Task
          </Btn>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {sprints.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              Chưa có Sprint nào. Hãy dùng &quot;Quản lý Sprint&quot; để thêm sprint (trong timeline dự án) trước khi tạo
              task.
            </p>
          ) : (
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                Sprint <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={chosenSprintId}
                onChange={(e) => {
                  const id = e.target.value;
                  setChosenSprintId(id);
                  applySprintDates(id);
                }}
              >
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Task phải thuộc một sprint; ngày bắt đầu / hạn chót phải nằm trong sprint (và trong dự án).
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#718096]">
              <Type className="h-3 w-3 text-[#148922]" /> Tiêu đề Task
            </label>
            <input
              required
              type="text"
              placeholder="Nhập tiêu đề công việc..."
              className="w-full rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[14px] font-bold text-[#1A202C] transition-all focus:border-[#148922] focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#718096]">
              <AlignLeft className="h-3 w-3 text-[#148922]" /> Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả các yêu cầu và kết quả mong đợi..."
              className="w-full resize-none rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[14px] font-medium text-[#1A202C] transition-all focus:border-[#148922] focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                <AlertCircle className="h-3 w-3 text-[#148922]" /> Ưu tiên
              </label>
              <select
                className="w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="Cao">Cao</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Thấp">Thấp</option>
              </select>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                <LayoutGrid className="h-3 w-3 text-[#148922]" /> Loại Task
              </label>
              <select
                className="w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
              >
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Task">Task</option>
                <option value="Research">Research</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                <Calendar className="h-3 w-3 text-[#148922]" /> Ngày bắt đầu
              </label>
              <input
                required
                type="date"
                min={dateMin}
                max={dateMax}
                className="w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#718096]">
                <Calendar className="h-3 w-3 text-[#148922]" /> Hạn chót
              </label>
              <input
                type="date"
                min={dateMin}
                max={dateMax}
                className="w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#718096]">
              <Users className="h-3 w-3 text-[#148922]" /> Người thực hiện
            </label>
            <select
              required
              className="w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[14px] font-bold text-[#1A202C] focus:outline-none"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="" disabled>
                -- Chọn người thực hiện --
              </option>
              {filteredMembers.map((m) => {
                const empInfo = employees.find((e) => e.id === m.employeeId);
                return (
                  <option key={m.id} value={m.employeeId}>
                    {empInfo?.name} ({m.role}) {empInfo?.department ? `- ${empInfo.department}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};
