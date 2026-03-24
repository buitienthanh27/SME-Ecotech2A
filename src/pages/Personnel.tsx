import React, { useState, useMemo } from 'react';
import {
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  UserPlus,
  Trash2,
  Edit2,
  Building2,
  Users,
  Eye
} from 'lucide-react';
import { PersonnelCreateModal } from '../components/personnel/PersonnelCreateModal';
import { PersonnelDetailModal } from '../components/personnel/PersonnelDetailModal';
import { DepartmentCreateModal } from '../components/personnel/DepartmentCreateModal';
import { PageHeader, FilterBar, DataTable, StatusBadge, Btn, ConfirmModal, showToast, EmptyState } from '../components/ui';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export const INITIAL_DEPARTMENTS = [
  { id: 'd1', name: 'Phòng Kỹ thuật', headId: '1', description: 'Chịu trách nhiệm phát triển phần mềm' },
  { id: 'd2', name: 'Phòng Tài chính', headId: '3', description: 'Quản lý ngân sách và luồng tiền' },
  { id: 'd3', name: 'Phòng Kinh doanh', headId: '7', description: 'Tìm kiếm khách hàng và phát triển doanh thu' },
  { id: 'd4', name: 'Phòng Nhân sự', headId: '8', description: 'Tuyển dụng, đào tạo và quản lý nhân sự' },
  { id: 'd5', name: 'Phòng Marketing', headId: '9', description: 'Xây dựng thương hiệu và chiến dịch truyền thông' },
  { id: 'd6', name: 'Phòng Hành chính', headId: '10', description: 'Quản lý văn phòng, hậu cần và thủ tục nội bộ' },
  { id: 'd7', name: 'Phòng Nghiên cứu & Phát triển', headId: '11', description: 'Nghiên cứu công nghệ mới và đổi mới sản phẩm' },
  { id: 'd8', name: 'Phòng Chăm sóc khách hàng', headId: '12', description: 'Hỗ trợ và duy trì mối quan hệ với khách hàng' },
  { id: 'd9', name: 'Phòng Hạ tầng CNTT', headId: '13', description: 'Quản lý hệ thống mạng, máy chủ và bảo mật' },
  { id: 'd10', name: 'Phòng Đào tạo', headId: '14', description: 'Phát triển năng lực và chương trình đào tạo nội bộ' },
  { id: 'd11', name: 'Phòng Pháp chế', headId: '15', description: 'Tư vấn pháp lý và quản lý rủi ro hợp đồng' },
  { id: 'd12', name: 'Phòng Mua hàng', headId: '', description: 'Tìm nguồn cung ứng và đàm phán với nhà cung cấp' },
];

