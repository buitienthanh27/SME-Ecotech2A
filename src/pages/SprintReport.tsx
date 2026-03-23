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
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data for Charts
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Báo cáo Sprint 2</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dự án ECOTECH</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Hoàn thành 92%</span>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all">
          <Download className="w-4 h-4" />
          Xuất PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Tổng Task" value="45" icon={LayoutGrid} color="bg-blue-50 text-blue-600" />
        <SummaryCard label="Hoàn thành" value="41" icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <SummaryCard label="Quá hạn" value="2" icon={AlertCircle} color="bg-red-50 text-red-600" />
        <SummaryCard label="Thay thế" value="3" icon={ArrowRightLeft} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Burndown Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-[#003366]" />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Biểu đồ Burndown</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lý tưởng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF6600]"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thực tế</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={BURNDOWN_DATA}>
                <defs>
                  <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6600" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF6600" stopOpacity={0}/>
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
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ideal" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorIdeal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#FF6600" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sprint Info */}
        <div className="bg-[#003366] p-8 rounded-[2.5rem] text-white shadow-xl shadow-[#003366]/20">
          <div className="flex items-center gap-2 mb-8">
            <Activity className="w-4 h-4 text-blue-300" />
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Thông tin Sprint</span>
          </div>
          
          <div className="space-y-8">
            <InfoItem label="Thời gian" value="15/03 - 28/03" icon={Calendar} />
            <InfoItem label="Tổng giờ ước tính" value="120h" icon={Clock} />
            <InfoItem label="Tổng giờ thực tế" value="112h" icon={Activity} />
            <InfoItem label="Số nhân sự tham gia" value="4 người" icon={Users} />
            
            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Đánh giá Lead</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("w-3 h-3", s <= 4 ? "text-amber-400 fill-amber-400" : "text-white/20")} />
                  ))}
                </div>
              </div>
              <p className="text-sm font-medium text-blue-50 leading-relaxed italic opacity-80">
                "Team đã nỗ lực hoàn thành các task quan trọng đúng hạn. Việc thay thế nhân sự ở task API được xử lý mượt mà, không gây gián đoạn tiến độ chung."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gray-50 rounded-xl">
            <Users className="w-5 h-5 text-[#003366]" />
          </div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Hiệu suất thành viên</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thành viên</th>
                <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task hoàn thành</th>
                <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiến độ</th>
                <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đánh giá TB</th>
                <th className="text-right py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TEAM_PERFORMANCE.map((member, idx) => (
                <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {member.name.split(' ').pop()?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-black text-gray-900">{member.completed}/{member.total}</span>
                  </td>
                  <td className="py-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-400">{Math.round((member.completed / member.total) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF6600]" 
                          style={{ width: `${(member.completed / member.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-black text-gray-900">{member.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      member.completed === member.total ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {member.completed === member.total ? 'Xuất sắc' : 'Đạt yêu cầu'}
                    </span>
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
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
      <div className={cn("p-4 rounded-2xl", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-white/10 rounded-xl">
        <Icon className="w-4 h-4 text-blue-300" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}
