import type { AppRole } from '../types';

/** Tài khoản quản trị (demo): toàn quyền truy cập & thao tác */
export function isAdmin(role: AppRole): boolean {
  return role === 'Admin';
}

/** Route: Admin xem tất cả màn */
export const ROUTE_ROLES: Record<string, AppRole[]> = {
  '': ['Admin', 'CEO', 'PM', 'Lead', 'Accountant', 'HR', 'Employee'],
  customers: ['Admin', 'CEO', 'PM'],
  contracts: ['Admin', 'CEO', 'PM', 'Lead', 'Accountant'],
  projects: ['Admin', 'CEO', 'PM', 'Lead', 'Accountant', 'Employee'],
  personnel: ['Admin', 'CEO', 'HR'],
  payroll: ['Admin', 'CEO', 'PM', 'Accountant', 'HR', 'Employee'],
  /** PM không vào màn Dòng tiền — chỉ Accountant/CEO ghi thu/chi (spec §4.10) */
  cashflow: ['Admin', 'CEO', 'Accountant'],
  approvals: ['Admin', 'CEO', 'PM', 'Lead'],
  settings: ['Admin', 'CEO', 'PM', 'Lead', 'Accountant', 'HR', 'Employee'],
};

/** Project sub-routes: projects/:id/* — same as projects for access */
export function canAccessRoute(pathname: string, role: AppRole): boolean {
  if (isAdmin(role)) return true;
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segments[0] === 'projects' && segments.length >= 2) {
    return ROUTE_ROLES.projects.includes(role);
  }
  const key = segments[0] ?? '';
  const allowed = ROUTE_ROLES[key];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function canCreateCashFlowEntry(role: AppRole): boolean {
  return isAdmin(role) || role === 'CEO' || role === 'Accountant';
}

export function canConfirmPayroll(role: AppRole): boolean {
  return isAdmin(role) || role === 'CEO' || role === 'Accountant';
}

export function canEditPersonnelCrud(role: AppRole): boolean {
  return isAdmin(role) || role === 'HR';
}

export function canViewPersonnelModule(role: AppRole): boolean {
  return isAdmin(role) || role === 'CEO' || role === 'HR';
}

export function canApproveCentralApprovals(role: AppRole): boolean {
  return isAdmin(role) || role === 'CEO';
}

/** Duyệt nhân sự dự án (PersonnelProject) */
export function canApprovePersonnelOnProject(role: AppRole): boolean {
  return isAdmin(role) || role === 'CEO';
}

/** Quyền PM/CEO trên board & task (xem toàn bộ task dự án, kéo ngược, panel PM) */
export function hasProjectManagerPrivileges(role: AppRole): boolean {
  return isAdmin(role) || role === 'PM' || role === 'CEO';
}

/** Review → Done: Employee không tự xác nhận; Lead / PM / CEO / Admin được phép (spec §4.5) */
export function canMoveTaskFromReviewToDone(role: AppRole): boolean {
  return isAdmin(role) || role === 'CEO' || role === 'PM' || role === 'Lead';
}
