# 05 — Zustand Store & Code Patterns

---

## STORE OVERVIEW

File: `src/store/useStore.ts`

> ⭐ **Luôn import từ store. Không hardcode data trong component.**

```typescript
import { useStore } from '../store/useStore';

// Trong component:
const { currentUser, currentRole, projects, employees } = useStore();
const { addTask, updateTask, confirmPayroll } = useStore();
```

---

## STORE STATE

```typescript
interface AppState {
  // === AUTH / SESSION ===
  currentUser: Employee;
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;

  // === MASTER DATA ===
  customers: Customer[];
  contracts: Contract[];
  departments: Department[];
  employees: Employee[];          // Toàn bộ nhân viên công ty

  // === PROJECTS ===
  projects: Project[];            // includes members[], sprints[], tasks[], workSchedules[], trainingPlans[]

  // === FINANCE ===
  cashFlowEntries: CashFlowEntry[];
  payrollPeriods: PayrollPeriod[];

  // === APPROVALS ===
  approvalRequests: ApprovalRequest[];
  personnelRequests: PersonnelRequest[];

  // === SETTINGS ===
  otRate: number;                 // Đơn giá OT VND/giờ
}
```

---

## STORE ACTIONS

### HR Actions (chỉ role HR gọi được)
```typescript
addEmployee: (employee: Omit<Employee, 'id'>) => void
updateEmployee: (id: string, updates: Partial<Employee>) => void
deleteEmployee: (id: string) => void
updateBaseSalary: (employeeId: string, amount: number) => void  // ⭐ snapshot vào Payroll khi chốt
addDepartment: (dept: Omit<Department, 'id'>) => void
updateDepartment: (id: string, updates: Partial<Department>) => void
```

### Project Actions
```typescript
addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void
updateProject: (id: string, updates: Partial<Project>) => void
updateProjectStatus: (id: string, status: ProjectStatus) => void
addMemberToProject: (projectId: string, member: Omit<ProjectMember, 'id'>) => void
updateMember: (projectId: string, memberId: string, updates: Partial<ProjectMember>) => void
```

### Approval Actions
```typescript
addApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'createdAt'>) => void
approveRequest: (requestId: string, note?: string) => void
rejectRequest: (requestId: string, note: string) => void
// Khi approve: cập nhật ProjectMember.approvalStatus = 'Approved'
// Khi reject: cập nhật ProjectMember.approvalStatus = 'Rejected'
```

### Sprint Actions
```typescript
addSprint: (sprint: Omit<Sprint, 'id'>) => void
updateSprint: (id: string, updates: Partial<Sprint>) => void
activateSprint: (sprintId: string) => void
// Rule: deactivate sprint Active hiện tại trước khi activate sprint mới
completeSprint: (
  sprintId: string,
  unfinishedAction: 'backlog' | 'nextSprint',
  nextSprintId?: string
) => void
deleteSprint: (sprintId: string) => void  // chỉ khi status = Planned
```

### Task Actions
```typescript
addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
updateTask: (id: string, updates: Partial<Task>) => void
updateTaskStatus: (
  taskId: string,
  newStatus: TaskStatus,
  changedBy: { id: string; name: string },
  note?: string
) => void
// Tự động push vào task.statusHistory
substituteTaskAssignee: (
  taskId: string,
  fromPersonnelId: string,
  toPersonnelId: string,
  note?: string
) => void
// Giữ nguyên progressPercent, push SubstitutionLog vào progressHistory
moveTaskToSprint: (taskId: string, sprintId: string | null) => void
deleteTask: (id: string) => void
```

### TrainingPlan Actions
```typescript
addTrainingPlan: (plan: Omit<TrainingPlan, 'id'>) => void
updateTrainingPlan: (id: string, updates: Partial<TrainingPlan>) => void
confirmTrainingCost: (costId: string, actualAmount: number) => void
// Đổi cost.status = 'Đã chi', cập nhật amount
```

### Finance Actions (Accountant/CEO only)
```typescript
addCashFlowEntry: (entry: Omit<CashFlowEntry, 'id'>) => void
updateCashFlowEntry: (id: string, updates: Partial<CashFlowEntry>) => void
deleteCashFlowEntry: (id: string) => void  // chỉ Manual source

addPayrollPeriod: (period: Omit<PayrollPeriod, 'id'>) => void
confirmPayroll: (periodId: string) => void
// Sau khi confirm: snapshot baseSalary, auto tạo CashFlowEntry lương cho mỗi dự án
```

### Customer & Contract Actions
```typescript
addCustomer: (customer: Omit<Customer, 'id'>) => void
updateCustomer: (id: string, updates: Partial<Customer>) => void
deleteCustomer: (id: string) => void

addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => void
updateContract: (id: string, updates: Partial<Contract>) => void
```

---

## CODE PATTERNS

### 1. Role-based Conditional Rendering
```tsx
const { currentRole } = useStore();

// Pattern đơn giản
{currentRole === 'CEO' && <AdminPanel />}

// Pattern multi-role
{['CEO', 'PM'].includes(currentRole) && <CreateButton />}

// Pattern với helper
const canEditTask = ['CEO', 'PM', 'Lead'].includes(currentRole);
```

