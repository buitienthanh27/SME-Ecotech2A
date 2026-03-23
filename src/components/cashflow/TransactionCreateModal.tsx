import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, Briefcase, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (transaction: any) => void;
}

export const TransactionCreateModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    type: 'Chi phí' as 'Thu nhập' | 'Chi phí',
    category: '',
    amount: 0,
    project: 'Chung',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const categories = {
    'Thu nhập': ['Thanh toán dự án', 'Tư vấn', 'Tạm ứng', 'Khác'],
    'Chi phí': ['Vật tư', 'Lương', 'Thuê văn phòng', 'Tiện ích', 'Tiếp khách', 'Khác'],
  };

  const projects = ['Chung', 'Dự án Alpha', 'Dự án Beta', 'Dự án Gamma', 'Dự án Delta', 'Dự án Epsilon'];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      status: 'Đang chờ',
      date: formData.date.split('-').reverse().join('/'), // Convert to DD/MM/YYYY
    };
    onCreate(transaction);
    onClose();
  };

  return (
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
        className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ghi lại giao dịch</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Quản lý dòng tiền ECOTECH</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Type Selector */}
          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Thu nhập', category: categories['Thu nhập'][0] })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                formData.type === 'Thu nhập' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Thu nhập
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Chi phí', category: categories['Chi phí'][0] })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                formData.type === 'Chi phí' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Chi phí
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Danh mục</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Chọn danh mục</option>
                  {categories[formData.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Số tiền ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Dự án</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all appearance-none"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                >
                  {projects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Ngày giao dịch</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Ghi chú / Mô tả</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
              <textarea
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all min-h-[100px]"
                placeholder="Nhập chi tiết giao dịch..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
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
              Lưu giao dịch
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
