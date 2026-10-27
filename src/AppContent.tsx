import React, { useState, useEffect } from 'react';
import { useData } from './context/DataContext';
import { Header } from './components/Header';
import { HabitsSection } from './components/HabitsSection';
import { TasksSection } from './components/TasksSection';
import { HabitModal } from './components/HabitModal';
import { TaskModal } from './components/TaskModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { CommandBar } from './components/CommandBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { MobileBottomBar } from './components/MobileBottomBar';
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
        if (isAuthModalOpen) {
          setIsAuthModalOpen(false);
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
    isAuthModalOpen,
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
      {/* 3-Column Desktop Grid / 1-Column Mobile Composition */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-16 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center gap-8 xl:gap-12">
          
          {/* Left Column (Desktop only: Mini Calendar, Intention, Consistency) */}
          <div className="hidden lg:block w-[260px] xl:w-[280px] flex-shrink-0 sticky top-6">
            <LeftSidebar />
          </div>

          {/* Center Column: Core Today View */}
          <main className="w-full max-w-[640px] mx-auto flex-1">
            {/* Header with greeting, date & actions */}
            <Header
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenNewHabit={() => {
                setHabitToEdit(null);
                setIsHabitModalOpen(true);
              }}
              onOpenNewTask={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
            />

            {/* Quick Filter / Command Bar */}
            <CommandBar
              isOpen={isCommandBarOpen}
              onClose={() => setIsCommandBarOpen(false)}
            />

            {/* Habits Section */}
            <HabitsSection
              onOpenNewHabit={() => {
                setHabitToEdit(null);
                setIsHabitModalOpen(true);
              }}
              onEditHabit={handleOpenEditHabit}
            />

            {/* Hairline Editorial Rule */}
            <div className="hairline-t my-3" />

            {/* Tasks Section */}
            <TasksSection
              onOpenNewTask={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              onEditTask={handleOpenEditTask}
            />
          </main>

          {/* Right Column (Desktop only: Cloud Sync Badge, Upcoming Agenda, Streaks Leaderboard) */}
          <div className="hidden lg:block w-[260px] xl:w-[280px] flex-shrink-0 sticky top-6">
            <RightSidebar
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onEditTask={handleOpenEditTask}
              onEditHabit={handleOpenEditHabit}
            />
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile/tablet) */}
      <MobileBottomBar
        onOpenNewHabit={() => {
          setHabitToEdit(null);
          setIsHabitModalOpen(true);
        }}
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        onOpenSearch={() => setIsCommandBarOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Desktop Keyboard Shortcuts Bar (Visible only on large screens) */}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
