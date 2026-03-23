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
        { employeeId: 'e1', role: 'PM' },
        { employeeId: 'e2', role: 'Developer' }
      ],
      costPlan: [
        { id: 'cp1', category: 'Lương nhân sự', type: 'Nhân sự', plannedAmount: 800000000, notes: 'Chi phí lương cho team dev' }
      ],
      createdAt: new Date().toISOString(),
      revenue: 450000, 
      expenses: 330000, 
      profit: 120000, 
      margin: 26.7 
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
