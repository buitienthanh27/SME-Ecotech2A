import React, { useState, useMemo } from 'react';
import { UserPlus, AlertCircle, Briefcase, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectMember } from '../../types';
import { useStore } from '../../store/useStore';
import { Modal, Btn } from '../ui';

interface PersonnelAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAdd: (member: ProjectMember) => void;
  existingMemberIds?: string[];
  /** Lọc nhân viên theo phòng ban đang được chọn trên ProjectBoard (vd: Lead view phòng của bạn). */
  departmentId?: string;
  departmentName?: string;
}

export function PersonnelAddModal({
  isOpen,
  onClose,
  projectId,
  onAdd,
  existingMemberIds = [],
  departmentId,
  departmentName,
}: PersonnelAddModalProps) {
  const { employees, departments: orgDepartments, currentUser } = useStore();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const managedDepartment = useMemo(() => {
    return orgDepartments.find((d) => d.headId === currentUser.id);
  }, [currentUser.id, orgDepartments]);

  const filteredEmployees = useMemo(() => {
    const existing = new Set(existingMemberIds.map(String));
    const q = search.trim().toLowerCase();

    const deptId = managedDepartment?.id ?? departmentId;
    const deptName = managedDepartment?.name ?? departmentName;

    return employees.filter((e) => {
      if (e.id === 'admin' || e.status !== 'Active') return false;
      if (existing.has(e.id)) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;

      if (deptId || deptName) {
        if (deptId) {
          return e.departmentId ? e.departmentId === deptId : e.department === deptName;
        }
        return e.department === deptName;
      }

      return true;
    });
  }, [employees, managedDepartment, departmentId, departmentName, search, existingMemberIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedEmployeeId || !role) {
      setError('Vui lòng chọn nhân viên và vai trò.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newMember: ProjectMember = {
      id: `m-${Date.now()}`,
      employeeId: selectedEmployeeId,
      projectId,
      role,
      allocation: 100,
      startDate: today,
      endDate: '',
      status: 'Active'
    };
    onAdd(newMember);

    onClose();
    // Reset form
    setSelectedEmployeeId('');
    setRole('');
    setSearch('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        managedDepartment?.name || departmentName
          ? `Thêm nhân sự — ${managedDepartment?.name ?? departmentName}`
          : 'Thêm nhân sự dự án'
      }
      size="lg"
      footer={
        <div className="flex gap-4 w-full">
          <Btn variant="secondary" className="flex-1" onClick={onClose} type="button">Hủy bỏ</Btn>
          <Btn 
            className="flex-1 font-black uppercase tracking-wider" 
            icon={UserPlus}
            type="submit"
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
                {e.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#1A202C] truncate">{e.name}</p>
                <p className="text-[11px] text-[#718096] truncate">{(e as any).jobTitle || e.role}</p>
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
          <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2 ml-1">
            Vai trò trong dự án *
          </label>
          <div className="relative">
            <select
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[14px] font-bold text-[#1A202C] focus:outline-none focus:border-[#148922] transition-all pr-10"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            >
              <option value="">-- Chọn vai trò --</option>
              <option value="PM">Project Manager</option>
              <option value="Lead">Team Lead</option>
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
      </form>
    </Modal>
  );
}
