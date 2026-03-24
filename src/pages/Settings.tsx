import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database, 
  Lock, 
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, Btn, EmptyState } from '../components/ui';

const roles = [
  { id: '1', name: 'Quản trị viên', users: 3, permissions: 'Toàn quyền truy cập', status: 'Approved' },
  { id: '2', name: 'Quản lý tài chính', users: 5, permissions: 'Tài chính & Báo cáo', status: 'Approved' },
  { id: '3', name: 'Quản lý dự án', users: 12, permissions: 'Dự án & Nhân sự', status: 'Approved' },
  { id: '4', name: 'Kế toán', users: 8, permissions: 'Lương & Dòng tiền', status: 'Approved' },
  { id: '5', name: 'Người xem', users: 20, permissions: 'Chỉ đọc', status: 'Approved' },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState('Chung');

  const tabs = [
    { id: 'Chung', icon: SettingsIcon },
    { id: 'Người dùng & Vai trò', icon: Shield },
    { id: 'Thông báo', icon: Bell },
    { id: 'Bảo mật', icon: Lock },
    { id: 'Hệ thống', icon: Database },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Tên vai trò',
      render: (row: any) => <span className="font-bold text-[#1A202C]">{row.name}</span>
    },
    {
      key: 'users',
      header: 'Người dùng',
      render: (row: any) => <span className="text-[#4A5568]">{row.users} Thành viên</span>
    },
    {
      key: 'permissions',
      header: 'Quyền hạn',
      render: (row: any) => (
        <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#148922] rounded-full text-[11px] font-bold uppercase tracking-wider">
          {row.permissions}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: any) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (row: any) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button className="p-1.5 text-[#718096] hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quản lý các thiết lập chung, phân quyền người dùng và bảo mật hệ thống ECOTECH."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-bold text-[14px] transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#148922] text-white shadow-md shadow-[#148922]/20' 
                  : 'text-[#718096] hover:bg-white hover:text-[#1A202C]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'Người dùng & Vai trò' ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-[16px] text-[#1A202C]">Kiểm soát truy cập (RBAC)</h3>
                    <p className="text-[13px] text-[#718096]">Quản lý vai trò và phân quyền hạn tương ứng cho nhân viên.</p>
                  </div>
                  <Btn icon={Plus} size="sm">Thêm vai trò</Btn>
                </div>
                
                <DataTable
                  columns={columns}
                  data={roles}
                  keyExtractor={(row) => row.id}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[12px] border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center text-[#A0AEC0] mb-4 border-2 border-dashed border-[#E2E8F0]">
                <SettingsIcon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#1A202C] text-[18px]">Tính năng đang phát triển</h3>
              <p className="text-[#718096] max-w-xs mt-2 text-[14px]">Cài đặt <b>{activeTab}</b> hiện đang được hoàn thiện. Vui lòng quay lại sau.</p>
              <Btn variant="secondary" className="mt-6" onClick={() => setActiveTab('Người dùng & Vai trò')}>Xem Người dùng & Vai trò</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
