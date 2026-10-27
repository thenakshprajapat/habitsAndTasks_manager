import { db } from './db';
import type { Habit, HabitLog, Task, IDataStore, ExportPayload } from '../types';
import { getTodayKey, addDays } from '../utils/dateUtils';
import { cloudSync } from '../services/cloudSync';

export class DexieDataStore implements IDataStore {
  // --- Habits ---

  async getHabits(includeArchived = false): Promise<Habit[]> {
    if (includeArchived) {
      return await db.habits.toArray();
    }
    return await db.habits.filter(h => !h.archived).toArray();
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    return await db.habits.get(id);
  }

  async saveHabit(habit: Habit): Promise<void> {
    await db.habits.put(habit);
    cloudSync.syncHabit(habit);
  }

  async archiveHabit(id: string, archived: boolean): Promise<void> {
    await db.habits.update(id, { archived });
    const habit = await db.habits.get(id);
    if (habit) {
      cloudSync.syncHabit(habit);
    }
  }

  async deleteHabit(id: string): Promise<void> {
    await db.transaction('rw', db.habits, db.habitLogs, async () => {
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
    });
    cloudSync.deleteHabit(id);
  }

  // --- Habit Logs ---

  async getLogsForHabit(habitId: string, startDate?: string, endDate?: string): Promise<HabitLog[]> {
    let collection = db.habitLogs.where('habitId').equals(habitId);
    let logs = await collection.toArray();
    if (startDate) {
      logs = logs.filter(l => l.date >= startDate);
    }
    if (endDate) {
      logs = logs.filter(l => l.date <= endDate);
    }
    return logs;
  }

  async getAllLogs(startDate?: string, endDate?: string): Promise<HabitLog[]> {
    let logs = await db.habitLogs.toArray();
    if (startDate) {
      logs = logs.filter(l => l.date >= startDate);
    }
    if (endDate) {
      logs = logs.filter(l => l.date <= endDate);
    }
    return logs;
  }

  async toggleHabitLog(habitId: string, date: string): Promise<boolean> {
    const existing = await db.habitLogs
      .where('[habitId+date]')
      .equals([habitId, date])
      .first();

    if (existing) {
      const nextState = !existing.completed;
      await db.habitLogs.update(existing.id, { completed: nextState });
      cloudSync.syncHabitLog({ ...existing, completed: nextState });
      return nextState;
    } else {
      const newLog: HabitLog = {
        id: crypto.randomUUID(),
        habitId,
        date,
        completed: true,
      };
      await db.habitLogs.add(newLog);
      cloudSync.syncHabitLog(newLog);
      return true;
    }
  }

  async setHabitLog(habitId: string, date: string, completed: boolean): Promise<void> {
    const existing = await db.habitLogs
      .where('[habitId+date]')
      .equals([habitId, date])
      .first();

    if (existing) {
      await db.habitLogs.update(existing.id, { completed });
      cloudSync.syncHabitLog({ ...existing, completed });
    } else {
      const newLog: HabitLog = {
        id: crypto.randomUUID(),
        habitId,
        date,
        completed,
      };
      await db.habitLogs.add(newLog);
      cloudSync.syncHabitLog(newLog);
    }
  }

  // --- Tasks ---

  async getTasks(): Promise<Task[]> {
    return await db.tasks.toArray();
  }

  async saveTask(task: Task): Promise<void> {
    await db.tasks.put(task);
    cloudSync.syncTask(task);
  }

