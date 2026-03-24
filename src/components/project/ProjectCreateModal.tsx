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
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { Project, ProjectMember, ProjectCostItem, ProjectStatus } from '../../types';
import { Modal, Btn, Badge, StatusBadge } from '../ui';
import { INITIAL_DEPARTMENTS, INITIAL_PERSONNEL } from '../../pages/Personnel';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectMemberAssignment {
  employeeId: string;
  role: string;
  allocation: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (project: any) => void;
  initialData?: any;
}

export const ProjectCreateModal: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { customers, employees, contracts, addProject, updateProject, currentUser } = useStore();
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
    members: (initialData?.members || []) as ProjectMemberAssignment[],
    costPlan: (initialData?.costPlan || []) as ProjectCostItem[],
  });

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
    if (formData.budget <= 0) newErrors.budget = 'Doanh thu phải lớn hơn 0';

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
    // if (step === 2 && !validateStep2()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSave = () => {
    if (!validateStep3()) return;

    const totalCost = formData.costPlan.reduce((sum, item) => sum + item.plannedAmount, 0);
    const profit = (formData.budget - totalCost) / 1000;

    const projectId = initialData?.id || Math.random().toString(36).substr(2, 9);
    const projectData: Project = {
      id: projectId,
      ...formData,
      status: 'Đang thực hiện',
      pmId: initialData?.pmId || currentUser.id,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      revenue: formData.budget / 1000,
      expenses: totalCost / 1000,
      profit: profit,
      margin: formData.budget > 0 ? Math.round((profit * 1000 / formData.budget) * 100) : 0,
      timeline: `${formData.startDate} - ${formData.endDate}`,
    };

    if (initialData?.id) {
      updateProject(initialData.id, projectData);
    } else {
      addProject(projectData);
    }

    toast.success('Dự án đã được khởi tạo thành công');
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={initialData ? 'Hiệu chỉnh dự án' : 'Khởi tạo dự án mới'}
      footer={
        <div className="flex justify-between w-full">
          <Btn variant="secondary" onClick={step === 1 ? onClose : prevStep} icon={ChevronLeft}>
            {step === 1 ? 'Hủy' : 'Quay lại'}
          </Btn>
          <div className="flex gap-3">
            {step < 3 ? (
              <Btn onClick={nextStep} className="flex-row-reverse">
                Tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
              </Btn>
            ) : (
              <Btn onClick={handleSave} icon={Check}>Ghi nhận & Khởi tạo</Btn>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 px-1">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                step >= i ? "bg-[#148922]" : "bg-[#F1F5F9]"
              )}
            />
          ))}
          <span className="text-[10px] font-bold text-[#A0AEC0] uppercase ml-2 whitespace-nowrap">Giao đoạn {step} / 3</span>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
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
        </div>
      </div>
    </Modal>
  );
};

// --- Step Components ---

