import React from 'react';

export const KeyboardShortcutsFooter: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-2.5 bg-canvas/90 backdrop-blur-[2px] hairline-t select-none z-30">
      <div className="max-w-[640px] mx-auto px-4 flex items-center justify-between text-[11px] font-mono text-tertiary">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">N</kbd>
            <span>Task</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-border-subtle bg-surface text-primary">H</kbd>
            <span>Habit</span>
          </span>
          <span className="flex items-center gap-1.5 hidden sm:flex">
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
        </div>

        <div className="hidden md:block opacity-60 text-[10px]">
          dexie·db / auto-save
        </div>
      </div>
    </footer>
  );
};