  async toggleTask(id: string): Promise<boolean> {
    const task = await db.tasks.get(id);
    if (!task) return false;
    const nextState = !task.done;

    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.update(id, { done: nextState });
      cloudSync.syncTask({ ...task, done: nextState });

      // If completing a parent task, also complete its subtasks
      if (nextState) {
        const subtasks = await db.tasks.where('parentId').equals(id).toArray();
        for (const sub of subtasks) {
          await db.tasks.update(sub.id, { done: true });
          cloudSync.syncTask({ ...sub, done: true });
        }
      }
    });

    return nextState;
  }

  async deleteTask(id: string): Promise<void> {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.delete(id);
      const subtasks = await db.tasks.where('parentId').equals(id).toArray();
      await db.tasks.where('parentId').equals(id).delete();
      for (const s of subtasks) {
        cloudSync.deleteTask(s.id);
      }
    });
    cloudSync.deleteTask(id);
  }

  // --- Export / Import ---

  async exportData(): Promise<ExportPayload> {
    const habits = await db.habits.toArray();
    const habitLogs = await db.habitLogs.toArray();
    const tasks = await db.tasks.toArray();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      habitLogs,
      tasks,
    };
  }

  async importData(payload: ExportPayload): Promise<void> {
    if (!payload || !Array.isArray(payload.habits) || !Array.isArray(payload.tasks)) {
      throw new Error('Invalid export file format');
    }

    await db.transaction('rw', db.habits, db.habitLogs, db.tasks, async () => {
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.tasks.clear();

      if (payload.habits.length > 0) {
        await db.habits.bulkAdd(payload.habits);
        for (const h of payload.habits) {
          cloudSync.syncHabit(h);
        }
      }
      if (payload.habitLogs && payload.habitLogs.length > 0) {
        await db.habitLogs.bulkAdd(payload.habitLogs);
        for (const l of payload.habitLogs) {
          cloudSync.syncHabitLog(l);
        }
      }
      if (payload.tasks.length > 0) {
        await db.tasks.bulkAdd(payload.tasks);
        for (const t of payload.tasks) {
          cloudSync.syncTask(t);
        }
      }
    });
  }

  async clearAllData(): Promise<void> {
    const habits = await db.habits.toArray();
    const tasks = await db.tasks.toArray();

    await db.transaction('rw', db.habits, db.habitLogs, db.tasks, async () => {
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.tasks.clear();
    });

    for (const h of habits) cloudSync.deleteHabit(h.id);
    for (const t of tasks) cloudSync.deleteTask(t.id);
  }

  async seedDemoData(): Promise<void> {
    const today = getTodayKey();
    const habit1Id = 'demo-habit-1';
    const habit2Id = 'demo-habit-2';
    const habit3Id = 'demo-habit-3';
    const habit4Id = 'demo-habit-4';

    const habits: Habit[] = [
      {
        id: habit1Id,
        name: 'Morning Pages & Reflection',
        schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] },
        archived: false,
        createdAt: addDays(today, -90) + 'T07:00:00.000Z',
      },
      {
        id: habit2Id,
        name: '45-Min Focused Reading',
        schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] },
        archived: false,
        createdAt: addDays(today, -75) + 'T07:00:00.000Z',
      },
      {
        id: habit3Id,
        name: 'Resistance & Core Training',
        schedule: { type: 'weekly', days: [1, 3, 5] }, // Mon, Wed, Fri
        archived: false,
        createdAt: addDays(today, -60) + 'T07:00:00.000Z',
      },
      {
        id: habit4Id,
        name: 'Screenless Wind Down (21:30)',
        schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] },
        archived: false,
        createdAt: addDays(today, -45) + 'T07:00:00.000Z',
      },
    ];

    const logs: HabitLog[] = [];

    // Habit 1: Active 14-day streak, historical completions
    for (let i = 0; i < 90; i++) {
      const d = addDays(today, -i);
      if (i < 14) {
        logs.push({ id: crypto.randomUUID(), habitId: habit1Id, date: d, completed: true });
      } else if (i > 15 && i < 40) {
        logs.push({ id: crypto.randomUUID(), habitId: habit1Id, date: d, completed: true });
      } else if (i % 2 === 0 && i >= 40) {
        logs.push({ id: crypto.randomUUID(), habitId: habit1Id, date: d, completed: true });
      }
    }

    // Habit 2: Active 6-day streak
    for (let i = 0; i < 75; i++) {
      const d = addDays(today, -i);
      if (i < 6) {
        logs.push({ id: crypto.randomUUID(), habitId: habit2Id, date: d, completed: true });
      } else if (i > 7 && i < 22) {
        logs.push({ id: crypto.randomUUID(), habitId: habit2Id, date: d, completed: true });
      }
    }

    // Habit 3: Mon/Wed/Fri weekly habit with solid completion
    for (let i = 0; i < 60; i++) {
      const d = addDays(today, -i);
      const day = new Date(d).getDay();
      if ([1, 3, 5].includes(day)) {
        if (i < 20 || (i > 25 && i < 50)) {
          logs.push({ id: crypto.randomUUID(), habitId: habit3Id, date: d, completed: true });
        }
      }
    }

    // Habit 4: 9-day streak
    for (let i = 0; i < 45; i++) {
      const d = addDays(today, -i);
      if (i < 9 || (i > 11 && i < 28)) {
        logs.push({ id: crypto.randomUUID(), habitId: habit4Id, date: d, completed: true });
      }
    }

    // Demo Tasks
    const taskParent1 = 'demo-task-1';
    const tasks: Task[] = [
      {
        id: taskParent1,
        title: 'Review quarterly architecture roadmap',
        dueDate: today,
        priority: 'high',
        done: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-task-sub-1',
        title: 'Inspect database latency metrics',
        priority: 'med',
        done: true,
        createdAt: new Date().toISOString(),
        parentId: taskParent1,
      },
      {
        id: 'demo-task-sub-2',
        title: 'Draft RFC for Supabase sync layer',
        priority: 'high',
        done: false,
        createdAt: new Date().toISOString(),
        parentId: taskParent1,
      },
      {
        id: 'demo-task-2',
        title: 'Draft essay notes on intentional computing',
        dueDate: today,
        priority: 'med',
        done: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-task-3',
        title: 'Schedule dentist checkup and cleaning',
        dueDate: today,
        priority: 'low',
        done: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-task-4',
        title: 'Order replacement audio cable',
        dueDate: addDays(today, 1),
        priority: 'low',
        done: false,
        createdAt: new Date().toISOString(),
      },
    ];

    await this.importData({
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      habitLogs: logs,
      tasks,
    });
  }
}

export const dataStore: IDataStore = new DexieDataStore();
