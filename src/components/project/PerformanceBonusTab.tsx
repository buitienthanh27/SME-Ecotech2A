import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Lock,
  DollarSign,
  Info,
  ExternalLink
} from 'lucide-react';
import { PerformanceBonus, ProjectMember, Task, DailyProgressLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

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
  projectId, 
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Thưởng chờ duyệt tháng này</p>
              <p className="text-xl font-bold text-amber-900">{pendingTotal.toLocaleString()} VND</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
        >
          <Plus className="w-5 h-5" />
          Tạo thưởng mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
          <h3 className="font-bold text-gray-900">Danh sách Thưởng Hiệu suất</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thưởng..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
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
            <tbody className="divide-y divide-gray-100">
              {filteredBonuses.map((bonus) => {
                const member = members.find(m => m.id === bonus.employeeId);
                const task = tasks.find(t => t.id === bonus.taskId);
                
                return (
                  <tr key={bonus.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                          {member?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{member?.name}</p>
                          <p className="text-[10px] text-gray-500">{member?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {task ? (
                        <button 
                          onClick={() => onOpenTask(task.id)}
                          className="flex items-center gap-1 text-xs font-medium text-[#003366] hover:underline"
                        >
                          {task.title}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{bonus.bonusAmount.toLocaleString()} VND</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        bonus.bonusType === 'Xuất sắc' ? "bg-purple-100 text-purple-700" :
                        bonus.bonusType === 'Hoàn thành sớm' ? "bg-blue-100 text-blue-700" :
                        bonus.bonusType === 'Chất lượng cao' ? "bg-emerald-100 text-emerald-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {bonus.bonusType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600 line-clamp-1 max-w-[200px]" title={bonus.reason}>
                        {bonus.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bonus.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(bonus.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(bonus.status === 'Pending' || bonus.status === 'Linked') && (
                        <button 
                          onClick={() => onCancelBonus(bonus.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

const StatusBadge = ({ status }: { status: PerformanceBonus['status'] }) => {
  const configs = {
    Pending: { icon: Clock, color: "bg-amber-100 text-amber-700", label: "Chờ duyệt" },
    Linked: { icon: CheckCircle2, color: "bg-blue-100 text-blue-700", label: "Đã kết nối lương" },
    Cancelled: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Đã huỷ" },
    Locked: { icon: Lock, color: "bg-gray-100 text-gray-700", label: "Đã khoá" },
  };
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit", config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
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
    const taskLogs = dailyLogs.filter(l => l.taskAssigneeId === taskId); // Simplified, should match task
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#003366] text-white">
          <h3 className="text-xl font-bold">Tạo thưởng hiệu suất mới</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nhân viên</label>
            <select 
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#003366]/10 outline-none"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Chọn nhân viên...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Task liên quan (Không bắt buộc)</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#003366]/10 outline-none"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">Chọn task...</option>
              {tasks.filter(t => t.assigneeId === employeeId).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {avgRating && (
              <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Đánh giá trung bình của task này: {avgRating}/5.0
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Số tiền thưởng (VND)</label>
              <input 
                type="text"
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmount(val ? Number(val).toLocaleString() : '');
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Loại thưởng</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#003366]/10 outline-none"
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Lý do (Tối thiểu 10 ký tự)</label>
            <textarea 
              required
              minLength={10}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#003366]/10 outline-none resize-none h-24"
              placeholder="Nhập lý do thưởng..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Thưởng sẽ tự động cộng vào cột <strong>Bonus</strong> trong bảng lương tháng <strong>{new Date().getMonth() + 1}/{new Date().getFullYear()}</strong> khi Admin tạo kỳ lương. PM có thể huỷ trước khi kỳ lương được khoá.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Huỷ
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 bg-[#003366] text-white rounded-xl font-bold hover:bg-[#002244] transition-all shadow-lg shadow-[#003366]/20"
            >
              Lưu thưởng
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Star = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
