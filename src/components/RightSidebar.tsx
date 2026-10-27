import React from 'react';
import { useData } from '../context/DataContext';
import { getTodayKey, addDays, getRelativeTaskDateLabel } from '../utils/dateUtils';
import type { Task, Habit } from '../types';

interface RightSidebarProps {
  onOpenAuthModal: () => void;
  onEditTask: (task: Task) => void;
  onEditHabit: (habit: Habit) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onOpenAuthModal,
  onEditTask,
  onEditHabit,
}) => {
  const { tasks, habits, getHabitStreaks, toggleTask } = useData();

  const todayKey = getTodayKey();
  const nextWeekKey = addDays(todayKey, 7);

  // Upcoming root tasks (due tomorrow up to 7 days out)
  const upcomingTasks = tasks
    .filter(t => !t.parentId && !t.done && t.dueDate && t.dueDate > todayKey && t.dueDate <= nextWeekKey)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));

  // Top streak habits
  const topHabits = [...habits]
    .filter(h => !h.archived)
    .map(h => ({
      habit: h,
      streaks: getHabitStreaks(h),
    }))
    .sort((a, b) => b.streaks.currentStreak - a.streaks.currentStreak || b.streaks.bestStreak - a.streaks.bestStreak)
    .slice(0, 4);

  return (
    <aside className="w-full space-y-6 text-sm select-none">
      {/* Cloud Account & Cross-Device Sync Card */}
      <div className="p-4 bg-surface/40 border border-border-hairline rounded-none">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-tertiary mb-2">
          <span>Cross-Device Sync</span>
          <span className="w-1.5 h-1.5 rounded-full bg-complete animate-pulse" />
        </div>
        <div className="text-xs text-secondary mb-3 leading-relaxed">
          Access your habits and tasks seamlessly across your phone, tablet, and PC.
        </div>
        <button
          onClick={onOpenAuthModal}
          className="w-full py-2 px-3 border border-border-subtle hover:border-primary text-xs font-mono text-primary bg-surface transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Account & Cloud Sync</span>
        </button>
      </div>

      {/* Upcoming Agenda (Tomorrow & This Week) */}
      <div className="p-4 bg-surface/40 border border-border-hairline rounded-none">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-tertiary mb-3">
          <span>Upcoming Agenda</span>
          <span className="text-[10px]">({upcomingTasks.length})</span>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="text-xs text-tertiary font-serif italic py-2">
            No upcoming tasks scheduled for this week.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map(t => {
              const badge = getRelativeTaskDateLabel(t.dueDate!);
              return (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className="flex items-start justify-between gap-2 p-1.5 hover:bg-surface/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(t.id);
                      }}
                      className="mt-0.5 w-3.5 h-3.5 rounded-[1.5px] border border-border-subtle hover:border-primary flex-shrink-0"
                    />
                    <span className="text-xs font-sans text-secondary group-hover:text-primary truncate">
                      {t.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-tertiary whitespace-nowrap">
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Streak Leaderboard */}
      <div className="p-4 bg-surface/40 border border-border-hairline rounded-none">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-tertiary mb-3">
          <span>Habit Streaks</span>
          <span className="text-[10px]">Active</span>
        </div>

        <div className="space-y-2.5">
          {topHabits.map(({ habit, streaks }) => (
            <div
              key={habit.id}
              onClick={() => onEditHabit(habit)}
              className="flex items-center justify-between text-xs font-mono p-1 hover:bg-surface/60 transition-colors cursor-pointer group"
            >
              <span className="font-sans text-secondary group-hover:text-primary truncate max-w-[150px]">
                {habit.name}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
                <span className={`font-semibold ${streaks.currentStreak > 0 ? 'text-primary' : 'text-tertiary'}`}>
                  {streaks.currentStreak}d
                </span>
                <span className="text-tertiary text-[10px]">
                  (best {streaks.bestStreak}d)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
