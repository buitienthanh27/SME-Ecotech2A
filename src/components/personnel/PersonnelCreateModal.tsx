import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Phone, DollarSign, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    projects: [] as string[],
  });

  const availableProjects = [
    'Dự án Alpha',
    'Dự án Beta',
    'Dự án Gamma',
    'Dự án Delta',
    'Dự án Epsilon',
  ];

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
        projects: editingPerson.projects || [],
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
        projects: [],
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
      avatar: formData.avatar || initials,
    };

    onCreate(person);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
          >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {editingPerson ? 'Cập nhật nhân sự' : 'Thêm nhân viên mới'}
            </h3>
            <p className="text-xs font-bold text-gray-400 mt-1">Quản lý thông tin đội ngũ ECOTECH</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 shadow-sm">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                  placeholder="Nguyễn Văn A..."
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Chức vụ / Vai trò</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                  placeholder="Quản lý dự án..."
                  value={formData.role}
                  onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Email công việc</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type="email"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                    placeholder="email@ecotech.com"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type="tel"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                    placeholder="+84..."
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Lương hàng năm ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    required
                    type="number"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
                    placeholder="0"
                    value={formData.salary}
                    onChange={e => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Trạng thái</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all appearance-none"
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Đang nghỉ phép">Đang nghỉ phép</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">Dự án tham gia</label>
              <div className="flex flex-wrap gap-2">
                {availableProjects.map(project => (
                  <button
                    key={project}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        projects: prev.projects.includes(project)
                          ? prev.projects.filter(p => p !== project)
                          : [...prev.projects, project]
                      }));
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      formData.projects.includes(project)
                        ? 'bg-[#003366] text-white border-[#003366] shadow-md shadow-[#003366]/20'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {project}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-[#003366] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#003366]/20 hover:bg-[#002244] transition-all"
            >
              {editingPerson ? 'Cập nhật' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
