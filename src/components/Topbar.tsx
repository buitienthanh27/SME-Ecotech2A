import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, X, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const NOTIFICATIONS = [
  { id: 1, title: 'Phê duyệt đang chờ', desc: 'Có 2 yêu cầu phê duyệt cần xử lý', time: '5 phút', unread: true, link: '/approvals' },
  { id: 2, title: 'Lương tháng 3', desc: 'Đến hạn thanh toán trong 3 ngày', time: '1 giờ', unread: true, link: '/payroll' },
  { id: 3, title: 'Dự án Alpha', desc: 'Vượt ngân sách 15% tháng này', time: '3 giờ', unread: false, link: '/projects' },
];

const roleLabel: Record<string, string> = {
  Admin: 'Quản trị (toàn quyền)',
  CEO: 'CEO',
  PM: 'PM',
  Lead: 'Lead',
  Accountant: 'Kế toán',
  HR: 'Nhân sự',
  Employee: 'Nhân viên',
};

export function Topbar() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const initials =
    currentUser.name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className="bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 sticky top-0 z-10 shrink-0"
      style={{ height: 'var(--navbar-height)' }}
    >
      {/* Global Search */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm dự án, nhân sự, giao dịch..."
          className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#148922]/20 focus:border-[#148922] transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#4A5568]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(v => !v); setUserOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-[8px] text-[#718096] hover:bg-[#F8FAFC] transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E2E8F0] rounded-[12px] shadow-lg z-50 overflow-hidden slide-in-right">
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <h4 className="font-bold text-[14px] text-[#1A202C]">Thông báo</h4>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold text-[#EF4444]">{unreadCount} chưa đọc</span>
                )}
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {NOTIFICATIONS.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { navigate(n.link); setNotifOpen(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors ${n.unread ? 'bg-[#ECFDF5]/50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && <div className="w-2 h-2 bg-[#148922] rounded-full mt-1.5 shrink-0" />}
                      {!n.unread && <div className="w-2 h-2 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1A202C]">{n.title}</p>
                        <p className="text-[12px] text-[#718096] mt-0.5 truncate">{n.desc}</p>
                        <p className="text-[11px] text-[#A0AEC0] mt-1">{n.time} trước</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-[#E2E8F0]">
                <button className="text-[12px] font-bold text-[#148922] hover:underline w-full text-center">Xem tất cả thông báo</button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-[#E2E8F0]" />

        {/* User Avatar Dropdown */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen(v => !v); setNotifOpen(false); }}
            className="flex items-center gap-2.5 rounded-[8px] hover:bg-[#F8FAFC] px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 bg-[#148922] rounded-[8px] flex items-center justify-center text-white font-bold text-[12px]">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-semibold text-[#1A202C] leading-tight">{currentUser.name}</p>
              <p className="text-[11px] text-[#718096] leading-tight">
                {roleLabel[currentUser.role] ?? currentUser.role}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#718096] transition-transform hidden sm:block ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E2E8F0] rounded-[12px] shadow-lg z-50 overflow-hidden slide-in-right">
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <p className="text-[13px] font-bold text-[#1A202C]">{currentUser.name}</p>
                <p className="text-[11px] text-[#718096]">
                  {roleLabel[currentUser.role] ?? currentUser.role} · admin@ecotech.com
                </p>
              </div>
              <div className="p-1">
                <button onClick={() => { navigate('/settings'); setUserOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-[13px] text-[#4A5568] font-medium hover:bg-[#F8FAFC] transition-colors">
                  <User className="w-4 h-4" /> Hồ sơ cá nhân
                </button>
                <button onClick={() => { navigate('/settings'); setUserOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-[13px] text-[#4A5568] font-medium hover:bg-[#F8FAFC] transition-colors">
                  <Settings className="w-4 h-4" /> Cài đặt
                </button>
              </div>
              <div className="p-1 border-t border-[#E2E8F0]">
                <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-[13px] text-[#EF4444] font-medium hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
