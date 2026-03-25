import type { AppRole, Department, Employee } from '../types';

const R = [
  { name: 'Nguyễn Văn A', jobTitle: 'Quản lý dự án', salaryUi: 120000, employmentStatus: 'Đang làm việc' as const, email: 'a.nguyen@ecotech.com', phone: '+84 234 567 890', departmentId: 'd1', projects: ['Dự án Alpha', 'Dự án Gamma'] },
  { name: 'Trần Thị B', jobTitle: 'Kiến trúc sư cao cấp', salaryUi: 110000, employmentStatus: 'Đang làm việc' as const, email: 'b.tran@ecotech.com', phone: '+84 234 567 891', departmentId: 'd1', projects: ['Dự án Beta'] },
  { name: 'Lê Văn C', jobTitle: 'Chuyên viên phân tích tài chính', salaryUi: 95000, employmentStatus: 'Đang làm việc' as const, email: 'c.le@ecotech.com', phone: '+84 234 567 892', departmentId: 'd2', projects: ['Dự án Alpha', 'Dự án Delta'] },
  { name: 'Phạm Văn D', jobTitle: 'Cố vấn pháp lý', salaryUi: 150000, employmentStatus: 'Đang làm việc' as const, email: 'd.pham@ecotech.com', phone: '+84 234 567 893', departmentId: '', projects: ['Dự án Gamma'] },
  { name: 'Hoàng Thị E', jobTitle: 'Quản lý vận hành', salaryUi: 105000, employmentStatus: 'Đang nghỉ phép' as const, email: 'e.hoang@ecotech.com', phone: '+84 234 567 894', departmentId: '', projects: ['Dự án Epsilon'] },
  { name: 'Ngô Văn F', jobTitle: 'Kiểm soát chi phí', salaryUi: 115000, employmentStatus: 'Đang làm việc' as const, email: 'f.ngo@ecotech.com', phone: '+84 234 567 895', departmentId: 'd2', projects: ['Dự án Beta', 'Dự án Delta'] },
  { name: 'Đặng Thị G', jobTitle: 'Trưởng phòng Kinh doanh', salaryUi: 135000, employmentStatus: 'Đang làm việc' as const, email: 'g.dang@ecotech.com', phone: '+84 234 567 896', departmentId: 'd3', projects: ['Dự án Zeta', 'Dự án Eta'] },
  { name: 'Vũ Văn H', jobTitle: 'Quản lý Nhân sự', salaryUi: 100000, employmentStatus: 'Đang làm việc' as const, email: 'h.vu@ecotech.com', phone: '+84 234 567 897', departmentId: 'd4', projects: ['Dự án Nhân tài 2026'] },
  { name: 'Bùi Thị I', jobTitle: 'Giám đốc Marketing', salaryUi: 140000, employmentStatus: 'Đang làm việc' as const, email: 'i.bui@ecotech.com', phone: '+84 234 567 898', departmentId: 'd5', projects: ['Chiến dịch Tết 2026', 'Rebranding EcoTech'] },
  { name: 'Đỗ Văn J', jobTitle: 'Chuyên viên Hành chính', salaryUi: 75000, employmentStatus: 'Đang làm việc' as const, email: 'j.do@ecotech.com', phone: '+84 234 567 899', departmentId: 'd6', projects: ['Cải tiến quy trình văn phòng'] },
  { name: 'Lý Thị K', jobTitle: 'Nghiên cứu viên AI', salaryUi: 125000, employmentStatus: 'Đang làm việc' as const, email: 'k.ly@ecotech.com', phone: '+84 234 567 900', departmentId: 'd7', projects: ['Dự án AI Assistant', 'Dự án Gamma'] },
  { name: 'Triệu Văn L', jobTitle: 'Trưởng nhóm CSKH', salaryUi: 90000, employmentStatus: 'Đang làm việc' as const, email: 'l.trieu@ecotech.com', phone: '+84 234 567 901', departmentId: 'd8', projects: ['Nâng cao trải nghiệm khách hàng'] },
  { name: 'Cao Thị M', jobTitle: 'Kỹ sư hệ thống', salaryUi: 115000, employmentStatus: 'Đang làm việc' as const, email: 'm.cao@ecotech.com', phone: '+84 234 567 902', departmentId: 'd9', projects: ['Nâng cấp hạ tầng cloud'] },
  { name: 'Mai Văn N', jobTitle: 'Chuyên gia đào tạo', salaryUi: 95000, employmentStatus: 'Đang làm việc' as const, email: 'n.mai@ecotech.com', phone: '+84 234 567 903', departmentId: 'd10', projects: ['Chương trình Onboarding 2026'] },
  { name: 'Tô Thị O', jobTitle: 'Luật sư doanh nghiệp', salaryUi: 130000, employmentStatus: 'Đang làm việc' as const, email: 'o.to@ecotech.com', phone: '+84 234 567 904', departmentId: 'd11', projects: ['Rà soát hợp đồng đối tác'] },
  { name: 'Hà Văn P', jobTitle: 'Chuyên viên mua hàng', salaryUi: 85000, employmentStatus: 'Đang nghỉ phép' as const, email: 'p.ha@ecotech.com', phone: '+84 234 567 905', departmentId: 'd12', projects: ['Đàm phán nhà cung cấp Q1'] },
];

