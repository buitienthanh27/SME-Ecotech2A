import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Contract, ContractStatus } from '../types';
import { ContractCreateModal } from '../components/contract/ContractCreateModal';
import { PageHeader, FilterBar, KPICard, DataTable, StatusBadge, Btn, showToast, EmptyState } from '../components/ui';

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

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export function Contracts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateContract = (newContract: Contract) => {
    setContracts(prev => [newContract, ...prev]);
    showToast.success('Đã tạo hợp đồng mới thành công');
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
    const signedCount = contracts.filter(c => c.status === 'Signed' || c.status === 'Active' || c.status === 'Completed').length;
    const draftCount = contracts.filter(c => c.status === 'Draft').length;
    return { totalValue, signedCount, draftCount };
  }, [contracts]);

  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: '120px',
      render: (row: Contract) => <span className="font-bold text-[#718096]">{row.contractNumber}</span>
    },
    {
      key: 'title',
      header: 'Tên hợp đồng / Khách hàng',
      render: (row: Contract) => (
        <div>
          <p className="font-bold text-[#1A202C]">{row.title}</p>
          <p className="text-[12px] text-[#718096]">{row.clientName}</p>
        </div>
      )
    },
    {
      key: 'value',
      header: 'Giá trị',
      render: (row: Contract) => <span className="font-bold text-[#148922]">{fmt(row.value)}</span>
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '150px',
      render: (row: Contract) => <StatusBadge status={row.status === 'Signed' ? 'Đã ký' : row.status === 'Active' ? 'Đang thực hiện' : row.status === 'Draft' ? 'Draft' : row.status === 'Completed' ? 'Đã hoàn thành' : row.status} />
    },
    {
      key: 'dates',
      header: 'Thời gian',
      render: (row: Contract) => (
        <span className="text-[12px] text-[#718096]">{row.startDate} → {row.endDate}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (row: Contract) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-[#718096] hover:bg-[#F8FAFC] rounded-[6px] transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Hợp đồng"
        description="Quản lý kinh phí và các điều khoản cam kết trước khi triển khai dự án."
        actions={<Btn icon={Plus} onClick={() => setIsCreateModalOpen(true)}>Tạo hợp đồng mới</Btn>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Tổng giá trị hợp đồng" value={`${(stats.totalValue / 1000000000).toFixed(2)} tỷ VNĐ`} icon={DollarSign} iconBg="#ECFDF5" iconColor="#148922" />
        <KPICard title="Hợp đồng đã ký" value={String(stats.signedCount)} icon={CheckCircle2} iconBg="#f0fdf4" iconColor="#50b00a" />
        <KPICard title="Hợp đồng nháp" value={String(stats.draftCount)} icon={Clock} iconBg="#FEF3C7" iconColor="#F59E0B" />
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm theo tên hợp đồng, khách hàng..."
        filters={[
          {
            key: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Tất cả', value: 'Tất cả' },
              { label: 'Bản nháp', value: 'Draft' },
              { label: 'Đã gửi', value: 'Sent' },
              { label: 'Đã ký', value: 'Signed' },
              { label: 'Đang thực hiện', value: 'Active' },
              { label: 'Hoàn thành', value: 'Completed' },
            ]
          }
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredContracts}
        keyExtractor={(item) => item.id}
        emptyState={
          <EmptyState 
            icon={FileText} 
            title="Không có hợp đồng" 
            description="Chưa có hợp đồng nào phù hợp với bộ lọc." 
            action={<Btn icon={Plus} onClick={() => setIsCreateModalOpen(true)}>Tạo hợp đồng mới</Btn>} 
          />
        }
      />

      <ContractCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateContract}
      />
    </div>
  );
}
