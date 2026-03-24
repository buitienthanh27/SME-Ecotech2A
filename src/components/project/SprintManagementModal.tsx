import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Play, CheckCircle2 } from 'lucide-react';
import { Sprint } from '../../types';
import { format, parseISO } from 'date-fns';
import { Modal, Btn, Badge } from '../ui';

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
    onClose();
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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Quản lý Sprint"
      size="lg"
      footer={<Btn variant="secondary" onClick={onClose}>Đóng</Btn>}
    >
      <div className="space-y-8">
        {/* Add New Sprint */}
        <div className="bg-[#ECFDF5] p-6 rounded-[12px] border border-[#D1FAE5] space-y-4">
          <h4 className="text-[12px] font-bold text-[#148922] uppercase tracking-wider">Tạo Sprint mới</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <input 
                type="text"
                placeholder="Tên Sprint (VD: Sprint 03 - API Integration)"
                className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[14px] font-semibold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                value={newSprint.name}
                onChange={e => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1 ml-1">Ngày bắt đầu</label>
              <input 
                type="date"
                className="w-full px-4 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold focus:border-[#148922] outline-none transition-all"
                value={newSprint.startDate}
                onChange={e => setNewSprint(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1 ml-1">Ngày kết thúc</label>
              <input 
                type="date"
                className="w-full px-4 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold focus:border-[#148922] outline-none transition-all"
                value={newSprint.endDate}
                onChange={e => setNewSprint(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <textarea 
                placeholder="Mục tiêu của Sprint..."
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-[8px] text-[14px] font-medium focus:border-[#148922] outline-none transition-all h-20 resize-none"
                value={newSprint.goal}
                onChange={e => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
              />
            </div>
          </div>
          <Btn 
            onClick={handleAdd}
            disabled={!newSprint.name}
            className="w-full"
            icon={Plus}
          >
            Thêm Sprint vào danh sách
          </Btn>
        </div>

        {/* Sprint List */}
        <div className="space-y-4">
          <h4 className="text-[12px] font-bold text-[#718096] uppercase tracking-wider">Danh sách Sprint ({sprints.length})</h4>
          <div className="space-y-3">
            {sprints.sort((a, b) => b.sprintNo - a.sprintNo).map((sprint) => (
              <div key={sprint.id} className="group bg-white border border-[#E2E8F0] p-4 rounded-[12px] hover:border-[#148922]/30 transition-all shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded uppercase">#{sprint.sprintNo}</span>
                      <h5 className="font-bold text-[#1A202C]">{sprint.name}</h5>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-[#718096]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(sprint.startDate), 'dd/MM')} - {format(parseISO(sprint.endDate), 'dd/MM/yyyy')}
                      </div>
                      <span className="text-[#E2E8F0]">|</span>
                      <Badge variant={
                        sprint.status === 'Active' ? 'primary' :
                        sprint.status === 'Completed' ? 'success' : 'outline'
                      }>
                        {sprint.status === 'Active' ? 'Đang chạy' : 
                         sprint.status === 'Completed' ? 'Đã hoàn thành' : 'Đang chờ'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {sprint.status === 'Planned' && (
                      <button 
                        onClick={() => handleStatusChange(sprint.id, 'Active')}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-[6px] transition-all"
                        title="Bắt đầu Sprint"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}
                    {sprint.status === 'Active' && (
                      <button 
                        onClick={() => handleStatusChange(sprint.id, 'Completed')}
                        className="p-1.5 text-[#50b00a] hover:bg-green-50 rounded-[6px] transition-all"
                        title="Hoàn thành Sprint"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(sprint.id)}
                      className="p-1.5 text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {sprint.goal && (
                  <p className="text-[12px] text-[#718096] italic line-clamp-1 bg-[#F8FAFC] px-3 py-1.5 rounded-[8px]">
                    "{sprint.goal}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
