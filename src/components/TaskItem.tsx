import React, { useState } from 'react';
import type { Task, Priority } from '../types';
import { useData } from '../context/DataContext';
import { getRelativeTaskDateLabel } from '../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isSelected,
  onEdit,
}) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    saveTask,
    setSelectedItemId,
  } = useData();

  const [expandedSubtasks, setExpandedSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Get child subtasks
  const subtasks = tasks.filter(t => t.parentId === task.id);
  const completedSubtasks = subtasks.filter(t => t.done).length;

  const dateBadge = task.dueDate ? getRelativeTaskDateLabel(task.dueDate) : null;

  const getPriorityDot = (p: Priority) => {
    switch (p) {
      case 'high':
        return <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block flex-shrink-0" title="High Priority" />;
      case 'med':
        return <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block flex-shrink-0 opacity-70" title="Medium Priority" />;
      case 'low':
      default:
        return null;
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) {
      setIsAddingSubtask(false);
      return;
    }
    const newSub: Task = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      priority: 'low',
      done: false,
      createdAt: new Date().toISOString(),
      parentId: task.id,
    };
    await saveTask(newSub);
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
    setExpandedSubtasks(true);
  };

  return (
    <div
      onClick={() => setSelectedItemId(task.id)}
      className={`group transition-all duration-150 py-3 px-2 hairline-b ${
        isSelected ? 'bg-surface/80 ring-1 ring-border-subtle' : 'hover:bg-surface/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTask(task.id);
            }}
            className={`mt-0.5 w-[18px] h-[18px] rounded-[2px] flex items-center justify-center transition-all duration-180 cursor-pointer flex-shrink-0 ${
              task.done
                ? 'bg-complete text-complete-text border border-complete'
                : 'border border-border-subtle hover:border-primary bg-canvas'
            }`}
            aria-label={`Toggle task ${task.title}`}
          >
            {task.done && (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {getPriorityDot(task.priority)}
              <span
                className={`font-sans text-[15px] leading-snug transition-colors duration-180 ${
                  task.done ? 'text-secondary line-through opacity-75' : 'text-primary'
                }`}
              >
                {task.title}
              </span>
            </div>

            {/* Subtask pill indicator */}
            {subtasks.length > 0 && (
              <div className="mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedSubtasks(!expandedSubtasks);
                  }}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-tertiary hover:text-primary transition-colors cursor-pointer"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={`transition-transform ${expandedSubtasks ? 'rotate-90' : ''}`}
                  >
                    <path d="M6 12L10 8L6 4" />
                  </svg>
                  <span>
                    {completedSubtasks}/{subtasks.length} subtasks
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Due Date & Actions */}
        <div className="flex items-center gap-3 font-mono text-xs flex-shrink-0 pt-0.5">
          {dateBadge && (
            <span
              className={`text-[11px] px-1.5 py-0.5 border ${
                dateBadge.isOverdue
                  ? 'border-danger/40 text-danger bg-danger/5'
                  : dateBadge.isToday
                  ? 'border-border-subtle text-primary bg-surface/50'
                  : 'border-transparent text-tertiary'
              }`}
            >
              {dateBadge.label}
            </span>
          )}

          {/* Quick add subtask button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingSubtask(true);
              setExpandedSubtasks(true);
            }}
            className="p-1 text-tertiary hover:text-primary transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Add subtask"
            aria-label="Add subtask"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-tertiary hover:text-primary transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Edit task"
            aria-label="Edit task"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            className="p-1 text-tertiary hover:text-danger transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Delete task"
            aria-label="Delete task"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtasks nested section */}
      {expandedSubtasks && (
        <div className="pl-7 pr-2 pt-2 pb-1 space-y-1.5 mt-1 border-l-2 border-border-subtle/50 ml-2">
          {subtasks.map(sub => (
            <div key={sub.id} className="flex items-center justify-between text-xs py-1 group/sub">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(sub.id);
                  }}
                  className={`w-3.5 h-3.5 rounded-[1.5px] flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                    sub.done
                      ? 'bg-complete text-complete-text border border-complete'
                      : 'border border-border-subtle hover:border-primary bg-canvas'
                  }`}
                  aria-label={`Toggle subtask ${sub.title}`}
                >
                  {sub.done && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                    </svg>
                  )}
                </button>
                <span
                  className={`font-sans text-[13px] ${
                    sub.done ? 'text-secondary line-through opacity-70' : 'text-primary'
                  }`}
                >
                  {sub.title}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(sub.id);
                }}
                className="opacity-0 group-hover/sub:opacity-100 text-tertiary hover:text-danger p-0.5 transition-opacity"
                title="Delete subtask"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* In-line quick subtask input */}
          {isAddingSubtask && (
            <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                autoFocus
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onBlur={() => {
                  if (!newSubtaskTitle.trim()) setIsAddingSubtask(false);
                }}
                placeholder="Subtask title... (press Enter)"
                className="flex-1 bg-surface border border-border-subtle px-2 py-1 text-xs text-primary focus:outline-none focus:border-primary"
              />
            </form>
          )}
        </div>
      )}
    </div>
  );
};
