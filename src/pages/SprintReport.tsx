import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  ArrowRightLeft, 
  Download,
  ChevronLeft,
  LayoutGrid,
  Activity,
  Calendar,
  Star
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { motion } from 'motion/react';
import { Badge, StatusBadge, Btn } from '../components/ui';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data for Charts (Using Green Theme)
const BURNDOWN_DATA = [
  { day: 'Day 1', ideal: 100, actual: 100 },
  { day: 'Day 2', ideal: 90, actual: 95 },
  { day: 'Day 3', ideal: 80, actual: 88 },
  { day: 'Day 4', ideal: 70, actual: 85 },
  { day: 'Day 5', ideal: 60, actual: 75 },
  { day: 'Day 6', ideal: 50, actual: 65 },
  { day: 'Day 7', ideal: 40, actual: 55 },
  { day: 'Day 8', ideal: 30, actual: 45 },
  { day: 'Day 9', ideal: 20, actual: 30 },
  { day: 'Day 10', ideal: 10, actual: 15 },
  { day: 'Day 11', ideal: 0, actual: 5 },
];

const TEAM_PERFORMANCE = [
  { name: 'Nguyễn Văn An', completed: 12, total: 15, rating: 4.5 },
  { name: 'Trần Thị Bình', completed: 10, total: 10, rating: 4.8 },
  { name: 'Lê Văn Châu', completed: 8, total: 12, rating: 4.2 },
  { name: 'Phạm Văn Dũng', completed: 14, total: 14, rating: 4.9 },
];

export function SprintReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-[#E2E8F0] rounded-[12px] text-[#718096] hover:text-[#1A202C] hover:border-[#CBD5E1] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#1A202C] uppercase tracking-tight">Báo cáo Sprint 2</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] font-bold text-[#718096] uppercase tracking-widest">Dự án ECOTECH</span>
              <div className="w-1 h-1 bg-[#E2E8F0] rounded-full"></div>
              <span className="text-[11px] font-black text-[#148922] uppercase tracking-widest">Hoàn thành 92%</span>
            </div>
          </div>
        </div>
        <Btn icon={Download} className="font-black uppercase tracking-wider">
          Xuất PDF
        </Btn>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Tổng Task" value="45" icon={LayoutGrid} color="bg-[#EFF6FF] text-[#2563EB]" />
        <SummaryCard label="Hoàn thành" value="41" icon={CheckCircle2} color="bg-[#ECFDF5] text-[#148922]" />
        <SummaryCard label="Quá hạn" value="2" icon={AlertCircle} color="bg-[#FEF2F2] text-[#EF4444]" />
        <SummaryCard label="Thay thế" value="3" icon={ArrowRightLeft} color="bg-[#FFFBEB] text-[#D97706]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Burndown Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F8FAFC] rounded-[10px]">
                <TrendingUp className="w-5 h-5 text-[#148922]" />
              </div>
              <h3 className="text-[16px] font-black text-[#1A202C] uppercase tracking-tight">Biểu đồ Burndown</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E2E8F0]"></div>
                <span className="text-[10px] font-bold text-[#718096] uppercase tracking-widest">Lý tưởng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#148922]"></div>
                <span className="text-[10px] font-bold text-[#718096] uppercase tracking-widest">Thực tế</span>
              </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={BURNDOWN_DATA}>
                <defs>
                  <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#148922" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#148922" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ideal" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorIdeal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#148922" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sprint Info Card */}
        <div className="bg-[#064E3B] p-8 rounded-[24px] text-white shadow-xl shadow-[#064E3B]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-8">
               <Activity className="w-4 h-4 text-[#6EE7B7]" />
               <span className="text-[10px] font-bold text-[#A7F3D0] uppercase tracking-widest">Thông tin Sprint</span>
            </div>
            
            <div className="space-y-8 flex-1">
              <InfoItem label="Thời gian" value="15/03 - 28/03" icon={Calendar} />
              <InfoItem label="Tổng giờ ước tính" value="120h" icon={Clock} />
              <InfoItem label="Tổng giờ thực tế" value="112h" icon={Activity} />
              <InfoItem label="Số nhân sự tham gia" value="4 người" icon={Users} />
            </div>
            
            <div className="pt-8 mt-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-[#A7F3D0] uppercase tracking-widest">Đánh giá Lead</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("w-3 h-3", s <= 4 ? "text-amber-400 fill-amber-400" : "text-white/20")} />
                  ))}
                </div>
              </div>
              <p className="text-[13px] font-medium text-[#D1FAE5] leading-relaxed italic opacity-90">
                "Team đã nỗ lực hoàn thành các task quan trọng đúng hạn. Việc thay thế nhân sự ở task API được xử lý mượt mà, không gây gián đoạn tiến độ chung."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#E2E8F0]">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-[#F8FAFC] rounded-[10px]">
            <Users className="w-5 h-5 text-[#148922]" />
          </div>
          <h3 className="text-[16px] font-black text-[#1A202C] uppercase tracking-tight">Hiệu suất thành viên</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Thành viên</th>
                <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Task hoàn thành</th>
                <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Tiến độ</th>
                <th className="text-left py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Đánh giá TB</th>
                <th className="text-right py-4 text-[10px] font-bold text-[#718096] uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {TEAM_PERFORMANCE.map((member, idx) => (
                <tr key={idx} className="group hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#E2E8F0] rounded-full flex items-center justify-center text-[10px] font-black text-[#718096]">
                        {member.name.split(' ').pop()?.charAt(0)}
                      </div>
                      <span className="text-[14px] font-bold text-[#1A202C]">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-[14px] font-black text-[#1A202C]">{member.completed}/{member.total}</span>
                  </td>
                  <td className="py-4">
                    <div className="w-40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-[#718096]">{Math.round((member.completed / member.total) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#148922] rounded-full shadow-sm" 
                          style={{ width: `${(member.completed / member.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-[14px] font-black text-[#1A202C]">{member.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <StatusBadge 
                      status={member.completed === member.total ? 'Active' : 'Pending'} 
                      className="px-4"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E2E8F0] flex items-center gap-6 group hover:border-[#148922] transition-all">
      <div className={cn("p-4 rounded-[16px] transition-transform group-hover:scale-110 duration-300", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-[#1A202C]">{value}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-white/10 rounded-[10px]">
        <Icon className="w-4 h-4 text-[#A7F3D0]" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#6EE7B7] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[14px] font-black text-white">{value}</p>
      </div>
    </div>
  );
}
