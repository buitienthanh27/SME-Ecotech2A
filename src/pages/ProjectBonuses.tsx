import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  User, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Info,
  X,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PerformanceBonus, ProjectMember, Task } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data
const MOCK_MEMBERS: ProjectMember[] = [
  { id: 'emp-1', name: 'Nguyễn Văn An', role: 'Frontend Dev', avatar: 'VA' },
  { id: 'emp-2', name: 'Trần Thị Bình', role: 'Backend Dev', avatar: 'TB' },
  { id: 'emp-3', name: 'Lê Văn Châu', role: 'Mobile Dev', avatar: 'VC' },
];

const MOCK_TASKS: Task[] = [
  { id: 'task-1', title: 'Thiết kế màn hình Dashboard', description: 'Thiết kế UI/UX cho màn hình tổng quan tài chính và dự án.', sprintId: 'spr-2', status: 'In Progress', priority: 'Cao', type: 'Feature', estimatedHours: 16, actualHours: 10, completionPercent: 65, dueDate: '2026-03-22', position: 1, commentCount: 3, assigneeId: 'emp-1' },
  { id: 'task-6', title: 'Tài liệu API Swagger', description: 'Cập nhật tài liệu API đầy đủ cho frontend team.', sprintId: 'spr-2', status: 'Done', priority: 'Thấp', type: 'Research', estimatedHours: 4, actualHours: 4, completionPercent: 100, dueDate: '2026-03-18', position: 1, commentCount: 1, assigneeId: 'emp-3' },
];

const MOCK_BONUSES: PerformanceBonus[] = [
  {
    id: 'pb-1',
    taskAssigneeId: 'ta-1',
    employeeId: 'emp-3',
    taskId: 'task-6',
    employeeCostId: null,
    bonusAmount: 500000,
    bonusType: 'Hoàn thành sớm',
    reason: 'Hoàn thành task Research sớm và chất lượng tốt.',
    status: 'Pending',
    createdAt: '2026-03-19',
    createdByPMId: 'PM Nguyễn'
  },
  {
    id: 'pb-2',
    taskAssigneeId: 'ta-2',
    employeeId: 'emp-1',
    taskId: 'task-1',
    employeeCostId: 'ec-1',
    bonusAmount: 1000000,
    bonusType: 'Xuất sắc',
    reason: 'Lead đánh giá 5 sao cho phần thiết kế Dashboard.',
    status: 'Linked',
    createdAt: '2026-03-20',
    createdByPMId: 'PM Nguyễn'
  }
];

