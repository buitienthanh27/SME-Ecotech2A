import React, { useState, useMemo } from 'react';
import { X, UserPlus, AlertCircle, Calendar, Briefcase, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, Project, ProjectMember } from '../../types';
import { useStore } from '../../store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PersonnelAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAdd: (member: ProjectMember) => void;
}

export function PersonnelAddModal({ isOpen, onClose, projectId, onAdd }: PersonnelAddModalProps) {
  const { employees, projects } = useStore();
  
  const [department, setDepartment] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department)));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.status === 'Active' && 
      (!department || e.department === department)
    );
  }, [employees, department]);

  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === selectedEmployeeId), 
    [employees, selectedEmployeeId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedEmployeeId || !role || !startDate || !endDate) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    const newMember: ProjectMember = {
      id: `m-${Date.now()}`,
      employeeId: selectedEmployeeId,
      projectId,
      role,
      allocation: 0,
      startDate,
      endDate,
      status: 'Active'
    };

    onAdd(newMember);
    onClose();
    // Reset form
    setDepartment('');
    setSelectedEmployeeId('');
    setRole('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Thêm nhân sự dự án</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-xl transition-all text-blue-400" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-xs text-red-800 font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Phòng ban</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setSelectedEmployeeId('');
                }}
              >
                <option value="">-- Tất cả phòng ban --</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Nhân viên *</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {filteredEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Vai trò *</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">-- Chọn vai trò --</option>
                  <option value="PM">Project Manager</option>
                  <option value="Lead">Team Lead</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="QA">QA/Tester</option>
                  <option value="DevOps">DevOps</option>
                </select>
                <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Ngày bắt đầu *</label>
              <div className="relative">
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Ngày kết thúc *</label>
              <div className="relative">
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-[#003366] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
            >
              Thêm nhân sự
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
