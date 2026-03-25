import { addDays, format, getDay, parseISO } from 'date-fns';
import type { Task, WorkShift } from '../types';

const GEN_PREFIX = 'ws-gen-';

export function mergeGeneratedWorkSchedules(
  existing: WorkShift[] | undefined,
  generated: WorkShift[]
): WorkShift[] {
  const manual = (existing || []).filter((ws) => !ws.id.startsWith(GEN_PREFIX));
  return [...manual, ...generated];
}

/** Một ca sáng mỗi ngày làm việc (T2–T6) trong khoảng startDate–dueDate của task. */
export function generateWorkShiftsFromTasks(projectId: string, tasks: Task[]): WorkShift[] {
  const out: WorkShift[] = [];
  for (const task of tasks) {
    if (!task.assigneeId) continue;
    const start = task.startDate || task.dueDate;
    const end = task.dueDate;
    if (!start || !end) continue;
    let d = parseISO(start);
    const endD = parseISO(end);
    if (d > endD) continue;
    while (d <= endD) {
      const dow = getDay(d);
      if (dow !== 0 && dow !== 6) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const eff = Math.min(100, Math.round(55 + (task.completionPercent || 0) * 0.45));
        out.push({
          id: `${GEN_PREFIX}${task.id}-${dateStr}`,
          projectId,
          employeeId: task.assigneeId,
          taskId: task.id,
          date: dateStr,
          type: 'Sáng',
          efficiency: eff,
          isProductive: true,
          notes: `Tự động từ timeline task: ${task.title}`,
        });
      }
      d = addDays(d, 1);
    }
  }
  return out;
}
