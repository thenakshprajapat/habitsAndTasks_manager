import type { Habit, HabitLog, StreakInfo, DayActivity } from '../types';
import { addDays, getDayOfWeek, getTodayKey, getDaysBetween } from './dateUtils';

/**
 * Checks if a habit is scheduled to be performed on a specific date.
 */
export function isHabitScheduledOnDate(habit: Habit, dateKey: string): boolean {
  if (habit.schedule.type === 'daily') {
    return true;
  }
  const dayOfWeek = getDayOfWeek(dateKey);
  return habit.schedule.days.includes(dayOfWeek);
}

/**
 * Creates a fast lookup Map of logs for a given habit: dateKey -> boolean.
 */
export function buildLogsMap(logs: HabitLog[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const log of logs) {
    if (log.completed) {
      map.set(log.date, true);
    }
  }
  return map;
}

/**
 * Calculates current streak, best streak, and completion metrics derived from logs.
 * All derived at read time without persisting streak counters.
 */
export function calculateStreaks(
  habit: Habit,
  logs: HabitLog[],
  referenceDateKey = getTodayKey()
): StreakInfo {
  const logsMap = buildLogsMap(logs);
  const isScheduledToday = isHabitScheduledOnDate(habit, referenceDateKey);
  const completedToday = Boolean(logsMap.get(referenceDateKey));

  // Determine the start date for calculation
  const habitCreatedKey = habit.createdAt.slice(0, 10);
  
  // Find earliest recorded log or habit creation date
  let earliestDateKey = habitCreatedKey;
  for (const log of logs) {
    if (log.completed && log.date < earliestDateKey) {
      earliestDateKey = log.date;
    }
  }

  // 1. Calculate Current Streak
  let currentStreak = 0;
  if (isScheduledToday && completedToday) {
    currentStreak += 1;
  }

  // Step backwards starting from yesterday
  let checkKey = addDays(referenceDateKey, -1);
  const maxLookback = Math.max(365, getDaysBetween(earliestDateKey, referenceDateKey) + 30);
  let lookbackCount = 0;

  while (lookbackCount < maxLookback) {
    // If we've walked earlier than habit creation and haven't logged completions, stop
    if (checkKey < earliestDateKey && !logsMap.has(checkKey)) {
      break;
    }

    const scheduled = isHabitScheduledOnDate(habit, checkKey);
    if (scheduled) {
      const completed = Boolean(logsMap.get(checkKey));
      if (completed) {
        currentStreak += 1;
      } else {
        // Missing a scheduled day breaks the current streak
        break;
      }
    }
    // If not scheduled, it's a rest day; does not break the streak, continue walking back
    checkKey = addDays(checkKey, -1);
    lookbackCount += 1;
  }

  // 2. Calculate Best Streak (All-time longest contiguous scheduled completion sequence)
  let bestStreak = 0;
  let runningStreak = 0;

  // Walk forward from earliest date up to referenceDateKey
  let walkKey = earliestDateKey;
  const totalDaysToScan = Math.max(0, getDaysBetween(earliestDateKey, referenceDateKey));

  for (let i = 0; i <= totalDaysToScan; i++) {
    const scheduled = isHabitScheduledOnDate(habit, walkKey);
    if (scheduled) {
      const completed = Boolean(logsMap.get(walkKey));
      if (completed) {
        runningStreak += 1;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else {
        // If it's today and uncompleted, don't break previous running streak for best streak count
        if (walkKey !== referenceDateKey) {
          runningStreak = 0;
        }
      }
    }
    walkKey = addDays(walkKey, 1);
  }

  // Best streak cannot be less than current streak
  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  const totalCompletions = logs.filter(l => l.completed).length;

  return {
    currentStreak,
    bestStreak,
    completedToday,
    isScheduledToday,
    totalCompletions,
  };
}

/**
 * Generates the 90-day activity array ending on the reference date (today).
 */
export function get90DayGrid(
  habit: Habit,
  logs: HabitLog[],
  referenceDateKey = getTodayKey()
): DayActivity[] {
  const logsMap = buildLogsMap(logs);
  const grid: DayActivity[] = [];

  // 90 days: from (reference - 89) to reference
  for (let i = 89; i >= 0; i--) {
    const date = addDays(referenceDateKey, -i);
    const dayOfWeek = getDayOfWeek(date);
    const isScheduled = isHabitScheduledOnDate(habit, date);
    const isCompleted = Boolean(logsMap.get(date));

    let status: DayActivity['status'] = 'rest';
    if (isCompleted) {
      status = 'completed';
    } else if (isScheduled) {
      if (date === referenceDateKey) {
        status = 'rest';
      } else {
        status = 'missed';
      }
    } else {
      status = 'rest';
    }

    grid.push({
      date,
      dayOfWeek,
      isScheduled,
      isCompleted,
      status,
    });
  }

  return grid;
}
