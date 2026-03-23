import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, MessageSquare, Calendar, CornerUpRight } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { Task } from '../../types';
import clsx from 'clsx';

interface Props {
  task: Task;
  isOverlay?: boolean;
  onClick?: (id: string) => void;
  isUpdated?: boolean;
}

export const TaskCard: React.FC<Props> = ({ task, isOverlay, onClick, isUpdated }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const priorityColors = {
    'Cao': 'bg-red-100 text-red-700',
    'Trung bình': 'bg-orange-100 text-orange-700',
    'Thấp': 'bg-gray-100 text-gray-700',
  };

  const typeColors = {
    'Feature': 'bg-blue-50 text-blue-600',
    'Bug': 'bg-red-50 text-red-600',
    'Task': 'bg-gray-50 text-gray-600',
    'Research': 'bg-purple-50 text-purple-600',
  };

  const isOverdue = isPast(new Date(task.dueDate)) && task.status !== 'Done' && task.status !== 'Closed';
  const isClosed = task.status === 'Closed';
  const isCloned = !!task.clonedFromTaskId;

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} style={style} className="h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 opacity-50" />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task.id)}
      className={clsx(
        "bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative",
        isOverlay && "shadow-xl border-[#003366]/20",
        isClosed && "opacity-60 bg-gray-50 grayscale-[0.5]",
        isUpdated && "ring-2 ring-emerald-500 ring-offset-2 animate-pulse"
      )}
    >
      {/* Substitution Badges */}
      <div className="absolute -top-2 left-4 flex gap-2">
        {isCloned && (
          <span className="flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <CornerUpRight className="w-2.5 h-2.5" />
            TIẾP NỐI
          </span>
        )}
        {isClosed && (
          <span className="bg-gray-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ĐÃ BÀN GIAO
          </span>
        )}
      </div>

      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-wrap gap-1">
          <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", priorityColors[task.priority])}>
            {task.priority}
          </span>
          <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", typeColors[task.type])}>
            {task.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {task.isReviewedToday && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
          <span className="text-[10px] font-bold text-gray-400">#{task.id}</span>
        </div>
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-[#003366]">
        {task.title}
      </h4>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500" 
          style={{ width: `${task.completionPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "flex items-center gap-1 text-[10px] font-bold",
            isOverdue ? "text-red-600" : "text-gray-400"
          )}>
            <Calendar className="w-3 h-3" />
            {format(new Date(task.dueDate), 'dd/MM')}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
            <MessageSquare className="w-3 h-3" />
            {task.commentCount}
          </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-[#003366] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">
             {task.assigneeId === '1' ? 'A' : task.assigneeId === '2' ? 'B' : 'C'}
           </div>
        </div>
      </div>
    </div>
  );
}
