import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Task, ProjectMember } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  members: ProjectMember[];
  onConfirm: (newAssigneeId: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

export const SubstitutionDialog: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  task, 
  members, 
  onConfirm,
  isLoading 
}) => {
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const currentAssignee = members.find(m => m.id === task.assigneeId);
  const availableMembers = members.filter(m => m.id !== task.assigneeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssigneeId || !reason) return;
    await onConfirm(newAssigneeId, reason);
    onClose();
  };

  const selectedMember = members.find(m => m.id === newAssigneeId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Thay thế nhân sự</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-400 uppercase">Task hiện tại</span>
              <span className="text-xs font-bold text-blue-600">#{task.id}</span>
            </div>
            <p className="text-sm font-bold text-blue-900">{task.title}</p>
            <div className="flex justify-between items-center pt-2 border-t border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {currentAssignee?.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-blue-700">{currentAssignee?.name}</span>
              </div>
              <span className="text-xs font-bold text-blue-700">Tiến độ: {task.completionPercent}%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Người thay thế</label>
              <select
                required
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
              >
                <option value="">Chọn nhân sự thay thế...</option>
                {availableMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lý do thay thế</label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all h-24 resize-none"
                placeholder="Nhập lý do bàn giao công việc..."
              />
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Cảnh báo:</strong> Task <strong>'{task.title}'</strong> sẽ đóng lại ở <strong>{task.completionPercent}%</strong>. 
              Task mới sẽ tạo cho <strong>{selectedMember?.name || '[Nhân sự mới]'}</strong> bắt đầu từ <strong>{task.completionPercent}%</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !newAssigneeId || !reason}
              className="flex-1 px-4 py-2 rounded-xl bg-[#003366] text-white font-bold hover:bg-[#002244] transition-all shadow-lg shadow-[#003366]/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận thay thế'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