export const INITIAL_PERSONNEL = [
  { id: '1', name: 'Nguyễn Văn A', role: 'Quản lý dự án', salary: 120000, projects: ['Dự án Alpha', 'Dự án Gamma'], status: 'Đang làm việc', avatar: 'VA', email: 'a.nguyen@ecotech.com', phone: '+84 234 567 890', departmentId: 'd1' },
  { id: '2', name: 'Trần Thị B', role: 'Kiến trúc sư cao cấp', salary: 110000, projects: ['Dự án Beta'], status: 'Đang làm việc', avatar: 'TB', email: 'b.tran@ecotech.com', phone: '+84 234 567 891', departmentId: 'd1' },
  { id: '3', name: 'Lê Văn C', role: 'Chuyên viên phân tích tài chính', salary: 95000, projects: ['Dự án Alpha', 'Dự án Delta'], status: 'Đang làm việc', avatar: 'VC', email: 'c.le@ecotech.com', phone: '+84 234 567 892', departmentId: 'd2' },
  { id: '4', name: 'Phạm Văn D', role: 'Cố vấn pháp lý', salary: 150000, projects: ['Dự án Gamma'], status: 'Đang làm việc', avatar: 'VD', email: 'd.pham@ecotech.com', phone: '+84 234 567 893', departmentId: '' },
  { id: '5', name: 'Hoàng Thị E', role: 'Quản lý vận hành', salary: 105000, projects: ['Dự án Epsilon'], status: 'Đang nghỉ phép', avatar: 'TE', email: 'e.hoang@ecotech.com', phone: '+84 234 567 894', departmentId: '' },
  { id: '6', name: 'Ngô Văn F', role: 'Kiểm soát chi phí', salary: 115000, projects: ['Dự án Beta', 'Dự án Delta'], status: 'Đang làm việc', avatar: 'VF', email: 'f.ngo@ecotech.com', phone: '+84 234 567 895', departmentId: 'd2' },
  { id: '7', name: 'Đặng Thị G', role: 'Trưởng phòng Kinh doanh', salary: 135000, projects: ['Dự án Zeta', 'Dự án Eta'], status: 'Đang làm việc', avatar: 'TG', email: 'g.dang@ecotech.com', phone: '+84 234 567 896', departmentId: 'd3' },
  { id: '8', name: 'Vũ Văn H', role: 'Quản lý Nhân sự', salary: 100000, projects: ['Dự án Nhân tài 2026'], status: 'Đang làm việc', avatar: 'VH', email: 'h.vu@ecotech.com', phone: '+84 234 567 897', departmentId: 'd4' },
  { id: '9', name: 'Bùi Thị I', role: 'Giám đốc Marketing', salary: 140000, projects: ['Chiến dịch Tết 2026', 'Rebranding EcoTech'], status: 'Đang làm việc', avatar: 'TI', email: 'i.bui@ecotech.com', phone: '+84 234 567 898', departmentId: 'd5' },
  { id: '10', name: 'Đỗ Văn J', role: 'Chuyên viên Hành chính', salary: 75000, projects: ['Cải tiến quy trình văn phòng'], status: 'Đang làm việc', avatar: 'VJ', email: 'j.do@ecotech.com', phone: '+84 234 567 899', departmentId: 'd6' },
  { id: '11', name: 'Lý Thị K', role: 'Nghiên cứu viên AI', salary: 125000, projects: ['Dự án AI Assistant', 'Dự án Gamma'], status: 'Đang làm việc', avatar: 'TK', email: 'k.ly@ecotech.com', phone: '+84 234 567 900', departmentId: 'd7' },
  { id: '12', name: 'Triệu Văn L', role: 'Trưởng nhóm CSKH', salary: 90000, projects: ['Nâng cao trải nghiệm khách hàng'], status: 'Đang làm việc', avatar: 'VL', email: 'l.trieu@ecotech.com', phone: '+84 234 567 901', departmentId: 'd8' },
  { id: '13', name: 'Cao Thị M', role: 'Kỹ sư hệ thống', salary: 115000, projects: ['Nâng cấp hạ tầng cloud'], status: 'Đang làm việc', avatar: 'TM', email: 'm.cao@ecotech.com', phone: '+84 234 567 902', departmentId: 'd9' },
  { id: '14', name: 'Mai Văn N', role: 'Chuyên gia đào tạo', salary: 95000, projects: ['Chương trình Onboarding 2026'], status: 'Đang làm việc', avatar: 'VN', email: 'n.mai@ecotech.com', phone: '+84 234 567 903', departmentId: 'd10' },
  { id: '15', name: 'Tô Thị O', role: 'Luật sư doanh nghiệp', salary: 130000, projects: ['Rà soát hợp đồng đối tác'], status: 'Đang làm việc', avatar: 'TO', email: 'o.to@ecotech.com', phone: '+84 234 567 904', departmentId: 'd11' },
  { id: '16', name: 'Hà Văn P', role: 'Chuyên viên mua hàng', salary: 85000, projects: ['Đàm phán nhà cung cấp Q1'], status: 'Đang nghỉ phép', avatar: 'VP', email: 'p.ha@ecotech.com', phone: '+84 234 567 905', departmentId: 'd12' },
];

