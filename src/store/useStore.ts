import { create } from 'zustand';
import {
  Project,
  Customer,
  Employee,
  ApprovalRequest,
  Contract,
  PersonnelRequest,
  CashFlowEntry,
  PayrollPeriod,
  AppRole,
  Department,
  EmployeeCost,
} from '../types';
import { DEPARTMENTS_SEED, buildInitialEmployees } from '../data/companyDirectorySeed';

function buildPayrollDemoCosts(employees: Employee[]): EmployeeCost[] {
  const picks = (['e1', 'e2', 'e3'] as const)
    .map((id) => employees.find((e) => e.id === id))
    .filter((e): e is Employee => Boolean(e));
  const templates = [
    { allowances: 2_000_000, ot: 500_000 },
    { allowances: 2_000_000, ot: 0 },
    { allowances: 1_500_000, ot: 300_000 },
  ];
  return picks.map((e, i) => {
    const basic = e.baseSalary ?? 0;
    const { allowances, ot } = templates[i] ?? templates[0];
    const bonus = 0;
    const gross = basic + allowances + bonus + ot;
    const tax = Math.round(gross * 0.055);
    const netPay = gross - tax;
    return {
      id: `ec${i + 1}`,
      employeeId: e.id,
      employeeName: e.name,
      role: String(e.jobTitle || e.role),
      basicSalary: basic,
      allowances,
      bonus,
      ot,
      tax,
      grossSalary: gross,
      netPay,
    };
  });
}

const seedEmployees = buildInitialEmployees();

