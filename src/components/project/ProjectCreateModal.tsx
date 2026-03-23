import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Users, 
  Briefcase, 
  Search, 
  Check, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { Project, ProjectMemberAssignment, ProjectCostItem, ProjectStatus } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (project: any) => void; // Keeping for compatibility but we'll use store
  initialData?: any;
}

export const ProjectCreateModal: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { customers, employees, contracts, addProject, updateProject, addApprovalRequest, currentUser } = useStore();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    code: initialData?.code || '',
    customerId: initialData?.customerId || '',
    contractId: initialData?.contractId || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    budget: initialData?.budget || 0,
    description: initialData?.description || '',
    members: (initialData?.members || (currentUser.role === 'PM' ? [{ employeeId: currentUser.id, role: 'PM' }] : [])) as ProjectMemberAssignment[],
    costPlan: (initialData?.costPlan || []) as ProjectCostItem[],
  });

  // Auto-suggest project code based on name
  useEffect(() => {
    if (formData.name && !formData.code) {
      const suggestedCode = formData.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, code: suggestedCode }));
    }
  }, [formData.name]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Tên dự án là bắt buộc';
    if (!formData.code) newErrors.code = 'Mã dự án là bắt buộc';
    if (!formData.customerId) newErrors.customerId = 'Khách hàng là bắt buộc';
    if (!formData.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) newErrors.endDate = 'Ngày kết thúc là bắt buộc';
    if (formData.budget <= 0) newErrors.budget = 'Ngân sách phải lớn hơn 0';
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const hasPM = formData.members.some(m => m.role === 'PM');
    if (!hasPM) {
      toast.error('Vui lòng chọn ít nhất 1 nhân sự với vai trò PM');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.costPlan.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 khoản chi phí kế hoạch');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSave = (status: ProjectStatus) => {
    const totalCost = formData.costPlan.reduce((sum, item) => sum + item.plannedAmount, 0);
    const profit = (formData.budget - totalCost) / 1000;

    if (status === 'Chờ duyệt' && profit < 0) {
      toast.error('Không thể gửi phê duyệt dự án có lợi nhuận âm. Vui lòng kiểm tra lại ngân sách hoặc kế hoạch chi phí.');
      return;
    }

    const projectId = initialData?.id || Math.random().toString(36).substr(2, 9);
    const projectData: Project = {
      id: projectId,
      ...formData,
      status,
      pmId: initialData?.pmId || currentUser.id,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      // Compatibility fields
      revenue: formData.budget / 1000, // Mocking for now
      expenses: totalCost / 1000,
      profit: profit,
      margin: formData.budget > 0 ? Math.round((profit * 1000 / formData.budget) * 100) : 0,
      timeline: `${formData.startDate} - ${formData.endDate}`,
      rejectionNote: status === 'Chờ duyệt' ? undefined : initialData?.rejectionNote
    };

    if (initialData?.id) {
      updateProject(initialData.id, projectData);
    } else {
      addProject(projectData);
    }

    if (status === 'Chờ duyệt') {
      addApprovalRequest({
        id: Math.random().toString(36).substr(2, 9),
        title: `Phê duyệt kế hoạch dự án: ${formData.name}`,
        type: 'ProjectPlan',
        priority: 'High',
        targetRole: 'CEO',
        projectId: projectId,
        amount: formData.budget,
        status: 'Pending',
        submittedBy: currentUser.name,
        requesterId: currentUser.id,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      toast.success('Kế hoạch dự án đã gửi CEO phê duyệt');
    } else {
      toast.success(initialData?.id ? 'Đã cập nhật bản nháp' : 'Dự án đã được lưu nháp');
    }

    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
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
            className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Tạo dự án mới</h3>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4].map(i => (
                    <div 
                      key={i}
                      className={cn(
                        "h-1.5 w-8 rounded-full transition-all",
                        step >= i ? "bg-[#003366]" : "bg-gray-200"
                      )}
                    />
                  ))}
                  <span className="text-[10px] font-bold text-gray-400 uppercase ml-2">Bước {step} / 4</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 shadow-sm">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {step === 1 && (
                <Step1Info 
                  formData={formData} 
                  setFormData={setFormData} 
                  errors={errors} 
                  customers={customers}
                  contracts={contracts}
                />
              )}
              {step === 2 && (
                <Step2Personnel 
                  formData={formData} 
                  setFormData={setFormData} 
                  employees={employees}
                />
              )}
              {step === 3 && (
                <Step3CostPlan 
                  formData={formData} 
                  setFormData={setFormData} 
                  formatCurrency={formatCurrency}
                />
              )}
              {step === 4 && (
                <Step4Review 
                  formData={formData} 
                  customers={customers}
                  employees={employees}
                  contracts={contracts}
                  formatCurrency={formatCurrency}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <button
                type="button"
                onClick={step === 1 ? onClose : prevStep}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {step === 1 ? 'Hủy' : 'Quay lại'}
              </button>
              
              <div className="flex gap-4">
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-[#003366] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#003366]/20 hover:bg-[#002244] transition-all flex items-center gap-2"
                  >
                    Tiếp theo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSave('Draft')}
                      className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      Lưu nháp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave('Chờ duyệt')}
                      className="px-8 py-3 bg-[#003366] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#003366]/20 hover:bg-[#002244] transition-all"
                    >
                      Gửi phê duyệt
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Step Components ---

function Step1Info({ formData, setFormData, errors, customers, contracts }: any) {
  const filteredContracts = contracts.filter((c: any) => {
    const customer = customers.find((cust: any) => cust.id === formData.customerId);
    return customer && c.clientName === customer.name;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tên dự án (*)</label>
          <div className={cn("relative", errors.name && "ring-2 ring-red-500 rounded-2xl")}>
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
              placeholder="Nhập tên dự án..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mã dự án (*)</label>
          <div className={cn("relative", errors.code && "ring-2 ring-red-500 rounded-2xl")}>
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
              placeholder="Mã dự án..."
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          {errors.code && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.code}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Khách hàng (*)</label>
          <select
            className={cn(
              "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all",
              errors.customerId && "ring-2 ring-red-500"
            )}
            value={formData.customerId}
            onChange={e => setFormData({ ...formData, customerId: e.target.value, contractId: '' })}
          >
            <option value="">Chọn khách hàng...</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.customerId && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.customerId}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Hợp đồng liên kết</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
            value={formData.contractId}
            onChange={e => setFormData({ ...formData, contractId: e.target.value })}
            disabled={!formData.customerId}
          >
            <option value="">Chọn hợp đồng (nếu có)...</option>
            {filteredContracts.map((c: any) => (
              <option key={c.id} value={c.id}>{c.contractNumber} - {c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày bắt đầu (*)</label>
          <input
            type="date"
            className={cn(
              "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all",
              errors.startDate && "ring-2 ring-red-500"
            )}
            value={formData.startDate}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
          />
          {errors.startDate && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.startDate}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày kết thúc dự kiến (*)</label>
          <input
            type="date"
            className={cn(
              "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all",
              errors.endDate && "ring-2 ring-red-500"
            )}
            value={formData.endDate}
            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
          />
          {errors.endDate && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.endDate}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngân sách kế hoạch (VND) (*)</label>
        <div className={cn("relative", errors.budget && "ring-2 ring-red-500 rounded-2xl")}>
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <input
            type="number"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all"
            placeholder="0"
            value={formData.budget}
            onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
          />
        </div>
        {errors.budget && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.budget}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mô tả</label>
        <textarea
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#003366]/10 outline-none transition-all min-h-[100px]"
          placeholder="Mô tả dự án..."
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
    </div>
  );
}

function Step2Personnel({ formData, setFormData, employees }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('Tất cả phòng ban');

  const departments = useMemo(() => {
    const depts = new Set(employees.map((e: any) => e.department));
    return ['Tất cả phòng ban', ...Array.from(depts)];
  }, [employees]);

  const filteredEmployees = employees.filter((e: any) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'Tất cả phòng ban' || e.department === deptFilter;
    const notSelected = !formData.members.some((m: any) => m.employeeId === e.id);
    return matchesSearch && matchesDept && notSelected;
  });

  const addMember = (employeeId: string) => {
    setFormData({
      ...formData,
      members: [...formData.members, { employeeId, role: 'Developer' }]
    });
  };

  const removeMember = (employeeId: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter((m: any) => m.employeeId !== employeeId)
    });
  };

  const updateRole = (employeeId: string, role: string) => {
    setFormData({
      ...formData,
      members: formData.members.map((m: any) => 
        m.employeeId === employeeId ? { ...m, role } : m
      )
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Selection Area */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Tìm kiếm nhân sự</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Tìm theo tên..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {filteredEmployees.map((e: any) => (
              <div 
                key={e.id}
                onClick={() => addMember(e.id)}
                className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between hover:border-[#003366] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <img src={e.avatar} alt={e.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{e.name}</p>
                    <p className="text-[10px] text-gray-400">{e.department}</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#003366]" />
              </div>
            ))}
          </div>
        </div>

        {/* Selected List */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Nhân sự đã chọn ({formData.members.length})</h4>
          <div className="space-y-3">
            {formData.members.map((m: any) => {
              const employee = employees.find((e: any) => e.id === m.employeeId);
              return (
                <div key={m.employeeId} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={employee?.avatar} alt={employee?.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{employee?.name}</p>
                      <p className="text-[10px] text-gray-400">{employee?.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                      value={m.role}
                      onChange={e => updateRole(m.employeeId, e.target.value)}
                    >
                      <option value="PM">PM</option>
                      <option value="Developer">Developer</option>
                      <option value="Tester">Tester</option>
                      <option value="Other">Other</option>
                    </select>
                    <button 
                      onClick={() => removeMember(m.employeeId)}
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {formData.members.length === 0 && (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Chưa có nhân sự nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3CostPlan({ formData, setFormData, formatCurrency }: any) {
  const addRow = () => {
    setFormData({
      ...formData,
      costPlan: [
        ...formData.costPlan,
        { id: Math.random().toString(36).substr(2, 9), category: '', type: 'Nhân sự', plannedAmount: 0, notes: '' }
      ]
    });
  };

  const removeRow = (id: string) => {
    const row = formData.costPlan.find((r: any) => r.id === id);
    if (row.category || row.plannedAmount > 0) {
      if (!window.confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;
    }
    setFormData({
      ...formData,
      costPlan: formData.costPlan.filter((r: any) => r.id !== id)
    });
  };

  const updateRow = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      costPlan: formData.costPlan.map((r: any) => 
        r.id === id ? { ...r, [field]: value } : r
      )
    });
  };

  const total = formData.costPlan.reduce((sum: number, r: any) => sum + r.plannedAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Kế hoạch chi phí dự án</h4>
        <button 
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm khoản chi
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="pb-4 pl-2">Hạng mục (*)</th>
              <th className="pb-4">Loại (*)</th>
              <th className="pb-4">Số tiền (VND) (*)</th>
              <th className="pb-4">Ghi chú</th>
              <th className="pb-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {formData.costPlan.map((row: any) => (
              <tr key={row.id} className="group">
                <td className="py-3 pl-2">
                  <input 
                    type="text"
                    className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold text-gray-900 placeholder:text-gray-300"
                    placeholder="Tên hạng mục..."
                    value={row.category}
                    onChange={e => updateRow(row.id, 'category', e.target.value)}
                  />
                </td>
                <td className="py-3">
                  <select
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                    value={row.type}
                    onChange={e => updateRow(row.id, 'type', e.target.value)}
                  >
                    <option value="Nhân sự">Nhân sự</option>
                    <option value="CSVC">CSVC</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Khác">Khác</option>
                  </select>
                </td>
                <td className="py-3">
                  <input 
                    type="number"
                    className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold text-gray-900 placeholder:text-gray-300"
                    placeholder="0"
                    value={row.plannedAmount}
                    onChange={e => updateRow(row.id, 'plannedAmount', Number(e.target.value))}
                  />
                </td>
                <td className="py-3">
                  <input 
                    type="text"
                    className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium text-gray-500 placeholder:text-gray-300"
                    placeholder="Ghi chú thêm..."
                    value={row.notes}
                    onChange={e => updateRow(row.id, 'notes', e.target.value)}
                  />
                </td>
                <td className="py-3 text-right">
                  <button 
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {formData.costPlan.length === 0 && (
          <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
            <DollarSign className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Chưa có khoản chi nào</p>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
        <div className={cn(
          "px-6 py-4 rounded-2xl border transition-all",
          total > formData.budget ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
        )}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng chi phí kế hoạch</p>
          <p className={cn(
            "text-xl font-black",
            total > formData.budget ? "text-red-600" : "text-[#003366]"
          )}>{formatCurrency(total)}</p>
        </div>
        <div className={cn(
          "px-6 py-4 rounded-2xl border transition-all",
          total > formData.budget ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
        )}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lợi nhuận dự kiến</p>
          <p className={cn(
            "text-xl font-black",
            total > formData.budget ? "text-red-600" : "text-emerald-600"
          )}>
            {total > formData.budget ? '-' : '+'}{formatCurrency(Math.abs(formData.budget - total))}
          </p>
        </div>
      </div>
      {total > formData.budget && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" />
          <p className="text-[10px] font-bold uppercase">Cảnh báo: Chi phí vượt quá ngân sách. Lợi nhuận âm!</p>
        </div>
      )}
    </div>
  );
}

function Step4Review({ formData, customers, employees, contracts, formatCurrency }: any) {
  const customer = customers.find((c: any) => c.id === formData.customerId);
  const contract = contracts.find((c: any) => c.id === formData.contractId);
  const totalCost = formData.costPlan.reduce((sum: number, r: any) => sum + r.plannedAmount, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Info & Personnel */}
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-[#003366]">
              <Briefcase className="w-4 h-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">Thông tin chung</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Dự án</p>
                <p className="text-sm font-bold text-gray-900">{formData.name}</p>
                <p className="text-[10px] text-gray-500">{formData.code}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Khách hàng</p>
                <p className="text-sm font-bold text-gray-900">{customer?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Thời gian</p>
                <p className="text-sm font-bold text-gray-900">{formData.startDate} - {formData.endDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Ngân sách</p>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(formData.budget)}</p>
              </div>
            </div>
            {contract && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Hợp đồng liên kết</p>
                <p className="text-sm font-bold text-blue-600">{contract.contractNumber} - {contract.title}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng chi phí dự kiến</p>
                <p className="text-sm font-bold text-[#003366]">{formatCurrency(totalCost)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Lợi nhuận dự kiến</p>
                <p className={cn(
                  "text-sm font-bold",
                  totalCost > formData.budget ? "text-red-600" : "text-emerald-600"
                )}>
                  {totalCost > formData.budget ? '-' : '+'}{formatCurrency(Math.abs(formData.budget - totalCost))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-[#003366]">
              <Users className="w-4 h-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">Nhân sự ({formData.members.length})</h4>
            </div>
            <div className="space-y-2">
              {formData.members.map((m: any) => {
                const emp = employees.find((e: any) => e.id === m.employeeId);
                return (
                  <div key={m.employeeId} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <img src={emp?.avatar} alt={emp?.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{emp?.name}</p>
                        <p className="text-[10px] text-gray-400">{emp?.department}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase">{m.role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cost Plan */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4 flex flex-col">
          <div className="flex items-center gap-2 text-[#003366]">
            <DollarSign className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase tracking-wider">Kế hoạch chi phí</h4>
          </div>
          <div className="flex-1 space-y-2">
            {formData.costPlan.map((row: any) => (
              <div key={row.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">{row.category}</p>
                  <p className="text-[10px] text-gray-400">{row.type}</p>
                </div>
                <p className="text-xs font-bold text-gray-700">{formatCurrency(row.plannedAmount)}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng chi phí dự kiến</p>
              <p className="text-lg font-black text-[#003366]">{formatCurrency(totalCost)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h5 className="text-sm font-bold text-blue-900">Xác nhận gửi phê duyệt</h5>
          <p className="text-xs text-blue-700 mt-1">
            Sau khi gửi phê duyệt, kế hoạch sẽ được chuyển đến CEO. Bạn sẽ không thể chỉnh sửa cho đến khi có kết quả phê duyệt hoặc bị từ chối.
          </p>
        </div>
      </div>
    </div>
  );
}
