import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, Type, AlertCircle, Clock, Calendar, Users, AlignLeft, Plus } from 'lucide-react';
import { Task, TaskPriority, TaskType, ProjectMember } from '../../types';
import { useStore } from '../../store/useStore';
import { Modal, Btn } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  sprintId: string;
  members: ProjectMember[];
}

export const TaskCreateModal: React.FC<Props> = ({ isOpen, onClose, onCreate, sprintId, members }) => {
  const { id: projectId } = useParams();
  const { currentUser, employees, projects } = useStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Trung bình');
  const [type, setType] = useState<TaskType>('Task');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [parentId, setParentId] = useState('');

  const projectTasks = useMemo(() => {
    return projects.find(p => p.id === projectId || p.id === '1')?.tasks || [];
  }, [projects, projectId]);

  const filteredMembers = useMemo(() => {
    // Exclude inactive members entirely
    const activeMembers = members.filter(m => m.status === 'Active');
    
    if (!currentUser) return activeMembers;
    if (currentUser.role === 'PM' || currentUser.role === 'CEO') return activeMembers;
    
    if (currentUser.role === 'Lead') {
      const currentEmp = employees.find(e => e.id === currentUser.id);
      return activeMembers.filter(m => {
        const emp = employees.find(e => e.id === m.employeeId);
        return emp?.department === currentEmp?.department;
      });
    }
    
    return activeMembers.filter(m => m.employeeId === currentUser.id);
  }, [members, currentUser, employees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      sprintId,
      title,
      description,
      priority,
      type,
      status: 'Backlog',
      estimatedHours,
      actualHours: 0,
      completionPercent: 0,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      position: 0,
      commentCount: 0,
      assigneeId: assigneeId || undefined,
      startDate: startDate || new Date().toISOString().split('T')[0],
      parentId: parentId || undefined,
    };
    onCreate(newTask);
    onClose();
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('Trung bình');
    setType('Task');
    setEstimatedHours(8);
    setDueDate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setAssigneeId('');
    setParentId('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Task mới"
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Hủy</Btn>
          <Btn className="flex-[2]" onClick={handleSubmit as any} icon={Plus}>Tạo Task</Btn>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Type className="w-3 h-3 text-[#148922]" /> Tiêu đề Task
            </label>
            <input 
              required
              type="text"
              placeholder="Nhập tiêu đề công việc..."
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlignLeft className="w-3 h-3 text-[#148922]" /> Mô tả chi tiết
            </label>
            <textarea 
              rows={3}
              placeholder="Mô tả các yêu cầu và kết quả mong đợi..."
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-medium text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-[#148922]" /> Ưu tiên
              </label>
              <select 
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="Cao">Cao</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Thấp">Thấp</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3 text-[#148922]" /> Loại Task
              </label>
              <select 
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] font-bold text-[#1A202C] focus:outline-none"
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
              <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-[#148922]" /> Ngày bắt đầu
              </label>
              <input 
                required
                type="date"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-[#148922]" /> Hạn chót
              </label>
              <input 
                type="date"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3 text-[#148922]" /> Ước tính (giờ)
              </label>
              <input 
                type="number"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3 text-[#148922]" /> Task cha
              </label>
              <select 
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] font-bold text-[#1A202C] focus:outline-none"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">-- Không có --</option>
                {projectTasks.filter(t => !t.parentId).map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Users className="w-3 h-3 text-[#148922]" /> Người thực hiện
            </label>
            <select 
              required
              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] font-bold text-[#1A202C] focus:outline-none"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="" disabled>-- Chọn người thực hiện --</option>
              {filteredMembers.map(m => {
                const empInfo = employees.find(e => e.id === m.employeeId);
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
