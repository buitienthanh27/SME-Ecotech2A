import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, AlertCircle, Calendar, Briefcase, Percent, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectMember } from '../../types';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';
import { Modal, Btn } from '../ui';
import { INITIAL_DEPARTMENTS, INITIAL_PERSONNEL } from '../../pages/Personnel';

interface PersonnelAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAdd: (member: ProjectMember) => void;
  existingMemberIds?: string[];
}

export function PersonnelAddModal({ isOpen, onClose, projectId, onAdd, existingMemberIds = [] }: PersonnelAddModalProps) {
  const { employees, currentUser, addPersonnelRequest } = useStore();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [allocation, setAllocation] = useState(100);
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const managedDepartment = useMemo(() => {
    return INITIAL_DEPARTMENTS.find(d => d.headId === currentUser.id.replace('e', ''));
  }, [currentUser.id]);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department)));
  }, [employees]);

  useEffect(() => {
    if (managedDepartment) {
      setDepartment(managedDepartment.name);
    }
  }, [managedDepartment]);

  // For department heads: use INITIAL_PERSONNEL filtered by their department
  const filteredEmployees = useMemo(() => {
    if (managedDepartment) {
      return INITIAL_PERSONNEL.filter(e => {
        const dept = INITIAL_DEPARTMENTS.find(d => d.id === e.departmentId);
        const inDept = dept?.name === managedDepartment.name;
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
        const notAdded = !existingMemberIds.includes(e.id);
        return inDept && matchesSearch && notAdded;
      });
    }
    return employees.filter(e => {
      if (e.status !== 'Active') return false;
      if (department && e.department !== department) return false;
      return e.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [employees, managedDepartment, department, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (managedDepartment) {
      if (!selectedEmployeeId || !role) {
        setError('Vui lòng chọn nhân viên và vai trò.');
        return;
      }
    } else {
      if (!selectedEmployeeId || !role || !startDate || !endDate || allocation <= 0 || allocation > 100) {
        setError('Vui lòng nhập đầy đủ thông tin hợp lệ (Phân bổ 1-100%).');
        return;
      }
    }

    if (managedDepartment) {
      const newMember: ProjectMember = {
        id: `m-${Date.now()}`,
        employeeId: selectedEmployeeId,
        projectId,
        role,
        allocation: 100,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Active'
      };
      onAdd(newMember);
      toast.success('Đã thêm nhân sự vào dự án');
    } else {
      const newMember: ProjectMember = {
        id: `m-${Date.now()}`,
        employeeId: selectedEmployeeId,
        projectId,
        role,
        allocation,
        startDate,
        endDate,
        status: 'Active'
      };
      onAdd(newMember);
      toast.success('Đã thêm 1 nhân sự vào dự án');
    }

    onClose();
    // Reset form
    setSelectedEmployeeId('');
    setRole('');
    setSearch('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setAllocation(100);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={managedDepartment ? `Thêm nhân sự — ${managedDepartment.name}` : 'Thêm nhân sự dự án'}
      size="lg"
      footer={
        <div className="flex gap-4 w-full">
          <Btn variant="secondary" className="flex-1" onClick={onClose} type="button">Hủy bỏ</Btn>
          <Btn 
            className="flex-1 font-black uppercase tracking-wider" 
            onClick={handleSubmit as any} 
            icon={UserPlus}
          >
            Thêm nhân sự
          </Btn>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 border border-red-100 rounded-[12px] flex gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-[12px] text-red-800 font-bold leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Department Head simplified flow: card list of employees */}
        {managedDepartment ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] font-bold outline-none focus:border-[#148922] transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Employee Cards */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredEmployees.length === 0 && (
                <p className="text-center py-8 text-[12px] italic text-[#A0AEC0]">Không tìm thấy nhân viên.</p>
              )}
              {filteredEmployees.map(e => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEmployeeId(e.id === selectedEmployeeId ? '' : e.id)}
                  className={`flex items-center gap-3 p-3 rounded-[12px] border cursor-pointer transition-all ${
                    selectedEmployeeId === e.id
                      ? 'border-[#148922] bg-[#ECFDF5]'
                      : 'border-[#E2E8F0] bg-white hover:border-[#148922]/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#148922] font-black text-[11px]">
                    {e.avatar || e.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1A202C] truncate">{e.name}</p>
                    <p className="text-[11px] text-[#718096] truncate">{e.role}</p>
                  </div>
                  {selectedEmployeeId === e.id && (
                    <div className="w-5 h-5 rounded-full bg-[#148922] flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">Vai trò trong dự án *</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all pr-10"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                >
                  <option value="">-- Chọn vai trò --</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="QA">QA/Tester</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Other">Khác</option>
                </select>
                <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096] pointer-events-none" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* PM / CEO full form */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">Phòng ban</label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
                  value={department}
                  onChange={e => { setDepartment(e.target.value); setSelectedEmployeeId(''); }}
                >
                  <option value="">-- Tất cả phòng ban --</option>
                  {departments.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">Nhân viên *</label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all"
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {filteredEmployees.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">Vai trò *</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all pr-10" value={role} onChange={e => setRole(e.target.value)} required>
                    <option value="">-- Chọn vai trò --</option>
                    <option value="PM">Project Manager</option>
                    <option value="Lead">Team Lead</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="QA">QA/Tester</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                  <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">% Phân bổ *</label>
                <div className="relative">
                  <input type="number" min="1" max="100" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all pr-10" value={allocation} onChange={e => setAllocation(parseInt(e.target.value) || 0)} required />
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096] pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">Ngày bắt đầu *</label>
                <div className="relative">
                  <input type="date" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">Ngày kết thúc *</label>
                <div className="relative">
                  <input type="date" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096] pointer-events-none" />
                </div>
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
