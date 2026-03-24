import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Lock,
  Info,
  ExternalLink,
  MoreVertical,
  Banknote,
  Star as StarIcon
} from 'lucide-react';
import { PerformanceBonus, ProjectMember, Task, DailyProgressLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Modal, Btn, Badge, StatusBadge } from '../ui';

interface Props {
  projectId: string;
  members: ProjectMember[];
  tasks: Task[];
  dailyLogs: DailyProgressLog[];
  bonuses: PerformanceBonus[];
  onAddBonus: (bonus: Partial<PerformanceBonus>) => void;
  onCancelBonus: (bonusId: string) => void;
  onOpenTask: (taskId: string) => void;
}

export const PerformanceBonusTab: React.FC<Props> = ({ 
  members, 
  tasks, 
  dailyLogs, 
  bonuses, 
  onAddBonus, 
  onCancelBonus,
  onOpenTask
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const pendingTotal = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return bonuses
      .filter(b => b.status === 'Pending' && b.createdAt.startsWith(currentMonth))
      .reduce((sum, b) => sum + b.bonusAmount, 0);
  }, [bonuses]);

  const filteredBonuses = useMemo(() => {
    return bonuses.filter(b => {
      const member = members.find(m => m.id === b.employeeId);
      const searchStr = `${member?.name} ${b.reason} ${b.bonusType}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [bonuses, members, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-[#FFFBEB] border border-[#FEF3C7] p-4 rounded-[12px] flex items-center gap-4 shadow-sm">
          <div className="p-2 bg-[#FEF3C7] text-[#92400E] rounded-[8px]">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#92400E] uppercase tracking-wider mb-0.5">Thưởng chờ duyệt tháng này</p>
            <p className="text-xl font-black text-[#1A202C]">{pendingTotal.toLocaleString()} VND</p>
          </div>
        </div>
        
        <Btn 
          onClick={() => setIsCreateModalOpen(true)}
          icon={Plus}
          className="font-black uppercase tracking-wider"
        >
          Tạo thưởng mới
        </Btn>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between gap-4">
          <h3 className="text-[15px] font-bold text-[#1A202C] uppercase tracking-tight">Danh sách Thưởng Hiệu suất</h3>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thưởng..." 
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[13px] font-medium focus:outline-none focus:border-[#148922] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#718096] uppercase tracking-widest border-b border-[#E2E8F0]">
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Task liên quan</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Lý do</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredBonuses.map((bonus) => {
                const member = members.find(m => m.id === bonus.employeeId);
                const task = tasks.find(t => t.id === bonus.taskId);
                
                return (
                  <tr key={bonus.id} className="hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[10px] font-black text-[#718096] border border-white shadow-sm">
                          {member?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A202C] text-[14px]">{member?.name}</p>
                          <p className="text-[10px] text-[#718096] font-bold uppercase">{member?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {task ? (
                        <button 
                          onClick={() => onOpenTask(task.id)}
                          className="flex items-center gap-1.5 text-[12px] font-bold text-[#148922] hover:underline"
                        >
                          <span className="line-clamp-1 max-w-[120px]">{task.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[12px] text-[#CBD5E1] italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[14px] font-black text-[#1A202C]">{bonus.bonusAmount.toLocaleString()} đ</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        bonus.bonusType === 'Xuất sắc' ? 'primary' :
                        bonus.bonusType === 'Hoàn thành sớm' ? 'success' :
                        bonus.bonusType === 'Chất lượng cao' ? 'info' :
                        'outline'
                      }>
                        {bonus.bonusType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[12px] text-[#718096] font-medium line-clamp-1 max-w-[200px]" title={bonus.reason}>
                        {bonus.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bonus.status} />
                    </td>
                    <td className="px-6 py-4 text-[12px] font-medium text-[#718096]">
                      {new Date(bonus.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(bonus.status === 'Pending' || bonus.status === 'Linked') && (
                        <button 
                          onClick={() => onCancelBonus(bonus.id)}
                          className="p-2 text-[#CBD5E1] hover:text-[#EF4444] hover:bg-red-50 rounded-[8px] transition-all"
                          title="Huỷ thưởng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreateBonusModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        members={members}
        tasks={tasks}
        dailyLogs={dailyLogs}
        onSave={onAddBonus}
      />
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ProjectMember[];
  tasks: Task[];
  dailyLogs: DailyProgressLog[];
  onSave: (bonus: Partial<PerformanceBonus>) => void;
}

const CreateBonusModal: React.FC<ModalProps> = ({ isOpen, onClose, members, tasks, dailyLogs, onSave }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<PerformanceBonus['bonusType']>('Xuất sắc');
  const [reason, setReason] = useState('');

  const avgRating = useMemo(() => {
    if (!taskId) return null;
    const taskLogs = dailyLogs.filter(l => l.taskAssigneeId === taskId);
    if (taskLogs.length === 0) return null;
    const sum = taskLogs.reduce((s, l) => s + l.leadRating, 0);
    return (sum / taskLogs.length).toFixed(1);
  }, [taskId, dailyLogs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount || reason.length < 10) return;

    onSave({
      employeeId,
      taskId: taskId || undefined,
      bonusAmount: Number(amount.replace(/\D/g, '')),
      bonusType: type,
      reason,
    });
    onClose();
    // Reset form
    setEmployeeId('');
    setTaskId('');
    setAmount('');
    setType('Xuất sắc');
    setReason('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo thưởng hiệu suất mới"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Huỷ bỏ</Btn>
          <Btn className="flex-1 font-black uppercase tracking-wider" onClick={handleSubmit as any}>Lưu thưởng</Btn>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider ml-1">Nhân viên *</label>
          <select 
            required
            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Chọn nhân viên...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider ml-1">Task liên quan (Không bắt buộc)</label>
          <select 
            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
          >
            <option value="">Chọn task...</option>
            {tasks.filter(t => t.assigneeId === employeeId).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          {avgRating && (
            <p className="text-[11px] font-bold text-amber-600 mt-1.5 flex items-center gap-1 ml-1">
              <StarIcon className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Đánh giá trung bình task: {avgRating}/5.0
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider ml-1">Số tiền (VND) *</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-black text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setAmount(val ? Number(val).toLocaleString() : '');
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider ml-1">Loại thưởng</label>
            <select 
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="Xuất sắc">Xuất sắc</option>
              <option value="Hoàn thành sớm">Hoàn thành sớm</option>
              <option value="Chất lượng cao">Chất lượng cao</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider ml-1">Lý do (Tối thiểu 10 ký tự) *</label>
          <textarea 
            required
            minLength={10}
            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-medium text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all resize-none h-24"
            placeholder="Nhập lý do thưởng..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="bg-[#EFF6FF] p-4 rounded-[12px] border border-[#DBEAFE] flex gap-3">
          <Info className="w-5 h-5 text-[#2563EB] shrink-0" />
          <p className="text-[12px] text-[#1E40AF] font-medium leading-relaxed">
            Thưởng sẽ tự động cộng vào cột <strong>Bonus</strong> của kỳ lương tháng <strong>{new Date().getMonth() + 1}/{new Date().getFullYear()}</strong>. PM có thể huỷ trước khi kỳ lương được khoá.
          </p>
        </div>
      </form>
    </Modal>
  );
};
