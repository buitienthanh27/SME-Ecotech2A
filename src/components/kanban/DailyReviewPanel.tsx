import React, { useState, useMemo } from 'react';
import { X, Star, CheckCircle2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Task, ProjectMember, DailyProgressLog, TaskStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  members: ProjectMember[];
  onSave: (logs: Partial<DailyProgressLog>[], completedTaskIds: string[]) => void;
}

export const DailyReviewPanel: React.FC<Props> = ({ isOpen, onClose, tasks, members, onSave }) => {
  const [reviews, setReviews] = useState<Record<string, Partial<DailyProgressLog>>>({});
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [expandedAssignee, setExpandedAssignee] = useState<string | null>(null);

  // Group tasks by assignee
  const tasksByAssignee = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (task.status !== 'Closed' && task.assigneeId) {
        if (!groups[task.assigneeId]) groups[task.assigneeId] = [];
        groups[task.assigneeId].push(task);
      }
    });
    return groups;
  }, [tasks]);

  const handleReviewChange = (taskId: string, field: keyof DailyProgressLog, value: any) => {
    setReviews(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
        taskId, // Ensure taskId is present
      }
    }));
  };

  const toggleCompleted = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSubmit = () => {
    const logs = Object.values(reviews);
    const completedIds = Object.keys(completedTasks).filter(id => completedTasks[id]);
    onSave(logs, completedIds);
    onClose();
  };

  const totalTasks = tasks.filter(t => t.status !== 'Closed' && t.assigneeId).length;
  const reviewedCount = Object.keys(reviews).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#003366] text-white">
          <div>
            <h2 className="text-xl font-bold">Đánh giá cuối ngày</h2>
            <p className="text-blue-200 text-xs mt-1">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {(Object.entries(tasksByAssignee) as [string, Task[]][]).map(([assigneeId, assigneeTasks]) => {
            const member = members.find(m => m.id === assigneeId);
            const isExpanded = expandedAssignee === assigneeId;
            
            return (
              <div key={assigneeId} className="space-y-4">
                <button 
                  onClick={() => setExpandedAssignee(isExpanded ? null : assigneeId)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center text-white font-bold">
                      {member?.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{member?.name}</p>
                      <p className="text-xs text-gray-500">{member?.role} • {assigneeTasks.length} tasks</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-4 pl-4 border-l-2 border-gray-100"
                    >
                      {assigneeTasks.map(task => {
                        const review = reviews[task.id] || {};
                        const isReviewed = !!review.leadRating;
                        
                        return (
                          <div 
                            key={task.id} 
                            className={clsx(
                              "p-4 rounded-2xl border transition-all space-y-4",
                              isReviewed ? "bg-blue-50 border-blue-100" : "bg-white border-gray-100 shadow-sm"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-gray-900 text-sm">{task.title}</h4>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={completedTasks[task.id] || false}
                                    onChange={() => toggleCompleted(task.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                                  />
                                  <span className="text-xs font-medium text-gray-600">Hoàn thành</span>
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Giờ làm hôm nay</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="12"
                                  step="0.5"
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]/10 outline-none"
                                  value={review.hoursWorked || ''}
                                  onChange={(e) => handleReviewChange(task.id, 'hoursWorked', Number(e.target.value))}
                                  placeholder="0.0"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Tiến độ: {review.progressPercent ?? task.completionPercent}%</label>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100"
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003366] mt-2"
                                  value={review.progressPercent ?? task.completionPercent}
                                  onChange={(e) => handleReviewChange(task.id, 'progressPercent', Number(e.target.value))}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Đánh giá chất lượng</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button 
                                    key={star}
                                    onClick={() => handleReviewChange(task.id, 'leadRating', star)}
                                    className="transition-transform active:scale-90"
                                  >
                                    <Star 
                                      className={clsx(
                                        "w-6 h-6",
                                        (review.leadRating || 0) >= star ? "fill-amber-400 text-amber-400" : "text-gray-200"
                                      )} 
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Nhận xét của Lead</label>
                              <textarea 
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]/10 outline-none resize-none h-20"
                                placeholder="Nhập nhận xét..."
                                value={review.leadComment || ''}
                                onChange={(e) => handleReviewChange(task.id, 'leadComment', e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            Đã review <span className="text-[#003366] font-bold">{reviewedCount}</span>/{totalTasks} tasks
          </div>
          <button 
            onClick={handleSubmit}
            disabled={reviewedCount === 0}
            className="flex items-center gap-2 bg-[#003366] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#003366]/20 hover:bg-[#002244] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Lưu tất cả
          </button>
        </div>
      </motion.div>
    </div>
  );
};
