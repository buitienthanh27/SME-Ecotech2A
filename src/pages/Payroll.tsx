import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  Printer, 
  ChevronRight,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Info,
  Lock
} from 'lucide-react';
import { PayrollPeriod, EmployeeCost, PerformanceBonus } from '../types';
import clsx from 'clsx';

// Mock initial bonuses
const MOCK_BONUSES: PerformanceBonus[] = [
  {
    id: 'b1',
    taskAssigneeId: 't1',
    taskId: 't1',
    employeeId: '1',
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
    employeeId: '3',
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
  { id: 'ec1', employeeId: '1', employeeName: 'Nguyễn Văn A', role: 'Frontend Developer', basicSalary: 15000000, allowances: 2000000, bonus: 0, ot: 500000, tax: 1500000, grossSalary: 17500000, netPay: 16000000 },
  { id: 'ec2', employeeId: '2', employeeName: 'Trần Thị B', role: 'Backend Developer', basicSalary: 16000000, allowances: 2000000, bonus: 0, ot: 0, tax: 1600000, grossSalary: 18000000, netPay: 16400000 },
  { id: 'ec3', employeeId: '3', employeeName: 'Lê Văn C', role: 'UI/UX Designer', basicSalary: 14000000, allowances: 1500000, bonus: 0, ot: 300000, tax: 1400000, grossSalary: 15800000, netPay: 14400000 },
];

export function Payroll() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bonuses, setBonuses] = useState<PerformanceBonus[]>(MOCK_BONUSES);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([
    {
      id: 'p1',
      month: '2026-03',
      status: 'Open',
      companyId: 'c1',
      employeeCosts: MOCK_EMPLOYEE_COSTS
    }
  ]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('p1');

  const currentPeriod = useMemo(() => 
    periods.find(p => p.id === selectedPeriodId), 
  [periods, selectedPeriodId]);

  const handleProcessPayroll = () => {
    if (!currentPeriod || currentPeriod.status === 'Locked') return;

    const currentMonth = currentPeriod.month;
    
    // 1. Find pending bonuses for this month
    const pendingBonuses = bonuses.filter(b => 
      b.status === 'Pending' && 
      b.createdAt.startsWith(currentMonth)
    );

    if (pendingBonuses.length === 0) {
      alert('Không có thưởng mới để xử lý trong tháng này.');
      return;
    }

    // 2. Update employee costs and link bonuses
    const updatedEmployeeCosts = currentPeriod.employeeCosts.map(ec => {
      const employeeBonuses = pendingBonuses.filter(b => b.employeeId === ec.employeeId);
      if (employeeBonuses.length > 0) {
        const totalBonus = employeeBonuses.reduce((sum, b) => sum + b.bonusAmount, 0);
        const newBonus = ec.bonus + totalBonus;
        const newGross = ec.basicSalary + ec.allowances + newBonus + ec.ot;
        const newTax = Math.round(newGross * 0.1); // Simplified tax
        
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

    // 3. Update bonus statuses
    setBonuses(prev => prev.map(b => {
      const isLinked = pendingBonuses.some(pb => pb.id === b.id);
      if (isLinked) {
        const ec = updatedEmployeeCosts.find(e => e.employeeId === b.employeeId);
        return { ...b, status: 'Linked', employeeCostId: ec?.id || null };
      }
      return b;
    }));

    // 4. Update period
    setPeriods(prev => prev.map(p => p.id === selectedPeriodId ? { ...p, employeeCosts: updatedEmployeeCosts } : p));
    
    alert(`Đã xử lý ${pendingBonuses.length} khoản thưởng hiệu suất.`);
  };

  const handleLockPeriod = () => {
    if (!currentPeriod) return;
    
    setPeriods(prev => prev.map(p => p.id === selectedPeriodId ? { ...p, status: 'Locked' } : p));
    
    // Lock all linked bonuses in this period
    const linkedBonusIds = currentPeriod.employeeCosts.flatMap(ec => ec.projectBonuses?.map(b => b.id) || []);
    setBonuses(prev => prev.map(b => linkedBonusIds.includes(b.id) ? { ...b, status: 'Locked' } : b));
    
    alert('Kỳ lương đã được khoá. Không thể chỉnh sửa thưởng đã kết nối.');
  };

  const filteredCosts = useMemo(() => {
    if (!currentPeriod) return [];
    return currentPeriod.employeeCosts.filter(ec => 
      ec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ec.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentPeriod, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Lương</h2>
          <p className="text-gray-500">Xử lý lương hàng tháng, thuế và thưởng dự án.</p>
        </div>
        <div className="flex items-center gap-3">
          {currentPeriod?.status === 'Open' && (
            <button 
              onClick={handleLockPeriod}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
            >
              <Lock className="w-4 h-4" />
              Khoá Kỳ Lương
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
          <button 
            onClick={handleProcessPayroll}
            disabled={currentPeriod?.status === 'Locked'}
            className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Xử lý Lương & Thưởng
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng Lương Gộp</p>
              <p className="text-xl font-bold text-gray-900">
                {currentPeriod?.employeeCosts.reduce((sum, ec) => sum + ec.grossSalary, 0).toLocaleString()} VND
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3" />
            +2.4% so với tháng trước
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng Thuế</p>
              <p className="text-xl font-bold text-gray-900">
                {currentPeriod?.employeeCosts.reduce((sum, ec) => sum + ec.tax, 0).toLocaleString()} VND
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-red-600 font-bold">
            <TrendingUp className="w-3 h-3" />
            +1.8% so với tháng trước
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng Thực Nhận</p>
              <p className="text-xl font-bold text-gray-900">
                {currentPeriod?.employeeCosts.reduce((sum, ec) => sum + ec.netPay, 0).toLocaleString()} VND
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3" />
            +2.6% so với tháng trước
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-gray-900">Danh sách Lương - Tháng {currentPeriod?.month}</h3>
              <div className={clsx(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                currentPeriod?.status === 'Open' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
              )}>
                {currentPeriod?.status === 'Open' ? 'Đang mở' : 'Đã khoá'}
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân viên..." 
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
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Lương cơ bản</th>
                  <th className="px-6 py-4">Phụ cấp</th>
                  <th className="px-6 py-4">Tăng ca</th>
                  <th className="px-6 py-4">Thưởng DA</th>
                  <th className="px-6 py-4">Thuế</th>
                  <th className="px-6 py-4">Thực nhận</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCosts.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{item.employeeName}</p>
                        <p className="text-xs text-gray-500">{item.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.basicSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.allowances.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.ot.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-600">{item.bonus.toLocaleString()}</span>
                        {item.projectBonuses && item.projectBonuses.length > 0 && (
                          <div className="relative group/tooltip">
                            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-help">
                              DA
                              <Info className="w-3 h-3" />
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 shadow-xl">
                              <p className="font-bold border-b border-white/10 pb-1 mb-2">Chi tiết thưởng dự án</p>
                              <div className="space-y-2">
                                {item.projectBonuses.map(b => (
                                  <div key={b.id} className="flex justify-between gap-2">
                                    <span className="opacity-70 line-clamp-1">{b.reason}</span>
                                    <span className="font-bold shrink-0">{b.bonusAmount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 font-medium">-{item.tax.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">{item.netPay.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="In Phiếu Lương">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="Tải PDF">
                          <Download className="w-4 h-4" />
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
      </div>
    </div>
  );
}

function AllocationItem({ name, amount, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">{name}</span>
        <span className="font-bold text-gray-900">${amount.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
