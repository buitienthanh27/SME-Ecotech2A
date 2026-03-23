import React, { useState, useCallback } from 'react';
import { Task, SubstitutionLog, TaskStatus } from '../types';

interface UseSubstitutionProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addLog: (log: SubstitutionLog) => void;
}

export function useSubstitution({ tasks, setTasks, addLog }: UseSubstitutionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    taskId: string,
    newAssigneeId: string,
    reason: string,
    approvedByPMId: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) throw new Error('Task not found');

      const originalTask = tasks[taskIndex];
      const originalAssigneeId = originalTask.assigneeId;

      if (!originalAssigneeId) throw new Error('Task has no assignee');

      // Rule: Task đã "Done" KHÔNG được clone
      if (originalTask.status === 'Done') {
        throw new Error('Cannot substitute on a completed task');
      }

      let updatedTasks = [...tasks];

      if (originalTask.status === 'In Progress' || originalTask.status === 'In Review') {
        // Step 1: Task gốc status -> "Closed"
        const progressAtHandover = originalTask.completionPercent;
        updatedTasks[taskIndex] = {
          ...originalTask,
          status: 'Closed',
        };

        // Step 2: Tạo task MỚI (clone)
        const newTask: Task = {
          ...originalTask,
          id: `t${Date.now()}`, // Simple unique ID
          title: `[Tiếp nối] ${originalTask.title}`,
          clonedFromTaskId: originalTask.id,
          completionPercent: progressAtHandover,
          status: 'In Progress',
          assigneeId: newAssigneeId,
          position: originalTask.position + 0.1, // Insert near original
          commentCount: 0,
          isReviewedToday: false,
        };

        updatedTasks.push(newTask);

        // Step 4: Tạo SubstitutionLog
        const log: SubstitutionLog = {
          id: `log${Date.now()}`,
          taskId: originalTask.id,
          originalAssigneeId,
          newAssigneeId,
          progressAtSubstitution: progressAtHandover,
          reason,
          approvedByPMId,
          timestamp: new Date().toISOString(),
        };
        addLog(log);

      } else {
        // Rule: Task "Backlog" hoặc "Todo": chuyển thẳng sang B (không cần clone)
        updatedTasks[taskIndex] = {
          ...originalTask,
          assigneeId: newAssigneeId,
        };
      }

      // Step 5: Recalculate (Mock)
      console.log('Recalculating allocations for', originalAssigneeId, 'and', newAssigneeId);

      // Step 6: Emit realtime event (Mock)
      console.log('Emitting project.staff_substituted event');

      setTasks(updatedTasks);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred during substitution');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [tasks, setTasks, addLog]);

  return { execute, isLoading, error };
}