export function Personnel() {
  const [activeTab, setActiveTab] = useState<'personnel' | 'departments'>('personnel');
  const [departmentList, setDepartmentList] = useState(INITIAL_DEPARTMENTS);
  const [personList, setPersonList] = useState(INITIAL_PERSONNEL);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [departmentFilter, setDepartmentFilter] = useState('Tất cả phòng ban');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteDeptConfirmOpen, setIsDeleteDeptConfirmOpen] = useState(false);
  
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);

  const filteredPersonnel = useMemo(() => {
    return personList.filter(person => {
      const dept = departmentList.find(d => d.id === person.departmentId);
      const deptName = dept ? dept.name.toLowerCase() : '';

      const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deptName.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Tất cả trạng thái' || person.status === statusFilter;
      const matchesDept = departmentFilter === 'Tất cả phòng ban' || person.departmentId === departmentFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [personList, searchTerm, statusFilter, departmentList, departmentFilter]);

  const filteredDepartments = useMemo(() => {
    return departmentList.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departmentList, searchTerm]);

  const handleCreateOrUpdate = (person: any) => {
    if (editingPerson) {
      setPersonList(prev => prev.map(p => p.id === person.id ? person : p));
      showToast.success('Đã cập nhật thông tin nhân viên');
    } else {
      setPersonList(prev => [person, ...prev]);
      showToast.success('Đã thêm nhân viên mới');
    }
    setEditingPerson(null);
    setIsCreateModalOpen(false);
  };

  const handleCreateOrUpdateDepartment = (dept: any, memberIds: string[]) => {
    if (editingDepartment) {
      setDepartmentList(prev => prev.map(d => d.id === dept.id ? dept : d));
      showToast.success('Đã cập nhật phòng ban');
    } else {
      setDepartmentList(prev => [dept, ...prev]);
      showToast.success('Đã tạo phòng ban mới');
    }

    setPersonList(prev => prev.map(p => {
      if (memberIds.includes(p.id)) {
        return { ...p, departmentId: dept.id };
      }
      if (p.departmentId === dept.id) {
        return { ...p, departmentId: '' };
      }
      return p;
    }));

    setEditingDepartment(null);
    setIsDeptModalOpen(false);
  };

  const confirmDelete = () => {
    if (personToDelete) {
      setPersonList(prev => prev.filter(p => p.id !== personToDelete));
      setPersonToDelete(null);
      showToast.success('Đã xóa nhân viên');
    }
  };

  const confirmDeleteDepartment = () => {
    if (deptToDelete) {
      setPersonList(prev => prev.map(p => p.departmentId === deptToDelete ? { ...p, departmentId: '' } : p));
      setDepartmentList(prev => prev.filter(d => d.id !== deptToDelete));
      setDeptToDelete(null);
      showToast.success('Đã xóa phòng ban');
    }
  };

  const personnelColumns = [
    {
      key: 'name',
      header: 'Nhân viên',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#148922] rounded-[8px] flex items-center justify-center text-white font-bold text-[14px]">
            {row.avatar}
          </div>
          <div>
            <p className="font-bold text-[#1A202C]">{row.name}</p>
            <p className="text-[12px] text-[#718096]">{row.role}</p>
          </div>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Phòng ban',
      render: (row: any) => {
        const dept = departmentList.find(d => d.id === row.departmentId);
        return <span className="font-medium text-[#1A202C]">{dept?.name || 'Vãng lai'}</span>;
      }
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: any) => <StatusBadge status={row.status} />
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      render: (row: any) => (
        <div className="text-[12px] text-[#718096]">
          <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {row.email}</p>
          <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {row.phone}</p>
        </div>
      )
    },
    {
      key: 'salary',
      header: 'Lương / kỳ',
      render: (row: any) => <span className="font-bold text-[#1A202C]">{fmt(row.salary)}</span>
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (row: any) => (
        <div className="flex items-center justify-end gap-1">
          <button 
            onClick={() => { setSelectedPerson(row); setIsDetailModalOpen(true); }}
            className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setEditingPerson(row); setIsCreateModalOpen(true); }}
            className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setPersonToDelete(row.id); setIsDeleteConfirmOpen(true); }}
            className="p-1.5 text-[#718096] hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Nhân sự"
        description="Quản lý nhân viên, phòng ban và phân bổ nguồn lực của ECOTECH."
        actions={
          <div className="flex items-center gap-3">
             <div className="bg-white border border-[#E2E8F0] p-1 rounded-[10px] flex shadow-sm">
                <button
                  onClick={() => setActiveTab('personnel')}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${activeTab === 'personnel'
                    ? 'bg-[#148922] text-white shadow-sm'
                    : 'text-[#718096] hover:text-[#1A202C]'}`}
                >
                  Nhân viên
                </button>
                <button
                  onClick={() => setActiveTab('departments')}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${activeTab === 'departments'
                    ? 'bg-[#148922] text-white shadow-sm'
                    : 'text-[#718096] hover:text-[#1A202C]'}`}
                >
                  Phòng ban
                </button>
              </div>
              <Btn 
                icon={activeTab === 'personnel' ? UserPlus : Building2} 
                onClick={() => activeTab === 'personnel' ? setIsCreateModalOpen(true) : setIsDeptModalOpen(true)}
              >
                {activeTab === 'personnel' ? 'Thêm nhân viên' : 'Thêm phòng ban'}
              </Btn>
          </div>
        }
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={activeTab === 'personnel' ? "Tìm theo tên, email, vai trò..." : "Tìm tên phòng ban..."}
        filters={activeTab === 'personnel' ? [
          {
            key: 'dept',
            label: 'Phòng ban',
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: [
              { label: 'Tất cả', value: 'Tất cả phòng ban' },
              ...departmentList.map(d => ({ label: d.name, value: d.id }))
            ]
          },
          {
            key: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Tất cả', value: 'Tất cả trạng thái' },
              { label: 'Đang làm việc', value: 'Đang làm việc' },
              { label: 'Đang nghỉ phép', value: 'Đang nghỉ phép' },
              { label: 'Đã nghỉ việc', value: 'Đã nghỉ việc' },
            ]
          }
        ] : []}
      />

      {activeTab === 'personnel' ? (
        <DataTable
          columns={personnelColumns}
          data={filteredPersonnel}
          keyExtractor={(row) => row.id}
          emptyState={<EmptyState icon={Users} title="Không có nhân viên" description="Chưa có nhân viên nào phù hợp với bộ lọc." />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              head={personList.find(p => p.id === dept.headId)}
              memberCount={personList.filter(p => p.departmentId === dept.id).length}
              onEdit={() => { setEditingDepartment(dept); setIsDeptModalOpen(true); }}
              onDelete={() => { setDeptToDelete(dept.id); setIsDeleteDeptConfirmOpen(true); }}
            />
          ))}
          {filteredDepartments.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Building2} title="Không có phòng ban" />
            </div>
          )}
        </div>
      )}

      {isCreateModalOpen && (
        <PersonnelCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => { setIsCreateModalOpen(false); setEditingPerson(null); }}
          onCreate={handleCreateOrUpdate}
          editingPerson={editingPerson}
        />
      )}

      {isDeptModalOpen && (
        <DepartmentCreateModal
          isOpen={isDeptModalOpen}
          onClose={() => { setIsDeptModalOpen(false); setEditingDepartment(null); }}
          onCreate={handleCreateOrUpdateDepartment}
          editingDepartment={editingDepartment}
          availablePersonnel={personList}
          currentMembers={personList.filter(p => p.departmentId === editingDepartment?.id).map(p => p.id)}
        />
      )}

      {isDetailModalOpen && (
        <PersonnelDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setSelectedPerson(null); }}
          person={selectedPerson}
          departments={departmentList}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Xóa nhân viên"
        message="Bạn có chắc chắn muốn xóa nhân viên này? Dữ liệu lịch sử sẽ được bảo lưu nhưng nhân viên sẽ không còn trong danh sách hoạt động."
        variant="danger"
      />

      <ConfirmModal
        isOpen={isDeleteDeptConfirmOpen}
        onClose={() => setIsDeleteDeptConfirmOpen(false)}
        onConfirm={confirmDeleteDepartment}
        title="Xóa phòng ban"
        message="Bạn có chắc chắn muốn xóa phòng ban này? Nhân viên thuộc phòng này sẽ được chuyển về trạng thái 'Vãng lai'."
        variant="danger"
      />
    </div>
  );
}

