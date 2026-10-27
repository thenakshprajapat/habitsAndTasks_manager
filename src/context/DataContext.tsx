import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Habit, HabitLog, Task, StreakInfo, ExportPayload } from '../types';
import { dataStore } from '../storage/DataStore';
import { getTodayKey } from '../utils/dateUtils';
import { calculateStreaks } from '../utils/streakUtils';
import { cloudSync } from '../services/cloudSync';

interface DataContextType {
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
  loading: boolean;
  selectedDate: string;
  searchQuery: string;
  showArchivedHabits: boolean;
  expandedHeatmaps: Record<string, boolean>;
  selectedItemId: string | null;
  navigableItems: Array<{ id: string; type: 'habit' | 'task'; title: string }>;

  // Habit operations
  toggleHabit: (habitId: string, date?: string) => Promise<void>;
  saveHabit: (habit: Habit) => Promise<void>;
  archiveHabit: (habitId: string, archived: boolean) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  getHabitStreaks: (habit: Habit) => StreakInfo;
  toggleHeatmap: (habitId: string) => void;

  // Task operations
  toggleTask: (taskId: string) => Promise<void>;
  saveTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Filter & Navigation
  setSelectedDate: (date: string) => void;
  setSearchQuery: (query: string) => void;
  setShowArchivedHabits: (show: boolean) => void;
  setSelectedItemId: (id: string | null) => void;
  navigateSelection: (direction: 'up' | 'down') => void;
  toggleSelectedItem: () => void;

  // System & Backup
  exportData: () => Promise<ExportPayload>;
  importData: (payload: ExportPayload) => Promise<void>;
  resetToDemo: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchivedHabits, setShowArchivedHabits] = useState<boolean>(false);
  const [expandedHeatmaps, setExpandedHeatmaps] = useState<Record<string, boolean>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Load all data from DataStore
  const refreshData = useCallback(async () => {
    try {
      let storedHabits = await dataStore.getHabits(true);
      let storedTasks = await dataStore.getTasks();

      // If brand new launch with no data, seed with demo data
      if (storedHabits.length === 0 && storedTasks.length === 0) {
        await dataStore.seedDemoData();
        storedHabits = await dataStore.getHabits(true);
        storedTasks = await dataStore.getTasks();
      }

      const storedLogs = await dataStore.getAllLogs();
      setHabits(storedHabits);
      setTasks(storedTasks);
      setHabitLogs(storedLogs);
    } catch (err) {
      console.error('Failed to load habit tracker data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    cloudSync.setOnRemoteChange(refreshData);
  }, [refreshData]);

  // Habit Streaks memoized computation helper
  const getHabitStreaks = useCallback(
    (habit: Habit): StreakInfo => {
      const logs = habitLogs.filter(l => l.habitId === habit.id);
      return calculateStreaks(habit, logs, selectedDate);
    },
    [habitLogs, selectedDate]
  );

  // Toggle Habit completion for given date
  const toggleHabit = async (habitId: string, date = selectedDate) => {
    await dataStore.toggleHabitLog(habitId, date);
    const updatedLogs = await dataStore.getAllLogs();
    setHabitLogs(updatedLogs);
  };

  const saveHabit = async (habit: Habit) => {
    await dataStore.saveHabit(habit);
    await refreshData();
  };

  const archiveHabit = async (habitId: string, archived: boolean) => {
    await dataStore.archiveHabit(habitId, archived);
    await refreshData();
  };

  const deleteHabit = async (habitId: string) => {
    await dataStore.deleteHabit(habitId);
    await refreshData();
  };

  const toggleHeatmap = (habitId: string) => {
    setExpandedHeatmaps(prev => ({
      ...prev,
      [habitId]: !prev[habitId],
    }));
  };

  // Task operations
  const toggleTask = async (taskId: string) => {
    await dataStore.toggleTask(taskId);
    const updatedTasks = await dataStore.getTasks();
    setTasks(updatedTasks);
  };

  const saveTask = async (task: Task) => {
    await dataStore.saveTask(task);
    const updatedTasks = await dataStore.getTasks();
    setTasks(updatedTasks);
  };

  const deleteTask = async (taskId: string) => {
    await dataStore.deleteTask(taskId);
    const updatedTasks = await dataStore.getTasks();
    setTasks(updatedTasks);
  };

  // Navigable items list for keyboard arrow navigation
  const navigableItems = useMemo(() => {
    const list: Array<{ id: string; type: 'habit' | 'task'; title: string }> = [];

    // Filtered visible habits
    const visibleHabits = habits
      .filter(h => (showArchivedHabits ? true : !h.archived))
      .filter(h => !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()));

    for (const h of visibleHabits) {
      list.push({ id: h.id, type: 'habit', title: h.name });
    }

    // Filtered visible root tasks (tasks for today or undated or matching query)
    const visibleTasks = tasks
      .filter(t => !t.parentId)
      .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

    for (const t of visibleTasks) {
      list.push({ id: t.id, type: 'task', title: t.title });
    }

    return list;
  }, [habits, tasks, showArchivedHabits, searchQuery]);

  // Navigate selection with Up/Down arrows
  const navigateSelection = useCallback(
    (direction: 'up' | 'down') => {
      if (navigableItems.length === 0) return;
      const currentIndex = navigableItems.findIndex(item => item.id === selectedItemId);

      let nextIndex = 0;
      if (direction === 'down') {
        nextIndex = currentIndex === -1 || currentIndex >= navigableItems.length - 1 ? 0 : currentIndex + 1;
      } else {
        nextIndex = currentIndex <= 0 ? navigableItems.length - 1 : currentIndex - 1;
      }

      setSelectedItemId(navigableItems[nextIndex].id);
    },
    [navigableItems, selectedItemId]
  );

  // Toggle selected item when pressing Enter
  const toggleSelectedItem = useCallback(() => {
    if (!selectedItemId) return;
    const item = navigableItems.find(i => i.id === selectedItemId);
    if (!item) return;

    if (item.type === 'habit') {
      toggleHabit(item.id);
    } else {
      toggleTask(item.id);
    }
  }, [selectedItemId, navigableItems, toggleHabit, toggleTask]);

  // Backup & Restore
  const exportData = async () => {
    return await dataStore.exportData();
  };

  const importData = async (payload: ExportPayload) => {
    await dataStore.importData(payload);
    await refreshData();
  };

  const resetToDemo = async () => {
    await dataStore.clearAllData();
    await dataStore.seedDemoData();
    await refreshData();
  };

  const clearAll = async () => {
    await dataStore.clearAllData();
    await refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        habits,
        habitLogs,
        tasks,
        loading,
        selectedDate,
        searchQuery,
        showArchivedHabits,
        expandedHeatmaps,
        selectedItemId,
        navigableItems,
        toggleHabit,
        saveHabit,
        archiveHabit,
        deleteHabit,
        getHabitStreaks,
        toggleHeatmap,
        toggleTask,
        saveTask,
        deleteTask,
        setSelectedDate,
        setSearchQuery,
        setShowArchivedHabits,
        setSelectedItemId,
        navigateSelection,
        toggleSelectedItem,
        exportData,
        importData,
        resetToDemo,
        clearAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
