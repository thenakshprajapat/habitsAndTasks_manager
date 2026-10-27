import { describe, it, expect } from 'vitest';
import { calculateStreaks, get90DayGrid, isHabitScheduledOnDate } from './streakUtils';
import type { Habit, HabitLog } from '../types';
import { addDays } from './dateUtils';

describe('Streak Calculation & Schedule Logic', () => {
  const mockHabitDaily: Habit = {
    id: 'habit-1',
    name: 'Morning Meditation',
    schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] },
    archived: false,
    createdAt: '2026-10-01T08:00:00.000Z',
  };

  const today = '2026-10-28';

  it('determines daily schedule correctly for all days', () => {
    expect(isHabitScheduledOnDate(mockHabitDaily, '2026-10-28')).toBe(true);
    expect(isHabitScheduledOnDate(mockHabitDaily, '2026-10-25')).toBe(true);
  });

  it('calculates current and best streak when yesterday was completed and today is completed', () => {
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: today, completed: true },
      { id: '2', habitId: 'habit-1', date: addDays(today, -1), completed: true },
      { id: '3', habitId: 'habit-1', date: addDays(today, -2), completed: true },
      { id: '4', habitId: 'habit-1', date: addDays(today, -3), completed: true },
    ];

    const result = calculateStreaks(mockHabitDaily, logs, today);
    expect(result.currentStreak).toBe(4);
    expect(result.bestStreak).toBe(4);
    expect(result.completedToday).toBe(true);
    expect(result.isScheduledToday).toBe(true);
  });

  it('preserves current streak if today is not completed yet but yesterday was completed', () => {
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: addDays(today, -1), completed: true },
      { id: '2', habitId: 'habit-1', date: addDays(today, -2), completed: true },
      { id: '3', habitId: 'habit-1', date: addDays(today, -3), completed: true },
    ];

    const result = calculateStreaks(mockHabitDaily, logs, today);
    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
    expect(result.completedToday).toBe(false);
  });

  it('breaks current streak if a past scheduled day was missed', () => {
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: today, completed: true },
      { id: '2', habitId: 'habit-1', date: addDays(today, -2), completed: true },
      { id: '3', habitId: 'habit-1', date: addDays(today, -3), completed: true },
      { id: '4', habitId: 'habit-1', date: addDays(today, -4), completed: true },
    ];

    const result = calculateStreaks(mockHabitDaily, logs, today);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(3);
  });

  it('handles weekly schedule correctly without breaking on non-scheduled days', () => {
    const mockHabitWeekly: Habit = {
      id: 'habit-2',
      name: 'Strength Training',
      schedule: { type: 'weekly', days: [1, 3, 5] },
      archived: false,
      createdAt: '2026-10-01T08:00:00.000Z',
    };

    expect(isHabitScheduledOnDate(mockHabitWeekly, '2026-10-28')).toBe(true); // Wed
    expect(isHabitScheduledOnDate(mockHabitWeekly, '2026-10-27')).toBe(false); // Tue

    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-2', date: '2026-10-28', completed: true }, // Wed
      { id: '2', habitId: 'habit-2', date: '2026-10-26', completed: true }, // Mon
      { id: '3', habitId: 'habit-2', date: '2026-10-23', completed: true }, // Fri
    ];

    const result = calculateStreaks(mockHabitWeekly, logs, '2026-10-28');
    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
  });

  it('generates an activity grid with exactly 90 days', () => {
    const logs: HabitLog[] = [
      { id: '1', habitId: 'habit-1', date: today, completed: true },
      { id: '2', habitId: 'habit-1', date: addDays(today, -5), completed: true },
    ];

    const grid = get90DayGrid(mockHabitDaily, logs, today);
    expect(grid.length).toBe(90);
    expect(grid[grid.length - 1].date).toBe(today);
    expect(grid[grid.length - 1].isCompleted).toBe(true);
    expect(grid[grid.length - 1].status).toBe('completed');

    const dayMinus5 = grid.find(d => d.date === addDays(today, -5));
    expect(dayMinus5?.isCompleted).toBe(true);
    expect(dayMinus5?.status).toBe('completed');

    const dayMinus1 = grid.find(d => d.date === addDays(today, -1));
    expect(dayMinus1?.isCompleted).toBe(false);
    expect(dayMinus1?.status).toBe('missed');
  });
});
