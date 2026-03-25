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
import { canCreateCashFlowEntry } from '../lib/permissions';

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
  const { projects, updateProject, cashFlowEntries, addCashFlowEntry, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | 'projects'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [prefilledProject, setPrefilledProject] = useState<{ id: string; name: string } | undefined>();
  const [typeFilter, setTypeFilter] = useState('Tất cả loại');

  const cashFlowList = useMemo(() => {
    const rows = cashFlowEntries.map((e) => ({
      id: e.id,
      date: e.date,
      type: e.type,
      category: e.category,
      amount: e.amount,
      project:
        (e as { project?: string }).project ??
        projects.find((p) => p.id === e.projectId)?.name ??
        'Chung',
      projectId: e.projectId,
      status: 'Đã duyệt' as const,
      source: e.source,
    }));
    return rows.length ? rows : INITIAL_CASHFLOW;
  }, [cashFlowEntries, projects]);

  const filteredEntries = useMemo(() => {
    return cashFlowList.filter((item) => {
      const matchesSearch =
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.project).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'Tất cả loại' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [cashFlowList, searchTerm, typeFilter]);

  const stats = useMemo(() => {
    const income = cashFlowList
      .filter((item) => item.type === 'Thu nhập' && item.status === 'Đã duyệt')
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = cashFlowList
      .filter((item) => item.type === 'Chi phí' && item.status === 'Đã duyệt')
      .reduce((sum, item) => sum + item.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [cashFlowList]);

  const handleCreateTransaction = (newTransaction: any) => {
    if (!canCreateCashFlowEntry(currentUser.role)) {
      showToast.error('Chỉ Kế toán, CEO hoặc quản trị được ghi thu/chi.');
      return;
    }
    addCashFlowEntry({
      id: newTransaction.id,
      date: newTransaction.date,
      type: newTransaction.type,
      category: newTransaction.category,
      amount: newTransaction.amount,
      project: newTransaction.project,
      projectId: newTransaction.projectId,
      source: 'Manual',
      description: newTransaction.description,
      createdBy: currentUser.id,
    });

    if (newTransaction.projectId) {
      const project = projects.find((p) => p.id === newTransaction.projectId);
      if (project) {
        const updatePayload: Record<string, number> = {};
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
      width: '12%',
      render: (row: any) => <span className="text-[#718096]">{row.date}</span>
    },
    {
      key: 'type',
      header: 'Loại',
      width: '14%',
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
      width: '38%',
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
      width: '22%',
      render: (row: any) => (
        <span className={`font-bold ${row.type === 'Thu nhập' ? 'text-[#148922]' : 'text-red-600'}`}>
          {row.type === 'Thu nhập' ? '+' : '-'}{fmt(row.amount)}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '14%',
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
          {projects.map((project) => {
            const expectedExpense = project.costPlan?.reduce((sum, item) => sum + item.plannedAmount, 0) || 0;
            const actualIn = project.actualIncome || 0;
            const actualOut = project.actualExpense || 0;
            const expectedIn = project.budget || 0;
            const profit = actualIn - actualOut;

            return (
              <div key={project.id} className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-stretch">
                  <div className="xl:col-span-3 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-[#148922]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-gray-900 leading-tight break-words">{project.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{project.code}</p>
                    </div>
                  </div>
                  </div>

                  <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-[#148922]" /> Thu (Thực / Dự kiến)
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className="text-base sm:text-lg font-black text-[#148922] break-words">{fmt(actualIn)}</span>
                      <span className="text-xs font-bold text-gray-400">Dự kiến: {fmt(expectedIn)}</span>
                    </div>
                  </div>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-red-500" /> Chi (Thực / Dự kiến)
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className="text-base sm:text-lg font-black text-red-600 break-words">{fmt(actualOut)}</span>
                      <span className="text-xs font-bold text-gray-400">Dự kiến: {fmt(expectedExpense)}</span>
                    </div>
                  </div>
                </div>

                  <div className="xl:col-span-3 flex flex-col justify-between gap-3 xl:border-l border-gray-100 xl:pl-6 pt-4 xl:pt-0 border-t xl:border-t-0">
                    <div className="text-left xl:text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lãi/Lỗ Thực tế</p>
                    <p className={`text-lg sm:text-xl font-black break-words ${profit >= 0 ? 'text-[#148922]' : 'text-red-600'}`}>
                      {profit >= 0 ? '+' : ''}{fmt(profit)}
                    </p>
                  </div>
                    <div className="flex items-center xl:justify-end gap-2 mt-1">
                    <button 
                      onClick={() => openTransactionModal({ id: project.id, name: project.name })}
                      className="w-full xl:w-auto px-4 py-2 bg-[#ECFDF5] text-[#148922] text-xs font-bold rounded-xl hover:bg-[#D1FAE5] transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Ghi nhận Thu/Chi
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );  
          })}
        </div>
      )}

      <TransactionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPrefilledProject(undefined);
        }}
        onCreate={handleCreateTransaction}
        prefilledProject={prefilledProject}
        projectsFromStore={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
