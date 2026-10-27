import React, { useState, useEffect } from 'react';
import { useData } from './context/DataContext';
import { Header } from './components/Header';
import { HabitsSection } from './components/HabitsSection';
import { TasksSection } from './components/TasksSection';
import { HabitModal } from './components/HabitModal';
import { TaskModal } from './components/TaskModal';
import { SettingsModal } from './components/SettingsModal';
import { CommandBar } from './components/CommandBar';
import { KeyboardShortcutsFooter } from './components/KeyboardShortcutsFooter';
import type { Habit, Task } from './types';
import { addDays } from './utils/dateUtils';

export const AppContent: React.FC = () => {
  const {
    loading,
    selectedDate,
    setSelectedDate,
    navigateSelection,
    toggleSelectedItem,
    setSelectedItemId,
  } = useData();

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);

  // Global Keyboard Navigation & Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      // Handle Escape anywhere
      if (e.key === 'Escape') {
        if (isHabitModalOpen) {
          setIsHabitModalOpen(false);
          return;
        }
        if (isTaskModalOpen) {
          setIsTaskModalOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isCommandBarOpen) {
          setIsCommandBarOpen(false);
          return;
        }
        setSelectedItemId(null);
        return;
      }

      // If user is actively typing in an input field or dialog, don't hijack hotkeys
      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setTaskToEdit(null);
        setIsTaskModalOpen(true);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHabitToEdit(null);
        setIsHabitModalOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        setIsCommandBarOpen(true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSelection('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSelection('up');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        toggleSelectedItem();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedDate(addDays(selectedDate, -1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedDate(addDays(selectedDate, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isHabitModalOpen,
    isTaskModalOpen,
    isSettingsOpen,
    isCommandBarOpen,
    selectedDate,
    navigateSelection,
    toggleSelectedItem,
    setSelectedDate,
    setSelectedItemId,
  ]);

  const handleOpenEditHabit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsHabitModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs text-tertiary">
        Loading habit studio...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-primary selection:bg-[#dfdcd5] dark:selection:bg-[#383531]">
      <main className="max-w-[640px] mx-auto px-4 sm:px-6 pb-20">
        {/* Editorial Date and Actions Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNewHabit={() => {
            setHabitToEdit(null);
            setIsHabitModalOpen(true);
          }}
          onOpenNewTask={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
        />

        {/* Command / Filter Bar */}
        <CommandBar
          isOpen={isCommandBarOpen}
          onClose={() => setIsCommandBarOpen(false)}
        />

        {/* Today's Habits Section */}
        <HabitsSection
          onOpenNewHabit={() => {
            setHabitToEdit(null);
            setIsHabitModalOpen(true);
          }}
          onEditHabit={handleOpenEditHabit}
        />

        {/* Hairline Editorial Divider */}
        <div className="hairline-t my-2" />

        {/* Today's Tasks Section */}
        <TasksSection
          onOpenNewTask={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          onEditTask={handleOpenEditTask}
        />
      </main>

      {/* Persistent Keyboard Shortcuts Hint Bar */}
      <KeyboardShortcutsFooter />

      {/* Modals */}
      <HabitModal
        isOpen={isHabitModalOpen}
        habitToEdit={habitToEdit}
        onClose={() => {
          setIsHabitModalOpen(false);
          setHabitToEdit(null);
        }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
