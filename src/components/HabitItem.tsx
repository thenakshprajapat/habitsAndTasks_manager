import React from 'react';
import type { Habit } from '../types';
import { useData } from '../context/DataContext';
import { HabitHeatmap } from './HabitHeatmap';
import { getDayName } from '../utils/dateUtils';

interface HabitItemProps {
  habit: Habit;
  isSelected: boolean;
  onEdit: (habit: Habit) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ habit, isSelected, onEdit }) => {
  const {
    selectedDate,
    habitLogs,
    toggleHabit,
    getHabitStreaks,
    expandedHeatmaps,
    toggleHeatmap,
    setSelectedItemId,
  } = useData();

  const streaks = getHabitStreaks(habit);
  const isExpanded = Boolean(expandedHeatmaps[habit.id]);

  // Check if completed on selectedDate
  const isCompleted = habitLogs.some(
    l => l.habitId === habit.id && l.date === selectedDate && l.completed
  );

  const formatScheduleLabel = () => {
    if (habit.schedule.type === 'daily') {
      return 'Daily';
    }
    const days = habit.schedule.days.map(d => getDayName(d, true));
    return days.join(' · ');
  };

  return (
    <div
      onClick={() => setSelectedItemId(habit.id)}
      className={`group transition-all duration-150 py-3 px-2 hairline-b ${
        isSelected ? 'bg-surface/80 ring-1 ring-border-subtle' : 'hover:bg-surface/30'
      } ${habit.archived ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox & Name */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleHabit(habit.id, selectedDate);
            }}
            className={`mt-0.5 w-[18px] h-[18px] rounded-[2px] flex items-center justify-center transition-all duration-180 cursor-pointer flex-shrink-0 ${
              isCompleted
                ? 'bg-complete text-complete-text border border-complete'
                : 'border border-border-subtle hover:border-primary bg-canvas'
            }`}
            aria-label={`Toggle habit ${habit.name}`}
          >
            {isCompleted && (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className={`font-sans text-[15px] leading-snug transition-colors duration-180 ${
                  isCompleted ? 'text-secondary line-through opacity-75' : 'text-primary'
                }`}
              >
                {habit.name}
              </span>
              {habit.archived && (
                <span className="text-[10px] font-mono px-1 py-0.2 border border-border-subtle text-tertiary">
                  archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-tertiary">
              <span>{formatScheduleLabel()}</span>
              {!streaks.isScheduledToday && (
                <span className="text-secondary/70">· Not scheduled today</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Streaks & Action Toggles */}
        <div className="flex items-center gap-3 font-mono text-xs flex-shrink-0 pt-0.5">
          {/* Current & Best Streak */}
          <div className="flex items-center gap-2 text-right">
            <span
              className={`font-medium tracking-tight ${
                streaks.currentStreak > 0 ? 'text-primary' : 'text-tertiary'
              }`}
              title="Current Streak"
            >
              {streaks.currentStreak}d
            </span>
            <span className="text-tertiary text-[11px]" title="Best All-Time Streak">
              best {streaks.bestStreak}d
            </span>
          </div>

          {/* Heatmap expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleHeatmap(habit.id);
            }}
            className={`p-1 text-tertiary hover:text-primary transition-colors cursor-pointer ${
              isExpanded ? 'text-primary' : ''
            }`}
            title={isExpanded ? 'Hide 90-day activity matrix' : 'Show 90-day activity matrix'}
            aria-label="Toggle activity matrix"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>

          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(habit);
            }}
            className="p-1 text-tertiary hover:text-primary transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Edit habit"
            aria-label="Edit habit"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable 90-Day Heatmap Activity Grid */}
      {isExpanded && (
        <HabitHeatmap
          habit={habit}
          logs={habitLogs.filter(l => l.habitId === habit.id)}
          referenceDateKey={selectedDate}
          onToggleDate={(date) => toggleHabit(habit.id, date)}
        />
      )}
    </div>
  );
};
