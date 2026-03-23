import { create } from 'zustand';
import { 
  Project, 
  Customer, 
  Employee, 
  ApprovalRequest, 
  Contract,
  ProjectStatus
} from '../types';

interface StoreState {
  projects: Project[];
  customers: Customer[];
  employees: Employee[];
  contracts: Contract[];
  approvalRequests: ApprovalRequest[];
  currentUser: { id: string; name: string; role: 'PM' | 'CEO' };
  
  // Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addApprovalRequest: (request: ApprovalRequest) => void;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
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
      revenue: 450000, 
      expenses: 330000, 
      profit: 120000, 
      margin: 26.7,
      sprints: [
        { 
          id: 'spr-1', 
          projectId: '1', 
          name: 'Sprint 1', 
          sprintNo: 1, 
          startDate: '2026-01-01', 
          endDate: '2026-01-14', 
          status: 'Completed', 
          goal: 'Xây dựng khung ứng dụng và module quản lý nhân sự.' 
        },
        { 
          id: 'spr-2', 
          projectId: '1', 
          name: 'Sprint 2', 
          sprintNo: 2, 
          startDate: '2026-01-15', 
          endDate: '2026-01-28', 
          status: 'Active', 
          goal: 'Hoàn thiện module quản lý dự án và tích hợp realtime.' 
        },
      ],
      tasks: [
        { 
          id: 'task-1', 
          sprintId: 'spr-2', 
          title: 'Thiết kế màn hình Dashboard', 
          description: 'Thiết kế UI/UX cho màn hình tổng quan tài chính và dự án.', 
          priority: 'Cao', 
          type: 'Feature', 
          status: 'In Progress', 
          estimatedHours: 16, 
          actualHours: 10, 
          completionPercent: 65, 
          dueDate: '2026-01-22', 
          position: 1, 
          commentCount: 3,
          assigneeId: 'e1',
          isReviewedToday: true,
          startDate: '2026-01-15'
        },
        { 
          id: 'task-2', 
          sprintId: 'spr-2', 
          title: 'Build API quản lý dự án', 
          description: 'Xây dựng các endpoint CRUD cho dự án, sprint và task.', 
          priority: 'Cao', 
          type: 'Feature', 
          status: 'In Progress', 
          estimatedHours: 24, 
          actualHours: 12, 
          completionPercent: 40, 
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
  ],
  customers: [
    { id: 'c1', name: 'VinGroup', email: 'contact@vingroup.com', phone: '024 3974 9999', address: 'Số 7 Đường Bằng Lăng 1, Phường Việt Hưng, Quận Long Biên, Hà Nội' },
    { id: 'c2', name: 'Sun Group', email: 'info@sungroup.com.vn', phone: '024 3939 3399', address: 'Tầng 9, Tòa nhà Sun City, 13 Hai Bà Trưng, Hoàn Kiếm, Hà Nội' },
    { id: 'c3', name: 'Viettel', email: 'support@viettel.com.vn', phone: '1800 8098', address: 'Số 1 Trần Hữu Dực, Mỹ Đình 2, Nam Từ Liêm, Hà Nội' },
  ],
  employees: [
    { id: 'e1', name: 'Nguyễn Văn A', department: 'Software Engineering', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e1' },
    { id: 'e2', name: 'Trần Thị B', department: 'Software Engineering', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e2' },
    { id: 'e3', name: 'Lê Văn C', department: 'QA/QC', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e3' },
    { id: 'e4', name: 'Phạm Văn D', department: 'Product', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e4' },
    { id: 'e5', name: 'Hoàng Thị E', department: 'Design', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=e5' },
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
  currentUser: { id: 'e1', name: 'Nguyễn Văn A', role: 'PM' }, // Default to PM for testing

  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p))
  })),
  addApprovalRequest: (request) => set((state) => ({ approvalRequests: [request, ...state.approvalRequests] })),
  updateApprovalRequest: (id, updates) => set((state) => ({
    approvalRequests: state.approvalRequests.map((r) => (r.id === id ? { ...r, ...updates } : r))
  })),
  setProjects: (projects) => set({ projects }),
}));
