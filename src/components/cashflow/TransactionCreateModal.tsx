import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Calendar, Tag, Briefcase, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Modal, Btn } from '../ui';

type FlowType = 'Thu nhập' | 'Chi phí';

const DEFAULT_INCOME_CATS = ['Thanh toán dự án', 'Tư vấn', 'Tạm ứng', 'Khác'];
const DEFAULT_EXPENSE_CATS = [
  'Vật tư',
  'Lương nhân sự',
  'Thuê văn phòng',
  'Tiện ích',
  'Tiếp khách',
  'Khác',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (transaction: Record<string, unknown>) => void;
  prefilledProject?: { id: string; name: string };
  /** Danh sách dự án từ store — thay cho danh sách cứng */
  projectsFromStore?: { id: string; name: string }[];
}

export const TransactionCreateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreate,
  prefilledProject,
  projectsFromStore = [],
}) => {
  const [formData, setFormData] = useState({
    type: 'Chi phí' as FlowType,
    category: DEFAULT_EXPENSE_CATS[0],
    amount: 0,
    project: prefilledProject ? prefilledProject.name : 'Chung',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const projectOptions = useMemo(() => {
    const names = ['Chung', ...projectsFromStore.map((p) => p.name)];
    const uniq = [...new Set(names)];
    if (prefilledProject && !uniq.includes(prefilledProject.name)) {
      uniq.push(prefilledProject.name);
    }
    return uniq;
  }, [projectsFromStore, prefilledProject]);

  const categories = useMemo(
    () =>
      ({
        'Thu nhập': DEFAULT_INCOME_CATS,
        'Chi phí': DEFAULT_EXPENSE_CATS,
      }) as Record<FlowType, string[]>,
    []
  );

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        project: prefilledProject ? prefilledProject.name : 'Chung',
      }));
    }
  }, [isOpen, prefilledProject]);

  const resolveProjectId = (projectName: string): string | undefined => {
    if (prefilledProject && projectName === prefilledProject.name) return prefilledProject.id;
    const hit = projectsFromStore.find((p) => p.name === projectName);
    return hit?.id;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      projectId: resolveProjectId(formData.project),
      date: formData.date.split('-').reverse().join('/'),
    };
    onCreate(transaction);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi lại giao dịch tài chính"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Hủy
          </Btn>
          <Btn type="submit" form="transaction-form">
            Lưu giao dịch
          </Btn>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex p-1 bg-[#F1F5F9] rounded-[10px]">
          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                type: 'Thu nhập',
                category: categories['Thu nhập'][0],
              })
            }
            className={`flex-1 py-2 rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
              formData.type === 'Thu nhập' ? 'bg-white text-[#148922] shadow-sm' : 'text-[#718096] hover:text-[#1A202C]'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Thu nhập
          </button>
          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                type: 'Chi phí',
                category: categories['Chi phí'][0],
              })
            }
            className={`flex-1 py-2 rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
              formData.type === 'Chi phí' ? 'bg-white text-[#EF4444] shadow-sm' : 'text-[#718096] hover:text-[#1A202C]'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Chi phí
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Danh mục</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <select
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all appearance-none cursor-pointer"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories[formData.type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Số tiền (VNĐ)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#148922]" />
              <input
                type="number"
                required
                min="0"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-black focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Liên kết dự án</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all appearance-none cursor-pointer"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                disabled={!!prefilledProject}
              >
                {projectOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Ngày thực hiện</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <input
                type="date"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Ghi chú & chứng từ</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-[#A0AEC0]" />
            <textarea
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all min-h-[100px]"
              placeholder="Nhập chi tiết diễn giải giao dịch..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
