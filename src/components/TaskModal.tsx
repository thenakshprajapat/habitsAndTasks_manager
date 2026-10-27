import React, { useState, useEffect } from 'react';
import type { Task, Priority } from '../types';
import { useData } from '../context/DataContext';
import { getTodayKey } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  taskToEdit?: Task | null;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  taskToEdit,
  onClose,
}) => {
  const { tasks, saveTask, deleteTask } = useData();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('med');
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDueDate(taskToEdit.dueDate || '');
      setPriority(taskToEdit.priority);
      const existingSubs = tasks.filter(t => t.parentId === taskToEdit.id).map(t => t.title);
      setSubtaskInputs(existingSubs);
    } else {
      setTitle('');
      setDueDate(getTodayKey());
      setPriority('med');
      setSubtaskInputs([]);
    }
    setNewSubtaskText('');
  }, [taskToEdit, isOpen, tasks]);

  if (!isOpen) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtaskInputs([...subtaskInputs, newSubtaskText.trim()]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtaskInputs(subtaskInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskId = taskToEdit ? taskToEdit.id : crypto.randomUUID();

    const taskData: Task = {
      id: taskId,
      title: title.trim(),
      dueDate: dueDate || undefined,
      priority,
      done: taskToEdit ? taskToEdit.done : false,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
    };

    await saveTask(taskData);

    // If new subtasks added in form that didn't exist before
    const existingSubs = tasks.filter(t => t.parentId === taskId);
    for (const subTitle of subtaskInputs) {
      const alreadyExists = existingSubs.some(s => s.title === subTitle);
      if (!alreadyExists) {
        await saveTask({
          id: crypto.randomUUID(),
          title: subTitle,
          priority: 'low',
          done: false,
          createdAt: new Date().toISOString(),
          parentId: taskId,
        });
      }
    }

    onClose();
  };

  const handleDelete = async () => {
    if (taskToEdit && window.confirm('Delete this task and all its subtasks?')) {
      await deleteTask(taskToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div
        className="w-full max-w-md bg-canvas border border-border-subtle p-6 shadow-xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="flex items-center justify-between pb-4 hairline-b mb-5">
          <h3 id="task-modal-title" className="font-serif text-2xl font-normal text-primary">
            {taskToEdit ? 'Edit Task' : 'New Task'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1.5">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Prepare architectural RFC, Review contract"
              className="w-full bg-surface border border-border-subtle px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary font-sans"
              required
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority" className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1.5">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-surface border border-border-subtle px-3 py-2 text-xs font-mono text-primary focus:outline-none focus:border-primary"
              >
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1.5">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-surface border border-border-subtle px-3 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1.5">
              Subtasks ({subtaskInputs.length})
            </label>

            {subtaskInputs.length > 0 && (
              <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                {subtaskInputs.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 bg-surface border border-border-subtle/50">
                    <span className="truncate flex-1 font-sans text-secondary">{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-tertiary hover:text-danger ml-2 p-0.5"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={e => setNewSubtaskText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newSubtaskText.trim()) {
                      setSubtaskInputs([...subtaskInputs, newSubtaskText.trim()]);
                      setNewSubtaskText('');
                    }
                  }
                }}
                placeholder="Add subtask..."
                className="flex-1 bg-surface border border-border-subtle px-2.5 py-1 text-xs text-primary focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-2.5 py-1 border border-border-subtle text-xs font-mono text-secondary hover:text-primary cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 hairline-t flex items-center justify-between">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs font-mono text-danger hover:underline transition-colors cursor-pointer"
              >
                Delete Task
              </button>
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
                disabled={!title.trim()}
                className="px-4 py-1.5 text-xs font-mono bg-primary text-canvas border border-primary hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
              >
                {taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
