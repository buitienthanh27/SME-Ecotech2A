import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Banknote, 
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
import { Modal, Btn, Badge, StatusBadge } from '../components/ui';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Local extended interface for UI display
interface ProjectMemberUI extends ProjectMember {
  name: string;
  avatar: string;
}

// Mock Data
const MOCK_MEMBERS: ProjectMemberUI[] = [
  { id: 'pm-1', employeeId: 'emp-1', projectId: 'p-1', role: 'Frontend Dev', allocation: 100, startDate: '2026-01-01', endDate: '2026-06-30', status: 'Active', name: 'Nguyễn Văn An', avatar: 'VA' },
  { id: 'pm-2', employeeId: 'emp-2', projectId: 'p-1', role: 'Backend Dev', allocation: 100, startDate: '2026-01-01', endDate: '2026-06-30', status: 'Active', name: 'Trần Thị Bình', avatar: 'TB' },
  { id: 'pm-3', employeeId: 'emp-3', projectId: 'p-1', role: 'Mobile Dev', allocation: 50, startDate: '2026-02-01', endDate: '2026-05-30', status: 'Active', name: 'Lê Văn Châu', avatar: 'VC' },
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

  const stats = useMemo(() => {
    const total = bonuses.reduce((acc, b) => acc + b.bonusAmount, 0);
    const pending = bonuses.filter(b => b.status === 'Pending').length;
    const approved = bonuses.filter(b => b.status === 'Linked' || b.status === 'Locked').length;
    return { total, pending, approved };
  }, [bonuses]);

  const filteredBonuses = useMemo(() => {
    return bonuses.filter(b => {
      const employee = MOCK_MEMBERS.find(m => m.employeeId === b.employeeId);
      const task = MOCK_TASKS.find(t => t.id === b.taskId);
      return (
        employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [bonuses, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Tổng tiền thưởng" 
          value={stats.total.toLocaleString('vi-VN') + ' đ'} 
          icon={Banknote} 
          color="bg-[#ECFDF5] text-[#148922]"
          trend="+12% so với tháng trước"
        />
        <StatCard 
          label="Đang chờ duyệt" 
          value={stats.pending.toString()} 
          icon={Clock} 
          color="bg-[#FFFBEB] text-[#D97706]"
          trend="Cần PM phê duyệt"
        />
        <StatCard 
          label="Đã phê duyệt" 
          value={stats.approved.toString()} 
          icon={CheckCircle2} 
          color="bg-[#EFF6FF] text-[#2563EB]"
          trend="Sẽ cộng vào kỳ lương tới"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main List */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F8FAFC] rounded-[10px]">
                  <TrendingUp className="w-5 h-5 text-[#148922]" />
                </div>
                <h2 className="text-[18px] font-black text-[#1A202C] uppercase tracking-tight">Danh sách thưởng hiệu suất</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <input 
                    placeholder="Tìm kiếm..."
                    className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] font-medium focus:outline-none focus:border-[#148922] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                </div>
                <Btn 
                  onClick={() => setIsCreateOpen(true)}
                  icon={Plus}
                  className="font-black uppercase tracking-wider"
                >
                  Tạo thưởng mới
                </Btn>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Nhân viên</th>
                    <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Task / Lý do</th>
                    <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Số tiền</th>
                    <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Trạng thái</th>
                    <th className="text-right py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
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
          <div className="bg-[#064E3B] p-8 rounded-[32px] text-white shadow-xl shadow-[#064E3B]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Info className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-4 h-4 text-[#6EE7B7]" />
                <span className="text-[10px] font-bold text-[#A7F3D0] uppercase tracking-widest">Thông tin Payroll</span>
              </div>
              <h3 className="text-[18px] font-black mb-4 leading-tight">Tích hợp Lương</h3>
              <p className="text-[13px] text-[#D1FAE5] leading-relaxed mb-6 opacity-90">
                Các khoản thưởng hiệu suất sau khi được PM phê duyệt sẽ tự động được liệt kê trong module Payroll. 
                Khi kỳ lương được chốt (Lock), các khoản này sẽ chính thức được cộng vào thu nhập của nhân viên.
              </p>
              <div className="p-4 bg-white/10 rounded-[16px] border border-white/10">
                <p className="text-[10px] font-bold text-[#A7F3D0] uppercase tracking-widest mb-2">Kỳ lương hiện tại</p>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black">Tháng 03/2026</span>
                  <Badge variant="success" className="uppercase text-[9px] px-2 py-0.5">Open</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-[#E2E8F0] shadow-sm">
            <h3 className="text-[12px] font-black text-[#1A202C] uppercase tracking-tight mb-6">Top thưởng chờ duyệt</h3>
            <div className="space-y-4">
              {bonuses.filter(b => b.status === 'Pending').slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-[16px] border border-[#F1F5F9] hover:border-[#148922] transition-colors group cursor-pointer">
                  <div className="w-8 h-8 bg-[#148922] rounded-full flex items-center justify-center text-[10px] font-black text-white">
                    {MOCK_MEMBERS.find(m => m.employeeId === b.employeeId)?.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1A202C] truncate">{MOCK_MEMBERS.find(m => m.employeeId === b.employeeId)?.name}</p>
                    <p className="text-[11px] font-black text-[#148922]">{b.bonusAmount.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#148922] transition-all" />
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
        onSave={(newBonus: PerformanceBonus) => {
          setBonuses(prev => [newBonus, ...prev]);
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#E2E8F0] flex items-center gap-6 group hover:border-[#148922] transition-all">
      <div className={cn("p-4 rounded-[16px] transition-transform group-hover:scale-110", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-[#1A202C]">{value}</p>
        <p className="text-[10px] font-bold text-[#718096] mt-1">{trend}</p>
      </div>
    </div>
  );
}

const BonusRow: React.FC<{ bonus: PerformanceBonus; key?: React.Key }> = ({ bonus }) => {
  const employee = MOCK_MEMBERS.find(m => m.employeeId === bonus.employeeId);
  const task = MOCK_TASKS.find(t => t.id === bonus.taskId);

  return (
    <tr className="group hover:bg-[#F8FAFC] transition-colors">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E2E8F0] rounded-full flex items-center justify-center text-[10px] font-black text-[#718096]">
            {employee?.avatar}
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#1A202C]">{employee?.name}</p>
            <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest">{employee?.role}</p>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className="max-w-xs">
          <p className="text-[13px] font-bold text-[#1A202C] truncate mb-1">{task?.title || 'Thưởng chung'}</p>
          <p className="text-[11px] text-[#718096] line-clamp-1 font-medium">{bonus.reason}</p>
        </div>
      </td>
      <td className="py-4">
        <p className="text-[14px] font-black text-[#1A202C]">{bonus.bonusAmount.toLocaleString('vi-VN')} đ</p>
        <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mt-0.5">{bonus.bonusType}</p>
      </td>
      <td className="py-4">
        <StatusBadge status={bonus.status === 'Locked' || bonus.status === 'Linked' ? 'Linked' : 'Pending'} />
      </td>
      <td className="py-4 text-right">
        <button className="p-2 text-[#CBD5E1] hover:text-[#148922] transition-colors rounded-[8px] hover:bg-[#F1F5F9]">
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo thưởng hiệu suất"
      size="md"
      footer={
        <div className="flex gap-4 w-full">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Hủy bỏ</Btn>
          <Btn 
            className="flex-1 font-black uppercase tracking-wider"
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
          >
            Tạo thưởng
          </Btn>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-widest ml-1">Nhân viên *</label>
            <select 
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
            >
              <option value="">-- Chọn nhân viên --</option>
              {MOCK_MEMBERS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-widest ml-1">Task liên quan</label>
            <select 
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
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
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-widest ml-1">Số tiền (VNĐ) *</label>
            <input 
              type="number"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-black text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all placeholder:text-[#CBD5E1]"
              placeholder="Ví dụ: 500000"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-widest ml-1">Loại thưởng</label>
            <select 
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
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

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#718096] uppercase tracking-widest ml-1">Lý do thưởng *</label>
          <textarea 
            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-medium text-[#1A202C] min-h-[100px] focus:outline-none focus:border-[#148922] transition-all resize-none"
            placeholder="Nhập lý do chi tiết..."
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
          />
        </div>

        <div className="p-4 bg-[#EFF6FF] rounded-[16px] border border-[#DBEAFE] flex gap-3">
          <Info className="w-5 h-5 text-[#2563EB] shrink-0" />
          <p className="text-[12px] text-[#1E40AF] leading-relaxed font-medium">
            Khoản thưởng này sẽ được gửi đến PM phê duyệt. Sau khi duyệt, nó sẽ tự động được liên kết với module <span className="font-bold">Payroll</span> của nhân viên trong kỳ lương hiện tại.
          </p>
        </div>
      </div>
    </Modal>
  );
}
