import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { db } from '../storage/db';
import type { Habit, HabitLog, Task } from '../types';

/**
 * Removes undefined fields which Firestore rejects with an error.
 */
function sanitize<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

class CloudSyncService {
  private activeUserId: string | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private isApplyingRemoteUpdate = false;
  private onRemoteChangeCallback: (() => void) | null = null;

  public setOnRemoteChange(callback: () => void) {
    this.onRemoteChangeCallback = callback;
  }

  /**
   * Starts real-time cloud synchronization for the authenticated user.
   */
  public async startSync(userId: string) {
    if (!firestore || !userId) return;

    // If already syncing for this user, do nothing
    if (this.activeUserId === userId && this.unsubscribers.length > 0) {
      return;
    }

    this.stopSync();
    this.activeUserId = userId;

    console.log(`[CloudSync] Starting real-time sync for user: ${userId}`);

    try {
      // 1. Initial Sync Check: If remote is empty but local has data, upload local data to Firestore
      const habitsCol = collection(firestore, 'users', userId, 'habits');
      const remoteHabitsSnap = await getDocs(habitsCol);

      if (remoteHabitsSnap.empty) {
        const localHabits = await db.habits.toArray();
        const localLogs = await db.habitLogs.toArray();
        const localTasks = await db.tasks.toArray();

        if (localHabits.length > 0 || localTasks.length > 0) {
          console.log('[CloudSync] Firestore is empty; uploading local data to Cloud...');
          await this.uploadAllLocalData(userId, localHabits, localLogs, localTasks);
        }
      } else {
        // Remote has data; populate local Dexie with remote data
        console.log('[CloudSync] Loading initial remote data from Firestore into local database...');
        await this.pullAllRemoteData(userId);
      }

      // 2. Setup Real-time Listeners for cross-device updates
      this.setupRealtimeListeners(userId);
    } catch (err) {
      console.error('[CloudSync] Error during startSync:', err);
    }
  }

