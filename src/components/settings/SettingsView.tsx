import { useState } from 'react';
import { Sun, Moon, Download, Upload, RotateCcw } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { backupApi } from '../../api/client';
import { DEFAULT_DAY_MAPPING, type DaySlotMapping } from '../../utils/dateUtils';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SLOT_OPTIONS = ['train-1', 'train-2', 'train-3', 'train-4', 'evening-1', 'evening-2', 'evening-3'];

export function SettingsView() {
  const { state, updateSettings, refreshData, dayMapping } = useProgress();
  const [startDate, setStartDate] = useState(state.settings.actual_start_date || '2026-03-24');
  const [localMapping, setLocalMapping] = useState<DaySlotMapping>(dayMapping);
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState('');

  const isDark = state.settings.theme === 'dark';

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    await updateSettings({ theme: newTheme });
  };

  const saveStartDate = async () => {
    await updateSettings({ actual_start_date: startDate });
    setMessage('Start date saved');
    setTimeout(() => setMessage(''), 2000);
  };

  const saveDayMapping = async () => {
    await updateSettings({ day_mapping: JSON.stringify(localMapping) });
    setMessage('Day mapping saved');
    setTimeout(() => setMessage(''), 2000);
  };

  const resetDayMapping = () => {
    setLocalMapping({ ...DEFAULT_DAY_MAPPING });
  };

  const toggleSlotForDay = (day: string, slot: string) => {
    setLocalMapping(prev => {
      const daySlots = prev[day] || [];
      const next = daySlots.includes(slot) ? daySlots.filter(s => s !== slot) : [...daySlots, slot];
      return { ...prev, [day]: next };
    });
  };

  const handleExport = async () => {
    const data = await backupApi.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Progress exported');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      await backupApi.importData(data);
      await refreshData();
      setMessage('Progress imported');
      setTimeout(() => setMessage(''), 2000);
    };
    input.click();
  };

  const handleReset = async () => {
    await backupApi.importData({ completions: [], confusion_log: [], week_notes: [], settings: [] });
    await refreshData();
    setShowReset(false);
    setMessage('All progress reset');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>

      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-secondary) 10%, transparent)', color: 'var(--color-accent-secondary)' }}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Theme */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Theme</h3>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            Switch to {isDark ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* Start date */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Start Date</h3>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Change if you started on a different date than March 24, 2026. This shifts all week calculations.
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
            />
            <button onClick={saveStartDate} className="px-3 py-2 rounded-md text-sm cursor-pointer" style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>
              Save
            </button>
          </div>
        </div>

        {/* Day mapping */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Day-to-Slot Mapping</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Customise which days of the week you do each study slot.
          </p>
          <div className="space-y-2">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-semibold capitalize w-24" style={{ color: 'var(--color-text-primary)' }}>
                  {day}
                </span>
                <div className="flex flex-wrap gap-1">
                  {SLOT_OPTIONS.map(slot => (
                    <button
                      key={slot}
                      onClick={() => toggleSlotForDay(day, slot)}
                      className="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
                      style={{
                        backgroundColor: localMapping[day]?.includes(slot) ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
                        color: localMapping[day]?.includes(slot) ? 'white' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={saveDayMapping} className="text-sm px-3 py-1.5 rounded cursor-pointer" style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>
              Save Mapping
            </button>
            <button onClick={resetDayMapping} className="text-sm px-3 py-1.5 rounded cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
              Reset to Default
            </button>
          </div>
        </div>

        {/* Export/Import */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Data</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
              <Download size={16} /> Export Progress
            </button>
            <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
              <Upload size={16} /> Import Progress
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Database file: server/progress.db
          </p>
        </div>

        {/* Reset */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-accent-primary)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-accent-primary)' }}>Danger Zone</h3>
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 10%, transparent)', color: 'var(--color-accent-primary)' }}
            >
              <RotateCcw size={16} /> Reset All Progress
            </button>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--color-accent-primary)' }}>
                This will permanently delete all completion data, notes, and confusion log entries. Are you sure?
              </p>
              <div className="flex gap-2">
                <button onClick={handleReset} className="px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>
                  Yes, Reset Everything
                </button>
                <button onClick={() => setShowReset(false)} className="px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
