import type { Task } from '../types';

/** Giữ thứ tự các task không thuộc nhóm; chèn lại nhóm theo thứ tự mới. */
export function mergeReorderedSubset(allTasks: Task[], newOrder: Task[]): Task[] {
  if (newOrder.length === 0) return allTasks;
  const idSet = new Set(newOrder.map((t) => t.id));
  const rest = allTasks.filter((t) => !idSet.has(t.id));
  const insertAt = allTasks.findIndex((t) => idSet.has(t.id));
  if (insertAt < 0) return allTasks;
  const pos = allTasks.slice(0, insertAt).filter((t) => !idSet.has(t.id)).length;
  return [...rest.slice(0, pos), ...newOrder, ...rest.slice(pos)];
}
