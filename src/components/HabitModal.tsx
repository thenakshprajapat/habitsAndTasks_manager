import React, { useState, useEffect } from 'react';
import type { Habit, HabitSchedule } from '../types';
import { useData } from '../context/DataContext';
import { getDayName } from '../utils/dateUtils';

interface HabitModalProps {
  isOpen: boolean;
  habitToEdit?: Habit | null;
  onClose: () => void;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  habitToEdit,
  onClose,
}) => {
  const { saveHabit, deleteHabit, archiveHabit } = useData();

  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setScheduleType(habitToEdit.schedule.type);
      setSelectedDays(habitToEdit.schedule.days);
    } else {
      setName('');
      setScheduleType('daily');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) return; // Must keep at least one day
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const schedule: HabitSchedule = {
      type: scheduleType,
      days: scheduleType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays,
    };

    if (habitToEdit) {
      await saveHabit({
        ...habitToEdit,
        name: name.trim(),
        schedule,
      });
    } else {
      const newHabit: Habit = {
        id: crypto.randomUUID(),
        name: name.trim(),
        schedule,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      await saveHabit(newHabit);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (habitToEdit && window.confirm('Permanently delete this habit and all its logs?')) {
      await deleteHabit(habitToEdit.id);
      onClose();
    }
  };

  const handleArchiveToggle = async () => {
    if (habitToEdit) {
      await archiveHabit(habitToEdit.id, !habitToEdit.archived);
      onClose();
    }
  };

  const weekDayPills = [
    { label: 'S', day: 0 },
    { label: 'M', day: 1 },
    { label: 'T', day: 2 },
    { label: 'W', day: 3 },
    { label: 'T', day: 4 },
    { label: 'F', day: 5 },
    { label: 'S', day: 6 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div
        className="w-full max-w-md bg-canvas border border-border-subtle p-6 shadow-xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-modal-title"
      >
        <div className="flex items-center justify-between pb-4 hairline-b mb-5">
          <h3 id="habit-modal-title" className="font-serif text-2xl font-normal text-primary">
            {habitToEdit ? 'Edit Habit' : 'New Habit'}
          </h3>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-primary transition-colors cursor-pointer p-1"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Habit Name */}
          <div>
            <label htmlFor="habit-name" className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1.5">
              Habit Name
            </label>
            <input
              id="habit-name"
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 30-min Reading, Morning Walk, Journaling"
              className="w-full bg-surface border border-border-subtle px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary font-sans"
              required
            />
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1.5">
              Schedule Cadence
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setScheduleType('daily')}
                className={`py-2 px-3 border transition-colors cursor-pointer text-center ${
                  scheduleType === 'daily'
                    ? 'border-primary bg-surface font-medium text-primary'
                    : 'border-border-subtle text-secondary hover:text-primary'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('weekly')}
                className={`py-2 px-3 border transition-colors cursor-pointer text-center ${
                  scheduleType === 'weekly'
                    ? 'border-primary bg-surface font-medium text-primary'
                    : 'border-border-subtle text-secondary hover:text-primary'
                }`}
              >
                Weekly (Specific Days)
              </button>
            </div>
          </div>

          {/* Weekday Selector if Weekly */}
          {scheduleType === 'weekly' && (
            <div>
              <label className="block text-xs font-mono text-tertiary mb-2">
                Active Days ({selectedDays.length} selected)
              </label>
              <div className="flex gap-1.5">
                {weekDayPills.map(p => {
                  const active = selectedDays.includes(p.day);
                  return (
                    <button
                      key={p.day}
                      type="button"
                      onClick={() => toggleDay(p.day)}
                      title={getDayName(p.day)}
                      className={`flex-1 py-1.5 text-xs font-mono border transition-all cursor-pointer ${
                        active
                          ? 'border-primary bg-primary text-canvas font-semibold'
                          : 'border-border-subtle text-secondary hover:border-primary/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 hairline-t flex items-center justify-between">
            {habitToEdit ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleArchiveToggle}
                  className="text-xs font-mono text-secondary hover:text-primary transition-colors cursor-pointer underline"
                >
                  {habitToEdit.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-mono text-danger hover:underline transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-secondary hover:text-primary border border-transparent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-1.5 text-xs font-mono bg-primary text-canvas border border-primary hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
              >
                {habitToEdit ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
