import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  Lock, 
  ChevronRight,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

const roles = [
  { id: '1', name: 'Quản trị viên', users: 3, permissions: 'Toàn quyền truy cập', status: 'Đang hoạt động' },
  { id: '2', name: 'Quản lý tài chính', users: 5, permissions: 'Tài chính & Báo cáo', status: 'Đang hoạt động' },
  { id: '3', name: 'Quản lý dự án', users: 12, permissions: 'Dự án & Nhân sự', status: 'Đang hoạt động' },
  { id: '4', name: 'Kế toán', users: 8, permissions: 'Lương & Dòng tiền', status: 'Đang hoạt động' },
  { id: '5', name: 'Người xem', users: 20, permissions: 'Chỉ đọc', status: 'Đang hoạt động' },
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h2>
          <p className="text-gray-500">Cấu hình các tham số hệ thống, vai trò người dùng và cài đặt bảo mật.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#003366] text-white shadow-lg shadow-[#003366]/20' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'Người dùng & Vai trò' ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900">Kiểm soát truy cập dựa trên vai trò</h3>
                  <button className="flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all">
                    <Plus className="w-4 h-4" />
                    Thêm vai trò mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Tên vai trò</th>
                        <th className="px-6 py-4">Người dùng</th>
                        <th className="px-6 py-4">Quyền hạn</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {roles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{role.name}</td>
                          <td className="px-6 py-4 text-gray-600">{role.users} Người dùng</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {role.permissions}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {role.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                              <button className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <SettingsIcon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Sắp ra mắt</h3>
              <p className="text-gray-500 max-w-xs mt-2">Cài đặt {activeTab} hiện đang được phát triển. Vui lòng quay lại sau.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
