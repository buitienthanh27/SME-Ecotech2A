import { create } from 'zustand';
import {
  Project,
  Customer,
  Employee,
  ApprovalRequest,
  Contract,
  ProjectStatus,
  PersonnelRequest,
  CashFlowEntry
} from '../types';

interface StoreState {
  projects: Project[];
  customers: Customer[];
  employees: Employee[];
  contracts: Contract[];
  approvalRequests: ApprovalRequest[];
  personnelRequests: PersonnelRequest[];
  cashFlowEntries: CashFlowEntry[];
  currentUser: { id: string; name: string; role: 'PM' | 'CEO' | 'Lead' | 'Employee' };

  // Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addApprovalRequest: (request: ApprovalRequest) => void;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
  addPersonnelRequest: (request: PersonnelRequest) => void;
  updatePersonnelRequest: (id: string, updates: Partial<PersonnelRequest>) => void;
  addCashFlowEntry: (entry: CashFlowEntry) => void;
  setProjects: (projects: Project[]) => void;
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
          status: 'Active'
        },
        {
          id: 'm2',
          employeeId: 'e2',
          projectId: '1',
          role: 'Developer',
          allocation: 100,
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          status: 'Active'
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
      tasks: [
        {
          id: 'task-1',
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
        { id: 'task-4', title: 'API tích hợp cổng thanh toán', description: 'Kết nối VNPay/Momo cho module thanh toán.', priority: 'Cao', type: 'Feature', status: 'Backlog', estimatedHours: 32, actualHours: 0, completionPercent: 0, dueDate: '2026-02-27', position: 2, commentCount: 0, assigneeId: 'e2',  startDate: '2026-02-22' }
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
        { id: 'task-5', title: 'Khảo sát dữ liệu nguồn', description: 'Đánh giá chất lượng và định dạng dữ liệu từ hệ thống Viettel.', priority: 'Cao', type: 'Research', status: 'Backlog', estimatedHours: 40, actualHours: 0, completionPercent: 0, dueDate: '2026-03-10', position: 1, commentCount: 0, assigneeId: 'e3',  startDate: '2026-03-01' },
        { id: 'task-6', title: 'Setup môi trường ML', description: 'Cấu hình Docker, Jupyter, và kết nối AWS SageMaker.', priority: 'Trung bình', type: 'Task', status: 'Backlog', estimatedHours: 16, actualHours: 0, completionPercent: 0, dueDate: '2026-03-07', position: 2, commentCount: 0, assigneeId: 'e2',  startDate: '2026-03-01' }
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
  employees: [
    { id: 'e1', name: 'Nguyễn Văn A', department: 'Software Engineering', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e1', role: 'PM' },
    { id: 'e2', name: 'Trần Thị B', department: 'Software Engineering', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e2', role: 'Employee' },
    { id: 'e3', name: 'Lê Văn C', department: 'QA/QC', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e3', role: 'Lead' },
    { id: 'e4', name: 'Phạm Văn D', department: 'Product', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e4', role: 'Lead' },
    { id: 'e5', name: 'Hoàng Thị E', department: 'Design', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e5', role: 'Employee' },
    { id: 'e6', name: 'Trịnh Văn F', department: 'Executive', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e6', role: 'CEO' },
  ],
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
  approvalRequests: [],
  personnelRequests: [],
  cashFlowEntries: [
    { id: '1', date: '15/03/2026', type: 'Thu nhập', category: 'Thanh toán dự án', amount: 45000000, project: 'Dự án Alpha', projectId: '1' },
    { id: '2', date: '14/03/2026', type: 'Chi phí', category: 'Vật tư', amount: 12500000, project: 'Dự án Gamma', projectId: '3' },
    { id: '3', date: '12/03/2026', type: 'Thu nhập', category: 'Tư vấn', amount: 8000000, project: 'Dự án Beta', projectId: '2' },
    { id: '4', date: '10/03/2026', type: 'Chi phí', category: 'Lương', amount: 45810000, project: 'Chung' },
    { id: '5', date: '08/03/2026', type: 'Chi phí', category: 'Thuê văn phòng', amount: 5000000, project: 'Chung' },
    { id: '6', date: '05/03/2026', type: 'Thu nhập', category: 'Tạm ứng', amount: 25000000, project: 'Dự án Epsilon' },
  ],
  currentUser: { id: 'e1', name: 'Nguyễn Văn A', role: 'PM' }, // Default to PM for testing

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
}));

