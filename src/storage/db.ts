import Dexie, { type EntityTable } from 'dexie';
import type { Habit, HabitLog, Task } from '../types';

/**
 * Versioned IndexedDB schema managed via Dexie.js.
 * Handles high-volume habit logs, subtasks, and instant persistence.
 */
export class HabitTrackerDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;
  tasks!: EntityTable<Task, 'id'>;

  constructor() {
    super('HabitTrackerDatabase');

    // Schema Version 1
    this.version(1).stores({
      habits: 'id, archived, createdAt',
      habitLogs: 'id, habitId, date, [habitId+date]',
      tasks: 'id, dueDate, priority, done, createdAt, parentId',
    });
  }
}

export const db = new HabitTrackerDB();
