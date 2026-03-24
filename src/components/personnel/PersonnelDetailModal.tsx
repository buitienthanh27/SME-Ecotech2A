import React from 'react';
import { Mail, Phone, Briefcase, DollarSign, Award, User as UserIcon, TrendingUp, MapPin } from 'lucide-react';
import { PerformanceBonus, Department } from '../../types';
import { Modal, StatusBadge, Btn } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  person: any;
  departments: Department[];
}

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

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export const PersonnelDetailModal: React.FC<Props> = ({ isOpen, onClose, person, departments }) => {
  if (!person) return null;

  const bonuses = MOCK_PERSON_BONUSES.filter(b => b.employeeId === person.id);
  const department = departments.find(d => d.id === person.departmentId);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl" 
      title="Chi tiết mã hồ sơ nhân viên"
      footer={<Btn variant="secondary" onClick={onClose}>Đóng</Btn>}
    >
      <div className="space-y-8">
        {/* Profile Header Block */}
        <div className="flex items-center gap-6 p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px]">
          <div className="w-24 h-24 bg-[#148922] rounded-[20px] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-[#148922]/20">
            {person.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[22px] font-bold text-[#1A202C]">{person.name}</h3>
              <StatusBadge status={person.status} />
            </div>
            <div className="flex items-center gap-3 text-[#718096] text-[14px]">
              <span className="font-bold uppercase tracking-wider text-[11px]">{person.role}</span>
              <span className="w-1 h-1 rounded-full bg-[#CBD5E1]"></span>
              <span className="font-bold text-[#148922]">{department?.name || 'Vãng lai'}</span>
            </div>
            <div className="flex items-center gap-6 mt-4">
               <div className="flex items-center gap-2 text-[13px] text-[#4A5568]">
                  <Mail className="w-4 h-4 text-[#A0AEC0]" />
                  {person.email}
               </div>
               <div className="flex items-center gap-2 text-[13px] text-[#4A5568]">
                  <Phone className="w-4 h-4 text-[#A0AEC0]" />
                  {person.phone}
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work & Projects */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[11px] font-bold text-[#718096] uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Dự án đang tham gia
              </h4>
              <div className="space-y-2">
                {person.projects.length > 0 ? (
                  person.projects.map((project: string, i: number) => (
                    <div key={i} className="p-3.5 bg-white border border-[#E2E8F0] rounded-[10px] flex items-center justify-between shadow-sm">
                      <span className="text-[14px] font-bold text-[#1A202C]">{project}</span>
                      <span className="text-[10px] font-bold text-[#148922] bg-[#ECFDF5] px-2 py-0.5 rounded-full uppercase">Đang chạy</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-[#F8FAFC] rounded-[10px] border border-dashed border-[#E2E8F0] text-center">
                    <p className="text-[12px] font-bold text-[#A0AEC0]">Chưa được phân bổ dự án</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-[#718096] uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Địa điểm làm việc
              </h4>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-[10px] shadow-sm">
                <p className="text-[14px] font-bold text-[#1A202C]">Trụ sở chính ECOTECH</p>
                <p className="text-[13px] text-[#718096]">Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
          </div>

          {/* Performance & Rewards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-[#ECFDF5] border border-[#D1FAE5] rounded-[16px]">
                <p className="text-[11px] font-bold text-[#148922] uppercase mb-1">Thực lĩnh kỳ trước</p>
                <p className="text-[20px] font-black text-[#148922]">{fmt(person.salary / 12)}</p>
              </div>
              <div className="p-5 bg-blue-50 border border-blue-100 rounded-[16px]">
                <p className="text-[11px] font-bold text-blue-600 uppercase mb-1">Hiệu suất tổng quát</p>
                <p className="text-[20px] font-black text-blue-700">94.8% <span className="text-[12px] font-bold text-blue-400">/ 100</span></p>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-[#718096] uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Lịch sử thưởng dự án (3 tháng gần nhất)
              </h4>
              <div className="space-y-3">
                {bonuses.length > 0 ? (
                  bonuses.map((bonus) => (
                    <div key={bonus.id} className="p-4 bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#148922] bg-[#ECFDF5] px-2 py-0.5 rounded-full uppercase">{bonus.bonusType}</span>
                        <span className="text-[12px] text-[#A0AEC0]">{bonus.createdAt}</span>
                      </div>
                      <p className="text-[16px] font-bold text-[#1A202C] mb-1">{fmt(bonus.bonusAmount)}</p>
                      <p className="text-[13px] text-[#718096] line-clamp-2 leading-relaxed italic">"{bonus.reason}"</p>
                    </div>
                  ))
                ) : (
                  <div className="p-12 bg-[#F8FAFC] rounded-[12px] border border-dashed border-[#E2E8F0] text-center">
                    <Award className="w-8 h-8 text-[#E2E8F0] mx-auto mb-3" />
                    <p className="text-[13px] font-bold text-[#A0AEC0]">Chưa có dữ liệu thưởng hiệu suất</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
