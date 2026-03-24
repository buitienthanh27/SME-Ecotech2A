import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Calendar, MessageCircle, Send, UserPlus, Trophy, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, ProjectMember, SubstitutionLog, DailyProgressLog, PerformanceBonus } from '../../types';
import { SubstitutionHistory } from './SubstitutionHistory';
import { useRealtime } from '../RealtimeProvider';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface Props {
  task: Task;
  members: ProjectMember[];
  logs: SubstitutionLog[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onSubstitute: (taskId: string) => void;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export const TaskDetailSheet: React.FC<Props> = ({ task, members, logs, onClose, onUpdate, onSubstitute }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [newComment, setNewComment] = useState('');
  const [progressLogs, setProgressLogs] = useState<DailyProgressLog[]>([]);
  const [bonuses, setBonuses] = useState<PerformanceBonus[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [logPercent, setLogPercent] = useState(task.completionPercent);
  
  const { emit, on, off, setTyping, typingUsers } = useRealtime();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedTask(task);
    setLogPercent(task.completionPercent);
  }, [task]);

  useEffect(() => {
    const handleComment = (data: any) => {
      if (data.taskId === task.id) {
        setEditedTask(prev => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment]
        }));
      }
    };

    const handleProgressLogged = (data: any) => {
      if (data.taskId === task.id) {
        setProgressLogs(prev => [data.log, ...prev]);
        setEditedTask(prev => ({ ...prev, completionPercent: data.log.progress }));
      }
    };

    const handleBonusCreated = (data: any) => {
      if (data.taskId === task.id) {
        setBonuses(prev => [data.bonus, ...prev]);
      }
    };

    on('task.commented', handleComment);
    on('task.progress_logged', handleProgressLogged);
    on('bonus.created', handleBonusCreated);

    return () => {
      off('task.commented', handleComment);
      off('task.progress_logged', handleProgressLogged);
      off('bonus.created', handleBonusCreated);
    };
  }, [on, off, task.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [editedTask.comments]);

  const handleChange = (field: keyof Task, value: any) => {
    const updated = { ...editedTask, [field]: value };
    setEditedTask(updated);
    
    if (field === 'assigneeId') {
      const newAssignee = members.find(m => m.id === value);
      emit('task.assigned', { 
        taskId: task.id, 
        assigneeId: value, 
        assigneeName: newAssignee?.name,
        action: `giao task cho ${newAssignee?.name}`,
        taskTitle: task.title
      });
    }
  };

  const handleSave = () => {
    onUpdate(editedTask);
    onClose();
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;

    const comment: any = {
      id: Math.random().toString(36).substr(2, 9),
      taskId: task.id,
      userId: 'me', 
      userName: 'Bạn',
      text: newComment,
      timestamp: new Date().toISOString(),
    };

    const updatedTask = {
      ...editedTask,
      comments: [...(editedTask.comments || []), comment]
    };

    setEditedTask(updatedTask);
    onUpdate(updatedTask);
    
    emit('task.commented', { 
      taskId: task.id, 
      comment, 
      action: 'bình luận vào',
      taskTitle: task.title 
    });
    setNewComment('');
    setTyping(false);
  };

  const handleLogProgress = () => {
    const log: DailyProgressLog = {
      id: Math.random().toString(36).substr(2, 9),
      taskId: task.id,
      taskAssigneeId: task.assigneeId || 'unknown',
      reviewedByLeadId: 'me',
      logDate: new Date().toISOString().split('T')[0],
      hoursWorked: 0,
      progressPercent: logPercent,
      leadRating: 5,
      leadComment: logNote,
      isApprovedByLead: true,
      timestamp: new Date().toISOString(),
    };

    setProgressLogs(prev => [log, ...prev]);
    setEditedTask(prev => ({ ...prev, completionPercent: logPercent }));
    emit('task.progress_logged', { 
      taskId: task.id, 
      log, 
      action: `cập nhật tiến độ lên ${logPercent}%`,
      taskTitle: task.title 
    });
    setShowLogForm(false);
    setLogNote('');
  };

  const handleCreateBonus = () => {
    const bonus: PerformanceBonus = {
      id: Math.random().toString(36).substr(2, 9),
      taskId: task.id,
      taskAssigneeId: task.assigneeId || 'unknown',
      employeeId: editedTask.assigneeId || 'unknown',
      employeeCostId: null,
      bonusAmount: 500000,
      bonusType: 'Xuất sắc',
      reason: 'Hoàn thành task xuất sắc và đúng hạn',
      createdByPMId: 'me',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setBonuses(prev => [bonus, ...prev]);
    emit('bonus.created', { 
      taskId: task.id, 
      bonus, 
      action: `thưởng ${bonus.bonusAmount.toLocaleString()}đ cho ${assignee?.name || 'nhân viên'}`,
      taskTitle: task.title 
    });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const priorityColors = {
    'Cao': 'bg-red-50 text-red-700',
    'Trung bình': 'bg-orange-50 text-orange-700',
    'Thấp': 'bg-gray-50 text-gray-700',
  };

  const statusColors = {
    'Backlog': 'bg-gray-50 text-gray-700',
    'In Progress': 'bg-blue-50 text-blue-700',
    'In Review': 'bg-purple-50 text-purple-700',
    'Done': 'bg-emerald-50 text-emerald-700',
    'Closed': 'bg-gray-500 text-white',
  };

  const assignee = members.find(m => m.id === editedTask.assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Task #{task.id}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Title Inline Edit */}
          <input 
            className="text-2xl font-bold text-gray-900 w-full border-none focus:ring-0 p-0 mb-2 bg-transparent"
            value={editedTask.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />

          <div className="flex items-center gap-4">
             <select 
               className={clsx("text-xs font-bold px-3 py-1.5 rounded-xl border-none focus:ring-0 cursor-pointer", statusColors[editedTask.status])}
               value={editedTask.status}
               onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
             >
               <option value="Backlog">Khởi tạo</option>
               <option value="In Progress">Đang làm</option>
               <option value="In Review">Đang review</option>
               <option value="Done">Hoàn thành</option>
               <option value="Closed">Đã đóng</option>
             </select>
             <select 
               className={clsx("text-xs font-bold px-3 py-1.5 rounded-xl border-none focus:ring-0 cursor-pointer", priorityColors[editedTask.priority])}
               value={editedTask.priority}
               onChange={(e) => handleChange('priority', e.target.value as TaskPriority)}
             >
               <option value="Cao">Ưu tiên Cao</option>
               <option value="Trung bình">Ưu tiên Trung bình</option>
               <option value="Thấp">Ưu tiên Thấp</option>
             </select>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Tiến độ thực hiện</label>
                <button 
                  onClick={() => setShowLogForm(!showLogForm)}
                  className="text-[10px] font-bold text-[#148922] hover:underline"
                >
                  {showLogForm ? 'Hủy' : 'Cập nhật nhật ký'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#148922]">{editedTask.completionPercent}%</span>
              </div>
            </div>
            
            <AnimatePresence>
              {showLogForm && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={logPercent}
                      onChange={(e) => setLogPercent(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#148922]"
                    />
                    <span className="text-sm font-bold text-gray-700 w-12 text-right">{logPercent}%</span>
                  </div>
                  <textarea 
                    placeholder="Ghi chú công việc đã làm..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] transition-all resize-none h-20"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                  />
                  <button 
                    onClick={handleLogProgress}
                    className="w-full py-2 bg-[#148922] text-white rounded-xl text-xs font-bold hover:bg-[#0b6b17] transition-all"
                  >
                    Xác nhận cập nhật
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${editedTask.completionPercent}%` }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Người thực hiện</p>
              <div className="relative group">
                <select 
                  className="w-full appearance-none bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-700 cursor-pointer"
                  value={editedTask.assigneeId}
                  onChange={(e) => handleChange('assigneeId', e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-[#148922] flex items-center justify-center text-[10px] font-bold text-white">
                    {assignee?.name.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-500">{assignee?.role}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Hạn chót</p>
              <input 
                type="date"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-transparent border-none p-0 focus:ring-0 w-full"
                value={editedTask.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Ước tính (Giờ)</p>
              <input 
                type="number"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-transparent border-none p-0 focus:ring-0 w-full"
                value={editedTask.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Thực tế (Giờ)</p>
              <input 
                type="number"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-transparent border-none p-0 focus:ring-0 w-full"
                value={editedTask.actualHours}
                onChange={(e) => handleChange('actualHours', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Mô tả chi tiết</label>
            <textarea 
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] transition-all resize-none"
              value={editedTask.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Bonus Section */}
          {bonuses.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                <Trophy className="w-3 h-3 text-amber-500" />
                Thưởng nóng
              </label>
              <div className="space-y-2">
                {bonuses.map(bonus => (
                  <div key={bonus.id} className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-900">+{bonus.amount.toLocaleString()}đ</p>
                      <p className="text-[10px] text-amber-700">{bonus.reason}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status History */}
          {editedTask.statusLogs && editedTask.statusLogs.length > 0 && (
            <div className="pt-8 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider text-gray-400">
                <Send className="w-3 h-3 rotate-180" />
                Lịch sử thay đổi trạng thái
              </h4>
              <div className="space-y-4">
                {editedTask.statusLogs.map((log) => {
                  const getStatusLabel = (s: string) => {
                    const labels: any = {
                      'Backlog': 'Khởi tạo',
                      'In Progress': 'Đang làm',
                      'In Review': 'Đang review',
                      'Done': 'Hoàn thành',
                      'Closed': 'Đã đóng'
                    };
                    return labels[s] || s;
                  };
                  return (
                    <div key={log.id} className="flex gap-4">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="absolute top-8 bottom-[-16px] left-1/2 w-[1px] bg-gray-100 last:hidden" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-gray-900">
                            {getStatusLabel(log.fromStatus)} → {getStatusLabel(log.toStatus)}
                          </p>
                          <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium text-gray-900">{log.changedByName}:</span> {log.note || 'Cập nhật trạng thái thông thường'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Substitution History */}
          <SubstitutionHistory logs={logs} members={members} />

          {/* Daily Progress Log */}
          <div className="pt-8 border-t border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-between uppercase text-xs tracking-wider text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Nhật ký tiến độ hàng ngày
              </div>
              {editedTask.status === 'Done' && (
                <button 
                  onClick={handleCreateBonus}
                  className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
                >
                  <Trophy className="w-3 h-3" />
                  Thưởng nóng
                </button>
              )}
            </h4>
            <div className="space-y-4">
              {progressLogs.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-2xl text-center text-gray-400 text-sm">
                  Chưa có nhật ký nào cho task này.
                </div>
              ) : (
                progressLogs.map(log => (
                  <div key={log.id} className="flex gap-3">
                    <div className="w-1 h-auto bg-emerald-500 rounded-full" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-900">Tiến độ: {log.progress}%</span>
                        <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 italic">"{log.note}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-8 border-t border-gray-100 space-y-6">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Thảo luận ({task.commentCount + (editedTask.comments?.length || 0)})
            </h4>

            {/* Typing Indicator */}
            <AnimatePresence>
              {Object.keys(typingUsers).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-[10px] italic text-gray-400 flex items-center gap-2"
                >
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-75" />
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-150" />
                  </div>
                  {Object.values(typingUsers).join(', ')} đang nhập...
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {(editedTask.comments || []).map((comment) => (
                <motion.div 
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-2xl rounded-tl-none">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-900">{comment.userName}</span>
                      <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            <div className="relative">
              <textarea 
                placeholder="Viết bình luận..."
                className="w-full p-4 pr-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#148922]/10 focus:border-[#148922] transition-all resize-none h-24"
                value={newComment}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <button 
                onClick={handleSendComment}
                disabled={!newComment.trim()}
                className="absolute right-3 bottom-3 p-2 bg-[#148922] text-white rounded-xl hover:bg-[#0b6b17] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button 
            onClick={() => onSubstitute(task.id)}
            className="text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
            disabled={editedTask.status === 'Closed'}
          >
            Thay thế nhân sự
          </button>
          <button 
            onClick={handleSave}
            className="bg-[#148922] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#148922]/20 hover:bg-[#0b6b17] transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