interface StoreState {
  projects: Project[];
  customers: Customer[];
  employees: Employee[];
  departments: Department[];
  contracts: Contract[];
  approvalRequests: ApprovalRequest[];
  personnelRequests: PersonnelRequest[];
  cashFlowEntries: CashFlowEntry[];
  payrollPeriods: PayrollPeriod[];
  currentUser: { id: string; name: string; role: AppRole };

  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addApprovalRequest: (request: ApprovalRequest) => void;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
  addPersonnelRequest: (request: PersonnelRequest) => void;
  updatePersonnelRequest: (id: string, updates: Partial<PersonnelRequest>) => void;
  addCashFlowEntry: (entry: CashFlowEntry) => void;
  setProjects: (projects: Project[]) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addEmployee: (employee: Employee) => void;
  removeEmployee: (id: string) => void;
  addDepartment: (department: Department) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  removeDepartment: (id: string) => void;
  updateBaseSalary: (personnelId: string, amount: number) => void;
  updatePayrollPeriod: (id: string, updates: Partial<PayrollPeriod>) => void;
  setPayrollPeriods: (periods: PayrollPeriod[] | ((prev: PayrollPeriod[]) => PayrollPeriod[])) => void;
  /** Chốt kỳ lương: tạo CashFlowEntry lương (Auto) */
  confirmPayrollPeriod: (periodId: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  projects: [
    {
      id: '1',
      name: 'Dự án Alpha',
      code: 'ALPHA-001',
      customerId: 'c1',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      budget: 1200000000,
      description: 'Dự án phát triển phần mềm quản lý tài chính.',
      status: 'Đang thực hiện',
      pmId: 'e1',
      members: [
        {
          id: 'm1',
          employeeId: 'e1',
          projectId: '1',
          role: 'PM',
          allocation: 50,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: 'Active',
          approvalStatus: 'Approved'
        },
        {
          id: 'm2',
          employeeId: 'e2',
          projectId: '1',
          role: 'Developer',
          allocation: 100,
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          status: 'Active',
          approvalStatus: 'Approved'
        },
        {
          id: 'm-demo-pend',
          employeeId: 'e5',
          projectId: '1',
          role: 'Designer',
          allocation: 20,
          startDate: '2026-03-01',
          endDate: '2026-12-31',
          status: 'Active',
          approvalStatus: 'Pending'
        }
      ],
      costPlan: [
        { id: 'cp1', category: 'Lương nhân sự', type: 'Nhân sự', plannedAmount: 800000000, notes: 'Chi phí lương cho team dev' }
      ],
      createdAt: new Date().toISOString(),
      revenue: 650000000,
      expenses: 400000000,
      profit: 250000000,
      margin: 38.46,
      actualIncome: 650000000,
      actualExpense: 400000000,
      sprints: [
        {
          id: 'sprint-alpha-1',
          projectId: '1',
          name: 'Sprint 1 — Khởi tạo',
          sprintNo: 1,
          startDate: '2026-01-15',
          endDate: '2026-01-31',
          status: 'Active',
          goal: 'UI Dashboard + API dự án',
        },
      ],
      tasks: [
        {
          id: 'task-1',
          sprintId: 'sprint-alpha-1',
          title: 'Thiết kế màn hình Dashboard',
          description: 'Thiết kế UI/UX cho màn hình tổng quan tài chính và dự án.',
          priority: 'Cao',
          type: 'Feature',
          status: 'In Progress',
          estimatedHours: 16,
          actualHours: 10,
          completionPercent: 25,
          dueDate: '2026-01-22',
          position: 1,
          commentCount: 3,
          assigneeId: 'e1',
          
          startDate: '2026-01-15'
        },
        {
          id: 'task-2',
          sprintId: 'sprint-alpha-1',
          title: 'Build API quản lý dự án',
          description: 'Xây dựng các endpoint CRUD cho dự án, sprint và task.',
          priority: 'Cao',
          type: 'Feature',
          status: 'In Progress',
          estimatedHours: 24,
          actualHours: 12,
          completionPercent: 25,
          dueDate: '2026-01-25',
          position: 2,
          commentCount: 1,
          assigneeId: 'e2',
          startDate: '2026-01-18'
        }
      ],
      workSchedules: [
        {
          id: 'ws1',
          projectId: '1',
          employeeId: 'e1',
          taskId: 'task-1',
          date: '2026-01-18',
          type: 'Sáng',
          efficiency: 95,
          isProductive: true,
          notes: 'Hoàn thiện layout'
        },
        {
          id: 'ws2',
          projectId: '1',
          employeeId: 'e1',
          taskId: 'task-1',
          date: '2026-01-18',
          type: 'Chiều',
          efficiency: 90,
          isProductive: true,
          notes: 'Review design'
        },
        {
          id: 'ws3',
          projectId: '1',
          employeeId: 'e2',
          taskId: 'task-2',
          date: '2026-01-18',
          type: 'Sáng',
          efficiency: 85,
          isProductive: true,
          notes: 'Setup database schema'
        },
        {
          id: 'ws4',
          projectId: '1',
          employeeId: 'e1',
          taskId: 'task-1',
          date: '2026-01-18',
          type: 'OT',
          efficiency: 100,
          isProductive: true,
          notes: 'Fixing critical bugs'
        }
      ]
    },
    // === Thêm 3 project mới vào mảng projects ===
    {
      id: '2',
      name: 'Dự án Beta',
      code: 'BETA-002',
      customerId: 'c2',
      startDate: '2026-02-01',
      endDate: '2026-08-31',
      budget: 850000000,
      description: 'Xây dựng nền tảng web quản lý resort và booking cho Sun Group.',
      status: 'Đang thực hiện',
      pmId: 'e4',
      members: [
        { id: 'm3', employeeId: 'e4', projectId: '2', role: 'PM', allocation: 50, startDate: '2026-02-01', endDate: '2026-08-31', status: 'Active' },
        { id: 'm4', employeeId: 'e2', projectId: '2', role: 'Frontend Dev', allocation: 100, startDate: '2026-02-01', endDate: '2026-05-31', status: 'Active' },
        { id: 'm5', employeeId: 'e5', projectId: '2', role: 'UI/UX Designer', allocation: 30, startDate: '2026-02-01', endDate: '2026-03-15', status: 'Active' }
      ],
      costPlan: [
        { id: 'cp2', category: 'Lương nhân sự', type: 'Nhân sự', plannedAmount: 500000000, notes: 'Team frontend + design' },
        { id: 'cp3', category: 'Hệ tống cloud', type: 'CSVC', plannedAmount: 120000000, notes: 'AWS/Azure cho staging & production' }
      ],
      createdAt: new Date().toISOString(),
      revenue: 400000000,
      expenses: 280000000,
      profit: 120000000,
      margin: 30,
      actualIncome: 400000000,
      actualExpense: 280000000,
      tasks: [
        { id: 'task-3', title: 'Thiết kế luồng đặt phòng', description: 'Wireframe + high-fidelity cho luồng booking 3 bước.', priority: 'Cao', type: 'Task', status: 'In Progress', estimatedHours: 20, actualHours: 14, completionPercent: 70, dueDate: '2026-02-20', position: 1, commentCount: 2, assigneeId: 'e5',  startDate: '2026-02-15' },
        { id: 'task-4', title: 'API tích hợp cổng thanh toán', description: 'Kết nối VNPay/Momo cho module thanh toán.', priority: 'Cao', type: 'Feature', status: 'Todo', estimatedHours: 32, actualHours: 0, completionPercent: 0, dueDate: '2026-02-27', position: 2, commentCount: 0, assigneeId: 'e2',  startDate: '2026-02-22' }
      ],
      workSchedules: [
        { id: 'ws5', projectId: '2', employeeId: 'e5', taskId: 'task-3', date: '2026-01-18', type: 'Sáng', efficiency: 92, isProductive: true, notes: 'Finalize wireframe booking flow' },
        { id: 'ws6', projectId: '2', employeeId: 'e4', taskId: null, date: '2026-01-18', type: 'Chiều', efficiency: 88, isProductive: true, notes: 'Meeting với client Sun Group' }
      ]
    },
    {
      id: '3',
      name: 'Dự án Gamma',
      code: 'GAMMA-003',
      customerId: 'c3',
      startDate: '2026-03-01',
      endDate: '2027-02-28',
      budget: 2100000000,
      description: 'Hệ thống AI phân tích dữ liệu viễn thông và dự báo nhu cầu mạng cho Viettel.',
      status: 'Đang chờ',
      pmId: 'e1',
      members: [
        { id: 'm6', employeeId: 'e1', projectId: '3', role: 'PM', allocation: 30, startDate: '2026-03-01', endDate: '2027-02-28', status: 'Active' },
        { id: 'm7', employeeId: 'e3', projectId: '3', role: 'AI Engineer', allocation: 100, startDate: '2026-03-01', endDate: '2026-12-31', status: 'Active' },
        { id: 'm8', employeeId: 'e2', projectId: '3', role: 'Backend Dev', allocation: 50, startDate: '2026-04-01', endDate: '2026-12-31', status: 'Inactive' }
      ],
      costPlan: [
        { id: 'cp4', category: 'Lương nhân sự', type: 'Nhân sự', plannedAmount: 1200000000, notes: 'Team AI/ML + backend' },
        { id: 'cp5', category: 'GPU Cloud', type: 'CSVC', plannedAmount: 450000000, notes: 'Training model trên AWS SageMaker' },
        { id: 'cp6', category: 'Dữ liệu & License', type: 'Khác', plannedAmount: 200000000, notes: 'Mua dataset và license thư viện ML' }
      ],
      createdAt: new Date().toISOString(),
      revenue: 0,
      expenses: 0,
      profit: 0,
      margin: 0,
      actualIncome: 0,
      actualExpense: 0,
      tasks: [
        { id: 'task-5', title: 'Khảo sát dữ liệu nguồn', description: 'Đánh giá chất lượng và định dạng dữ liệu từ hệ thống Viettel.', priority: 'Cao', type: 'Research', status: 'Todo', estimatedHours: 40, actualHours: 0, completionPercent: 0, dueDate: '2026-03-10', position: 1, commentCount: 0, assigneeId: 'e3',  startDate: '2026-03-01' },
        { id: 'task-6', title: 'Setup môi trường ML', description: 'Cấu hình Docker, Jupyter, và kết nối AWS SageMaker.', priority: 'Trung bình', type: 'Task', status: 'Todo', estimatedHours: 16, actualHours: 0, completionPercent: 0, dueDate: '2026-03-07', position: 2, commentCount: 0, assigneeId: 'e2',  startDate: '2026-03-01' }
      ],
      workSchedules: []
    },
    {
      id: '4',
      name: 'Dự án Delta',
      code: 'DELTA-INT',
      customerId: null,
      startDate: '2026-01-15',
      endDate: '2026-06-30',
      budget: 300000000,
      description: 'Dự án nội bộ: Xây dựng công cụ auto-generate tài liệu kỹ thuật từ code.',
      status: 'Đang thực hiện',
      pmId: 'e3',
      members: [
        { id: 'm9', employeeId: 'e3', projectId: '4', role: 'PM', allocation: 20, startDate: '2026-01-15', endDate: '2026-06-30', status: 'Active' },
        { id: 'm10', employeeId: 'e2', projectId: '4', role: 'Fullstack Dev', allocation: 40, startDate: '2026-01-15', endDate: '2026-06-30', status: 'Active' }
      ],
      costPlan: [
        { id: 'cp7', category: 'Lương nhân sự', type: 'Nhân sự', plannedAmount: 250000000, notes: 'Part-time cho team R&D' },
        { id: 'cp8', category: 'Công cụ & License', type: 'Khác', plannedAmount: 50000000, notes: 'License thư viện parsing code' }
      ],
      createdAt: new Date().toISOString(),
      revenue: 0,
      expenses: 85000,
      profit: -85000,
      margin: -28.3,
      tasks: [
        { id: 'task-7', title: 'Parser AST cho TypeScript', description: 'Dùng @typescript-eslint/parser để trích xuất cấu trúc code.', priority: 'Cao', type: 'Feature', status: 'In Progress', estimatedHours: 24, actualHours: 18, completionPercent: 75, dueDate: '2026-01-24', position: 1, commentCount: 4, assigneeId: 'e2',  startDate: '2026-01-15' },
        { id: 'task-8', title: 'Generator Markdown template', description: 'Tạo template và logic render tài liệu từ AST.', priority: 'Trung bình', type: 'Feature', status: 'In Progress', estimatedHours: 16, actualHours: 8, completionPercent: 50, dueDate: '2026-01-26', position: 2, commentCount: 1, assigneeId: 'e2',  startDate: '2026-01-20' }
      ],
      workSchedules: [
        { id: 'ws7', projectId: '4', employeeId: 'e2', taskId: 'task-7', date: '2026-01-18', type: 'Sáng', efficiency: 95, isProductive: true, notes: 'Hoàn thành parser cơ bản' },
        { id: 'ws8', projectId: '4', employeeId: 'e2', taskId: 'task-8', date: '2026-01-18', type: 'Chiều', efficiency: 88, isProductive: true, notes: 'Implement template engine' },
        { id: 'ws9', projectId: '4', employeeId: 'e3', taskId: null, date: '2026-01-18', type: 'Sáng', efficiency: 70, isProductive: true, notes: 'Review kiến trúc và planning sprint 2' }
      ]
    },
  ],
  customers: [
    { id: 'c1', name: 'VinGroup', email: 'contact@vingroup.com', phone: '024 3974 9999', address: 'Số 7 Đường Bàng Lang 1, Phường Việt Hùng, Quận Long Biên, Hà Nội' },
    { id: 'c2', name: 'Sun Group', email: 'info@sungroup.com.vn', phone: '024 3939 3399', address: 'Tầng 9, Tòa nhà Sun City, 13 Hai Bà Trung, Hoàn Kiếm, Hà Nội' },
    { id: 'c3', name: 'Viettel', email: 'support@viettel.com.vn', phone: '1800 8098', address: 'Số 1 Trần Hữu Đức, Mễ Trì 2, Nam Từ Liêm, Hà Nội' },
  ],
  employees: seedEmployees,
  departments: DEPARTMENTS_SEED.map((d) => ({ ...d })),
  contracts: [
    {
      id: 'ct1',
      contractNumber: 'HD-2026-001',
      title: 'Hợp đồng phát triển App VinGroup',
      clientName: 'VinGroup',
      value: 1500000000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'Signed',
      description: 'Phát triển ứng dụng di động cho VinGroup',
      terms: ['Thanh toán 3 đợt', 'Bảo hành 12 tháng'],
      createdAt: new Date().toISOString()
    },
  ],
  approvalRequests: [
    {
      id: 'apr-demo-1',
      title: 'Duyệt nhân sự dự án Alpha — Hoàng Thị E',
      type: 'PersonnelProject',
      priority: 'Medium',
      targetRole: 'CEO',
      projectId: '1',
      pendingMemberId: 'm-demo-pend',
      status: 'Pending',
      submittedBy: 'Trưởng phòng',
      requesterId: 'e3',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
  personnelRequests: [],
  cashFlowEntries: [
    { id: '1', date: '15/03/2026', type: 'Thu nhập', category: 'Thanh toán dự án', amount: 45000000, project: 'Dự án Alpha', projectId: '1', source: 'Manual' },
    { id: '2', date: '14/03/2026', type: 'Chi phí', category: 'Vật tư', amount: 12500000, project: 'Dự án Gamma', projectId: '3', source: 'Manual' },
    { id: '3', date: '12/03/2026', type: 'Thu nhập', category: 'Tư vấn', amount: 8000000, project: 'Dự án Beta', projectId: '2', source: 'Manual' },
    { id: '4', date: '10/03/2026', type: 'Chi phí', category: 'Lương', amount: 45810000, project: 'Chung', source: 'Manual' },
    { id: '5', date: '08/03/2026', type: 'Chi phí', category: 'Thuê văn phòng', amount: 5000000, project: 'Chung', source: 'Manual' },
    { id: '6', date: '05/03/2026', type: 'Thu nhập', category: 'Tạm ứng', amount: 25000000, project: 'Dự án Epsilon', source: 'Manual' },
  ],
  payrollPeriods: [
    {
      id: 'p1',
      month: '2026-03',
      status: 'Open',
      companyId: 'c1',
      createdBy: 'e7',
      employeeCosts: buildPayrollDemoCosts(seedEmployees),
    },
  ],
  /** Mặc định: Admin — toàn quyền (demo). Đổi sang e1/e6/… để test vai trò nghiệp vụ. */
  currentUser: { id: 'admin', name: 'Quản trị hệ thống', role: 'Admin' },

  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p))
  })),
  addApprovalRequest: (request) => set((state) => ({ approvalRequests: [request, ...state.approvalRequests] })),
  updateApprovalRequest: (id, updates) => set((state) => ({
    approvalRequests: state.approvalRequests.map((r) => (r.id === id ? { ...r, ...updates } : r))
  })),
  addPersonnelRequest: (request) => set((state) => ({ personnelRequests: [request, ...state.personnelRequests] })),
  updatePersonnelRequest: (id, updates) => set((state) => ({
    personnelRequests: state.personnelRequests.map((r) => (r.id === id ? { ...r, ...updates } : r))
  })),
  addCashFlowEntry: (entry) => set((state) => ({ cashFlowEntries: [entry, ...state.cashFlowEntries] })),
  setProjects: (projects) => set({ projects }),
  updateEmployee: (id, updates) =>
    set((state) => ({
      employees: state.employees.map((e) => {
        if (e.id !== id) return e;
        const merged = { ...e, ...updates };
        if (updates.departmentId !== undefined) {
          if (merged.departmentId) {
            const dept = state.departments.find((d) => d.id === merged.departmentId);
            merged.department = dept?.name ?? merged.department;
          } else {
            merged.department = 'Vãng lai';
          }
        }
        return merged;
      }),
    })),
  addEmployee: (employee) => set((state) => ({ employees: [...state.employees, employee] })),
  removeEmployee: (id) =>
    set((state) => {
      if (id === 'admin') return state;
      return {
        employees: state.employees.filter((e) => e.id !== id),
        departments: state.departments.map((d) => (d.headId === id ? { ...d, headId: '' } : d)),
      };
    }),
  addDepartment: (department) => set((state) => ({ departments: [department, ...state.departments] })),
  updateDepartment: (id, updates) =>
    set((state) => {
      const departments = state.departments.map((d) => (d.id === id ? { ...d, ...updates } : d));
      const dept = departments.find((d) => d.id === id);
      const employees =
        dept && updates.name !== undefined
          ? state.employees.map((e) =>
              e.departmentId === id ? { ...e, department: dept.name } : e
            )
          : state.employees;
      return { departments, employees };
    }),
  removeDepartment: (id) =>
    set((state) => ({
      departments: state.departments.filter((d) => d.id !== id),
      employees: state.employees.map((e) =>
        e.departmentId === id ? { ...e, departmentId: undefined, department: 'Vãng lai' } : e
      ),
    })),
  updateBaseSalary: (personnelId, amount) =>
    set((state) => ({
      employees: state.employees.map((e) => (e.id === personnelId ? { ...e, baseSalary: amount } : e)),
    })),
  updatePayrollPeriod: (id, updates) =>
    set((state) => ({
      payrollPeriods: state.payrollPeriods.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  setPayrollPeriods: (periods) =>
    set((state) => ({
      payrollPeriods: typeof periods === 'function' ? periods(state.payrollPeriods) : periods,
    })),
  confirmPayrollPeriod: (periodId) =>
    set((state) => {
      const period = state.payrollPeriods.find((p) => p.id === periodId);
      if (!period || period.status === 'Locked') return state;
      const totalNet = period.employeeCosts.reduce((s, ec) => s + ec.netPay, 0);
      const entry: CashFlowEntry = {
        id: `cf-payroll-${periodId}-${Date.now()}`,
        date: new Date().toLocaleDateString('vi-VN'),
        type: 'Chi phí',
        category: 'Lương nhân sự',
        amount: totalNet,
        project: 'Chung',
        source: 'Auto',
        description: `Tổng lương kỳ ${period.month} (chốt)`,
        createdBy: state.currentUser.id,
      };
      return {
        payrollPeriods: state.payrollPeriods.map((p) =>
          p.id === periodId ? { ...p, status: 'Locked' as const } : p
        ),
        cashFlowEntries: [entry, ...state.cashFlowEntries],
      };
    }),
}));

