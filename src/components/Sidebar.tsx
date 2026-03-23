import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Wallet, 
  Receipt, 
  CheckSquare, 
  Settings, 
  LogOut,
  TrendingUp,
  FileText
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/' },
  { icon: FileText, label: 'Hợp đồng', path: '/contracts' },
  { icon: Briefcase, label: 'Dự án', path: '/projects' },
  { icon: Users, label: 'Nhân sự', path: '/personnel' },
  { icon: Wallet, label: 'Bảng lương', path: '/payroll' },
  { icon: TrendingUp, label: 'Dòng tiền', path: '/cashflow' },
  { icon: CheckSquare, label: 'Phê duyệt', path: '/approvals' },
  { icon: Settings, label: 'Cài đặt', path: '/settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-[#003366] text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center">
          <Receipt className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">ECOTECH</h1>
          <p className="text-xs text-white/60">Kiến trúc sư Tài chính</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-[#FF6600] text-white shadow-lg shadow-[#FF6600]/20" 
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