/** Chỉ số dòng R (0-based) → id nhân viên (e1–e8 lõi dự án, e9+ mở rộng) */
const EMP_ORDER: { id: string; row: number; role: AppRole; baseSalary: number }[] = [
  { id: 'e1', row: 0, role: 'PM', baseSalary: 25_000_000 },
  { id: 'e2', row: 1, role: 'Employee', baseSalary: 18_000_000 },
  { id: 'e3', row: 2, role: 'Lead', baseSalary: 22_000_000 },
  { id: 'e4', row: 3, role: 'Lead', baseSalary: 21_000_000 },
  { id: 'e5', row: 4, role: 'Employee', baseSalary: 16_000_000 },
  { id: 'e6', row: -1, role: 'CEO', baseSalary: 0 },
  { id: 'e7', row: -1, role: 'Accountant', baseSalary: 18_000_000 },
  { id: 'e8', row: 7, role: 'HR', baseSalary: 15_000_000 },
  { id: 'e9', row: 6, role: 'Lead', baseSalary: 135_000 * 1000 },
  { id: 'e10', row: 5, role: 'Employee', baseSalary: 115_000 * 1000 },
  { id: 'e11', row: 8, role: 'Employee', baseSalary: 140_000 * 1000 },
  { id: 'e12', row: 9, role: 'Employee', baseSalary: 75_000 * 1000 },
  { id: 'e13', row: 10, role: 'Employee', baseSalary: 125_000 * 1000 },
  { id: 'e14', row: 11, role: 'Employee', baseSalary: 90_000 * 1000 },
  { id: 'e15', row: 12, role: 'Employee', baseSalary: 115_000 * 1000 },
  { id: 'e16', row: 13, role: 'Employee', baseSalary: 95_000 * 1000 },
  { id: 'e17', row: 14, role: 'Employee', baseSalary: 130_000 * 1000 },
  { id: 'e18', row: 15, role: 'Employee', baseSalary: 85_000 * 1000 },
];

function deptName(deptId: string, departments: Department[]): string {
  if (!deptId) return 'Vãng lai';
  return departments.find((d) => d.id === deptId)?.name || 'Vãng lai';
}

