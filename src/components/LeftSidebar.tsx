import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { parseDateKey, getTodayKey, addDays } from '../utils/dateUtils';

export const LeftSidebar: React.FC = () => {
  const { selectedDate, setSelectedDate, habits, habitLogs, getHabitStreaks } = useData();

  const [currentMonthDate, setCurrentMonthDate] = useState(() => parseDateKey(selectedDate));
  const [intention, setIntention] = useState(() => {
    return localStorage.getItem('habit_studio_daily_intention') || 'Focus on presence, consistency, and deep work.';
  });
  const [isEditingIntention, setIsEditingIntention] = useState(false);

  useEffect(() => {
    localStorage.setItem('habit_studio_daily_intention', intention);
  }, [intention]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate calendar days for this month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const todayKey = getTodayKey();

  // Calculate 7-day consistency rate
  const last7Days = Array.from({ length: 7 }, (_, i) => addDays(todayKey, -i));
  let totalScheduledIn7Days = 0;
  let totalCompletedIn7Days = 0;

  for (const d of last7Days) {
    for (const h of habits.filter(h => !h.archived)) {
      const streaks = getHabitStreaks(h);
      if (streaks.isScheduledToday) { // habit is active
        totalScheduledIn7Days++;
        if (habitLogs.some(l => l.habitId === h.id && l.date === d && l.completed)) {
          totalCompletedIn7Days++;
        }
      }
    }
  }

  const weeklyRate = totalScheduledIn7Days > 0 ? Math.round((totalCompletedIn7Days / totalScheduledIn7Days) * 100) : 0;

  return (
    <aside className="w-full space-y-6 text-sm select-none">
      {/* Mini Calendar View */}
      <div className="p-4 bg-surface/40 border border-border-hairline rounded-none">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="font-semibold text-primary tracking-wide uppercase text-[11px]">
            {monthNames[month]} {year}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 text-tertiary hover:text-primary transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8L10 4" />
              </svg>
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-tertiary hover:text-primary transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 12L10 8L6 4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 text-[10px] font-mono text-tertiary text-center mb-1.5">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1 text-xs font-mono">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayKey;

            // Check if user had completions on this day
            const dayCompletions = habitLogs.filter(l => l.date === dateStr && l.completed).length;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-7 w-7 rounded-[2px] relative flex flex-col items-center justify-center text-[11px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-canvas font-semibold shadow-sm'
                    : isToday
                    ? 'border border-primary text-primary font-medium'
                    : 'hover:bg-surface text-secondary hover:text-primary'
                }`}
              >
                <span>{dayNum}</span>
                {dayCompletions > 0 && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-complete absolute bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Intention / Focus Card */}
      <div className="p-4 bg-surface/40 border border-border-hairline rounded-none">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-tertiary mb-2">
          <span>Daily Intention</span>
          <button
            onClick={() => setIsEditingIntention(!isEditingIntention)}
            className="text-[10px] text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            {isEditingIntention ? 'Done' : 'Edit'}
          </button>
        </div>

        {isEditingIntention ? (
          <textarea
            value={intention}
            onChange={e => setIntention(e.target.value)}
            rows={3}
            className="w-full text-xs font-serif italic text-primary bg-surface border border-border-subtle p-2 focus:outline-none focus:border-primary resize-none"
            placeholder="Write your focus for today..."
          />
        ) : (
          <p className="font-serif italic text-sm text-primary leading-relaxed">
            "{intention}"
          </p>
        )}
      </div>

      {/* 7-Day Consistency Meter */}
      <div className="p-4 bg-surface/40 border border-border-hairline rounded-none text-xs font-mono space-y-2">
        <div className="flex justify-between items-center text-tertiary uppercase text-[10px] tracking-wider">
          <span>7-Day Consistency</span>
          <span className="text-primary font-bold text-xs">{weeklyRate}%</span>
        </div>
        <div className="w-full bg-border-hairline h-1 rounded-none overflow-hidden">
          <div
            className="bg-complete h-full transition-all duration-300"
            style={{ width: `${weeklyRate}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-tertiary pt-1">
          <span>{totalCompletedIn7Days} check-offs</span>
          <span>Last 7 calendar days</span>
        </div>
      </div>
    </aside>
  );
};
