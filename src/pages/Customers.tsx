import React, { useMemo, useState } from 'react';
import { Building2, CircleDollarSign, Plus, Users, Wallet, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Customer } from '../types';
import { Btn, ConfirmModal, DataTable, EmptyState, FilterBar, KPICard, Modal, PageHeader, StatusBadge, showToast } from '../components/ui';

type CustomerFormState = {
  code: string;
  companyName: string;
  taxCode: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  industry: string;
  companySize: string;
  status: 'Tiềm năng' | 'Đang hợp tác' | 'Ngừng hợp tác';
  priority: 'High' | 'Medium' | 'Low';
  source: string;
  note: string;
  totalRevenue: string;
  totalDebt: string;
};

const defaultForm: CustomerFormState = {
  code: '',
  companyName: '',
  taxCode: '',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  industry: '',
  companySize: '',
  status: 'Tiềm năng',
  priority: 'Medium',
  source: '',
  note: '',
  totalRevenue: '0',
  totalDebt: '0',
};

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

export function Customers() {
  const { customers, contracts, employees, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [contractFilter, setContractFilter] = useState<string>('Tất cả');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormState>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contractByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    contracts.forEach((contract) => {
      const project = useStore.getState().projects.find((p) => p.id === contract.projectId);
      if (!project?.customerId) return;
      map.set(project.customerId, (map.get(project.customerId) ?? 0) + 1);
    });
    return map;
  }, [contracts]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return customers.filter((c) => {
      const companyName = c.companyName ?? c.name;
      const assignedName = employees.find((e) => e.id === c.assignedTo)?.name ?? '';
      const searchable = [companyName, c.taxCode, c.address, c.contactPerson, c.phone, c.email, assignedName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !keyword || searchable.includes(keyword);
      const matchesStatus = statusFilter === 'Tất cả' || (c.status ?? 'Tiềm năng') === statusFilter;
      const hasContract = (contractByCustomer.get(c.id) ?? 0) > 0;
      const matchesContract = contractFilter === 'Tất cả' || (contractFilter === 'Có hợp đồng' ? hasContract : !hasContract);
      return matchesSearch && matchesStatus && matchesContract;
    });
  }, [contractByCustomer, contractFilter, customers, employees, searchValue, statusFilter]);

  const stats = useMemo(() => {
    const totalDebt = customers.reduce((acc, c) => acc + (c.totalDebt ?? 0), 0);
    const totalRevenue = customers.reduce((acc, c) => acc + (c.totalRevenue ?? 0), 0);
    return {
      totalDebt,
      totalCustomers: customers.length,
      totalRevenue,
      totalCollected: totalRevenue - totalDebt,
    };
  }, [customers]);

  const resetForm = () => {
    setForm(defaultForm);
    setErrors({});
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      code: customer.code ?? '',
      companyName: customer.companyName ?? customer.name ?? '',
      taxCode: customer.taxCode ?? '',
      address: customer.address ?? '',
      contactPerson: customer.contactPerson ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      industry: customer.industry ?? '',
      companySize: customer.companySize ?? '',
      status: customer.status ?? 'Tiềm năng',
      priority: customer.priority ?? 'Medium',
      source: customer.source ?? '',
      note: customer.note ?? '',
      totalRevenue: String(customer.totalRevenue ?? 0),
      totalDebt: String(customer.totalDebt ?? 0),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.companyName.trim()) nextErrors.companyName = 'Tên công ty là bắt buộc';
    if (!form.taxCode.trim()) nextErrors.taxCode = 'MST là bắt buộc';
    if (!form.address.trim()) nextErrors.address = 'Địa chỉ là bắt buộc';
    if (!form.contactPerson.trim()) nextErrors.contactPerson = 'Người liên hệ là bắt buộc';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const now = Date.now().toString();
    const companyName = form.companyName.trim();
    const payload: Customer = {
      id: editing?.id ?? `c-${now}`,
      code: form.code.trim() || `CUS-${now.slice(-6)}`,
      companyName,
      name: companyName,
      taxCode: form.taxCode.trim(),
      address: form.address.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      industry: form.industry.trim(),
      companySize: form.companySize.trim(),
      status: form.status,
      priority: form.priority,
      source: form.source.trim(),
      note: form.note.trim(),
      totalRevenue: Number(form.totalRevenue) || 0,
      totalDebt: Number(form.totalDebt) || 0,
    };

    if (editing) {
      updateCustomer(editing.id, payload);
      showToast.success('Đã cập nhật khách hàng');
    } else {
      addCustomer(payload);
      showToast.success('Đã thêm khách hàng mới');
    }
    setIsModalOpen(false);
    resetForm();
  };

  const columns = [
    { key: 'code', header: 'Mã KH', width: '110px', render: (row: Customer) => <span className="font-semibold">{row.code ?? '-'}</span> },
    {
      key: 'companyName',
      header: 'Công ty',
      render: (row: Customer) => (
        <div>
          <p className="font-semibold text-[#1A202C]">{row.companyName ?? row.name}</p>
          <p className="text-[12px] text-[#718096]">{row.taxCode ?? '—'}</p>
        </div>
      ),
    },
    { key: 'contactPerson', header: 'Liên hệ', render: (row: Customer) => row.contactPerson || '—' },
    { key: 'phone', header: 'SĐT', width: '130px', render: (row: Customer) => row.phone || '—' },
    { key: 'status', header: 'Trạng thái', width: '130px', render: (row: Customer) => <StatusBadge status={row.status ?? 'Tiềm năng'} /> },
    { key: 'totalRevenue', header: 'Đã thu', render: (row: Customer) => <span className="font-semibold text-[#148922]">{formatVND(row.totalRevenue ?? 0)}</span> },
    { key: 'totalDebt', header: 'Công nợ', render: (row: Customer) => <span className="font-semibold text-[#EF4444]">{formatVND(row.totalDebt ?? 0)}</span> },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '120px',
      render: (row: Customer) => (
        <div className="flex items-center gap-1">
          <Btn variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(row)} />
          <Btn variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirmDeleteId(row.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý khách hàng"
        description="Theo dõi dữ liệu khách hàng, doanh thu và công nợ."
        actions={<Btn icon={Plus} onClick={openCreate}>Thêm khách hàng mới</Btn>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Tổng công nợ" value={formatVND(stats.totalDebt)} icon={Wallet} iconBg="#fef2f2" iconColor="#ef4444" />
        <KPICard title="Tổng khách hàng" value={stats.totalCustomers} icon={Users} />
        <KPICard title="Tổng doanh thu" value={formatVND(stats.totalRevenue)} icon={CircleDollarSign} />
        <KPICard title="Tổng đã thu" value={formatVND(stats.totalCollected)} icon={Building2} />
      </div>

      <FilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Tìm theo tên công ty, MST, liên hệ, SĐT, email..."
        filters={[
          {
            key: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Tất cả', value: 'Tất cả' },
              { label: 'Tiềm năng', value: 'Tiềm năng' },
              { label: 'Đang hợp tác', value: 'Đang hợp tác' },
              { label: 'Ngừng hợp tác', value: 'Ngừng hợp tác' },
            ],
          },
          {
            key: 'contract',
            label: 'Hợp đồng',
            value: contractFilter,
            onChange: setContractFilter,
            options: [
              { label: 'Tất cả', value: 'Tất cả' },
              { label: 'Có hợp đồng', value: 'Có hợp đồng' },
              { label: 'Chưa có hợp đồng', value: 'Chưa có hợp đồng' },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(row) => row.id}
        emptyState={<EmptyState title="Không tìm thấy dữ liệu" description="Không có khách hàng phù hợp với bộ lọc hiện tại." />}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        size="lg"
        title={editing ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Btn>
            <Btn onClick={handleSave}>{editing ? 'Cập nhật' : 'Tạo khách hàng'}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tên công ty *" value={form.companyName} onChange={(v) => setForm((s) => ({ ...s, companyName: v }))} error={errors.companyName} />
          <Field label="MST *" value={form.taxCode} onChange={(v) => setForm((s) => ({ ...s, taxCode: v }))} error={errors.taxCode} />
          <Field label="Địa chỉ *" value={form.address} onChange={(v) => setForm((s) => ({ ...s, address: v }))} error={errors.address} />
          <Field label="Người liên hệ *" value={form.contactPerson} onChange={(v) => setForm((s) => ({ ...s, contactPerson: v }))} error={errors.contactPerson} />
          <Field label="Số điện thoại" value={form.phone} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} />
          <Field label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />
          <Field label="Ngành nghề" value={form.industry} onChange={(v) => setForm((s) => ({ ...s, industry: v }))} />
          <Field label="Quy mô" value={form.companySize} onChange={(v) => setForm((s) => ({ ...s, companySize: v }))} />
          <Field label="Tổng doanh thu" type="number" value={form.totalRevenue} onChange={(v) => setForm((s) => ({ ...s, totalRevenue: v }))} />
          <Field label="Tổng công nợ" type="number" value={form.totalDebt} onChange={(v) => setForm((s) => ({ ...s, totalDebt: v }))} />
          <SelectField
            label="Trạng thái"
            value={form.status}
            options={['Tiềm năng', 'Đang hợp tác', 'Ngừng hợp tác']}
            onChange={(v) => setForm((s) => ({ ...s, status: v as CustomerFormState['status'] }))}
          />
          <SelectField
            label="Ưu tiên"
            value={form.priority}
            options={['High', 'Medium', 'Low']}
            onChange={(v) => setForm((s) => ({ ...s, priority: v as CustomerFormState['priority'] }))}
          />
          <div className="md:col-span-2">
            <label className="block text-[12px] font-semibold text-[#4A5568] mb-1">Ghi chú</label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-[14px] focus:outline-none focus:border-[#148922]"
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (!confirmDeleteId) return;
          deleteCustomer(confirmDeleteId);
          setConfirmDeleteId(null);
          showToast.success('Đã xóa khách hàng');
        }}
        title="Xóa khách hàng"
        message="Bạn có chắc muốn xóa khách hàng này?"
        confirmText="Xóa"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'number';
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4A5568] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-[8px] border px-3 py-2 text-[14px] focus:outline-none focus:border-[#148922] ${error ? 'border-red-400' : 'border-[#E2E8F0]'}`}
      />
      {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#4A5568] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-[14px] focus:outline-none focus:border-[#148922]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
