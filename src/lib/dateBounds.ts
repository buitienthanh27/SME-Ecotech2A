/** So sánh ISO yyyy-MM-dd */
export function maxIsoDate(a: string, b: string): string {
  return a >= b ? a : b;
}

export function minIsoDate(a: string, b: string): string {
  return a <= b ? a : b;
}

export function sprintDateBoundsForTask(
  projectStart: string,
  projectEnd: string,
  sprintStart: string,
  sprintEnd: string
): { min: string; max: string } {
  return {
    min: maxIsoDate(projectStart, sprintStart),
    max: minIsoDate(projectEnd, sprintEnd),
  };
}
