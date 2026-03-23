import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskStatus, Task } from '../../types';
import { TaskCard } from './TaskCard';
import { MoreHorizontal, Plus } from 'lucide-react';

interface Props {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (id: string) => void;
  updatedTaskId?: string | null;
}

export const KanbanColumn: React.FC<Props> = ({ id, title, tasks, onTaskClick, updatedTaskId }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: { type: 'Column' },
  });

  return (
    <div className="flex flex-col w-80 bg-gray-50/50 rounded-2xl border border-gray-100 min-h-[500px]">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-all text-gray-500">
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-all text-gray-500">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 p-3 space-y-3 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={onTaskClick} 
              isUpdated={updatedTaskId === task.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