  /**
   * Stops active Firestore real-time listeners.
   */
  public stopSync() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.activeUserId = null;
    console.log('[CloudSync] Sync stopped.');
  }

  /**
   * Real-time listeners: when another device changes a habit, task, or log, update local Dexie immediately.
   */
  private setupRealtimeListeners(userId: string) {
    if (!firestore) return;

    // Listen to Habits collection
    const habitsCol = collection(firestore, 'users', userId, 'habits');
    const unsubHabits = onSnapshot(habitsCol, async (snapshot) => {
      if (this.isApplyingRemoteUpdate) return;
      if (snapshot.metadata.hasPendingWrites) return; // Ignore local optimistic writes

      this.isApplyingRemoteUpdate = true;
      try {
        const remoteHabits: Habit[] = [];
        const remoteIds = new Set<string>();

        snapshot.forEach(docSnap => {
          const habit = docSnap.data() as Habit;
          remoteHabits.push(habit);
          remoteIds.add(habit.id);
        });

        if (remoteHabits.length > 0) {
          await db.habits.bulkPut(remoteHabits);
        }

        // Remove any local habits that were deleted on another device
        const localHabits = await db.habits.toArray();
        for (const local of localHabits) {
          if (!remoteIds.has(local.id)) {
            await db.habits.delete(local.id);
          }
        }

        if (this.onRemoteChangeCallback) {
          this.onRemoteChangeCallback();
        }
      } catch (e) {
        console.error('[CloudSync] Error processing remote habits update:', e);
      } finally {
        this.isApplyingRemoteUpdate = false;
      }
    });
    this.unsubscribers.push(unsubHabits);

    // Listen to HabitLogs collection
    const logsCol = collection(firestore, 'users', userId, 'habitLogs');
    const unsubLogs = onSnapshot(logsCol, async (snapshot) => {
      if (this.isApplyingRemoteUpdate) return;
      if (snapshot.metadata.hasPendingWrites) return;

      this.isApplyingRemoteUpdate = true;
      try {
        const remoteLogs: HabitLog[] = [];
        snapshot.forEach(docSnap => {
          remoteLogs.push(docSnap.data() as HabitLog);
        });

        if (remoteLogs.length > 0) {
          await db.habitLogs.bulkPut(remoteLogs);
        }

        if (this.onRemoteChangeCallback) {
          this.onRemoteChangeCallback();
        }
      } catch (e) {
        console.error('[CloudSync] Error processing remote logs update:', e);
      } finally {
        this.isApplyingRemoteUpdate = false;
      }
    });
    this.unsubscribers.push(unsubLogs);

    // Listen to Tasks collection
    const tasksCol = collection(firestore, 'users', userId, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, async (snapshot) => {
      if (this.isApplyingRemoteUpdate) return;
      if (snapshot.metadata.hasPendingWrites) return;

      this.isApplyingRemoteUpdate = true;
      try {
        const remoteTasks: Task[] = [];
        const remoteIds = new Set<string>();

        snapshot.forEach(docSnap => {
          const task = docSnap.data() as Task;
          remoteTasks.push(task);
          remoteIds.add(task.id);
        });

        if (remoteTasks.length > 0) {
          await db.tasks.bulkPut(remoteTasks);
        }

        // Remove tasks deleted on other devices
        const localTasks = await db.tasks.toArray();
        for (const local of localTasks) {
          if (!remoteIds.has(local.id)) {
            await db.tasks.delete(local.id);
          }
        }

        if (this.onRemoteChangeCallback) {
          this.onRemoteChangeCallback();
        }
      } catch (e) {
        console.error('[CloudSync] Error processing remote tasks update:', e);
      } finally {
        this.isApplyingRemoteUpdate = false;
      }
    });
    this.unsubscribers.push(unsubTasks);
  }

  // --- Push Single Item to Cloud (Called immediately on user action) ---

  public async syncHabit(habit: Habit) {
    if (!firestore || !this.activeUserId) return;
    try {
      const ref = doc(firestore, 'users', this.activeUserId, 'habits', habit.id);
      await setDoc(ref, sanitize(habit), { merge: true });
    } catch (e) {
      console.warn('[CloudSync] Failed to sync habit to Cloud:', e);
    }
  }

  public async deleteHabit(habitId: string) {
    if (!firestore || !this.activeUserId) return;
    try {
      const ref = doc(firestore, 'users', this.activeUserId, 'habits', habitId);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('[CloudSync] Failed to delete habit from Cloud:', e);
    }
  }

  public async syncHabitLog(log: HabitLog) {
    if (!firestore || !this.activeUserId) return;
    try {
      const ref = doc(firestore, 'users', this.activeUserId, 'habitLogs', log.id);
      await setDoc(ref, sanitize(log), { merge: true });
    } catch (e) {
      console.warn('[CloudSync] Failed to sync log to Cloud:', e);
    }
  }

  public async syncTask(task: Task) {
    if (!firestore || !this.activeUserId) return;
    try {
      const ref = doc(firestore, 'users', this.activeUserId, 'tasks', task.id);
      await setDoc(ref, sanitize(task), { merge: true });
    } catch (e) {
      console.warn('[CloudSync] Failed to sync task to Cloud:', e);
    }
  }

  public async deleteTask(taskId: string) {
    if (!firestore || !this.activeUserId) return;
    try {
      const ref = doc(firestore, 'users', this.activeUserId, 'tasks', taskId);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('[CloudSync] Failed to delete task from Cloud:', e);
    }
  }

  // --- Bulk Initial Helpers ---

  private async uploadAllLocalData(
    userId: string,
    habits: Habit[],
    logs: HabitLog[],
    tasks: Task[]
  ) {
    if (!firestore) return;
    const batch = writeBatch(firestore);

    habits.forEach(h => {
      const ref = doc(firestore!, 'users', userId, 'habits', h.id);
      batch.set(ref, sanitize(h));
    });

    // Firestore batch limit is 500 ops; take first 300 logs for initial batch
    logs.slice(0, 300).forEach(l => {
      const ref = doc(firestore!, 'users', userId, 'habitLogs', l.id);
      batch.set(ref, sanitize(l));
    });

    tasks.forEach(t => {
      const ref = doc(firestore!, 'users', userId, 'tasks', t.id);
      batch.set(ref, sanitize(t));
    });

    await batch.commit();
    console.log('[CloudSync] Successfully uploaded local data to Cloud!');
  }

  private async pullAllRemoteData(userId: string) {
    if (!firestore) return;
    const habitsCol = collection(firestore, 'users', userId, 'habits');
    const logsCol = collection(firestore, 'users', userId, 'habitLogs');
    const tasksCol = collection(firestore, 'users', userId, 'tasks');

    const [habitsSnap, logsSnap, tasksSnap] = await Promise.all([
      getDocs(habitsCol),
      getDocs(logsCol),
      getDocs(tasksCol),
    ]);

    const remoteHabits: Habit[] = habitsSnap.docs.map(d => d.data() as Habit);
    const remoteLogs: HabitLog[] = logsSnap.docs.map(d => d.data() as HabitLog);
    const remoteTasks: Task[] = tasksSnap.docs.map(d => d.data() as Task);

    await db.transaction('rw', db.habits, db.habitLogs, db.tasks, async () => {
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.tasks.clear();

      if (remoteHabits.length > 0) await db.habits.bulkAdd(remoteHabits);
      if (remoteLogs.length > 0) await db.habitLogs.bulkAdd(remoteLogs);
      if (remoteTasks.length > 0) await db.tasks.bulkAdd(remoteTasks);
    });

    console.log(`[CloudSync] Pulled ${remoteHabits.length} habits, ${remoteLogs.length} logs, ${remoteTasks.length} tasks from Cloud.`);
  }
}

export const cloudSync = new CloudSyncService();
