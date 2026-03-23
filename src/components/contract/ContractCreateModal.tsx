import React, { useState } from 'react';
import { X, Plus, Trash2, Save, FileText, Calendar, Users, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { Contract, ContractStatus } from '../../types';

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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#003366] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Tạo Hợp đồng mới</h3>
              <p className="text-xs text-white/60">Xác định kinh phí và các điều khoản ràng buộc</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên hợp đồng</label>
                <input 
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Hợp đồng Thiết kế Nội thất..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên khách hàng</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    required
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="VD: Công ty TNHH ABC"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giá trị hợp đồng (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    required
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Thời gian thực hiện</label>
                <div className="flex items-center gap-2">
                  <input 
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all font-bold text-sm"
                  />
                  <span className="text-gray-400">→</span>
                  <input 
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mô tả phạm vi công việc</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all font-medium text-sm"
                placeholder="Mô tả chi tiết các hạng mục công việc chính..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Các điều khoản ràng buộc</label>
                <button 
                  type="button"
                  onClick={handleAddTerm}
                  className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Thêm điều khoản
                </button>
              </div>
              <div className="space-y-3">
                {terms.map((term, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      type="text"
                      value={term}
                      onChange={(e) => handleTermChange(index, e.target.value)}
                      placeholder={`Điều khoản ${index + 1}...`}
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 transition-all text-sm"
                    />
                    {terms.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveTerm(index)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-[#003366] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
          >
            <Save className="w-5 h-5" />
            Lưu bản nháp
          </button>
        </div>
      </motion.div>
    </div>
  );
}
