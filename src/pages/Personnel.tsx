import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  DollarSign,
  ChevronRight,
  UserPlus,
  Trash2,
  Edit2
} from 'lucide-react';
import { PersonnelCreateModal } from '../components/personnel/PersonnelCreateModal';
import { PersonnelDetailModal } from '../components/personnel/PersonnelDetailModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AnimatePresence } from 'motion/react';

const INITIAL_PERSONNEL = [
  { id: '1', name: 'Nguyễn Văn A', role: 'Quản lý dự án', salary: 120000, projects: ['Dự án Alpha', 'Dự án Gamma'], status: 'Đang làm việc', avatar: 'VA', email: 'a.nguyen@ecotech.com', phone: '+84 234 567 890' },
  { id: '2', name: 'Trần Thị B', role: 'Kiến trúc sư cao cấp', salary: 110000, projects: ['Dự án Beta'], status: 'Đang làm việc', avatar: 'TB', email: 'b.tran@ecotech.com', phone: '+84 234 567 891' },
  { id: '3', name: 'Lê Văn C', role: 'Chuyên viên phân tích tài chính', salary: 95000, projects: ['Dự án Alpha', 'Dự án Delta'], status: 'Đang làm việc', avatar: 'VC', email: 'c.le@ecotech.com', phone: '+84 234 567 892' },
  { id: '4', name: 'Phạm Văn D', role: 'Cố vấn pháp lý', salary: 150000, projects: ['Dự án Gamma'], status: 'Đang làm việc', avatar: 'VD', email: 'd.pham@ecotech.com', phone: '+84 234 567 893' },
  { id: '5', name: 'Hoàng Thị E', role: 'Quản lý vận hành', salary: 105000, projects: ['Dự án Epsilon'], status: 'Đang nghỉ phép', avatar: 'TE', email: 'e.hoang@ecotech.com', phone: '+84 234 567 894' },
  { id: '6', name: 'Ngô Văn F', role: 'Kiểm soát chi phí', salary: 115000, projects: ['Dự án Beta', 'Dự án Delta'], status: 'Đang làm việc', avatar: 'VF', email: 'f.ngo@ecotech.com', phone: '+84 234 567 895' },
];

export function Personnel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [personList, setPersonList] = useState(INITIAL_PERSONNEL);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');

  const filteredPersonnel = useMemo(() => {
    return personList.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           person.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Tất cả trạng thái' || person.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [personList, searchTerm, statusFilter]);

  const handleCreateOrUpdate = (person: any) => {
    if (editingPerson) {
      setPersonList(prev => prev.map(p => p.id === person.id ? person : p));
    } else {
      setPersonList(prev => [person, ...prev]);
    }
    setEditingPerson(null);
  };

  const handleDelete = (id: string) => {
    setPersonToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (personToDelete) {
      setPersonList(prev => prev.filter(p => p.id !== personToDelete));
      setPersonToDelete(null);
    }
  };

  const handleEdit = (person: any) => {
    setEditingPerson(person);
    setIsCreateModalOpen(true);
  };

  const handleViewDetail = (person: any) => {
    setSelectedPerson(person);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý nhân sự</h2>
          <p className="text-gray-500">Quản lý đội ngũ, vai trò và phân bổ dự án của bạn.</p>
        </div>
        <button 
          onClick={() => {
            setEditingPerson(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Thêm nhân viên
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, vai trò hoặc dự án..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
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
            <option>Tất cả trạng thái</option>
            <option>Đang làm việc</option>
            <option>Đang nghỉ phép</option>
            <option>Đã nghỉ việc</option>
          </select>
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPersonnel.map((person) => (
          <PersonnelCard 
            key={person.id} 
            person={person} 
            onEdit={() => handleEdit(person)}
            onDelete={() => handleDelete(person.id)}
            onViewDetail={() => handleViewDetail(person)}
          />
        ))}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <PersonnelCreateModal 
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingPerson(null);
            }}
            onCreate={handleCreateOrUpdate}
            editingPerson={editingPerson}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && (
          <PersonnelDetailModal 
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedPerson(null);
            }}
            person={selectedPerson}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Xóa nhân viên"
        message="Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các dự án liên quan."
        confirmText="Xóa ngay"
        variant="danger"
      />
    </div>
  );
}

function PersonnelCard({ person, onEdit, onDelete, onViewDetail }: any) {
  const statusColors: any = {
    'Đang làm việc': "bg-emerald-100 text-emerald-700",
    'Đang nghỉ phép': "bg-orange-100 text-orange-700",
    'Đã nghỉ việc': "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#003366] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#003366]/20 group-hover:bg-[#FF6600] group-hover:shadow-[#FF6600]/20 transition-all">
              {person.avatar}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{person.name}</h3>
              <p className="text-sm text-gray-500 font-medium">{person.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-[#003366] hover:bg-gray-50 rounded-lg transition-all"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{person.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{person.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span>{person.projects.length} Dự án đang hoạt động</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[person.status]}`}>
              {person.status}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Lương hàng năm</p>
            <p className="text-sm font-bold text-gray-900">${(person.salary / 1000).toFixed(0)}k</p>
          </div>
        </div>
      </div>
      <button 
        onClick={onViewDetail}
        className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-[#003366] text-sm font-bold flex items-center justify-center gap-2 transition-all"
      >
        Xem hồ sơ đầy đủ
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
