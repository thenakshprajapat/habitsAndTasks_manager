import React from 'react';
import type { Habit } from '../types';
import { useData } from '../context/DataContext';
import { HabitItem } from './HabitItem';

interface HabitsSectionProps {
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
}

export const HabitsSection: React.FC<HabitsSectionProps> = ({
  onOpenNewHabit,
  onEditHabit,
}) => {
  const {
    habits,
    showArchivedHabits,
    setShowArchivedHabits,
    searchQuery,
    selectedItemId,
  } = useData();

  const filteredHabits = habits
    .filter(h => (showArchivedHabits ? true : !h.archived))
    .filter(h => !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const archivedCount = habits.filter(h => h.archived).length;

  return (
    <section className="pt-6 pb-8" aria-labelledby="habits-heading">
      {/* Section Header */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div className="flex items-baseline gap-2.5">
          <h2 id="habits-heading" className="font-serif text-2xl font-normal text-primary tracking-tight">
            Habits
          </h2>
          <span className="font-mono text-xs text-tertiary">
            ({filteredHabits.length})
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchivedHabits(!showArchivedHabits)}
              className="text-tertiary hover:text-primary transition-colors cursor-pointer text-[11px]"
            >
              {showArchivedHabits ? 'Hide archived' : `Archived (${archivedCount})`}
            </button>
          )}

          <button
            onClick={onOpenNewHabit}
            className="hover:text-primary text-secondary transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <span>+ New</span>
            <kbd className="text-[10px] px-1 bg-surface border border-border-subtle text-tertiary">H</kbd>
          </button>
        </div>
      </div>

      {/* Habit List */}
      <div className="hairline-t">
        {filteredHabits.length === 0 ? (
          <div className="py-8 text-center text-sm font-sans text-secondary italic">
            {searchQuery ? 'No habits matching search.' : 'No active habits scheduled.'}
          </div>
        ) : (
          filteredHabits.map(habit => (
            <HabitItem
              key={habit.id}
              habit={habit}
              isSelected={selectedItemId === habit.id}
              onEdit={onEditHabit}
            />
          ))
        )}
      </div>
    </section>
  );
};
