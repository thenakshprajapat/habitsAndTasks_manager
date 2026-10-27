import React from 'react';
import { useData } from '../context/DataContext';
import { getTodayKey } from '../utils/dateUtils';

interface MobileBottomBarProps {
  onOpenNewHabit: () => void;
  onOpenNewTask: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenNewHabit,
  onOpenNewTask,
  onOpenSearch,
  onOpenAuth,
}) => {
  const { selectedDate, setSelectedDate } = useData();
  const isToday = selectedDate === getTodayKey();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-canvas/95 backdrop-blur-[6px] hairline-t px-4 py-2 z-40 lg:hidden select-none"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around text-xs font-mono">
        {/* Today Tab */}
        <button
          onClick={() => setSelectedDate(getTodayKey())}
          className={`flex flex-col items-center gap-1 p-1 transition-colors cursor-pointer ${
            isToday ? 'text-primary font-bold' : 'text-tertiary hover:text-primary'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[10px]">Today</span>
        </button>

        {/* New Habit */}
        <button
          onClick={onOpenNewHabit}
          className="flex flex-col items-center gap-1 p-1 text-tertiary hover:text-primary transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[10px]">+ Habit</span>
        </button>

        {/* New Task */}
        <button
          onClick={onOpenNewTask}
          className="flex flex-col items-center gap-1 p-1 text-tertiary hover:text-primary transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-[10px]">+ Task</span>
        </button>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center gap-1 p-1 text-tertiary hover:text-primary transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="text-[10px]">Filter</span>
        </button>

        {/* Account / Sync */}
        <button
          onClick={onOpenAuth}
          className="flex flex-col items-center gap-1 p-1 text-tertiary hover:text-primary transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px]">Sync</span>
        </button>
      </div>
    </nav>
  );
};
