import React, { useState } from 'react';
import type { Task } from '../types';
import { useData } from '../context/DataContext';
import { TaskItem } from './TaskItem';

interface TasksSectionProps {
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  onOpenNewTask,
  onEditTask,
}) => {
  const { tasks, searchQuery, selectedDate, selectedItemId } = useData();
  const [filterView, setFilterView] = useState<'today' | 'all' | 'completed'>('today');

  // Root tasks only (subtasks rendered under parent)
  const rootTasks = tasks.filter(t => !t.parentId);

  const filteredTasks = rootTasks.filter(task => {
    // Search match
    if (searchQuery) {
      const matchTitle = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const hasSubtaskMatch = tasks.some(
        sub => sub.parentId === task.id && sub.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!matchTitle && !hasSubtaskMatch) return false;
    }

    if (filterView === 'today') {
      // Show if:
      // 1. Due on selectedDate
      // 2. Or overdue (due < selectedDate and !done)
      // 3. Or undated and not done
      if (task.done) {
        return task.dueDate === selectedDate;
      }
      if (!task.dueDate) return true;
      return task.dueDate <= selectedDate;
    }

    if (filterView === 'completed') {
      return task.done;
    }

    // 'all'
    return true;
  });

  return (
    <section className="pt-8 pb-16" aria-labelledby="tasks-heading">
      {/* Section Header */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div className="flex items-baseline gap-2.5">
          <h2 id="tasks-heading" className="font-serif text-2xl font-normal text-primary tracking-tight">
            Tasks
          </h2>
          <span className="font-mono text-xs text-tertiary">
            ({filteredTasks.length})
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {/* Subtle View Switcher */}
          <div className="flex items-center gap-2 text-[11px] text-tertiary mr-1">
            <button
              onClick={() => setFilterView('today')}
              className={`hover:text-primary transition-colors cursor-pointer ${
                filterView === 'today' ? 'text-primary font-medium underline underline-offset-4' : ''
              }`}
            >
              Today
            </button>
            <span>/</span>
            <button
              onClick={() => setFilterView('all')}
              className={`hover:text-primary transition-colors cursor-pointer ${
                filterView === 'all' ? 'text-primary font-medium underline underline-offset-4' : ''
              }`}
            >
              All
            </button>
            <span>/</span>
            <button
              onClick={() => setFilterView('completed')}
              className={`hover:text-primary transition-colors cursor-pointer ${
                filterView === 'completed' ? 'text-primary font-medium underline underline-offset-4' : ''
              }`}
            >
              Done
            </button>
          </div>

          <button
            onClick={onOpenNewTask}
            className="hover:text-primary text-secondary transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <span>+ New</span>
            <kbd className="text-[10px] px-1 bg-surface border border-border-subtle text-tertiary">N</kbd>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="hairline-t">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-sm font-sans text-secondary italic">
            {searchQuery
              ? 'No tasks matching search.'
              : filterView === 'today'
              ? 'All clear for today.'
              : 'No tasks found.'}
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedItemId === task.id}
              onEdit={onEditTask}
            />
          ))
        )}
      </div>
    </section>
  );
};
