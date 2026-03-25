import React, { useState, useMemo } from 'react';
import {
  Mail,
  Phone,
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
import { useStore } from '../store/useStore';
import type { Department, Employee, PersonnelTableRow } from '../types';
import { canEditPersonnelCrud } from '../lib/permissions';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function employmentFromEmployee(e: Employee): 'Đang làm việc' | 'Đang nghỉ phép' | 'Đã nghỉ việc' {
  if (e.employmentStatus) return e.employmentStatus;
  return e.status === 'Inactive' ? 'Đã nghỉ việc' : 'Đang làm việc';
}

export function Personnel() {
  const employees = useStore((s) => s.employees);
  const departments = useStore((s) => s.departments);
  const currentUser = useStore((s) => s.currentUser);
  const updateEmployee = useStore((s) => s.updateEmployee);
  const addEmployee = useStore((s) => s.addEmployee);
  const removeEmployee = useStore((s) => s.removeEmployee);
  const addDepartment = useStore((s) => s.addDepartment);
  const updateDepartment = useStore((s) => s.updateDepartment);
  const removeDepartment = useStore((s) => s.removeDepartment);

  const canEdit = canEditPersonnelCrud(currentUser.role);

  const [activeTab, setActiveTab] = useState<'personnel' | 'departments'>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [departmentFilter, setDepartmentFilter] = useState('Tất cả phòng ban');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteDeptConfirmOpen, setIsDeleteDeptConfirmOpen] = useState(false);

  const [editingPerson, setEditingPerson] = useState<PersonnelTableRow | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonnelTableRow | null>(null);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<(typeof departments)[0] | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);

  const directoryEmployees = useMemo(
    () => employees.filter((e) => e.id !== 'admin'),
    [employees]
  );

  const personList: PersonnelTableRow[] = useMemo(
    () =>
      directoryEmployees.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.jobTitle || e.role,
        salary: e.baseSalary ?? 0,
        status: employmentFromEmployee(e),
        departmentId: e.departmentId ?? '',
        email: e.email ?? '',
        phone: e.phone ?? '',
        avatar: initials(e.name),
        projects: e.projectLabels ?? [],
      })),
    [directoryEmployees]
  );

  const filteredPersonnel = useMemo(() => {
    return personList.filter((person) => {
      const dept = departments.find((d) => d.id === person.departmentId);
      const deptName = dept ? dept.name.toLowerCase() : '';

      const matchesSearch =
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deptName.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Tất cả trạng thái' || person.status === statusFilter;
      const matchesDept = departmentFilter === 'Tất cả phòng ban' || person.departmentId === departmentFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [personList, searchTerm, statusFilter, departments, departmentFilter]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [departments, searchTerm]);

  const rowToEmployee = (p: PersonnelTableRow, prev?: Employee): Employee => {
    const dept = departments.find((d) => d.id === p.departmentId);
    const operational: 'Active' | 'Inactive' = p.status === 'Đã nghỉ việc' ? 'Inactive' : 'Active';
    const avatarUrl =
      prev?.avatar?.startsWith('http') ? prev.avatar : `https://i.pravatar.cc/150?u=${encodeURIComponent(p.id)}`;
    return {
      id: p.id,
      name: p.name,
      jobTitle: p.role,
      baseSalary: p.salary,
      employmentStatus: p.status,
      email: p.email,
      phone: p.phone,
      departmentId: p.departmentId || undefined,
      department: dept?.name || 'Vãng lai',
      status: operational,
      role: prev?.role ?? 'Employee',
      avatar: avatarUrl,
      projectLabels: p.projects.length ? p.projects : prev?.projectLabels ?? [],
    };
  };

  const handleCreateOrUpdate = (person: PersonnelTableRow) => {
    if (!canEdit) return;
    if (editingPerson) {
      const prev = employees.find((e) => e.id === person.id);
      updateEmployee(person.id, rowToEmployee(person, prev));
      showToast.success('Đã cập nhật thông tin nhân viên');
    } else {
      const newId = `emp-${Date.now()}`;
      addEmployee(
        rowToEmployee(
          { ...person, id: newId, avatar: initials(person.name) },
          undefined
        )
      );
      showToast.success('Đã thêm nhân viên mới');
    }
    setEditingPerson(null);
    setIsCreateModalOpen(false);
  };

  const handleCreateOrUpdateDepartment = (dept: Department, memberIds: string[]) => {
    if (!canEdit) return;
    if (editingDepartment) {
      updateDepartment(dept.id, {
        name: dept.name,
        headId: dept.headId,
        description: dept.description,
      });
      showToast.success('Đã cập nhật phòng ban');
    } else {
      addDepartment(dept);
      showToast.success('Đã tạo phòng ban mới');
    }

    const deptId = dept.id;
    useStore.getState().employees.forEach((e) => {
      if (e.departmentId === deptId && !memberIds.includes(e.id)) {
        updateEmployee(e.id, { departmentId: undefined });
      }
    });
    memberIds.forEach((mid) => updateEmployee(mid, { departmentId: deptId }));
    if (dept.headId) {
      updateEmployee(dept.headId, { departmentId: deptId });
    }

    setEditingDepartment(null);
    setIsDeptModalOpen(false);
  };

  const confirmDelete = () => {
    if (!canEdit || !personToDelete) return;
    removeEmployee(personToDelete);
    setPersonToDelete(null);
    showToast.success('Đã xóa nhân viên');
  };

  const confirmDeleteDepartment = () => {
    if (!canEdit || !deptToDelete) return;
    removeDepartment(deptToDelete);
    setDeptToDelete(null);
    showToast.success('Đã xóa phòng ban');
  };

  const personnelColumns = [
    {
      key: 'name',
      header: 'Nhân viên',
      render: (row: PersonnelTableRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#148922] rounded-[8px] flex items-center justify-center text-white font-bold text-[14px]">
            {row.avatar}
          </div>
          <div>
            <p className="font-bold text-[#1A202C]">{row.name}</p>
            <p className="text-[12px] text-[#718096]">{row.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Phòng ban',
      render: (row: PersonnelTableRow) => {
        const dept = departments.find((d) => d.id === row.departmentId);
        return <span className="font-medium text-[#1A202C]">{dept?.name || 'Vãng lai'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: PersonnelTableRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      render: (row: PersonnelTableRow) => (
        <div className="text-[12px] text-[#718096]">
          <p className="flex items-center gap-1">
            <Mail className="w-3 h-3" /> {row.email || '—'}
          </p>
          <p className="flex items-center gap-1">
            <Phone className="w-3 h-3" /> {row.phone || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Lương cơ bản',
      render: (row: PersonnelTableRow) => <span className="font-bold text-[#1A202C]">{fmt(row.salary)}</span>,
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            width: '100px',
            render: (row: PersonnelTableRow) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => {
                    setSelectedPerson(row);
                    setIsDetailModalOpen(true);
                  }}
                  className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingPerson(row);
                    setIsCreateModalOpen(true);
                  }}
                  className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setPersonToDelete(row.id);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="p-1.5 text-[#718096] hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]
      : [
          {
            key: 'actions',
            header: '',
            width: '60px',
            render: (row: PersonnelTableRow) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => {
                    setSelectedPerson(row);
                    setIsDetailModalOpen(true);
                  }}
                  className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]),
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
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${
                  activeTab === 'personnel'
                    ? 'bg-[#148922] text-white shadow-sm'
                    : 'text-[#718096] hover:text-[#1A202C]'
                }`}
              >
                Nhân viên
              </button>
              <button
                onClick={() => setActiveTab('departments')}
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${
                  activeTab === 'departments'
                    ? 'bg-[#148922] text-white shadow-sm'
                    : 'text-[#718096] hover:text-[#1A202C]'
                }`}
              >
                Phòng ban
              </button>
            </div>
            {canEdit && (
              <Btn
                icon={activeTab === 'personnel' ? UserPlus : Building2}
                onClick={() => (activeTab === 'personnel' ? setIsCreateModalOpen(true) : setIsDeptModalOpen(true))}
              >
                {activeTab === 'personnel' ? 'Thêm nhân viên' : 'Thêm phòng ban'}
              </Btn>
            )}
          </div>
        }
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={activeTab === 'personnel' ? 'Tìm theo tên, email, vai trò...' : 'Tìm tên phòng ban...'}
        filters={
          activeTab === 'personnel'
            ? [
                {
                  key: 'dept',
                  label: 'Phòng ban',
                  value: departmentFilter,
                  onChange: setDepartmentFilter,
                  options: [
                    { label: 'Tất cả', value: 'Tất cả phòng ban' },
                    ...departments.map((d) => ({ label: d.name, value: d.id })),
                  ],
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
                  ],
                },
              ]
            : []
        }
      />

      {activeTab === 'personnel' ? (
        <DataTable
          columns={personnelColumns}
          data={filteredPersonnel}
          keyExtractor={(row) => row.id}
          emptyState={
            <EmptyState icon={Users} title="Không có nhân viên" description="Chưa có nhân viên nào phù hợp với bộ lọc." />
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              head={personList.find((p) => p.id === dept.headId)}
              memberCount={personList.filter((p) => p.departmentId === dept.id).length}
              canEdit={canEdit}
              onEdit={() => {
                setEditingDepartment(dept);
                setIsDeptModalOpen(true);
              }}
              onDelete={() => {
                setDeptToDelete(dept.id);
                setIsDeleteDeptConfirmOpen(true);
              }}
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
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPerson(null);
          }}
          onCreate={handleCreateOrUpdate}
          editingPerson={editingPerson}
          departments={departments}
        />
      )}

      {isDeptModalOpen && (
        <DepartmentCreateModal
          isOpen={isDeptModalOpen}
          onClose={() => {
            setIsDeptModalOpen(false);
            setEditingDepartment(null);
          }}
          onCreate={handleCreateOrUpdateDepartment}
          editingDepartment={editingDepartment}
          availablePersonnel={directoryEmployees}
          currentMembers={directoryEmployees.filter((e) => e.departmentId === editingDepartment?.id).map((e) => e.id)}
        />
      )}

      {isDetailModalOpen && (
        <PersonnelDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPerson(null);
          }}
          person={selectedPerson}
          departments={departments}
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

function DepartmentCard({
  department,
  head,
  memberCount,
  canEdit,
  onEdit,
  onDelete,
}: {
  department: { id: string; name: string; description?: string };
  head?: PersonnelTableRow;
  memberCount: number;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-[#718096] hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
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
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-white bg-[#F1F5F9] flex items-center justify-center text-[8px] font-bold text-[#718096]"
            >
              {i + 1}
            </div>
          ))}
          {memberCount > 5 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-white flex items-center justify-center text-[8px] font-bold text-[#148922]">
              +{memberCount - 5}
            </div>
          )}
        </div>
        {canEdit && (
          <button onClick={onEdit} className="text-[12px] font-bold text-[#148922] hover:underline">
            Chi tiết
          </button>
        )}
      </div>
    </div>
  );
}
