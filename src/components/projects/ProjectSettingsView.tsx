import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { completionsApi, subtaskCompletionsApi, confusionApi } from '../../api/client';
import { useProgress } from '../../context/ProgressContext';
import { useProjects } from '../../context/ProjectsContext';
import { DEFAULT_SCHEDULE_CONFIG, SCHEDULE_PRESETS, type ScheduleConfig } from '../../utils/scheduleConfig';
import { ColorPicker } from '../shared/ColorPicker';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function ProjectSettingsView() {
  const { projectId, actualStartDate, scheduleConfig, refreshData } = useProgress();
  const { projects, updateProject } = useProjects();
  const currentProject = projects.find(p => p.id === projectId);
  const [startDate, setStartDate] = useState(actualStartDate || '2026-03-24');
  const [cfg, setCfg] = useState<ScheduleConfig>(structuredClone(scheduleConfig));
  const [message, setMessage] = useState('');
  const [showReset, setShowReset] = useState(false);

  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 2000); };

  const saveSchedule = async () => {
    await updateProject(projectId, { schedule_config: JSON.stringify(cfg) });
    flash('Schedule saved');
  };
  const saveStartDate = async () => {
    await updateProject(projectId, { actual_start_date: startDate });
    flash('Start date saved');
  };

  const toggleDaySlot = (day: string, key: string) => {
    setCfg(prev => {
      const next = structuredClone(prev);
      const arr = next.dayMapping[day] || [];
      next.dayMapping[day] = arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key];
      return next;
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Project Settings</h2>

      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-secondary) 10%, transparent)', color: 'var(--color-accent-secondary)' }}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Project color */}
        <Section title="Project Color" subtitle="Pick a color to identify this project.">
          <ColorPicker
            value={currentProject?.color || '#6366f1'}
            onChange={async (color) => {
              await updateProject(projectId, { color });
              flash('Project color updated');
            }}
          />
        </Section>

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

        {/* Weekly schedule — day mapping only */}
        <Section title="Weekly Schedule" subtitle="Choose which days you do each session. Session types come from your study plan.">
          {/* Presets */}
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Quick presets</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SCHEDULE_PRESETS).map(([id, p]) => (
                <button key={id} onClick={() => setCfg(prev => ({ ...prev, dayMapping: structuredClone(p.config.dayMapping) }))} title={p.description}
                  className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Day mapping */}
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Assign sessions to days</div>
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

        {/* Danger Zone */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-accent-primary)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-accent-primary)' }}>Danger Zone</h3>
          {!showReset ? (
            <button onClick={() => setShowReset(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 10%, transparent)', color: 'var(--color-accent-primary)' }}>
              <RotateCcw size={16} /> Reset Progress for This Project
            </button>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--color-accent-primary)' }}>
                This will delete all completion data, subtask progress, confusion log entries, and week notes for this project. The study plan itself will not be affected.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const allCompletions = await completionsApi(projectId).getAll();
                    for (const c of allCompletions) await completionsApi(projectId).remove(c.slot_id);
                    const allSubtasks = await subtaskCompletionsApi(projectId).getAll();
                    for (const s of allSubtasks) await subtaskCompletionsApi(projectId).upsert(s.subtask_id, false);
                    const allConfusion = await confusionApi(projectId).getAll();
                    for (const e of allConfusion) await confusionApi(projectId).remove(e.id);
                    await refreshData();
                    setShowReset(false);
                    flash('All progress reset for this project');
                  }}
                  className="px-3 py-2 rounded-lg text-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>
                  Yes, Reset Progress
                </button>
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
