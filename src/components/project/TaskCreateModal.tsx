import React, { useState } from 'react';
import { X, LayoutGrid, Type, AlertCircle, Clock, Calendar, Users, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskPriority, TaskType, ProjectMember, TaskStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  sprintId: string;
  members: ProjectMember[];
}

export const TaskCreateModal: React.FC<Props> = ({ isOpen, onClose, onCreate, sprintId, members }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Trung bình');
  const [type, setType] = useState<TaskType>('Task');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

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
    setAssigneeId('');
  };

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
        className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#003366] rounded-xl">
              <PlusIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Tạo Task mới</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Type className="w-3 h-3" /> Tiêu đề Task
              </label>
              <input 
                required
                type="text"
                placeholder="Nhập tiêu đề công việc..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlignLeft className="w-3 h-3" /> Mô tả chi tiết
              </label>
              <textarea 
                rows={3}
                placeholder="Mô tả các yêu cầu và kết quả mong đợi..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Ưu tiên
                </label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="Cao">Cao</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Thấp">Thấp</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <LayoutGrid className="w-3 h-3" /> Loại Task
                </label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
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
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Ước tính (giờ)
                </label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Hạn chót
                </label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Users className="w-3 h-3" /> Người thực hiện
              </label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Chưa phân bổ</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="flex-[2] px-6 py-4 bg-[#003366] text-white rounded-2xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
            >
              Tạo Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
