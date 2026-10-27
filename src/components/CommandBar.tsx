import React, { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ isOpen, onClose }) => {
  const { searchQuery, setSearchQuery } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen && !searchQuery) return null;

  return (
    <div className="mb-4">
      <div className="relative flex items-center bg-surface border border-border-subtle px-3 py-2 text-sm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-tertiary mr-2.5 flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setSearchQuery('');
              onClose();
            }
          }}
          placeholder="Filter habits and tasks... (press Esc to clear)"
          className="w-full bg-transparent text-primary text-sm focus:outline-none placeholder:text-tertiary font-sans"
        />

        {searchQuery ? (
          <button
            onClick={() => {
              setSearchQuery('');
              onClose();
            }}
            className="text-tertiary hover:text-primary text-xs font-mono px-1.5 py-0.5 ml-2 cursor-pointer"
          >
            Clear
          </button>
        ) : (
          <kbd className="text-[10px] font-mono px-1 bg-canvas border border-border-subtle text-tertiary">
            ESC
          </kbd>
        )}
      </div>
    </div>
  );
};