function Step1Info({ formData, setFormData, errors, customers, contracts }: any) {
  const filteredContracts = contracts.filter((c: any) => {
    const customer = customers.find((cust: any) => cust.id === formData.customerId);
    return customer && c.clientName === customer.name;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Tên dự án (*)</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <input
              type="text"
              className={cn(
                "w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all",
                errors.name ? "border-red-400" : "border-[#E2E8F0]"
              )}
              placeholder="Nhập tên dự án..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Mã định danh</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <input
              type="text"
              className={cn(
                "w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all",
                errors.code ? "border-red-400" : "border-[#E2E8F0]"
              )}
              placeholder="AUTO-GEN"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Khách hàng (*)</label>
          <select
            className={cn(
              "w-full px-4 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all cursor-pointer appearance-none",
              errors.customerId ? "border-red-400" : "border-[#E2E8F0]"
            )}
            value={formData.customerId}
            onChange={e => setFormData({ ...formData, customerId: e.target.value, contractId: '' })}
          >
            <option value="">Chọn khách hàng...</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Hợp đồng pháp lý</label>
          <select
            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all cursor-pointer appearance-none disabled:opacity-50"
            value={formData.contractId}
            onChange={e => setFormData({ ...formData, contractId: e.target.value })}
            disabled={!formData.customerId}
          >
            <option value="">Chọn hợp đồng đã ký...</option>
            {filteredContracts.map((c: any) => (
              <option key={c.id} value={c.id}>{c.contractNumber} - {c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Ngày khởi công (*)</label>
          <input
            type="date"
            className={cn(
              "w-full px-4 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all",
              errors.startDate ? "border-red-400" : "border-[#E2E8F0]"
            )}
            value={formData.startDate}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Ngày bàn giao (*)</label>
          <input
            type="date"
            className={cn(
              "w-full px-4 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all",
              errors.endDate ? "border-red-400" : "border-[#E2E8F0]"
            )}
            value={formData.endDate}
            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Doanh thu dự kiến (VNĐ) (*)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#148922]" />
          <input
            type="number"
            className={cn(
              "w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border rounded-[10px] text-[18px] font-black focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all",
              errors.budget ? "border-red-400" : "border-[#E2E8F0]"
            )}
            placeholder="0"
            value={formData.budget}
            onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Yêu cầu / Ghi chú</label>
        <textarea
          className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all min-h-[80px]"
          placeholder="Mô tả tóm tắt phạm vi và đặc thù dự án..."
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
    </div>
  );
}

function Step2Personnel({ formData, setFormData, employees }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = INITIAL_PERSONNEL.filter((e: any) => {
    // Hiển thị tất cả nhân sự có Id là headId trong INITIAL_DEPARTMENTS
    const isHead = INITIAL_DEPARTMENTS.some(d => d.headId === e.id);
    if (!isHead) return false;

    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notSelected = !formData.members.some((m: any) => m.employeeId === e.id);
    return matchesSearch && notSelected;
  });

  const addMember = (employeeId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      members: [...prev.members, { employeeId, role: 'Lead', allocation: 100 }]
    }));
  };

  const removeMember = (employeeId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      members: prev.members.filter((m: any) => m.employeeId !== employeeId)
    }));
  };

  const updateMember = (employeeId: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      members: prev.members.map((m: any) =>
        m.employeeId === employeeId ? { ...m, [field]: value } : m
      )
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Left: Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
          <input
            type="text"
            placeholder="Tìm trưởng phòng..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] font-bold outline-none focus:border-[#148922]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
          {filteredEmployees.map((e: any) => (
            <div
              key={e.id}
              onClick={() => addMember(e.id)}
              className="p-3 bg-white border border-[#E2E8F0] rounded-[12px] flex items-center justify-between hover:border-[#148922] cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#148922] font-black text-[10px]">
                  {e.avatar?.length < 3 ? e.avatar : e.name[0]}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1A202C]">{e.name}</p>
                  <p className="text-[11px] text-[#718096] whitespace-pre-wrap">Trưởng {INITIAL_DEPARTMENTS.find(d => d.headId === e.id)?.name || ''}</p>
                </div>
              </div>
              <Plus className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#148922]" />
            </div>
          ))}
          {filteredEmployees.length === 0 && <p className="text-center py-10 text-[#A0AEC0] text-[12px] italic">Không tìm thấy yêu cầu...</p>}
        </div>
      </div>

      {/* Right: Selected */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-bold text-[#718096] uppercase tracking-wider pl-1">Trưởng phòng / Quản lý ({formData.members.length})</h4>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {formData.members.map((m: any) => {
            const emp = INITIAL_PERSONNEL.find((e: any) => e.id === m.employeeId);
            return (
              <div key={m.employeeId} className="p-3 bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#148922] flex items-center justify-center text-white font-black text-[10px]">
                      {emp?.avatar?.length < 3 ? emp?.avatar : emp?.name[0]}
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[13px] font-bold text-[#1A202C]">{emp?.name}</span>
                      <span className="text-[11px] text-[#718096]">Trưởng {INITIAL_DEPARTMENTS.find(d => d.headId === emp?.id)?.name || ''}</span>
                    </div>
                  </div>
                  <button onClick={() => removeMember(m.employeeId)} className="text-[#A0AEC0] hover:text-[#EF4444] p-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
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
  const isOverBudget = total > formData.budget;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">Lập dự toán chi phí</h4>
        <Btn size="sm" variant="outline" icon={Plus} onClick={addRow}>Thêm dòng chi phí</Btn>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-white border-b border-[#E2E8F0]">
            <tr className="text-[10px] font-bold text-[#718096] uppercase tracking-widest">
              <th className="px-4 py-3">Hạng mục</th>
              <th className="px-4 py-3">Phân loại</th>
              <th className="px-4 py-3">Kế hoạch (VNĐ)</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {formData.costPlan.map((row: any) => (
              <tr key={row.id} className="hover:bg-white transition-colors">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    className="w-full bg-transparent border-none focus:ring-0 font-bold text-[#1A202C] p-0 placeholder:text-[#CBD5E1]"
                    placeholder="VD: Thuê cloud..."
                    value={row.category}
                    onChange={e => updateRow(row.id, 'category', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    className="bg-transparent border-none focus:ring-0 text-[#718096] font-bold p-0 cursor-pointer"
                    value={row.type}
                    onChange={e => updateRow(row.id, 'type', e.target.value)}
                  >
                    <option value="Nhân sự">Nhân sự</option>
                    <option value="CSVC">CSVC</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Cố định">Cố định</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    className="w-full bg-transparent border-none focus:ring-0 font-black text-[#1A202C] p-0"
                    value={row.plannedAmount}
                    onChange={e => updateRow(row.id, 'plannedAmount', Number(e.target.value))}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => removeRow(row.id)} className="text-[#CBD5E1] hover:text-[#EF4444] transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {formData.costPlan.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-[#A0AEC0] italic text-[12px]">Bấm nút thêm dòng để bắt đầu hoạch định chi phí...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={cn("p-5 rounded-[16px] border", isOverBudget ? "bg-red-50 border-red-100" : "bg-white border-[#E2E8F0]")}>
          <p className="text-[11px] font-bold text-[#718096] uppercase mb-1">Tổng chi phí kế hoạch</p>
          <p className={cn("text-[20px] font-black", isOverBudget ? "text-[#EF4444]" : "text-[#1A202C]")}>{formatCurrency(total)}</p>
        </div>
        <div className={cn("p-5 rounded-[16px] border", isOverBudget ? "bg-red-50 border-red-100" : "bg-[#ECFDF5] border-[#D1FAE5]")}>
          <p className="text-[11px] font-bold text-[#718096] uppercase mb-1">Biên lợi nhuận gộp</p>
          <p className={cn("text-[20px] font-black", isOverBudget ? "text-[#EF4444]" : "text-[#148922]")}>
            {formatCurrency(formData.budget - total)}
          </p>
        </div>
      </div>

      {isOverBudget && (
        <div className="flex items-center gap-2 bg-[#FEF2F2] text-[#EF4444] p-3 rounded-[10px] border border-[#FEE2E2]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-[12px] font-bold uppercase tracking-tight">Cảnh báo: Tổng chi phí dự kiến vượt quá doanh thu. Vui lòng cân đối lại!</p>
        </div>
      )}
    </div>
  );
}
