import React, { useMemo } from 'react';
import { 
  X, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertCircle,
  FileText,
  Printer,
  ChevronRight,
  Star
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Task, Sprint, ProjectMember, DailyProgressLog, SubstitutionLog, PerformanceBonus } from '../../types';
import clsx from 'clsx';
import { format, eachDayOfInterval, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint;
  tasks: Task[];
  members: ProjectMember[];
  logs: DailyProgressLog[];
  substitutions: SubstitutionLog[];
  bonuses: PerformanceBonus[];
}

export const SprintReport: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  sprint, 
  tasks, 
  members, 
  logs, 
  substitutions,
  bonuses
}) => {
  const sprintTasks = useMemo(() => tasks.filter(t => t.sprintId === sprint.id), [tasks, sprint.id]);
  
  const stats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter(t => t.status === 'Closed').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    
    const totalEst = sprintTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalAct = sprintTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    
    return { total, done, percent, totalEst, totalAct };
  }, [sprintTasks]);

  const burndownData = useMemo(() => {
    const start = parseISO(sprint.startDate);
    const end = parseISO(sprint.endDate);
    const days = eachDayOfInterval({ start, end });
    
    let remainingActual = stats.totalEst;
    const idealDecrement = stats.totalEst / (days.length - 1);

    return days.map((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.logDate === dateStr);
      
      // In a real app, we'd calculate remaining hours based on progress logs
      // For mock, let's simulate a burndown
      const hoursWorkedThatDay = dayLogs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
      remainingActual = Math.max(0, remainingActual - hoursWorkedThatDay);
      
      const ideal = Math.max(0, stats.totalEst - (idealDecrement * index));
      
      return {
        name: format(day, 'dd/MM'),
        "Kế hoạch": Math.round(ideal * 10) / 10,
        "Thực tế": isAfter(day, new Date()) ? null : Math.round(remainingActual * 10) / 10,
        isBehind: remainingActual > ideal
      };
    });
  }, [sprint, logs, stats.totalEst]);

  const teamPerformance = useMemo(() => {
    return members.map(member => {
      const memberTasks = sprintTasks.filter(t => t.assigneeId === member.id);
      const doneTasks = memberTasks.filter(t => t.status === 'Closed');
      const totalHours = memberTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      
      const memberLogs = logs.filter(l => l.taskAssigneeId === member.id);
      const avgRating = memberLogs.length > 0 
        ? memberLogs.reduce((sum, l) => sum + (l.leadRating || 0), 0) / memberLogs.length 
        : 0;
        
      const pendingBonus = bonuses.find(b => b.employeeId === member.id && b.status === 'Pending');

      return {
        ...member,
        assigned: memberTasks.length,
        done: doneTasks.length,
        hours: totalHours,
        rating: avgRating,
        hasBonus: !!pendingBonus,
        bonusAmount: pendingBonus?.bonusAmount
      };
    });
  }, [members, sprintTasks, logs, bonuses]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 print:shadow-none print:max-h-none print:rounded-none">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 print:bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#003366] text-white rounded-2xl shadow-lg shadow-[#003366]/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Báo cáo Sprint: {sprint.name}</h2>
              <p className="text-sm text-gray-500 font-medium">
                {format(parseISO(sprint.startDate), 'dd/MM/yyyy')} - {format(parseISO(sprint.endDate), 'dd/MM/yyyy')} • {sprint.goal}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Xuất PDF / In
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 print:overflow-visible">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hoàn thành</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-gray-900">{stats.percent}%</p>
                <p className="text-xs text-gray-500 mb-1.5">({stats.done}/{stats.total} tasks)</p>
              </div>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng giờ dự kiến</p>
              <p className="text-3xl font-black text-gray-900">{stats.totalEst}h</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Clock className="w-3 h-3" />
                Dựa trên estimation ban đầu
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng giờ thực tế</p>
              <p className="text-3xl font-black text-gray-900">{stats.totalAct}h</p>
              <div className={clsx(
                "mt-2 flex items-center gap-1 text-xs font-bold",
                stats.totalAct > stats.totalEst ? "text-red-500" : "text-emerald-500"
              )}>
                {stats.totalAct > stats.totalEst ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.totalAct - stats.totalEst)}h so với kế hoạch
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Thay thế nhân sự</p>
              <p className="text-3xl font-black text-gray-900">{substitutions.length}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Users className="w-3 h-3" />
                Lần điều chuyển trong sprint
              </div>
            </div>
          </div>

          {/* Burndown Chart */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                Biểu đồ Burndown
              </h3>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <span className="text-gray-500">Kế hoạch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  <span className="text-gray-900">Thực tế</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Kế hoạch" 
                    stroke="#cbd5e1" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Thực tế" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Hiệu suất Team
            </h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Thành viên</th>
                    <th className="px-6 py-4">Tasks (Done/Total)</th>
                    <th className="px-6 py-4">Tổng giờ</th>
                    <th className="px-6 py-4">Đánh giá Lead</th>
                    <th className="px-6 py-4">Thưởng dự kiến</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teamPerformance.map((member) => (
                    <tr key={member.id} className={clsx(
                      "hover:bg-gray-50/50 transition-colors",
                      member.hasBonus && "bg-amber-50/30"
                    )}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{member.name}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{member.done}/{member.assigned}</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500" 
                              style={{ width: `${member.assigned > 0 ? (member.done / member.assigned) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{member.hours}h</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-gray-900">{member.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.hasBonus ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">
                            +{member.bonusAmount?.toLocaleString()}đ
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Task Completion Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Chi tiết Task
            </h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Người thực hiện</th>
                    <th className="px-6 py-4">Giờ (Est/Act)</th>
                    <th className="px-6 py-4">Tiến độ</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sprintTasks.sort((a, b) => a.status === 'Closed' ? 1 : -1).map((task) => {
                    const assignee = members.find(m => m.id === task.assigneeId);
                    return (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{task.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium">#{task.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img src={assignee?.avatar} alt="" className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-medium text-gray-700">{assignee?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-900">
                          {task.estimatedHours}h / {task.actualHours}h
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-700">{task.completionPercent}%</span>
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={clsx(
                                  "h-full transition-all",
                                  task.completionPercent === 100 ? "bg-emerald-500" : "bg-blue-500"
                                )}
                                style={{ width: `${task.completionPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx(
                            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                            task.status === 'Closed' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {task.status === 'Closed' ? 'Hoàn thành' : 'Đang làm'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Substitution Summary */}
          {substitutions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Lịch sử Thay thế Nhân sự
              </h3>
              <div className="bg-amber-50/50 rounded-3xl border border-amber-100 p-6">
                <p className="text-sm text-amber-800 font-medium mb-4">
                  Trong sprint này đã thực hiện <strong>{substitutions.length}</strong> lần điều chuyển nhân sự để đảm bảo tiến độ.
                </p>
                <div className="space-y-3">
                  {substitutions.map((sub) => {
                    const from = members.find(m => m.id === sub.originalAssigneeId);
                    const to = members.find(m => m.id === sub.newAssigneeId);
                    const task = sprintTasks.find(t => t.id === sub.taskId);
                    return (
                      <div key={sub.id} className="flex items-center gap-3 text-xs bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                          <img src={from?.avatar} alt="" className="w-5 h-5 rounded-full" />
                          <span>{from?.name}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-amber-400" />
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                          <img src={to?.avatar} alt="" className="w-5 h-5 rounded-full" />
                          <span>{to?.name}</span>
                        </div>
                        <span className="text-gray-400 mx-2">|</span>
                        <div className="flex-1">
                          <span className="text-gray-500 font-medium">Task: <span className="text-gray-900 font-bold">{task?.title}</span></span>
                          <p className="text-[10px] text-gray-400 mt-1 italic">Lý do: {sub.reason}</p>
                        </div>
                        <span className="ml-auto text-[10px] text-gray-400 whitespace-nowrap">{format(parseISO(sub.timestamp), 'dd/MM HH:mm')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
