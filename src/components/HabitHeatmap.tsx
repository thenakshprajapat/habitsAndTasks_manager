import React, { useMemo, useState } from 'react';
import type { Habit, HabitLog } from '../types';
import { get90DayGrid } from '../utils/streakUtils';
import { getDayName } from '../utils/dateUtils';

interface HabitHeatmapProps {
  habit: Habit;
  logs: HabitLog[];
  referenceDateKey: string;
  onToggleDate?: (date: string) => void;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({
  habit,
  logs,
  referenceDateKey,
  onToggleDate,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    status: string;
    x: number;
    y: number;
  } | null>(null);

  const grid = useMemo(() => {
    return get90DayGrid(habit, logs, referenceDateKey);
  }, [habit, logs, referenceDateKey]);

  // Group into columns of 7 for standard calendar column layout (13 weeks)
  const columns = useMemo(() => {
    const cols: typeof grid[] = [];
    let current: typeof grid = [];
    grid.forEach((day, idx) => {
      current.push(day);
      if (current.length === 7 || idx === grid.length - 1) {
        cols.push(current);
        current = [];
      }
    });
    return cols;
  }, [grid]);

  const completedCount = grid.filter(d => d.isCompleted).length;
  const scheduledCount = grid.filter(d => d.isScheduled && d.date <= referenceDateKey).length;
  const rate = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

  return (
    <div className="pt-3 pb-4 px-3 bg-surface/50 border border-border-subtle/60 mt-2 select-none relative">
      <div className="flex items-center justify-between text-[11px] font-mono text-secondary mb-2.5">
        <span className="tracking-wider uppercase text-[10px] text-tertiary">
          90-Day Activity Matrix
        </span>
        <div className="flex items-center gap-3">
          <span>
            {completedCount} / {scheduledCount} days ({rate}%)
          </span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="inline-block w-2 h-2 rounded-[1px] bg-complete"></span>
            <span className="text-tertiary">Done</span>
            <span className="inline-block w-2 h-2 rounded-[1px] border border-border-subtle bg-transparent ml-1"></span>
            <span className="text-tertiary">Rest</span>
          </div>
        </div>
      </div>

      {/* Grid cells with staggered load */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3.5px] items-start min-w-[340px]">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-[3.5px]">
              {col.map((cell, rowIdx) => {
                const totalIndex = colIdx * 7 + rowIdx;
                const isCurrentDate = cell.date === referenceDateKey;

                let cellStyle = 'bg-transparent border border-border-subtle/70';
                if (cell.isCompleted) {
                  cellStyle = 'bg-complete text-complete-text border-transparent shadow-none';
                } else if (cell.status === 'missed') {
                  cellStyle = 'bg-surface border border-dashed border-border-subtle hover:border-danger/60';
                } else if (cell.status === 'rest') {
                  cellStyle = 'bg-transparent border border-border-subtle/30 opacity-60';
                }

                return (
                  <button
                    key={cell.date}
                    onClick={() => onToggleDate && onToggleDate(cell.date)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        date: cell.date,
                        status: cell.isCompleted
                          ? 'Completed'
                          : cell.status === 'missed'
                          ? 'Scheduled (Missed)'
                          : !cell.isScheduled
                          ? 'Rest day'
                          : 'Pending',
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      animation: `heatmapFadeIn 220ms ease forwards`,
                      animationDelay: `${Math.min(totalIndex * 4, 360)}ms`,
                      opacity: 0,
                    }}
                    className={`w-[9px] h-[9px] rounded-[1.5px] transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10 relative ${cellStyle} ${
                      isCurrentDate ? 'ring-1 ring-primary ring-offset-1 ring-offset-canvas' : ''
                    }`}
                    aria-label={`${cell.date}: ${cell.status}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Floating cell tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 bg-surface border border-border-subtle text-[11px] font-mono text-primary shadow-sm whitespace-nowrap"
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 6}px`,
          }}
        >
          <div className="font-medium">
            {hoveredCell.date} ({getDayName(new Date(hoveredCell.date).getDay(), true)})
          </div>
          <div className="text-secondary text-[10px]">{hoveredCell.status} · Click to toggle</div>
        </div>
      )}

      {/* Keyframe inline style */}
      <style>{`
        @keyframes heatmapFadeIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
