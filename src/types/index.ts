export type ScheduleType = 'daily' | 'weekly';

export interface HabitSchedule {
  type: ScheduleType;
  /**
   * For weekly habits: 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat.
   * If daily, contains [0, 1, 2, 3, 4, 5, 6].
   */
  days: number[];
}

export interface Habit {
  id: string;
  name: string;
  schedule: HabitSchedule;
  archived: boolean;
  createdAt: string; // ISO date string
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // Format: YYYY-MM-DD
  completed: boolean;
}

export type Priority = 'low' | 'med' | 'high';

export interface Task {
  id: string;
  title: string;
  dueDate?: string; // Format: YYYY-MM-DD
  priority: Priority;
  done: boolean;
  createdAt: string; // ISO date string
  parentId?: string; // Present if task is a subtask
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  isScheduledToday: boolean;
  totalCompletions: number;
}

export type DayActivityStatus = 'completed' | 'missed' | 'rest' | 'future';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  isScheduled: boolean;
  isCompleted: boolean;
  status: DayActivityStatus;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
}

export interface IDataStore {
  // Habits
  getHabits(includeArchived?: boolean): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  saveHabit(habit: Habit): Promise<void>;
  archiveHabit(id: string, archived: boolean): Promise<void>;
  deleteHabit(id: string): Promise<void>;

  // Habit Logs
  getLogsForHabit(habitId: string, startDate?: string, endDate?: string): Promise<HabitLog[]>;
  getAllLogs(startDate?: string, endDate?: string): Promise<HabitLog[]>;
  toggleHabitLog(habitId: string, date: string): Promise<boolean>;
  setHabitLog(habitId: string, date: string, completed: boolean): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  toggleTask(id: string): Promise<boolean>;
  deleteTask(id: string): Promise<void>;

  // Export / Import
  exportData(): Promise<ExportPayload>;
  importData(payload: ExportPayload): Promise<void>;
  clearAllData(): Promise<void>;
  seedDemoData(): Promise<void>;
}
