import React from 'react';

export const KeyboardShortcutsFooter: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-2.5 bg-canvas/95 backdrop-blur-[4px] hairline-t select-none z-30 hidden lg:block">
      <div className="max-w-[1340px] mx-auto px-6 flex items-center justify-between text-[11px] font-mono text-tertiary">
        <div className="flex items-center gap-5 flex-wrap">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">N</kbd>
            <span>Task</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">H</kbd>
            <span>Habit</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">↑</kbd>
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">↵</kbd>
            <span>Toggle</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">/</kbd>
            <span>Search</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">←</kbd>
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">→</kbd>
            <span>Date</span>
          </span>
        </div>

        <div className="opacity-70 text-[10px] font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-complete" />
          <span>offline-first · persistent sync</span>
        </div>
      </div>
    </footer>
  );
};
