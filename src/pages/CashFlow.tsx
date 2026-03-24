import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Download,
  FileText,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  List
} from 'lucide-react';
import { TransactionCreateModal } from '../components/cashflow/TransactionCreateModal';
import { PageHeader, FilterBar, KPICard, DataTable, StatusBadge, Btn, showToast, EmptyState } from '../components/ui';
import { useStore } from '../store/useStore';

const INITIAL_CASHFLOW = [
  { id: '1', date: '15/03/2026', type: 'Thu nhập', category: 'Thanh toán dự án', amount: 45000000, project: 'Dự án Alpha', status: 'Đã duyệt' },
  { id: '2', date: '14/03/2026', type: 'Chi phí', category: 'Vật tư', amount: 12500000, project: 'Dự án Gamma', status: 'Đã duyệt' },
  { id: '3', date: '12/03/2026', type: 'Thu nhập', category: 'Tư vấn', amount: 8000000, project: 'Dự án Beta', status: 'Đã duyệt' },
  { id: '4', date: '10/03/2026', type: 'Chi phí', category: 'Lương', amount: 45810000, project: 'Chung', status: 'Đã duyệt' },
  { id: '5', date: '08/03/2026', type: 'Chi phí', category: 'Thuê văn phòng', amount: 5000000, project: 'Chung', status: 'Đang chờ' },
  { id: '6', date: '05/03/2026', type: 'Thu nhập', category: 'Tạm ứng', amount: 25000000, project: 'Dự án Epsilon', status: 'Đã duyệt' },
];

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export function CashFlow() {
  const { projects, updateProject } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | 'projects'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cashFlowList, setCashFlowList] = useState(INITIAL_CASHFLOW);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [prefilledProject, setPrefilledProject] = useState<{id: string, name: string} | undefined>();
  const [typeFilter, setTypeFilter] = useState('Tất cả loại');

  const filteredEntries = useMemo(() => {
    return cashFlowList.filter(item => {
      const matchesSearch = item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.project.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'Tất cả loại' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [cashFlowList, searchTerm, typeFilter]);

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
    
    // Automatically update the project's actual income/expense if a projectId is provided
    if (newTransaction.projectId) {
      const project = projects.find(p => p.id === newTransaction.projectId);
      if (project) {
        const updatePayload: any = {};
        if (newTransaction.type === 'Thu nhập') {
          updatePayload.actualIncome = (project.actualIncome || 0) + newTransaction.amount;
        } else {
          updatePayload.actualExpense = (project.actualExpense || 0) + newTransaction.amount;
        }
        updateProject(project.id, updatePayload);
      }
    }
    
    showToast.success('Đã ghi lại giao dịch mới');
  };

  const openTransactionModal = (project?: {id: string, name: string}) => {
    setPrefilledProject(project);
    setIsCreateModalOpen(true);
  };

  const columns = [
    {
      key: 'date',
      header: 'Ngày',
      width: '120px',
      render: (row: any) => <span className="text-[#718096]">{row.date}</span>
    },
    {
      key: 'type',
      header: 'Loại',
      width: '120px',
      render: (row: any) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
          row.type === 'Thu nhập' ? 'bg-[#ECFDF5] text-[#148922]' : 'bg-red-50 text-red-700'
        }`}>
          {row.type === 'Thu nhập' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {row.type}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Danh mục / Dự án',
      render: (row: any) => (
        <div>
          <p className="font-bold text-[#1A202C]">{row.category}</p>
          <p className="text-[12px] text-[#718096]">{row.project}</p>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (row: any) => (
        <span className={`font-bold ${row.type === 'Thu nhập' ? 'text-[#148922]' : 'text-red-600'}`}>
          {row.type === 'Thu nhập' ? '+' : '-'}{fmt(row.amount)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: any) => <StatusBadge status={row.status === 'Đã duyệt' ? 'Approved' : 'Pending'} />
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (row: any) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"><FileText className="w-4 h-4" /></button>
          <button className="p-1.5 text-[#718096] hover:bg-[#F8FAFC] rounded-[6px] transition-colors"><MoreVertical className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dòng tiền & Giao dịch"
        description="Theo dõi toàn bộ luồng thu nhập và chi phí vận hành của doanh nghiệp."
        actions={
          <div className="flex items-center gap-3">
            <Btn variant="secondary" icon={Download}>Xuất báo cáo</Btn>
            <Btn icon={Plus} onClick={() => { setPrefilledProject(undefined); setIsCreateModalOpen(true); }}>Ghi lại giao dịch</Btn>
          </div>
        }
      />

      <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-2xl w-fit border border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'all'
              ? "bg-white text-[#148922] shadow-sm"
              : "text-[#718096] hover:text-[#1A202C]"
          }`}
        >
          <List className="w-4 h-4" />
          Tất cả giao dịch
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'projects'
              ? "bg-white text-[#148922] shadow-sm"
              : "text-[#718096] hover:text-[#1A202C]"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Theo dự án
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Tổng doanh thu (Tháng)" value={fmt(stats.income)} change="15.2%" isPositive icon={TrendingUp} iconBg="#ECFDF5" iconColor="#148922" />
        <KPICard title="Tổng chi phí (Tháng)" value={fmt(stats.expenses)} change="8.4%" isPositive={false} icon={TrendingDown} iconBg="#FEE2E2" iconColor="#EF4444" />
        <KPICard title="Dòng tiền thuần" value={fmt(stats.net)} change="24.1%" isPositive icon={DollarSign} iconBg="#f0fdf4" iconColor="#50b00a" />
      </div>

      {activeTab === 'all' ? (
        <>
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Tìm theo danh mục, dự án..."
            filters={[
              {
                key: 'type',
                label: 'Loại',
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { label: 'Tất cả', value: 'Tất cả loại' },
                  { label: 'Thu nhập', value: 'Thu nhập' },
                  { label: 'Chi phí', value: 'Chi phí' },
                ]
              }
            ]}
          />

          <DataTable
            columns={columns}
            data={filteredEntries}
            keyExtractor={(row) => row.id}
            emptyState={<EmptyState icon={DollarSign} title="Không có giao dịch" description="Chưa có bản ghi tài chính nào trong kỳ này." />}
          />
        </>
      ) : (
        <div className="space-y-4">
          {projects.map(project => {
            const expectedExpense = project.costPlan?.reduce((sum, item) => sum + item.plannedAmount, 0) || 0;
            const actualIn = project.actualIncome || 0;
            const actualOut = project.actualExpense || 0;
            const expectedIn = project.budget || 0;
            const profit = actualIn - actualOut;

            return (
              <div key={project.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-[#148922]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{project.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{project.code}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-[#148922]" /> Thu (Thực / Dự kiến)
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-black text-[#148922]">{fmt(actualIn)}</span>
                      <span className="text-xs font-bold text-gray-400 mb-1">/ {fmt(expectedIn)}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-red-500" /> Chi (Thực / Dự kiến)
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-black text-red-600">{fmt(actualOut)}</span>
                      <span className="text-xs font-bold text-gray-400 mb-1">/ {fmt(expectedExpense)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-end gap-3 border-l border-gray-100 pl-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lãi/Lỗ Thực tế</p>
                    <p className={`text-xl font-black ${profit >= 0 ? 'text-[#148922]' : 'text-red-600'}`}>
                      {profit >= 0 ? '+' : ''}{fmt(profit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => openTransactionModal({ id: project.id, name: project.name })}
                      className="px-4 py-2 bg-[#ECFDF5] text-[#148922] text-xs font-bold rounded-xl hover:bg-[#D1FAE5] transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Ghi nhận Thu/Chi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TransactionCreateModal 
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setPrefilledProject(undefined); }}
        onCreate={handleCreateTransaction}
        prefilledProject={prefilledProject}
      />
    </div>
  );
}
