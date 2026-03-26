# 02 — Domain Models (TypeScript Interfaces)

> **Source of truth**: `src/types.ts` — luôn kiểm tra file này trước khi tạo type mới.
> Nếu cần thêm field hay type mới, thêm vào `src/types.ts` trước, sau đó dùng.

---

## ROLES

```typescript
type AppRole = 'Admin' | 'CEO' | 'PM' | 'Lead' | 'Accountant' | 'HR' | 'Employee';
```

---

## CUSTOMER & CONTRACT

```typescript
interface Customer {
  id: string;
  code: string;
  companyName: string;
  taxCode: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  industry?: string;
  companySize?: string;
  status: 'Tiềm năng' | 'Đang hợp tác' | 'Ngừng hợp tác';
  priority?: 'High' | 'Medium' | 'Low';
  assignedTo?: string;         // personnelId
  source?: string;
  note?: string;
  totalRevenue?: number;       // tổng doanh thu đã thu
  totalDebt?: number;          // công nợ
}

interface Contract {
  id: string;
  contractNo: string;          // số hợp đồng
  name: string;
  customerId: string;
  projectId?: string;          // liên kết dự án (optional)
  value: number;               // giá trị hợp đồng (VND)
  status: 'Nháp' | 'Đã gửi' | 'Đã ký' | 'Đang thực hiện' | 'Hoàn thành';
  signedDate?: string;         // ngày ký
  startDate: string;
  endDate: string;
  contactPerson?: string;
  note?: string;
  createdAt: string;
}
```

---

## PROJECT

```typescript
type ProjectStatus = 'Draft' | 'Active' | 'Đang thực hiện' | 'Đã hoàn thành' | 'Tạm dừng' | 'Đang chờ';

interface Project {
  id: string;
  name: string;
  code: string;
  customerId: string | null;
  contractId?: string;
  startDate: string;
  endDate: string;
  budget: number;              // ngân sách kế hoạch (VND)
  description: string;
  status: ProjectStatus;
  pmId: string;                // PM phụ trách
  members: ProjectMember[];
  costPlan: ProjectCostItem[];
  sprints?: Sprint[];
  tasks?: Task[];
  workSchedules?: WorkShift[];
  trainingPlans?: TrainingPlan[];
  cashFlowEntries?: CashFlowEntry[];
  actualIncome?: number;
  actualExpense?: number;
  rejectionNote?: string;
  createdAt: string;
}

interface ProjectCostItem {
  id: string;
  category: string;
  type: 'Nhân sự' | 'CSVC' | 'Vendor' | 'Khác';
  plannedAmount: number;
  notes: string;
}

interface ProjectMember {
  id: string;
  employeeId: string;          // = personnelId trong spec
  projectId: string;
  role: 'PM' | 'Lead' | 'Developer' | 'Tester' | 'BA' | 'Other';
  allocation: number;          // % phân bổ (PB)
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive';
  inactiveReason?: string;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
}

// Helper: chỉ Active + đã Approved mới được giao task
function isMemberAssignableForTask(m: ProjectMember): boolean {
  if (m.status !== 'Active') return false;
  if (m.approvalStatus === 'Pending' || m.approvalStatus === 'Rejected') return false;
  return true;
}
```

---

## SPRINT

```typescript
interface Sprint {
  id: string;
  projectId: string;
  name: string;
  sprintNo: number;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'Planned' | 'Active' | 'Completed';
  order?: number;
}
```

**Quy tắc Sprint:**
- Chỉ **1 sprint Active** tại một thời điểm trong cùng dự án
- `Planning` → `Active`: có ít nhất 1 task (PM/CEO thực hiện)
- `Active` → `Completed`: PM xác nhận, task chưa Done → Backlog hoặc sprint tiếp
- Không thể reopen sprint đã Completed

---

## TASK

```typescript
type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';
type TaskPriority = 'Cao' | 'Trung bình' | 'Thấp';
type TaskType = 'Feature' | 'Bug' | 'Task' | 'Research';

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: string;           // null/undefined = Backlog
  parentTaskId?: string;       // sub-task
  assignees: TaskAssignee[];
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  startDate?: string;
  dueDate?: string;
  progressPercent: number;     // 0–100
  progressHistory?: SubstitutionLog[];
  statusHistory?: TaskStatusLog[];
  comments?: TaskComment[];
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  createdBy: string;
}

interface TaskAssignee {
  personnelId: string;
  assignedAt: string;
  assignedBy: string;
}

interface SubstitutionLog {
  fromPersonnelId: string;
  toPersonnelId: string;
  atProgress: number;          // % tiến độ lúc đổi người
  date: string;
  note?: string;
}

interface TaskStatusLog {
  id: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  changedById: string;
  changedByName: string;
  timestamp: string;
  note?: string;
}

interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}
```