export const DEPARTMENTS_SEED: Department[] = [
  { id: 'd1', name: 'Phòng Kỹ thuật', headId: 'e1', description: 'Chịu trách nhiệm phát triển phần mềm' },
  { id: 'd2', name: 'Phòng Tài chính', headId: 'e3', description: 'Quản lý ngân sách và luồng tiền' },
  { id: 'd3', name: 'Phòng Kinh doanh', headId: 'e9', description: 'Tìm kiếm khách hàng và phát triển doanh thu' },
  { id: 'd4', name: 'Phòng Nhân sự', headId: 'e8', description: 'Tuyển dụng, đào tạo và quản lý nhân sự' },
  { id: 'd5', name: 'Phòng Marketing', headId: 'e11', description: 'Xây dựng thương hiệu và chiến dịch truyền thông' },
  { id: 'd6', name: 'Phòng Hành chính', headId: 'e12', description: 'Quản lý văn phòng, hậu cần và thủ tục nội bộ' },
  { id: 'd7', name: 'Phòng Nghiên cứu & Phát triển', headId: 'e13', description: 'Nghiên cứu công nghệ mới và đổi mới sản phẩm' },
  { id: 'd8', name: 'Phòng Chăm sóc khách hàng', headId: 'e14', description: 'Hỗ trợ và duy trì mối quan hệ với khách hàng' },
  { id: 'd9', name: 'Phòng Hạ tầng CNTT', headId: 'e15', description: 'Quản lý hệ thống mạng, máy chủ và bảo mật' },
  { id: 'd10', name: 'Phòng Đào tạo', headId: 'e16', description: 'Phát triển năng lực và chương trình đào tạo nội bộ' },
  { id: 'd11', name: 'Phòng Pháp chế', headId: 'e17', description: 'Tư vấn pháp lý và quản lý rủi ro hợp đồng' },
  { id: 'd12', name: 'Phòng Mua hàng', headId: 'e18', description: 'Tìm nguồn cung ứng và đàm phán với nhà cung cấp' },
];

export function buildDirectoryEmployees(depts: Department[]): Employee[] {
  return EMP_ORDER.map((spec) => {
    let name: string;
    let jobTitle: string;
    let email: string;
    let phone: string;
    let departmentId: string;
    let projects: string[];
    let employmentStatus: 'Đang làm việc' | 'Đang nghỉ phép' | 'Đã nghỉ việc';
    let salaryUi: number;

    if (spec.row < 0) {
      if (spec.id === 'e6') {
        name = 'Trịnh Văn F';
        jobTitle = 'Tổng Giám đốc';
        email = 'f.trinh@ecotech.com';
        phone = '+84 234 567 800';
        departmentId = '';
        projects = [];
        employmentStatus = 'Đang làm việc';
        salaryUi = 0;
      } else {
        name = 'Kế toán G';
        jobTitle = 'Kế toán trưởng';
        email = 'g.kt@ecotech.com';
        phone = '+84 234 567 801';
        departmentId = 'd2';
        projects = [];
        employmentStatus = 'Đang làm việc';
        salaryUi = 180000;
      }
    } else {
      const row = R[spec.row];
      name = row.name;
      jobTitle = row.jobTitle;
      email = row.email;
      phone = row.phone;
      departmentId = row.departmentId;
      projects = row.projects;
      employmentStatus = row.employmentStatus;
      salaryUi = row.salaryUi;
    }

    const operational: 'Active' | 'Inactive' =
      employmentStatus === 'Đã nghỉ việc' ? 'Inactive' : 'Active';

    return {
      id: spec.id,
      name,
      department: deptName(departmentId, depts),
      departmentId: departmentId || undefined,
      jobTitle,
      email,
      phone,
      employmentStatus,
      projectLabels: projects,
      avatar: `https://i.pravatar.cc/150?u=${spec.id}`,
      status: operational,
      role: spec.role,
      baseSalary: spec.baseSalary > 0 ? spec.baseSalary : salaryUi * 1000,
    };
  });
}

export function buildAdminEmployee(): Employee {
  return {
    id: 'admin',
    name: 'Quản trị hệ thống',
    department: 'Quản trị',
    status: 'Active',
    avatar: 'https://i.pravatar.cc/150?u=admin',
    role: 'Admin',
    baseSalary: 0,
    jobTitle: 'Quản trị hệ thống',
    email: 'admin@ecotech.com',
  };
}

export function buildInitialEmployees(): Employee[] {
  const depts = DEPARTMENTS_SEED;
  return [...buildDirectoryEmployees(depts), buildAdminEmployee()];
}
