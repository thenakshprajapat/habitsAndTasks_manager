import React from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatEditorialDate, getTodayKey, addDays } from '../utils/dateUtils';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenNewHabit: () => void;
  onOpenNewTask: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenNewHabit,
  onOpenNewTask,
  onOpenAuthModal,
}) => {
  const { selectedDate, setSelectedDate, habits, habitLogs, tasks, getHabitStreaks } = useData();
  const { isDark, toggleTheme } = useTheme();
  const { userName } = useAuth();

  const isToday = selectedDate === getTodayKey();
  const dateInfo = formatEditorialDate(selectedDate);

  // Dynamic editorial greeting based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Compute daily summary stats
  const scheduledHabitsToday = habits.filter(h => {
    if (h.archived) return false;
    const streaks = getHabitStreaks(h);
    return streaks.isScheduledToday;
  });

  const completedHabitsToday = scheduledHabitsToday.filter(h => {
    return habitLogs.some(l => l.habitId === h.id && l.date === selectedDate && l.completed);
  }).length;

  const dueTasksToday = tasks.filter(t => !t.parentId && (t.dueDate === selectedDate || (!t.dueDate && !t.done)));
  const completedTasksToday = dueTasksToday.filter(t => t.done).length;

  return (
    <header className="pt-6 sm:pt-10 pb-6 sm:pb-8 select-none">
      {/* Top tier: Brand and global tools */}
      <div className="flex items-center justify-between pb-4 sm:pb-6 text-xs text-secondary tracking-wider font-mono">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-semibold text-primary tracking-widest text-xs sm:text-[13px]">
            STUDIO <span className="opacity-40">/</span> TODAY
          </span>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayKey())}
              className="px-2 py-0.5 text-[10px] sm:text-[11px] font-sans border border-border-subtle hover:border-primary text-primary transition-colors cursor-pointer"
              title="Return to today"
            >
              Back to Today
            </button>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-[13px]">
          {/* User Account Button with Name */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-secondary hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
            title="Account & Cross-Device Sync"
          >
            <span className="w-2 h-2 rounded-full bg-complete" />
            <span className="truncate max-w-[80px] sm:max-w-[120px] font-sans text-xs font-medium">
              {userName}
            </span>
          </button>

          <span className="text-border-subtle">|</span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1 text-secondary hover:text-primary transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Settings / Backup */}
          <button
            onClick={onOpenSettings}
            className="p-1 text-secondary hover:text-primary transition-colors cursor-pointer"
            title="Settings & Data Backup"
            aria-label="Settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Greeting and Large Date Headline */}
      <div className="pt-2 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-serif italic text-base sm:text-lg text-secondary">
            {getGreeting()}, <button onClick={onOpenAuthModal} className="text-primary hover:underline underline-offset-4 cursor-pointer">{userName}</button>
          </p>
          <span className="text-border-subtle">·</span>
          <p className="font-mono text-xs uppercase tracking-widest text-tertiary">
            {dateInfo.dayOfWeek}
          </p>
        </div>

        <h1 className="font-serif text-[36px] sm:text-[50px] leading-[1.05] tracking-tight font-normal text-primary">
          {dateInfo.dayNumber} {dateInfo.monthName} <span className="font-light opacity-50">{dateInfo.year}</span>
        </h1>
      </div>

      {/* Day Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-4 hairline-b">
        {/* Day stepper */}
        <div className="flex items-center gap-1 font-mono text-xs text-secondary">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="p-1.5 border border-border-subtle hover:border-primary text-secondary hover:text-primary transition-colors cursor-pointer"
            title="Previous day (Left Arrow)"
            aria-label="Previous day"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8L10 4" />
            </svg>
          </button>
          <span className="px-2 text-[11px] font-medium text-primary">
            {isToday ? 'Today' : selectedDate}
          </span>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-1.5 border border-border-subtle hover:border-primary text-secondary hover:text-primary transition-colors cursor-pointer"
            title="Next day (Right Arrow)"
            aria-label="Next day"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 12L10 8L6 4" />
            </svg>
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewHabit}
            className="px-2.5 py-1 text-xs font-mono border border-border-subtle hover:border-primary text-primary transition-colors cursor-pointer flex items-center gap-1.5"
            title="Create Habit (H)"
          >
            <span>+ Habit</span>
            <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 bg-surface border border-border-subtle text-tertiary">H</kbd>
          </button>

          <button
            onClick={onOpenNewTask}
            className="px-2.5 py-1 text-xs font-mono border border-border-subtle hover:border-primary text-primary transition-colors cursor-pointer flex items-center gap-1.5"
            title="Create Task (N)"
          >
            <span>+ Task</span>
            <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 bg-surface border border-border-subtle text-tertiary">N</kbd>
          </button>
        </div>
      </div>

      {/* Calm Status Ticker */}
      <div className="flex items-center justify-between text-xs text-secondary pt-2.5">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-complete"></span>
            <span>
              {completedHabitsToday} of {scheduledHabitsToday.length} habits
            </span>
          </span>
          <span className="text-border-subtle">·</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
            <span>
              {completedTasksToday} of {dueTasksToday.length} tasks
            </span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-tertiary hidden sm:block">
          Press <kbd className="px-1 border border-border-subtle bg-surface">/</kbd> to filter
        </div>
      </div>
    </header>
  );
};
