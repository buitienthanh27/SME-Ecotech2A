import React, { useState } from 'react';
import { Plus, Trash2, FileText, Calendar, Users, DollarSign, X } from 'lucide-react';
import { Contract } from '../../types';
import { Modal, Btn } from '../ui';

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (contract: Contract) => void;
}

export function ContractCreateModal({ isOpen, onClose, onCreate }: ContractCreateModalProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [value, setValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState<string[]>(['']);

  const handleAddTerm = () => setTerms([...terms, '']);
  const handleRemoveTerm = (index: number) => setTerms(terms.filter((_, i) => i !== index));
  const handleTermChange = (index: number, value: string) => {
    const newTerms = [...terms];
    newTerms[index] = value;
    setTerms(newTerms);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newContract: Contract = {
      id: `cnt-${Date.now()}`,
      contractNumber: `HD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      title,
      clientName,
      value,
      startDate,
      endDate,
      status: 'Draft',
      description,
      terms: terms.filter(t => t.trim() !== ''),
      createdAt: new Date().toISOString()
    };
    onCreate(newContract);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg" 
      title="Tạo hồ sơ hợp đồng mới"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Hủy</Btn>
          <Btn type="submit" form="contract-form">Lưu bản nháp</Btn>
        </>
      }
    >
      <form id="contract-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Tên hợp đồng</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <input 
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Hợp đồng Thiết kế Nội thất..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Đơn vị khách hàng</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
              <input 
                required
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="VD: Tập đoàn ECO-GREEN Ltd."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Tổng giá trị (VNĐ)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#148922]" />
              <input 
                required
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-black focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Thời hạn thực hiện</label>
            <div className="flex items-center gap-2">
              <input 
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none"
              />
              <span className="text-[#A0AEC0]">→</span>
              <input 
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] font-bold focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5 ml-1">Phạm vi công việc</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
            placeholder="Mô tả tóm tắt các hạng mục..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[11px] font-bold text-[#718096] uppercase ml-1">Điều khoản pháp lý</label>
            <button 
              type="button"
              onClick={handleAddTerm}
              className="text-[11px] font-bold text-[#148922] flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm dòng mới
            </button>
          </div>
          <div className="space-y-2">
            {terms.map((term, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  type="text"
                  value={term}
                  onChange={(e) => handleTermChange(index, e.target.value)}
                  placeholder={`Diễn giải điều khoản #${index + 1}...`}
                  className="flex-1 px-4 py-2 bg-white border border-[#E2E8F0] rounded-[10px] text-[13px] font-medium focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] outline-none transition-all"
                />
                {terms.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    className="p-2 text-[#CBD5E1] hover:text-[#EF4444] hover:bg-red-50 rounded-[10px] transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