### 2. Form với Validation
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!form.name.trim()) newErrors.name = 'Tên dự án không được để trống';
  if (!form.pmId) newErrors.pmId = 'Vui lòng chọn PM phụ trách';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;
  // proceed...
};

// Trong JSX:
<input className={`border rounded px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
```

### 3. Toast Notifications
```typescript
import toast from 'react-hot-toast';

toast.success('Tạo dự án thành công!');
toast.error('Lỗi: Không thể xóa dự án đang Active');

// Với loading
const id = toast.loading('Đang xử lý...');
// ... sau khi xong
toast.success('Hoàn thành!', { id });
```

### 4. ConfirmModal Pattern
```tsx
const [confirmModal, setConfirmModal] = useState<{
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}>({ open: false, title: '', message: '', onConfirm: () => {} });

// Trigger:
setConfirmModal({
  open: true,
  title: 'Xóa dự án',
  message: 'Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.',
  onConfirm: () => {
    deleteProject(id);
    toast.success('Đã xóa dự án');
  }
});

// Component:
<ConfirmModal
  open={confirmModal.open}
  title={confirmModal.title}
  message={confirmModal.message}
  onConfirm={confirmModal.onConfirm}
  onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
/>
```

### 5. Format Tiền VND
```typescript
// Helper function (thêm vào utils hoặc dùng inline)
const formatVND = (amount: number): string =>
  amount.toLocaleString('vi-VN') + ' ₫';

// Ví dụ: 1500000 → "1,500,000 ₫"
```

### 6. Format Ngày
```typescript
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
```

### 7. Pagination Pattern
```tsx
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

const total = filteredData.length;
const paginated = filteredData.slice((page - 1) * pageSize, page * pageSize);
const totalPages = Math.ceil(total / pageSize);

// Footer:
<div className="flex items-center justify-between">
  <span className="text-sm text-gray-500">
    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} của {total} kết quả
  </span>
  <div className="flex gap-2">
    <select value={pageSize} onChange={e => { setPageSize(+e.target.value); setPage(1); }}>
      {[10, 20, 50].map(s => <option key={s} value={s}>{s}/trang</option>)}
    </select>
    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
    <span>{page}/{totalPages}</span>
    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
  </div>
</div>
```

### 8. Empty State
```tsx
{filteredData.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <InboxIcon className="w-12 h-12 mb-3 opacity-40" />
    <p className="text-lg font-medium">Không tìm thấy dữ liệu</p>
    <p className="text-sm mt-1">Thử thay đổi điều kiện lọc</p>
  </div>
)}
```

### 9. Loading Skeleton (route transition)
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => setLoading(false), 300);
  return () => clearTimeout(timer);
}, []);

if (loading) return <SkeletonLoader />;
```

### 10. Zustand Selector (tránh re-render không cần thiết)
```typescript
// ❌ Xấu — re-render khi bất kỳ field nào trong store thay đổi
const store = useStore();

// ✅ Tốt — chỉ re-render khi projects thay đổi
const projects = useStore(s => s.projects);
const { addProject, updateProject } = useStore();
```

---

## COMPONENT STRUCTURE CONVENTION

```
ComponentName/
├── ComponentName.tsx          # Component chính
├── ComponentName.types.ts     # Types cục bộ (nếu phức tạp)
└── sub-components/            # Sub-components chỉ dùng trong này
    ├── TaskCard.tsx
    └── TaskDrawer.tsx
```

Với page-level components:
```tsx
// pages/ProjectBoard.tsx structure
export function ProjectBoard() {
  // 1. Store selectors
  // 2. Local state
  // 3. Computed values / memos
  // 4. Handlers
  // 5. Render
}
```

---

## NAMING CONVENTIONS

- Components: `PascalCase` — `TaskCard`, `ProjectBoard`
- Hooks: `use` prefix — `useSubstitution`, `usePermissions`
- Store actions: `verb + noun` — `addTask`, `updateProject`, `confirmPayroll`
- Event handlers: `handle` prefix — `handleSubmit`, `handleDelete`
- Boolean state: `is/has/can` prefix — `isOpen`, `hasError`, `canEdit`
- Types: `PascalCase` interfaces, `camelCase` types alias cho primitives

---

## TAILWIND DESIGN SYSTEM

Màu sắc chính của ECOTECH:
```
Primary:   indigo-600 / indigo-700
Success:   green-500 / green-600
Warning:   yellow-500 / amber-500
Danger:    red-500 / red-600
Info:      blue-500 / blue-600
Neutral:   gray-50 / gray-100 / gray-200 / gray-500 / gray-700 / gray-900
```

Status badge convention:
```tsx
const statusColor = {
  'Active': 'bg-green-100 text-green-700',
  'Completed': 'bg-blue-100 text-blue-700',
  'Draft': 'bg-gray-100 text-gray-600',
  'OnHold': 'bg-yellow-100 text-yellow-700',
  'Pending': 'bg-orange-100 text-orange-700',
  'Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
};

<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[status]}`}>
  {status}
</span>
```
