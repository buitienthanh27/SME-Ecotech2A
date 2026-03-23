export type ProjectStatus = 'Đang thực hiện' | 'Đã hoàn thành' | 'Tạm dừng' | 'Đang chờ' | 'Draft' | 'Chờ duyệt';

export interface ProjectCostItem {
  id: string;
  category: string;
  type: 'Nhân sự' | 'CSVC' | 'Vendor' | 'Khác';
  plannedAmount: number;
  notes: string;
}

export interface ProjectMemberAssignment {
  employeeId: string;
  role: 'PM' | 'Developer' | 'Tester' | 'Other';
}

export interface Project {
  id: string;
  name: string;
  code: string;
  customerId: string;
  contractId?: string;
  startDate: string;
  endDate: string;
  budget: number;
  description: string;
  status: ProjectStatus;
  pmId: string; // The PM who created it
  members: ProjectMemberAssignment[];
  costPlan: ProjectCostItem[];
  rejectionNote?: string;
  createdAt: string;
  // Existing fields for compatibility if needed, but we'll use the new ones
  revenue?: number;
  expenses?: number;
  profit?: number;
  margin?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  type: 'ProjectPlan' | 'Expense' | 'Salary' | 'Asset';
  priority: 'High' | 'Medium' | 'Low';
  targetRole: 'CEO' | 'Manager';
  projectId?: string;
  amount?: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedBy: string;
  requesterId: string;
  submittedAt: string;
  processedBy?: string;
  processedAt?: string;
  note?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  avatar?: string;
  status: 'Active' | 'Inactive';
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  salary: number;
  projects: string[];
  status: 'Đang làm việc' | 'Đang nghỉ phép' | 'Đã nghỉ việc';
}

export interface CashFlowEntry {
  id: string;
  date: string;
  type: 'Thu nhập' | 'Chi phí';
  category: string;
  amount: number;
  project?: string;
  status: 'Đang chờ' | 'Đã duyệt' | 'Đã từ chối';
}

export type TaskPriority = 'Cao' | 'Trung bình' | 'Thấp';
export type TaskType = 'Feature' | 'Bug' | 'Task' | 'Research';
export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Done' | 'Closed';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  sprintNo: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Planned';
  goal: string;
}

export interface Task {
  id: string;
  sprintId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  type: TaskType;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  completionPercent: number;
  dueDate: string;
  position: number;
  clonedFromTaskId?: string;
  commentCount: number;
  isReviewedToday?: boolean;
  assigneeId?: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  employeeId: string;
  isActive: boolean;
  progressAtHandover: number;
  assignedAt: string;
  handedOverAt?: string;
  handedOverToId?: string;
}

export interface SubstitutionLog {
  id: string;
  taskId: string;
  originalAssigneeId: string;
  newAssigneeId: string;
  progressAtSubstitution: number;
  reason: string;
  approvedByPMId: string;
  timestamp: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface DailyProgressLog {
  id: string;
  taskId: string;
  taskAssigneeId: string;
  reviewedByLeadId: string;
  logDate: string;            // ISO date string
  hoursWorked: number;      // input
  progressPercent: number;  // slider 0–100
  leadRating: 1 | 2 | 3 | 4 | 5;  // star rating
  leadComment: string;      // textarea
  isApprovedByLead: boolean;
  timestamp: string;
}

export interface PerformanceBonus {
  id: string;
  taskAssigneeId: string;
  taskId?: string; // Optional for linking
  employeeId: string;
  employeeCostId: string | null;  // null when Pending
  bonusAmount: number;
  bonusType: 'Xuất sắc' | 'Hoàn thành sớm' | 'Chất lượng cao' | 'Khác';
  reason: string;
  createdByPMId: string;
  status: 'Pending' | 'Linked' | 'Locked' | 'Cancelled';
  createdAt: string;
}

export interface EmployeeCost {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  basicSalary: number;
  allowances: number;
  bonus: number; // This will include PerformanceBonus
  ot: number;
  tax: number;
  grossSalary: number;
  netPay: number;
  projectBonuses?: PerformanceBonus[];
}

export interface PayrollPeriod {
  id: string;
  month: string; // YYYY-MM
  status: 'Open' | 'Locked';
  companyId: string;
  employeeCosts: EmployeeCost[];
}

export type ContractStatus = 'Draft' | 'Sent' | 'Signed' | 'Active' | 'Completed' | 'Cancelled';

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  clientName: string;
  value: number;
  startDate: string;
  endDate: string;
  signedDate?: string;
  status: ContractStatus;
  description: string;
  terms: string[];
  attachments?: string[];
  projectId?: string;
  createdAt: string;
}
