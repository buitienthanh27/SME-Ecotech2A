import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Info, 
  Lock,
  MoreVertical
} from 'lucide-react';
import { PayrollPeriod, EmployeeCost, PerformanceBonus } from '../types';
import { PageHeader, FilterBar, KPICard, DataTable, StatusBadge, Btn, showToast, ConfirmModal, EmptyState } from '../components/ui';
import { useStore } from '../store/useStore';
import { canConfirmPayroll } from '../lib/permissions';

const MOCK_BONUSES: PerformanceBonus[] = [
  {
    id: 'b1',
    taskAssigneeId: 't1',
    taskId: 't1',
    employeeId: 'e1',
    employeeCostId: null,
    bonusAmount: 500000,
    bonusType: 'Xuất sắc',
    reason: 'Hoàn thành module Kanban vượt tiến độ',
    createdByPMId: 'pm-1',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    taskAssigneeId: 't3',
    taskId: 't3',
    employeeId: 'e3',
    employeeCostId: null,
    bonusAmount: 300000,
    bonusType: 'Chất lượng cao',
    reason: 'Unit test đạt coverage 100%',
    createdByPMId: 'pm-1',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  }
];

const MOCK_EMPLOYEE_COSTS: EmployeeCost[] = [
  { id: 'ec1', employeeId: 'e1', employeeName: 'Nguyễn Văn A', role: 'Frontend Developer', basicSalary: 15000000, allowances: 2000000, bonus: 0, ot: 500000, tax: 1500000, grossSalary: 17500000, netPay: 16000000 },
  { id: 'ec2', employeeId: 'e2', employeeName: 'Trần Thị B', role: 'Backend Developer', basicSalary: 16000000, allowances: 2000000, bonus: 0, ot: 0, tax: 1600000, grossSalary: 18000000, netPay: 16400000 },
  { id: 'ec3', employeeId: 'e3', employeeName: 'Lê Văn C', role: 'UI/UX Designer', basicSalary: 14000000, allowances: 1500000, bonus: 0, ot: 300000, tax: 1400000, grossSalary: 15800000, netPay: 14400000 },
];

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export function Payroll() {
  const payrollPeriods = useStore((s) => s.payrollPeriods);
  const employees = useStore((s) => s.employees);
  const setPayrollPeriods = useStore((s) => s.setPayrollPeriods);
  const confirmPayrollPeriod = useStore((s) => s.confirmPayrollPeriod);
  const currentUser = useStore((s) => s.currentUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [bonuses, setBonuses] = useState<PerformanceBonus[]>(MOCK_BONUSES);
  const [selectedPeriodId, setSelectedPeriodId] = useState('p1');
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  const periods = payrollPeriods.length
    ? payrollPeriods
    : [
        {
          id: 'p1',
          month: '2026-03',
          status: 'Open' as const,
          companyId: 'c1',
          employeeCosts: MOCK_EMPLOYEE_COSTS,
        },
      ];

  const currentPeriod = useMemo(
    () => periods.find((p) => p.id === selectedPeriodId),
    [periods, selectedPeriodId]
  );

  const periodLocked = currentPeriod?.status === 'Locked';

  const handleProcessPayroll = () => {
    if (!currentPeriod || periodLocked) return;

    const currentMonth = currentPeriod.month;
    const pendingBonuses = bonuses.filter(b => 
      b.status === 'Pending' && 
      b.createdAt.startsWith(currentMonth)
    );

    if (pendingBonuses.length === 0) {
      showToast.info('Không có thưởng mới để xử lý trong tháng này.');
      return;
    }

    const updatedEmployeeCosts = currentPeriod.employeeCosts.map(ec => {
      const employeeBonuses = pendingBonuses.filter(b => b.employeeId === ec.employeeId);
      if (employeeBonuses.length > 0) {
        const totalBonus = employeeBonuses.reduce((sum, b) => sum + b.bonusAmount, 0);
        const newBonus = ec.bonus + totalBonus;
        const newGross = ec.basicSalary + ec.allowances + newBonus + ec.ot;
        const newTax = Math.round(newGross * 0.1); 
        
        return {
          ...ec,
          bonus: newBonus,
          grossSalary: newGross,
          tax: newTax,
          netPay: newGross - newTax,
          projectBonuses: [...(ec.projectBonuses || []), ...employeeBonuses]
        };
      }
      return ec;
    });

    setBonuses(prev => prev.map(b => {
      const isLinked = pendingBonuses.some(pb => pb.id === b.id);
      if (isLinked) {
        const ec = updatedEmployeeCosts.find(e => e.employeeId === b.employeeId);
        return { ...b, status: 'Linked', employeeCostId: ec?.id || null };
      }
      return b;
    }));

    setPayrollPeriods((prev) =>
      prev.map((p) => (p.id === selectedPeriodId ? { ...p, employeeCosts: updatedEmployeeCosts } : p))
    );
    showToast.success(`Đã xử lý ${pendingBonuses.length} khoản thưởng hiệu suất.`);
  };

  const handleLockPeriod = () => {
    if (!currentPeriod) return;
    if (!canConfirmPayroll(currentUser.role)) {
      showToast.error('Chỉ Kế toán hoặc CEO mới chốt bảng lương.');
      setIsLockModalOpen(false);
      return;
    }
    confirmPayrollPeriod(selectedPeriodId);
    const linkedBonusIds = currentPeriod.employeeCosts.flatMap((ec) => ec.projectBonuses?.map((b) => b.id) || []);
    setBonuses((prev) => prev.map((b) => (linkedBonusIds.includes(b.id) ? { ...b, status: 'Locked' as const } : b)));
    showToast.success('Kỳ lương đã được chốt; đã ghi nhận dòng tiền lương (Auto).');
    setIsLockModalOpen(false);
  };

  /** Đồng bộ lương cơ bản / tên / chức danh từ danh bạ nhân viên (kỳ Open) */
  const costsSynced = useMemo(() => {
    if (!currentPeriod) return [];
    if (currentPeriod.status !== 'Open') return currentPeriod.employeeCosts;
    return currentPeriod.employeeCosts.map((ec) => {
      const emp = employees.find((e) => e.id === ec.employeeId);
      if (!emp?.baseSalary) return ec;
      const basicSalary = emp.baseSalary;
      const grossSalary = basicSalary + ec.allowances + ec.bonus + ec.ot;
      const tax = Math.round(grossSalary * 0.055);
      const netPay = grossSalary - tax;
      return {
        ...ec,
        employeeName: emp.name,
        role: String(emp.jobTitle || emp.role),
        basicSalary,
        grossSalary,
        tax,
        netPay,
      };
    });
  }, [currentPeriod, employees]);

  const filteredCosts = useMemo(() => {
    if (!currentPeriod) return [];
    return costsSynced.filter(
      (ec) =>
        ec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ec.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentPeriod, costsSynced, searchTerm]);

  const stats = useMemo(() => {
    if (!currentPeriod) return { gross: 0, tax: 0, net: 0 };
    const list = currentPeriod.status === 'Open' ? costsSynced : currentPeriod.employeeCosts;
    const gross = list.reduce((sum, ec) => sum + ec.grossSalary, 0);
    const tax = list.reduce((sum, ec) => sum + ec.tax, 0);
    const net = list.reduce((sum, ec) => sum + ec.netPay, 0);
    return { gross, tax, net };
  }, [currentPeriod, costsSynced]);

  const columns = [
    {
      key: 'employee',
      header: 'Nhân viên',
      render: (row: EmployeeCost) => (
        <div>
          <p className="font-bold text-[#1A202C]">{row.employeeName}</p>
          <p className="text-[12px] text-[#718096]">{row.role}</p>
        </div>
      )
    },
    {
      key: 'basicSalary',
      header: 'Lương cơ bản',
      render: (row: EmployeeCost) => <span className="font-medium text-[#1A202C]">{fmt(row.basicSalary)}</span>
    },
    {
      key: 'allowances',
      header: 'Phụ cấp',
      render: (row: EmployeeCost) => <span className="text-[#4A5568]">{fmt(row.allowances)}</span>
    },
    {
      key: 'bonus',
      header: 'Thưởng DA',
      render: (row: EmployeeCost) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#148922]">{fmt(row.bonus)}</span>
          {row.projectBonuses && row.projectBonuses.length > 0 && (
            <div className="relative group/tooltip">
               <span className="bg-[#ECFDF5] text-[#148922] px-1.5 py-0.5 rounded text-[10px] font-bold cursor-help">DA</span>
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-[#1A202C] text-white text-[11px] rounded-[10px] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl">
                  <p className="font-bold border-b border-white/10 pb-1.5 mb-2">Thưởng dự án chi tiết</p>
                  <div className="space-y-1.5">
                    {row.projectBonuses.map((b: any) => (
                      <div key={b.id} className="flex justify-between gap-2">
                        <span className="opacity-70 truncate">{b.reason}</span>
                        <span className="font-bold shrink-0">{fmt(b.bonusAmount)}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'tax',
      header: 'Thuế (tạm tính)',
      render: (row: EmployeeCost) => <span className="text-[#EF4444] font-medium">-{fmt(row.tax)}</span>
    },
    {
      key: 'netPay',
      header: 'Thực nhận',
      render: (row: EmployeeCost) => <span className="font-bold text-[#148922]">{fmt(row.netPay)}</span>
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (row: EmployeeCost) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"><Printer className="w-4 h-4" /></button>
          <button className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"><Download className="w-4 h-4" /></button>
          <button className="p-1.5 text-[#718096] hover:bg-[#F8FAFC] rounded-[6px] transition-colors"><MoreVertical className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Lương & Chi phí"
        description="Xử lý bảng tính lương hàng tháng, thuế và các khoản thưởng hiệu suất dự án."
        actions={
          <div className="flex items-center gap-3">
            {currentPeriod?.status === 'Open' && canConfirmPayroll(currentUser.role) && (
              <Btn variant="danger" icon={Lock} onClick={() => setIsLockModalOpen(true)}>Khoá kỳ lương</Btn>
            )}
            <Btn icon={Plus} onClick={handleProcessPayroll} disabled={periodLocked}>
              Xử lý Lương & Thưởng
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Tổng Lương Gộp" value={fmt(stats.gross)} change="2.4%" isPositive icon={Wallet} iconBg="#ECFDF5" iconColor="#148922" />
        <KPICard title="Tổng Thuế & Khấu trừ" value={fmt(stats.tax)} change="1.8%" isPositive={false} icon={TrendingUp} iconBg="#FEE2E2" iconColor="#EF4444" />
        <KPICard title="Tổng Thực Nhận" value={fmt(stats.net)} change="2.6%" isPositive icon={DollarSign} iconBg="#f0fdf4" iconColor="#50b00a" />
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm nhân viên, chức vụ..."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#718096] font-medium">Kỳ lương:</span>
            <select 
              value={selectedPeriodId} 
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="bg-transparent text-[13px] font-bold text-[#1A202C] focus:outline-none cursor-pointer"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.month}</option>
              ))}
            </select>
            <StatusBadge status={!periodLocked ? 'Đang làm việc' : 'Đã khoá'} className="ml-2" />
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredCosts}
        keyExtractor={(row) => row.id}
        emptyState={<EmptyState icon={Wallet} title="Không có dữ liệu lương" description="Hãy kiểm tra lại bộ lọc hoặc kỳ lương đã chọn." />}
      />

      <ConfirmModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onConfirm={handleLockPeriod}
        title="Khoá kỳ lương"
        message="Sau khi khoá, bạn sẽ không thể thay đổi thông tin lương và thưởng trong kỳ này. Dữ liệu sẽ được chốt để báo cáo tài chính."
        variant="danger"
      />
    </div>
  );
}
