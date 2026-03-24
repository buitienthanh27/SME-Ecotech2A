import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Phone, Building2, Banknote, ShieldCheck } from 'lucide-react';
import { Modal, Btn } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (person: any) => void;
  editingPerson?: any;
}

export const PersonnelCreateModal: React.FC<Props> = ({ isOpen, onClose, onCreate, editingPerson }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    salary: 0,
    status: 'Đang làm việc',
    email: '',
    phone: '',
    avatar: '',
  });

  useEffect(() => {
    if (editingPerson) {
      setFormData({
        name: editingPerson.name,
        role: editingPerson.role,
        salary: editingPerson.salary,
        status: editingPerson.status,
        email: editingPerson.email,
        phone: editingPerson.phone,
        avatar: editingPerson.avatar,
      });
    } else {
      setFormData({
        name: '',
        role: '',
        salary: 0,
        status: 'Đang làm việc',
        email: '',
        phone: '',
        avatar: '',
      });
    }
  }, [editingPerson, isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const initials = formData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const person = {
      id: editingPerson?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      departmentId: editingPerson?.departmentId || '', 
      projects: editingPerson?.projects || [], 
      avatar: formData.avatar || initials,
    };

    onCreate(person);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingPerson ? 'Cập nhật nhân sự' : 'Thêm nhân viên mới'}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Hủy</Btn>
          <Btn type="submit" form="personnel-form">
            {editingPerson ? 'Cập nhật' : 'Thêm nhân viên'}
          </Btn>
        </>
      }
    >
      <form id="personnel-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Họ và tên</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <input
              required
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
              placeholder="Nguyễn Văn A..."
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Chức vụ / Vai trò</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <input
                required
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                placeholder="Quản lý dự án..."
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Email công việc</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <input
                required
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                placeholder="email@ecotech.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <input
                required
                type="tel"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                placeholder="+84..."
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Lương / kỳ (VNĐ)</label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#148922]" />
              <input
                required
                type="number"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                placeholder="0"
                value={formData.salary}
                onChange={e => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Trạng thái công việc</label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all appearance-none cursor-pointer"
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="Đang làm việc">Đang làm việc</option>
              <option value="Đang nghỉ phép">Đang nghỉ phép</option>
              <option value="Đã nghỉ việc">Đã nghỉ việc</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};
