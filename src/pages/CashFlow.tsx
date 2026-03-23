import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText
} from 'lucide-react';
import { TransactionCreateModal } from '../components/cashflow/TransactionCreateModal';

const INITIAL_CASHFLOW = [
  { id: '1', date: '15/03/2026', type: 'Thu nhập', category: 'Thanh toán dự án', amount: 45000, project: 'Dự án Alpha', status: 'Đã duyệt' },
  { id: '2', date: '14/03/2026', type: 'Chi phí', category: 'Vật tư', amount: 12500, project: 'Dự án Gamma', status: 'Đã duyệt' },
  { id: '3', date: '12/03/2026', type: 'Thu nhập', category: 'Tư vấn', amount: 8000, project: 'Dự án Beta', status: 'Đã duyệt' },
  { id: '4', date: '10/03/2026', type: 'Chi phí', category: 'Lương', amount: 45810, project: 'Chung', status: 'Đã duyệt' },
  { id: '5', date: '08/03/2026', type: 'Chi phí', category: 'Thuê văn phòng', amount: 5000, project: 'Chung', status: 'Đang chờ' },
  { id: '6', date: '05/03/2026', type: 'Thu nhập', category: 'Tạm ứng', amount: 25000, project: 'Dự án Epsilon', status: 'Đã duyệt' },
];

export function CashFlow() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cashFlowList, setCashFlowList] = useState(INITIAL_CASHFLOW);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredEntries = useMemo(() => {
    return cashFlowList.filter(item => 
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cashFlowList, searchTerm]);

  const stats = useMemo(() => {
    const income = cashFlowList
      .filter(item => item.type === 'Thu nhập' && item.status === 'Đã duyệt')
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = cashFlowList
      .filter(item => item.type === 'Chi phí' && item.status === 'Đã duyệt')
      .reduce((sum, item) => sum + item.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [cashFlowList]);

  const handleCreateTransaction = (newTransaction: any) => {
    setCashFlowList(prev => [newTransaction, ...prev]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Theo dõi dòng tiền</h2>
          <p className="text-gray-500">Theo dõi tất cả doanh thu và chi phí trong toàn tổ chức.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
          >
            <Plus className="w-5 h-5" />
            Ghi lại giao dịch
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng doanh thu (Tháng này)</p>
              <p className="text-xl font-bold text-gray-900">${stats.income.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            +15.2% so với tháng trước
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng chi phí (Tháng này)</p>
              <p className="text-xl font-bold text-gray-900">${stats.expenses.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-red-600 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            +8.4% so với tháng trước
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#003366] text-white rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dòng tiền thuần</p>
              <p className="text-xl font-bold text-gray-900">${stats.net.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            +24.1% so với tháng trước
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-gray-900">Giao dịch gần đây</h3>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-700">Tháng 3 2026</span>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo danh mục hoặc dự án..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Ngày</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Dự án</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'Thu nhập' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.project}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${
                    item.type === 'Thu nhập' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {item.type === 'Thu nhập' ? '+' : '-'}${item.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Đã duyệt' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="Xem hóa đơn">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionCreateModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTransaction}
      />
    </div>
  );
}
