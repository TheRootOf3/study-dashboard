import { useState } from 'react';
import { Download, Upload, RotateCcw, Plus, Trash2, GripVertical } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { backupApi } from '../../api/client';
import { DEFAULT_SCHEDULE_CONFIG, SCHEDULE_PRESETS, nextCustomSlotKey, type ScheduleConfig, type SessionType, type SlotDefinition } from '../../utils/scheduleConfig';
import { AVAILABLE_ICONS, getIcon } from '../../utils/iconMap';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function SettingsView() {
  const { state, scheduleConfig, updateSettings, refreshData } = useProgress();
  const [startDate, setStartDate] = useState(state.settings.actual_start_date || '2026-03-24');
  const [cfg, setCfg] = useState<ScheduleConfig>(structuredClone(scheduleConfig));
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState('');

  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 2000); };

  // --- Persistence ---
  const saveSchedule = async () => {
    await updateSettings({ schedule_config: JSON.stringify(cfg) });
    flash('Schedule saved');
  };
  const saveStartDate = async () => {
    await updateSettings({ actual_start_date: startDate });
    flash('Start date saved');
  };

  // --- Session type CRUD ---
  const addType = () => {
    setCfg(prev => ({
      ...prev,
      sessionTypes: [...prev.sessionTypes, { id: `type-${Date.now()}`, label: 'New Type', icon: 'circle' }],
    }));
  };
  const removeType = (id: string) => {
    setCfg(prev => {
      const next = structuredClone(prev);
      next.sessionTypes = next.sessionTypes.filter(t => t.id !== id);
      const fallback = next.sessionTypes[0]?.id || '';
      for (const s of next.slots) { if (s.typeId === id) s.typeId = fallback; }
      return next;
    });
  };
  const editType = (id: string, field: keyof SessionType, value: string) => {
    setCfg(prev => {
      const next = structuredClone(prev);
      const t = next.sessionTypes.find(t => t.id === id);
      if (t) t[field] = value;
      return next;
    });
  };

  // --- Slot CRUD ---
  const addSlot = () => {
    setCfg(prev => {
      const next = structuredClone(prev);
      const key = nextCustomSlotKey(next);
      const typeId = next.sessionTypes[0]?.id || '';
      next.slots.push({ key, typeId, label: `Custom ${next.slots.length + 1}`, isCustom: true });
      return next;
    });
  };
  const removeSlot = (key: string) => {
    setCfg(prev => {
      const next = structuredClone(prev);
      next.slots = next.slots.filter(s => s.key !== key);
      for (const day of DAYS) {
        next.dayMapping[day] = (next.dayMapping[day] || []).filter(k => k !== key);
      }
      return next;
    });
  };
  const editSlot = (key: string, field: keyof SlotDefinition, value: string) => {
    setCfg(prev => {
      const next = structuredClone(prev);
      const s = next.slots.find(s => s.key === key);
      if (s) {
        if (field === 'typeId') s.typeId = value;
        else if (field === 'label') s.label = value;
      }
      return next;
    });
  };

  // --- Day mapping ---
  const toggleDaySlot = (day: string, key: string) => {
    setCfg(prev => {
      const next = structuredClone(prev);
      const arr = next.dayMapping[day] || [];
      next.dayMapping[day] = arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key];
      return next;
    });
  };

  // --- Data ---
  const handleExport = async () => {
    const data = await backupApi.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `study-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    flash('Progress exported');
  };
  const handleImport = async () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      await backupApi.importData(JSON.parse(await file.text()));
      await refreshData(); flash('Progress imported');
    };
    input.click();
  };
  const handleReset = async () => {
    await backupApi.importData({ completions: [], confusion_log: [], week_notes: [], settings: [], subtask_completions: [] });
    await refreshData(); setShowReset(false); flash('All progress reset');
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
        {/* Start date */}
        <Section title="Start Date" subtitle="When did you start? This shifts all week calculations.">
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            <button onClick={saveStartDate} className="px-3 py-2 rounded-md text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>Save</button>
          </div>
        </Section>

        {/* Schedule config */}
        <Section title="Learning Schedule" subtitle="Define session types, content slots, and your weekly rhythm.">

          {/* Presets */}
          <div className="mb-5">
            <Label>Quick presets</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SCHEDULE_PRESETS).map(([id, p]) => (
                <button key={id} onClick={() => setCfg(structuredClone(p.config))} title={p.description}
                  className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Session types */}
          <div className="mb-5">
            <Label>Session types</Label>
            <div className="space-y-2">
              {cfg.sessionTypes.map(st => {
                const Ic = getIcon(st.icon);
                return (
                  <div key={st.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                    <select value={st.icon} onChange={e => editType(st.id, 'icon', e.target.value)}
                      className="px-2 py-1 rounded border text-xs cursor-pointer"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                      {AVAILABLE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <Ic size={18} style={{ color: 'var(--color-text-secondary)' }} />
                    <input value={st.label} onChange={e => editType(st.id, 'label', e.target.value)}
                      className="flex-1 px-2 py-1 rounded border text-sm"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }} />
                    {cfg.sessionTypes.length > 1 && (
                      <button onClick={() => removeType(st.id)} className="p-1 rounded cursor-pointer hover:opacity-70"
                        style={{ color: 'var(--color-text-tertiary)' }}><Trash2 size={14} /></button>
                    )}
                  </div>
                );
              })}
              <button onClick={addType} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                <Plus size={14} /> Add type
              </button>
            </div>
          </div>

          {/* Weekly slots */}
          <div className="mb-5">
            <Label>Weekly content slots</Label>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Each slot maps to one session of study content per week. Study plan slots have fixed content; custom slots are free-form.
            </p>
            <div className="space-y-1.5">
              {cfg.slots.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <GripVertical size={14} style={{ color: 'var(--color-text-tertiary)', opacity: 0.4 }} />
                  <span className="text-xs w-4 text-center font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{i + 1}</span>
                  <select value={s.typeId} onChange={e => editSlot(s.key, 'typeId', e.target.value)}
                    className="px-2 py-1 rounded border text-xs cursor-pointer w-28"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                    {cfg.sessionTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <input value={s.label} onChange={e => editSlot(s.key, 'label', e.target.value)}
                    className="flex-1 px-2 py-1 rounded border text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                  {s.isCustom ? (
                    <button onClick={() => removeSlot(s.key)} className="p-1 rounded cursor-pointer hover:opacity-70"
                      style={{ color: 'var(--color-text-tertiary)' }}><Trash2 size={14} /></button>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>plan</span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addSlot} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg cursor-pointer mt-2"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              <Plus size={14} /> Add slot
            </button>
          </div>

          {/* Day mapping */}
          <div className="mb-4">
            <Label>Weekly schedule</Label>
            <div className="space-y-2">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-sm font-semibold capitalize w-12" style={{ color: 'var(--color-text-primary)' }}>
                    {day.slice(0, 3)}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cfg.slots.map(s => {
                      const active = cfg.dayMapping[day]?.includes(s.key);
                      return (
                        <button key={s.key} onClick={() => toggleDaySlot(day, s.key)}
                          className="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
                          style={{
                            backgroundColor: active ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
                            color: active ? 'white' : 'var(--color-text-tertiary)',
                          }}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={saveSchedule} className="text-sm px-3 py-1.5 rounded cursor-pointer"
              style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>Save Schedule</button>
            <button onClick={() => setCfg(structuredClone(DEFAULT_SCHEDULE_CONFIG))}
              className="text-sm px-3 py-1.5 rounded cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
              Reset to Default
            </button>
          </div>
        </Section>

        {/* Export/Import */}
        <Section title="Data">
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
              <Download size={16} /> Export
            </button>
            <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
              <Upload size={16} /> Import
            </button>
          </div>
        </Section>

        {/* Reset */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-accent-primary)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-accent-primary)' }}>Danger Zone</h3>
          {!showReset ? (
            <button onClick={() => setShowReset(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 10%, transparent)', color: 'var(--color-accent-primary)' }}>
              <RotateCcw size={16} /> Reset All Progress
            </button>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--color-accent-primary)' }}>This will permanently delete all data.</p>
              <div className="flex gap-2">
                <button onClick={handleReset} className="px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>Yes, Reset</button>
                <button onClick={() => setShowReset(false)} className="px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
      {subtitle && <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>{children}</div>;
}
