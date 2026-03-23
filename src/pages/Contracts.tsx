import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  Users, 
  DollarSign,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Download,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contract, ContractStatus } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ContractCreateModal } from '../components/contract/ContractCreateModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'cnt-1',
    contractNumber: 'HD-2026-001',
    title: 'Hợp đồng Thiết kế & Thi công Nội thất Alpha',
    clientName: 'Tập đoàn Bất động sản Alpha',
    value: 1200000000,
    startDate: '2026-04-01',
    endDate: '2026-12-31',
    status: 'Signed',
    description: 'Cung cấp dịch vụ thiết kế kiến trúc và thi công nội thất trọn gói cho tòa nhà văn phòng Alpha Tower.',
    terms: [
      'Thanh toán đợt 1: 30% sau khi ký hợp đồng',
      'Thanh toán đợt 2: 40% sau khi hoàn thành thiết kế 3D',
      'Thanh toán đợt 3: 30% sau khi nghiệm thu bàn giao',
      'Thời gian bảo hành: 24 tháng kể từ ngày bàn giao'
    ],
    createdAt: '2026-03-15T10:00:00Z'
  },
  {
    id: 'cnt-2',
    contractNumber: 'HD-2026-002',
    title: 'Tư vấn Giải pháp Tiết kiệm Năng lượng Beta',
    clientName: 'Nhà máy Sản xuất Beta Green',
    value: 450000000,
    startDate: '2026-05-15',
    endDate: '2026-08-15',
    status: 'Draft',
    description: 'Khảo sát và đề xuất giải pháp tối ưu hóa hệ thống điện và chiếu sáng cho nhà xưởng.',
    terms: [
      'Thanh toán 100% sau khi bàn giao báo cáo khảo sát',
      'Cam kết tiết kiệm ít nhất 15% điện năng tiêu thụ'
    ],
    createdAt: '2026-03-18T14:30:00Z'
  },
  {
    id: 'cnt-3',
    contractNumber: 'HD-2026-003',
    title: 'Cung cấp Thiết bị Công nghệ Gamma',
    clientName: 'Trường Đại học Công nghệ Gamma',
    value: 850000000,
    startDate: '2026-03-20',
    endDate: '2026-04-20',
    status: 'Active',
    description: 'Cung cấp và lắp đặt hệ thống máy chủ và thiết bị mạng cho phòng Lab AI.',
    terms: [
      'Thanh toán 50% khi giao hàng',
      'Thanh toán 50% sau khi lắp đặt và cấu hình hoàn tất'
    ],
    createdAt: '2026-03-10T09:00:00Z',
    projectId: 'prj-gamma-01'
  }
];

export function Contracts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateContract = (newContract: Contract) => {
    setContracts(prev => [newContract, ...prev]);
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Tất cả' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalValue = contracts.reduce((acc, c) => acc + c.value, 0);
    const signedCount = contracts.filter(c => c.status === 'Signed' || c.status === 'Active').length;
    const draftCount = contracts.filter(c => c.status === 'Draft').length;
    return { totalValue, signedCount, draftCount };
  }, [contracts]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Hợp đồng</h2>
          <p className="text-gray-500">Quản lý kinh phí và các điều khoản cam kết trước khi triển khai dự án.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
        >
          <Plus className="w-5 h-5" />
          Tạo hợp đồng mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng giá trị hợp đồng</p>
              <p className="text-2xl font-black text-gray-900">{(stats.totalValue / 1000000000).toFixed(2)} tỷ VNĐ</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hợp đồng đã ký</p>
              <p className="text-2xl font-black text-gray-900">{stats.signedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hợp đồng nháp</p>
              <p className="text-2xl font-black text-gray-900">{stats.draftCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hợp đồng, khách hàng hoặc mã số..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Trạng thái:</span>
          <select 
            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Draft">Bản nháp</option>
            <option value="Sent">Đã gửi</option>
            <option value="Signed">Đã ký</option>
            <option value="Active">Đang thực hiện</option>
            <option value="Completed">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Contract List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredContracts.map((contract) => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <ContractCreateModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateContract}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContractCard({ contract }: { contract: Contract; key?: React.Key }) {
  const navigate = useNavigate();
  
  const statusConfig: Record<ContractStatus, { label: string; color: string; icon: any }> = {
    'Draft': { label: 'Bản nháp', color: 'bg-gray-100 text-gray-600', icon: Clock },
    'Sent': { label: 'Đã gửi', color: 'bg-blue-100 text-blue-600', icon: FileText },
    'Signed': { label: 'Đã ký', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 },
    'Active': { label: 'Đang thực hiện', color: 'bg-indigo-100 text-indigo-600', icon: Briefcase },
    'Completed': { label: 'Hoàn thành', color: 'bg-purple-100 text-purple-600', icon: CheckCircle2 },
    'Cancelled': { label: 'Đã hủy', color: 'bg-red-100 text-red-600', icon: AlertCircle },
  };

  const config = statusConfig[contract.status];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#003366] group-hover:bg-[#003366] group-hover:text-white transition-all">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{contract.contractNumber}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1", config.color)}>
                  <config.icon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{contract.title}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> Khách hàng: {contract.clientName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giá trị hợp đồng</p>
            <p className="text-lg font-black text-gray-900">{contract.value.toLocaleString('vi-VN')} VNĐ</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Thời gian</p>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{contract.startDate} → {contract.endDate}</span>
            </div>
          </div>
          <div className="md:col-span-2 p-4 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Điều khoản chính</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {contract.terms.slice(0, 2).map((term, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#FF6600] rounded-full"></div>
                  {term}
                </li>
              ))}
              {contract.terms.length > 2 && <li className="text-gray-400 italic">...và {contract.terms.length - 2} điều khoản khác</li>}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {contract.projectId ? (
              <button 
                onClick={() => navigate(`/projects/${contract.projectId}/board`)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
              >
                <Briefcase className="w-4 h-4" />
                Xem dự án liên kết
              </button>
            ) : (
              contract.status === 'Signed' && (
                <button 
                  onClick={() => navigate('/projects', { 
                    state: { 
                      fromContract: {
                        name: contract.title,
                        revenue: contract.value,
                        startDate: contract.startDate,
                        endDate: contract.endDate,
                        contractId: contract.id
                      } 
                    } 
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF6600] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#FF6600]/20 hover:bg-[#E65C00] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Khởi tạo dự án
                </button>
              )
            )}
          </div>
          <button className="flex items-center gap-1 text-sm font-bold text-[#003366] hover:gap-2 transition-all">
            Xem chi tiết hợp đồng
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
