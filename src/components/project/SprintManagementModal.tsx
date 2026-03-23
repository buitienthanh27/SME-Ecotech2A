import React, { useState } from 'react';
import { X, Calendar, Plus, Trash2, Play, CheckCircle2 } from 'lucide-react';
import { Sprint } from '../../types';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sprints: Sprint[];
  onUpdate: (sprints: Sprint[]) => void;
  projectId: string;
}

export const SprintManagementModal: React.FC<Props> = ({ isOpen, onClose, sprints, onUpdate, projectId }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSprint, setNewSprint] = useState<Partial<Sprint>>({
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'Planned',
    goal: ''
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newSprint.name) return;
    
    const sprint: Sprint = {
      id: Math.random().toString(36).substr(2, 9),
      projectId,
      name: newSprint.name!,
      sprintNo: sprints.length + 1,
      startDate: newSprint.startDate!,
      endDate: newSprint.endDate!,
      status: 'Planned',
      goal: newSprint.goal || ''
    };

    onUpdate([...sprints, sprint]);
    setNewSprint({
      name: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'Planned',
      goal: ''
    });
  };

  const handleDelete = (id: string) => {
    onUpdate(sprints.filter(s => s.id !== id));
  };

  const handleStatusChange = (id: string, status: Sprint['status']) => {
    onUpdate(sprints.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Quản lý Sprint</h3>
            <p className="text-xs font-bold text-gray-400 mt-1">Lập kế hoạch và điều phối các giai đoạn dự án</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 shadow-sm">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Add New Sprint */}
          <div className="bg-[#003366]/5 p-6 rounded-3xl border border-[#003366]/10 space-y-4">
            <h4 className="text-xs font-black text-[#003366] uppercase tracking-widest">Tạo Sprint mới</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <input 
                  type="text"
                  placeholder="Tên Sprint (VD: Sprint 03 - API Integration)"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                  value={newSprint.name}
                  onChange={e => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Ngày bắt đầu</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                  value={newSprint.startDate}
                  onChange={e => setNewSprint(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Ngày kết thúc</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                  value={newSprint.endDate}
                  onChange={e => setNewSprint(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <textarea 
                  placeholder="Mục tiêu của Sprint..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all h-20 resize-none"
                  value={newSprint.goal}
                  onChange={e => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
                />
              </div>
            </div>
            <button 
              onClick={handleAdd}
              disabled={!newSprint.name}
              className="w-full py-3 bg-[#003366] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm Sprint vào danh sách
            </button>
          </div>

          {/* Sprint List */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Danh sách Sprint ({sprints.length})</h4>
            <div className="space-y-3">
              {sprints.sort((a, b) => b.sprintNo - a.sprintNo).map((sprint) => (
                <div key={sprint.id} className="group bg-white border border-gray-100 p-5 rounded-3xl hover:border-[#003366]/30 transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">#{sprint.sprintNo}</span>
                        <h5 className="font-bold text-gray-900">{sprint.name}</h5>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(sprint.startDate), 'dd/MM')} - {format(parseISO(sprint.endDate), 'dd/MM/yyyy')}
                        </div>
                        <span className="text-gray-200">|</span>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full",
                          sprint.status === 'Active' ? "bg-blue-100 text-blue-600" :
                          sprint.status === 'Completed' ? "bg-emerald-100 text-emerald-600" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {sprint.status === 'Active' ? 'Đang chạy' : 
                           sprint.status === 'Completed' ? 'Đã hoàn thành' : 'Đang chờ'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {sprint.status === 'Planned' && (
                        <button 
                          onClick={() => handleStatusChange(sprint.id, 'Active')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Bắt đầu Sprint"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}
                      {sprint.status === 'Active' && (
                        <button 
                          onClick={() => handleStatusChange(sprint.id, 'Completed')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Hoàn thành Sprint"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(sprint.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {sprint.goal && (
                    <p className="text-xs text-gray-500 font-medium line-clamp-2 bg-gray-50 p-3 rounded-xl italic">
                      "{sprint.goal}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