export function ProjectBonuses() {
  const { id } = useParams();
  const [bonuses, setBonuses] = useState<PerformanceBonus[]>(MOCK_BONUSES);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBonuses = useMemo(() => {
    return bonuses.filter(b => {
      const employee = MOCK_MEMBERS.find(m => m.id === b.employeeId);
      const task = MOCK_TASKS.find(t => t.id === b.taskId);
      return (
        employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [bonuses, searchTerm]);

  const stats = useMemo(() => {
    const total = bonuses.reduce((acc, b) => acc + b.bonusAmount, 0);
    const pending = bonuses.filter(b => b.status === 'Pending').length;
    const approved = bonuses.filter(b => b.status === 'Linked' || b.status === 'Locked').length;
    return { total, pending, approved };
  }, [bonuses]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Tổng tiền thưởng" 
          value={stats.total.toLocaleString('vi-VN') + ' VNĐ'} 
          icon={DollarSign} 
          color="bg-emerald-50 text-emerald-600"
          trend="+12% so với tháng trước"
        />
        <StatCard 
          label="Đang chờ duyệt" 
          value={stats.pending.toString()} 
          icon={Clock} 
          color="bg-amber-50 text-amber-600"
          trend="Cần PM phê duyệt"
        />
        <StatCard 
          label="Đã phê duyệt" 
          value={stats.approved.toString()} 
          icon={CheckCircle2} 
          color="bg-blue-50 text-blue-600"
          trend="Sẽ cộng vào kỳ lương tới"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main List */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-[#003366]" />
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Danh sách thưởng hiệu suất</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input 
                    placeholder="Tìm kiếm..."
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-2 bg-[#003366] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Tạo thưởng mới
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nhân viên</th>
                    <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task / Lý do</th>
                    <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số tiền</th>
                    <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="text-right py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBonuses.map(bonus => (
                    <BonusRow key={bonus.id} bonus={bonus} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-[#003366] p-8 rounded-[2.5rem] text-white shadow-xl shadow-[#003366]/20">
            <div className="flex items-center gap-2 mb-6">
              <Info className="w-4 h-4 text-blue-300" />
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Thông tin Payroll</span>
            </div>
            <h3 className="text-lg font-black mb-4 leading-tight">Tích hợp Lương</h3>
            <p className="text-xs text-blue-100 leading-relaxed mb-6 opacity-80">
              Các khoản thưởng hiệu suất sau khi được PM phê duyệt sẽ tự động được liệt kê trong module Payroll. 
              Khi kỳ lương được chốt (Lock), các khoản này sẽ chính thức được cộng vào thu nhập của nhân viên.
            </p>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2">Kỳ lương hiện tại</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Tháng 03/2026</span>
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded uppercase">Open</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6">Top thưởng chờ duyệt</h3>
            <div className="space-y-4">
              {bonuses.filter(b => b.status === 'Pending').slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {MOCK_MEMBERS.find(m => m.id === b.employeeId)?.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{MOCK_MEMBERS.find(m => m.id === b.employeeId)?.name}</p>
                    <p className="text-[10px] font-bold text-[#FF6600]">{b.bonusAmount.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Bonus Dialog */}
      <CreateBonusDialog 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={(newBonus) => {
          setBonuses(prev => [newBonus, ...prev]);
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
      <div className={cn("p-4 rounded-2xl", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 mt-1">{trend}</p>
      </div>
    </div>
  );
}

function BonusRow({ bonus }: { bonus: PerformanceBonus; key?: React.Key }) {
  const employee = MOCK_MEMBERS.find(m => m.id === bonus.employeeId);
  const task = MOCK_TASKS.find(t => t.id === bonus.taskId);

  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {employee?.avatar}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{employee?.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{employee?.role}</p>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className="max-w-xs">
          <p className="text-xs font-bold text-gray-700 truncate mb-1">{task?.title || 'Thưởng chung'}</p>
          <p className="text-[10px] text-gray-500 line-clamp-1">{bonus.reason}</p>
        </div>
      </td>
      <td className="py-4">
        <p className="text-sm font-black text-gray-900">{bonus.bonusAmount.toLocaleString('vi-VN')} VNĐ</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{bonus.bonusType}</p>
      </td>
      <td className="py-4">
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
          bonus.status === 'Linked' || bonus.status === 'Locked' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        )}>
          {bonus.status === 'Linked' || bonus.status === 'Locked' ? 'Đã duyệt' : 'Chờ duyệt'}
        </span>
      </td>
      <td className="py-4 text-right">
        <button className="p-2 text-gray-300 hover:text-[#003366] transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function CreateBonusDialog({ isOpen, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    employeeId: '',
    taskId: '',
    amount: '',
    type: 'Task Completion',
    reason: ''
  });

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
        className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Tạo thưởng hiệu suất</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-xl transition-all text-emerald-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Nhân viên</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none"
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              >
                <option value="">-- Chọn nhân viên --</option>
                {MOCK_MEMBERS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Task liên quan</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none"
                value={formData.taskId}
                onChange={(e) => setFormData({...formData, taskId: e.target.value})}
              >
                <option value="">-- Chọn task (không bắt buộc) --</option>
                {MOCK_TASKS.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Số tiền (VNĐ)</label>
              <input 
                type="number"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                placeholder="Ví dụ: 500000"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Loại thưởng</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option>Task Completion</option>
                <option>Lead Rating</option>
                <option>Project Milestone</option>
                <option>Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Lý do thưởng</label>
            <textarea 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
              placeholder="Nhập lý do chi tiết..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              Khoản thưởng này sẽ được gửi đến PM phê duyệt. Sau khi duyệt, nó sẽ tự động được liên kết với module <span className="font-bold">Payroll</span> của nhân viên trong kỳ lương hiện tại.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Hủy bỏ</button>
            <button 
              onClick={() => onSave({
                id: `pb-${Date.now()}`,
                taskAssigneeId: 'ta-new',
                employeeId: formData.employeeId,
                taskId: formData.taskId,
                employeeCostId: null,
                bonusAmount: parseInt(formData.amount),
                bonusType: formData.type === 'Task Completion' ? 'Hoàn thành sớm' : formData.type === 'Lead Rating' ? 'Xuất sắc' : 'Khác',
                reason: formData.reason,
                status: 'Pending',
                createdAt: new Date().toISOString().split('T')[0],
                createdByPMId: 'PM Nguyễn'
              })}
              disabled={!formData.employeeId || !formData.amount || !formData.reason}
              className="flex-1 py-4 bg-[#003366] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tạo thưởng
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
