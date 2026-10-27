import React, { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import type { ExportPayload } from '../types';
import { getTodayKey } from '../utils/dateUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { exportData, importData, resetToDemo, clearAll, habits, tasks, habitLogs } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const payload = await exportData();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `habit-studio-backup-${getTodayKey()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImportMessage('Data backup downloaded successfully.');
      setIsError(false);
    } catch (err) {
      console.error(err);
      setImportMessage('Export failed.');
      setIsError(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportPayload;
      if (!parsed.habits || !parsed.tasks) {
        throw new Error('Invalid schema structure.');
      }
      await importData(parsed);
      setImportMessage(`Imported ${parsed.habits.length} habits and ${parsed.tasks.length} tasks.`);
      setIsError(false);
    } catch (err: any) {
      console.error(err);
      setImportMessage(`Import error: ${err.message || 'Corrupt JSON file.'}`);
      setIsError(true);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset database with authentic editorial sample habits & tasks?')) {
      await resetToDemo();
      setImportMessage('Sample data restored.');
      setIsError(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Wipe all local data permanently? This action cannot be undone.')) {
      await clearAll();
      setImportMessage('All records cleared.');
      setIsError(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div
        className="w-full max-w-md bg-canvas border border-border-subtle p-6 shadow-xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="flex items-center justify-between pb-4 hairline-b mb-5">
          <h3 id="settings-modal-title" className="font-serif text-2xl font-normal text-primary">
            Settings & Storage
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

        {/* Database Status */}
        <div className="mb-6 p-3 bg-surface border border-border-subtle/70 text-xs font-mono space-y-1">
          <div className="text-secondary uppercase text-[10px] tracking-wider mb-1">IndexedDB Storage (Dexie)</div>
          <div className="flex justify-between text-primary">
            <span>Habits registered:</span>
            <span>{habits.length}</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Logged completions:</span>
            <span>{habitLogs.length}</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Tasks (root + sub):</span>
            <span>{tasks.length}</span>
          </div>
        </div>

        {/* Export / Import Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-primary">Export JSON Data</div>
              <div className="text-xs text-secondary">Export your complete habits, 90-day logs, and tasks.</div>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-mono border border-border-subtle hover:border-primary text-primary transition-colors cursor-pointer"
            >
              Export
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 hairline-t">
            <div>
              <div className="text-sm font-medium text-primary">Import JSON Backup</div>
              <div className="text-xs text-secondary">Restore from a previously saved JSON export file.</div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-mono border border-border-subtle hover:border-primary text-primary transition-colors cursor-pointer"
            >
              Import
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 hairline-t">
            <div>
              <div className="text-sm font-medium text-primary">Reset to Sample Data</div>
              <div className="text-xs text-secondary">Load pre-configured editorial habits and active streaks.</div>
            </div>
            <button
              onClick={handleResetDemo}
              className="px-3 py-1.5 text-xs font-mono border border-border-subtle hover:border-primary text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 hairline-t">
            <div>
              <div className="text-sm font-medium text-danger">Clear All Records</div>
              <div className="text-xs text-secondary">Permanently remove all habits, tasks, and streaks.</div>
            </div>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-mono border border-danger/40 text-danger hover:bg-danger/5 transition-colors cursor-pointer"
            >
              Wipe
            </button>
          </div>
        </div>

        {importMessage && (
          <div
            className={`p-2.5 text-xs font-mono mb-4 border ${
              isError
                ? 'border-danger/30 text-danger bg-danger/5'
                : 'border-complete/30 text-complete bg-complete-tint/40'
            }`}
          >
            {importMessage}
          </div>
        )}

        <div className="pt-3 hairline-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono bg-primary text-canvas border border-primary hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
