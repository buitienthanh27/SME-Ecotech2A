import React from 'react';
import { X, Mail, Phone, Briefcase, Calendar, DollarSign, ShieldCheck, MapPin, Award, Clock, User as UserIcon, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PerformanceBonus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  person: any;
}

// Mock bonuses for detail view
const MOCK_PERSON_BONUSES: PerformanceBonus[] = [
  {
    id: 'pb-1',
    taskAssigneeId: 'ta-1',
    employeeId: '1',
    taskId: 'task-101',
    employeeCostId: 'ec-1',
    bonusAmount: 1200000,
    bonusType: 'Xuất sắc',
    reason: 'Hoàn thành module Dashboard vượt tiến độ 2 ngày',
    createdByPMId: 'pm-1',
    status: 'Locked',
    createdAt: '2026-03-15'
  },
  {
    id: 'pb-2',
    taskAssigneeId: 'ta-2',
    employeeId: '1',
    taskId: 'task-102',
    employeeCostId: 'ec-2',
    bonusAmount: 800000,
    bonusType: 'Chất lượng cao',
    reason: 'Code review đạt chuẩn 100% không lỗi',
    createdByPMId: 'pm-1',
    status: 'Linked',
    createdAt: '2026-03-20'
  }
];

export const PersonnelDetailModal: React.FC<Props> = ({ isOpen, onClose, person }) => {
  if (!isOpen || !person) return null;

  const bonuses = MOCK_PERSON_BONUSES.filter(b => b.employeeId === person.id);

  const statusColors: any = {
    'Đang làm việc': "bg-emerald-100 text-emerald-700",
    'Đang nghỉ phép': "bg-orange-100 text-orange-700",
    'Đã nghỉ việc': "bg-red-100 text-red-700",
  };

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
        className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-[#003366] to-[#005599] relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8 overflow-y-auto">
          {/* Profile Section */}
          <div className="relative -mt-16 mb-8 flex items-end gap-6">
            <div className="w-32 h-32 bg-white p-2 rounded-[2rem] shadow-xl">
              <div className="w-full h-full bg-[#003366] rounded-[1.5rem] flex items-center justify-center text-white text-4xl font-black">
                {person.avatar}
              </div>
            </div>
            <div className="pb-2">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{person.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{person.role}</span>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[person.status]}`}>
                  {person.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Info */}
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserIcon className="w-3 h-3" /> Thông tin liên hệ
                </h4>
                <div className="space-y-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Mail className="w-4 h-4 text-[#003366]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{person.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Phone className="w-4 h-4 text-[#003366]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Số điện thoại</p>
                      <p className="text-sm font-bold text-gray-900">{person.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <MapPin className="w-4 h-4 text-[#003366]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Văn phòng</p>
                      <p className="text-sm font-bold text-gray-900">ECOTECH Tower, Quận 1, TP.HCM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Tài chính & Hợp đồng
                </h4>
                <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Lương hàng năm</p>
                    <p className="text-xl font-black text-emerald-700">${person.salary.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Loại hợp đồng</p>
                    <p className="text-sm font-bold text-emerald-700">Toàn thời gian</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Projects & Performance */}
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Briefcase className="w-3 h-3" /> Dự án đang tham gia
                </h4>
                <div className="space-y-3">
                  {person.projects.length > 0 ? (
                    person.projects.map((project: string, i: number) => (
                      <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-[#003366]/20 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[#003366] font-bold text-xs">
                            {project.charAt(7)}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{project}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">Active</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                      <p className="text-xs font-bold text-gray-400">Chưa được phân bổ dự án</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Award className="w-3 h-3" /> Chỉ số hiệu suất
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Hoàn thành</p>
                    <p className="text-lg font-black text-blue-700">94%</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Tin cậy</p>
                    <p className="text-lg font-black text-purple-700">4.8/5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Bonus History */}
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Lịch sử thưởng hiệu suất
                </h4>
                <div className="space-y-3">
                  {bonuses.length > 0 ? (
                    bonuses.map((bonus) => (
                      <div key={bonus.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-wider">{bonus.bonusType}</span>
                          <span className="text-[10px] font-bold text-gray-400">{bonus.createdAt}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 mb-1">{bonus.bonusAmount.toLocaleString()} VNĐ</p>
                        <p className="text-[10px] text-gray-500 line-clamp-2">{bonus.reason}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            bonus.status === 'Locked' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {bonus.status === 'Locked' ? 'Đã chi trả' : 'Đã duyệt'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                      <p className="text-xs font-bold text-gray-400">Chưa có lịch sử thưởng</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
