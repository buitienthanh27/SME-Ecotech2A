import React, { useState, useEffect } from 'react';
import { Building2, UserCircle2, AlignLeft, X, Search, SearchIcon, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Department, Employee } from '../../types';
import { Modal, Btn } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (department: Department, memberIds: string[]) => void;
  editingDepartment?: Department | null;
  availablePersonnel: Employee[];
  currentMembers: string[];
}

export const DepartmentCreateModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  editingDepartment,
  availablePersonnel,
  currentMembers
}) => {
  const [formData, setFormData] = useState({
    name: '',
    headId: '',
    description: '',
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  useEffect(() => {
    if (editingDepartment) {
      setFormData({
        name: editingDepartment.name,
        headId: editingDepartment.headId,
        description: editingDepartment.description || '',
      });
      setSelectedMemberIds(currentMembers);
    } else {
      setFormData({
        name: '',
        headId: '',
        description: '',
      });
      setSelectedMemberIds([]);
      setMemberSearchTerm('');
      setIsSearchDropdownOpen(false);
    }
  }, [editingDepartment, isOpen, currentMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.headId) {
      alert('Vui lòng chọn một nhân viên làm trưởng phòng');
      return;
    }

    const department: Department = {
      id: editingDepartment?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      headId: formData.headId,
      description: formData.description,
    };

    onCreate(department, selectedMemberIds);
  };

  const availableForSelection = availablePersonnel.filter(p => 
    (!p.departmentId || p.departmentId === editingDepartment?.id) &&
    !selectedMemberIds.includes(p.id)
  );

  const displayRole = (e: Employee) => e.jobTitle || e.role;

  const filteredSearchResults = availableForSelection.filter(
    (p) =>
      p.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      displayRole(p).toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (formData.headId && !selectedMemberIds.includes(formData.headId)) {
      setSelectedMemberIds(prev => [...prev, formData.headId]);
    }
  }, [formData.headId]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingDepartment ? 'Cấu hình phòng ban' : 'Khởi tạo phòng ban mới'}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Hủy bỏ</Btn>
          <Btn type="submit" form="dept-form">{editingDepartment ? 'Lưu thay đổi' : 'Tạo phòng ban'}</Btn>
        </>
      }
    >
      <form id="dept-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Tên phòng ban</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <input
              required
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
              placeholder="VD: Phòng Kỹ thuật..."
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Trưởng phòng (Head)</label>
          <div className="relative">
            <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <select
              required
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all appearance-none cursor-pointer"
              value={formData.headId}
              onChange={e => setFormData(prev => ({ ...prev, headId: e.target.value }))}
            >
              <option value="" disabled>Chọn nhân sự...</option>
              {availablePersonnel
                .filter((p) => !p.departmentId || p.departmentId === editingDepartment?.id)
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({displayRole(person)})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-2 ml-1">Danh sách thành viên</label>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
              placeholder="Nhập tên để tìm kiếm nhân viên..."
              value={memberSearchTerm}
              onChange={(e) => {
                setMemberSearchTerm(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
            />
            
            <AnimatePresence>
              {isSearchDropdownOpen && memberSearchTerm && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-[12px] shadow-xl max-h-48 overflow-y-auto py-2"
                >
                  {filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map(person => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setSelectedMemberIds(prev => [...prev, person.id]);
                          setMemberSearchTerm('');
                          setIsSearchDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#F8FAFC] transition-all text-left group"
                      >
                        <div className="w-8 h-8 bg-[#ECFDF5] rounded-[6px] flex items-center justify-center text-[#148922] font-bold text-[10px] group-hover:bg-[#148922] group-hover:text-white transition-colors">
                          {person.avatar}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#1A202C]">{person.name}</p>
                          <p className="text-[11px] text-[#718096] uppercase font-bold tracking-tight">{displayRole(person)}</p>
                        </div>
                        <Plus className="w-4 h-4 ml-auto text-[#CBD5E1] group-hover:text-[#148922]" />
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-[12px] text-[#718096] text-center italic">Không tìm thấy yêu cầu phù hợp.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {selectedMemberIds.map(id => {
              const person = availablePersonnel.find(p => p.id === id);
              if (!person) return null;
              const isHead = person.id === formData.headId;
              return (
                <div 
                  key={id}
                  className={`p-2.5 rounded-[10px] border flex items-center justify-between transition-all ${
                    isHead ? 'bg-[#ECFDF5] border-[#D1FAE5]' : 'bg-white border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-[6px] flex items-center justify-center font-bold text-[10px] ${
                        isHead ? 'bg-[#148922] text-white' : 'bg-[#F1F5F9] text-[#718096]'
                      }`}
                    >
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-[13px] font-bold ${isHead ? 'text-[#148922]' : 'text-[#1A202C]'}`}>{person.name}</p>
                      <p className="text-[11px] text-[#718096] whitespace-nowrap">{displayRole(person)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHead && <span className="text-[9px] font-bold text-[#148922] bg-white border border-[#D1FAE5] px-2 py-0.5 rounded-full uppercase tracking-widest">Trưởng phòng</span>}
                    {!isHead && (
                      <button
                        type="button"
                        onClick={() => setSelectedMemberIds(prev => prev.filter(mid => mid !== id))}
                        className="p-1.5 text-[#A0AEC0] hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {selectedMemberIds.length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-[#F1F5F9] rounded-[12px]">
                <p className="text-[12px] text-[#A0AEC0] font-medium">Danh sách thành viên đang trống</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Mô tả nhiệm vụ</label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-[#A0AEC0]" />
            <textarea
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all min-h-[80px]"
              placeholder="Cơ cấu, chức năng và vai trò của phòng ban này..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
