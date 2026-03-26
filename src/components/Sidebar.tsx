import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Wallet, 
  LogOut,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Settings,
  Receipt,
} from 'lucide-react';
import { useLayout } from './Layout';
import { useStore } from '../store/useStore';
import { canAccessRoute } from '../lib/permissions';

const navItems = [
  { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/' },
  { icon: FileText,         label: 'Hợp đồng',         path: '/contracts' },
  { icon: Briefcase,        label: 'Dự án',             path: '/projects' },
  { icon: Users,            label: 'Nhân sự',           path: '/personnel' },
  { icon: Wallet,           label: 'Bảng lương',        path: '/payroll' },
  { icon: TrendingUp,       label: 'Dòng tiền',         path: '/cashflow' },
  { icon: CheckSquare,      label: 'Phê duyệt',         path: '/approvals' },
  { icon: Settings,         label: 'Cài đặt',           path: '/settings' },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useLayout();
  const currentUser = useStore((s) => s.currentUser);
  const role = currentUser?.role;
  const visibleNav = navItems.filter((item) =>
    role ? canAccessRoute(item.path === '/' ? '/' : item.path, role) : true
  );

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 bg-white border-r border-[#E2E8F0] shadow-sm z-20 transition-all duration-250 shrink-0"
      style={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#E2E8F0] shrink-0 overflow-hidden">
        <div className="w-9 h-9 bg-[#148922] rounded-[8px] flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="font-bold text-[15px] text-[#1A202C] leading-tight whitespace-nowrap">ECOTECH 2A</h1>
            <p className="text-[11px] text-[#718096] whitespace-nowrap">Kiến trúc sư Tài chính</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visibleNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-150 group overflow-hidden ${
                isActive
                  ? 'bg-[#ECFDF5] text-[#148922] border-l-[3px] border-[#148922]'
                  : 'text-[#4A5568] hover:bg-[#F8FAFC] hover:text-[#1A202C] border-l-[3px] border-transparent'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#1A202C] text-white text-[12px] rounded-[6px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-[#E2E8F0] p-2">
        <button
          title={collapsed ? 'Đăng xuất' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-[#4A5568] hover:text-[#EF4444] hover:bg-red-50 rounded-[8px] text-[14px] font-medium transition-all group relative"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#1A202C] text-white text-[12px] rounded-[6px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Đăng xuất
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm hover:bg-[#F8FAFC] text-[#718096] transition-colors z-30"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
