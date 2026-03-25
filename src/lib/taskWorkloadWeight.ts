import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Task } from '../types';

/**
 * Trọng số phân bổ: ưu tiên giờ ước tính nếu có; không thì theo số ngày (start→due) tối thiểu 1.
 */
export function taskWorkloadWeight(task: Task): number {
  const h = task.estimatedHours;
  if (typeof h === 'number' && h > 0) return h;
  const s = task.startDate || task.dueDate;
  const e = task.dueDate;
  if (!s || !e) return 1;
  const days = differenceInCalendarDays(parseISO(e), parseISO(s)) + 1;
  if (!Number.isFinite(days)) return 1;
  return Math.max(1, days);
}

/** Điểm đóng góp tiến độ có trọng số (0–100 scale trên weight) */
export function taskContributionPoints(task: Task): number {
  const cp = Number(task.completionPercent);
  const safe = Number.isFinite(cp) ? Math.min(100, Math.max(0, cp)) : 0;
  return (safe / 100) * taskWorkloadWeight(task);
}
