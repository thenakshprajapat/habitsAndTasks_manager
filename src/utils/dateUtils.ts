/**
 * Utility helpers for local date formatting and manipulation.
 * Avoids UTC offset skew by operating on calendar day components.
 */

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon to prevent DST boundary jumps
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function addDays(dateKey: string, offset: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + offset);
  return formatDateKey(d);
}

export function getDayOfWeek(dateKey: string): number {
  return parseDateKey(dateKey).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export function getDayName(dayIndex: number, short = false): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return short ? shortNames[dayIndex] : names[dayIndex];
}

export function formatEditorialDate(dateKey: string): {
  dayOfWeek: string;
  monthName: string;
  dayNumber: number;
  year: number;
} {
  const d = parseDateKey(dateKey);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return {
    dayOfWeek: getDayName(d.getDay()),
    monthName: monthNames[d.getMonth()],
    dayNumber: d.getDate(),
    year: d.getFullYear(),
  };
}

export function getDaysBetween(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey).getTime();
  const end = parseDateKey(endKey).getTime();
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getRelativeTaskDateLabel(dueDateKey: string, todayKey = getTodayKey()): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  const diff = getDaysBetween(todayKey, dueDateKey);
  if (diff < 0) {
    const days = Math.abs(diff);
    return {
      label: `${days}d overdue`,
      isOverdue: true,
      isToday: false,
    };
  }
  if (diff === 0) {
    return { label: 'Today', isOverdue: false, isToday: true };
  }
  if (diff === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false };
  }
  const d = parseDateKey(dueDateKey);
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    label: `${shortMonths[d.getMonth()]} ${d.getDate()}`,
    isOverdue: false,
    isToday: false,
  };
}