function DepartmentCard({ department, head, memberCount, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-all p-5 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ECFDF5] rounded-[10px] flex items-center justify-center text-[#148922]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#1A202C]">{department.name}</h3>
            <p className="text-[11px] text-[#718096] font-bold uppercase tracking-wider">{memberCount} nhân viên</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1.5 text-[#718096] hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="bg-[#F8FAFC] rounded-[10px] p-3 border border-[#F1F5F9] mb-4 flex-1">
         <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-[#148922] rounded-[6px] flex items-center justify-center text-white text-[10px] font-bold">
              {head?.avatar || '??'}
            </div>
            <div>
              <p className="text-[10px] text-[#718096] font-bold uppercase tracking-widest leading-none">Trưởng phòng</p>
              <p className="text-[13px] font-bold text-[#1A202C]">{head?.name || 'Chưa chỉ định'}</p>
            </div>
         </div>
         <p className="text-[12px] text-[#4A5568] line-clamp-2 leading-relaxed italic">
          {department.description || 'Không có mô tả.'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {Array.from({ length: Math.min(memberCount, 5) }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#F1F5F9] flex items-center justify-center text-[8px] font-bold text-[#718096]">
              {i + 1}
            </div>
          ))}
          {memberCount > 5 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-white flex items-center justify-center text-[8px] font-bold text-[#148922]">
              +{memberCount - 5}
            </div>
          )}
        </div>
        <button onClick={onEdit} className="text-[12px] font-bold text-[#148922] hover:underline">Chi tiết</button>
      </div>
    </div>
  );
}
