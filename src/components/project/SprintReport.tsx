import React, { useMemo } from 'react';
import { 
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
  ResponsiveContainer 
} from 'recharts';
import { Task, Sprint, ProjectMember, DailyProgressLog, SubstitutionLog, PerformanceBonus } from '../../types';
import { format, eachDayOfInterval, parseISO, isAfter } from 'date-fns';
import { Modal, Btn, Badge } from '../ui';

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
    const done = sprintTasks.filter((t) => t.status === 'Done').length;
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
      const doneTasks = memberTasks.filter((t) => t.status === 'Done');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Báo cáo Sprint: ${sprint.name}`}
      size="2xl"
      footer={
        <div className="flex gap-3 print:hidden">
          <Btn variant="secondary" icon={Printer} onClick={handlePrint}>Xuất PDF / In</Btn>
          <Btn onClick={onClose}>Đóng</Btn>
        </div>
      }
    >
      <div className="space-y-10 print:p-0">
        <div>
          <p className="text-[13px] text-[#718096] font-medium mb-6">
            {format(parseISO(sprint.startDate), 'dd/MM/yyyy')} - {format(parseISO(sprint.endDate), 'dd/MM/yyyy')} • {sprint.goal}
          </p>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[20px] border border-[#E2E8F0] shadow-sm">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">Hoàn thành</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-[#1A202C]">{stats.percent}%</p>
                <p className="text-xs text-[#718096] mb-1.5">({stats.done}/{stats.total} tasks)</p>
              </div>
              <div className="mt-4 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#148922] transition-all duration-1000" 
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[20px] border border-[#E2E8F0] shadow-sm">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">Tổng giờ dự kiến</p>
              <p className="text-3xl font-black text-[#1A202C]">{stats.totalEst}h</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-[#718096] font-bold">
                <Clock className="w-3.5 h-3.5" />
                Dựa trên estimation
              </div>
            </div>
            <div className="bg-white p-6 rounded-[20px] border border-[#E2E8F0] shadow-sm">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">Tổng giờ thực tế</p>
              <p className="text-3xl font-black text-[#1A202C]">{stats.totalAct}h</p>
              <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${
                stats.totalAct > stats.totalEst ? "text-[#EF4444]" : "text-[#148922]"
              }`}>
                {stats.totalAct > stats.totalEst ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(stats.totalAct - stats.totalEst)}h so với kế hoạch
              </div>
            </div>
            <div className="bg-white p-6 rounded-[20px] border border-[#E2E8F0] shadow-sm">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">Thay thế nhân sự</p>
              <p className="text-3xl font-black text-[#1A202C]">{substitutions.length}</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-[#718096] font-bold">
                <Users className="w-3.5 h-3.5" />
                Điều chuyển trong sprint
              </div>
            </div>
          </div>
        </div>

        {/* Burndown Chart */}
        <div className="bg-white p-8 rounded-[24px] border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-[#1A202C] flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[#148922]" />
              Biểu đồ Burndown
            </h3>
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#E2E8F0] rounded-full" />
                <span className="text-[#718096]">Kế hoạch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#148922] rounded-full" />
                <span className="text-[#1A202C]">Thực tế</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Kế hoạch" 
                  stroke="#CBD5E1" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Thực tế" 
                  stroke="#148922" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#148922', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Performance */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1A202C] flex items-center gap-2 font-black uppercase tracking-tight">
            <Users className="w-5 h-5 text-[#148922]" />
            Hiệu suất Team
          </h3>
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] text-[10px] font-bold text-[#718096] uppercase tracking-widest border-b border-[#E2E8F0]">
                  <th className="px-6 py-4">Thành viên</th>
                  <th className="px-6 py-4">Tasks (Done/Total)</th>
                  <th className="px-6 py-4">Tổng giờ</th>
                  <th className="px-6 py-4">Đánh giá Lead</th>
                  <th className="px-6 py-4">Thưởng dự kiến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {teamPerformance.map((member) => (
                  <tr key={member.id} className={`hover:bg-[#F8FAFC] transition-colors ${
                    member.hasBonus ? "bg-[#FFFBEB]" : ""
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={member.avatar} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                        <div>
                          <p className="text-sm font-bold text-[#1A202C]">{member.name}</p>
                          <p className="text-[10px] text-[#718096] font-bold uppercase">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#1A202C]">{member.done}/{member.assigned}</span>
                        <div className="w-16 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#148922]" 
                            style={{ width: `${member.assigned > 0 ? (member.done / member.assigned) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[#1A202C]">{member.hours}h</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-[#1A202C]">{member.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.hasBonus ? (
                        <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                          +{member.bonusAmount?.toLocaleString()}đ
                        </span>
                      ) : (
                        <span className="text-xs text-[#CBD5E1]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Detail Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1A202C] flex items-center gap-2 font-black uppercase tracking-tight">
            <CheckCircle2 className="w-5 h-5 text-[#148922]" />
            Chi tiết Task
          </h3>
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] text-[10px] font-bold text-[#718096] uppercase tracking-widest border-b border-[#E2E8F0]">
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Người thực hiện</th>
                  <th className="px-6 py-4">Giờ (Est/Act)</th>
                  <th className="px-6 py-4">Tiến độ</th>
                  <th className="px-6 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {sprintTasks.sort((a, b) => (a.status === 'Done' ? 1 : -1)).map((task) => {
                  const assignee = members.find(m => m.id === task.assigneeId);
                  return (
                    <tr key={task.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#1A202C] line-clamp-1">{task.title}</p>
                        <p className="text-[10px] text-[#CBD5E1] font-bold tracking-wider">#{task.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <img src={assignee?.avatar} alt="" className="w-6 h-6 rounded-full border border-gray-100" />
                          <span className="text-[13px] font-medium text-[#1A202C]">{assignee?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#1A202C]">
                        {task.estimatedHours}h / {task.actualHours}h
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#1A202C]">{task.completionPercent}%</span>
                          <div className="w-12 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                task.completionPercent === 100 ? "bg-[#50b00a]" : "bg-[#148922]"
                              }`}
                              style={{ width: `${task.completionPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={task.status === 'Done' ? 'success' : 'primary'}>
                          {task.status === 'Done' ? 'Hoàn thành' : 'Đang làm'}
                        </Badge>
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
            <h3 className="text-lg font-bold text-[#1A202C] flex items-center gap-2 font-black uppercase tracking-tight">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Lịch sử Thay thế Nhân sự
            </h3>
            <div className="bg-amber-50 rounded-[24px] border border-amber-100 p-8">
              <p className="text-[14px] text-amber-900 font-bold mb-6 italic">
                Trong sprint này đã thực hiện {substitutions.length} lần điều chuyển nhân sự để đảm bảo tiến độ.
              </p>
              <div className="grid gap-4">
                {substitutions.map((sub) => {
                  const from = members.find(m => m.id === sub.originalAssigneeId);
                  const to = members.find(m => m.id === sub.newAssigneeId);
                  const task = sprintTasks.find(t => t.id === sub.taskId);
                  return (
                    <div key={sub.id} className="flex items-center gap-4 bg-white/80 p-4 rounded-[16px] border border-amber-200 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-2 font-black text-[#1A202C] text-[12px]">
                        <img src={from?.avatar} alt="" className="w-6 h-6 rounded-full border border-gray-100" />
                        <span>{from?.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                      <div className="flex items-center gap-2 font-black text-[#1A202C] text-[12px]">
                        <img src={to?.avatar} alt="" className="w-6 h-6 rounded-full border border-gray-100" />
                        <span>{to?.name}</span>
                      </div>
                      <div className="h-6 w-px bg-amber-200 mx-2" />
                      <div className="flex-1">
                        <span className="text-[12px] text-[#718096] font-bold">Task: <span className="text-[#1A202C] font-black">{task?.title}</span></span>
                        <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Lý do: {sub.reason}</p>
                      </div>
                      <span className="text-[10px] text-[#CBD5E1] font-bold uppercase">{format(parseISO(sub.timestamp), 'dd/MM HH:mm')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