**Quy tắc chuyển trạng thái Task:**
| Từ | Sang | Ai được phép |
|---|---|---|
| Todo | In Progress | Assignee, Lead, PM, CEO |
| In Progress | Review | Assignee, Lead, PM, CEO |
| Review | Done | Lead, PM, CEO (**assignee KHÔNG tự Done**) |
| Review | In Progress | Lead, PM, CEO (reject, trả lại) |

---

## WORKSHIFT & TIMESHEET

```typescript
interface WorkShift {
  id: string;
  projectId: string;
  date: string;
  shift: 'Morning' | 'Afternoon' | 'OT';
  personnelIds: string[];
  performanceRating?: 1 | 2 | 3 | 4 | 5;   // PM đánh giá
  note?: string;
}
```

---

## TRAINING PLAN

```typescript
interface TrainingPlan {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';
  trainers: TrainingPersonnel[];
  costs: TrainingCost[];
  customerContacts?: string;
  note?: string;
}

interface TrainingPersonnel {
  personnelId: string;
  role: 'Trainer' | 'Support';
  days: number;
}

interface TrainingCost {
  id: string;
  trainingPlanId: string;
  category: 'Di chuyển' | 'Lưu trú' | 'Ăn uống' | 'Tài liệu' | 'Thuê địa điểm' | 'Khác';
  description: string;
  amount: number;
  paidBy?: string;
  status: 'Kế hoạch' | 'Đã chi';
}
```

---

## PERSONNEL (EMPLOYEE)

```typescript
interface Employee {
  id: string;
  name: string;
  department: string;           // tên phòng ban (denormalized)
  departmentId?: string;
  role: AppRole;
  baseSalary?: number;          // ⭐ chỉ HR sửa
  jobTitle?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: 'Active' | 'Inactive';
  employmentStatus?: 'Đang làm việc' | 'Đang nghỉ phép' | 'Đã nghỉ việc';
  projectLabels?: string[];
  joinDate?: string;
}

interface Department {
  id: string;
  name: string;
  headId: string;               // = employeeId của Lead phòng
  description?: string;
  memberIds?: string[];
}
```

---

## APPROVAL REQUEST

```typescript
interface ApprovalRequest {
  id: string;
  title: string;
  type: 'ProjectPlan' | 'Expense' | 'Salary' | 'Asset' | 'PersonnelProject';
  priority: 'High' | 'Medium' | 'Low';
  targetRole: 'CEO' | 'Manager';
  projectId?: string;
  pendingMemberId?: string;     // ProjectMember.id chờ duyệt
  amount?: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedBy: string;          // tên người gửi
  requesterId: string;          // employeeId người gửi
  submittedAt: string;
  processedBy?: string;
  processedAt?: string;
  note?: string;                // lý do từ chối / ghi chú
  createdAt: string;
}

interface PersonnelRequest {
  id: string;
  projectId: string;
  requestedBy: string;
  employeeId: string;
  role: string;
  allocation: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  processedBy?: string;
  processedAt?: string;
}
```

---

## CASHFLOW

```typescript
interface CashFlowEntry {
  id: string;
  projectId?: string;
  type: 'Thu nhập' | 'Chi phí';
  category: 'Lương nhân sự' | 'CSVC' | 'Vendor' | 'Đào tạo' | 'Ngoài kế hoạch' | 'Doanh thu';
  amount: number;               // VND
  date: string;
  description?: string;
  source: 'Auto' | 'Manual';   // Auto = từ Payroll, Manual = kế toán nhập tay
  createdBy?: string;
}
```

---

## PAYROLL

```typescript
interface PayrollPeriod {
  id: string;
  month: number;               // 1–12
  year: number;
  status: 'Draft' | 'Confirmed';
  entries: EmployeeCost[];
  createdBy: string;
  confirmedAt?: string;
}

interface EmployeeCost {
  personnelId: string;
  payrollPeriodId: string;
  baseSalary: number;          // SNAPSHOT tại thời điểm chốt — không thay đổi sau
  allocationAmount: number;    // baseSalary × (%PB/100) × (ngày thực tế / ngày trong kỳ)
  timesheetAmount: number;     // OT hours × đơn giá OT (từ Settings)
  performanceBonus: number;    // từ PerformanceBonus PM đánh giá
  totalAmount: number;         // = allocationAmount + timesheetAmount + performanceBonus
}
```

> ⚠️ Sau khi Payroll `Confirmed`, hệ thống **tự động tạo CashFlowEntry** loại "Chi phí", category "Lương nhân sự"
