import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useProgress } from '../../context/ProgressContext';
import { getSlotDisplay } from '../../utils/scheduleConfig';
import { getIcon } from '../../utils/iconMap';
import { getWeekByNumber, getPhaseForWeek, getPhaseColor } from '../../utils/progressCalc';

export function ActivityLogView() {
  const { state, projectSlug, studyPlan, scheduleConfig } = useProgress();
  const [filter, setFilter] = useState<'all' | 'slots' | 'subtasks'>('all');

  // Build a unified log of all completion events, sorted newest first
  const entries = useMemo(() => {
    const log: {
      id: string;
      type: 'slot' | 'subtask';
      label: string;
      slotLabel: string;
      weekNumber: number;
      weekTitle: string;
      phaseNumber: number;
      phaseTitle: string;
      completedAt: string;
      difficulty: number | null;
    }[] = [];

    // Slot completions
    for (const [slotId, c] of state.completions) {
      if (!c.completed || !c.completed_at) continue;
      // Parse week number from slot ID (e.g. "week-3-train-1")
      const weekMatch = slotId.match(/^week-(\d+)-(.+)$/);
      if (!weekMatch) continue;
      const weekNum = parseInt(weekMatch[1]);
      const slotKey = weekMatch[2];
      const week = getWeekByNumber(weekNum, studyPlan.phases);
      const phase = getPhaseForWeek(weekNum, studyPlan.phases);
      const display = getSlotDisplay(slotKey, scheduleConfig);

      log.push({
        id: slotId,
        type: 'slot',
        label: display.label,
        slotLabel: display.label,
        weekNumber: weekNum,
        weekTitle: week?.title || `Week ${weekNum}`,
        phaseNumber: phase?.number || 0,
        phaseTitle: phase?.title || '',
        completedAt: c.completed_at,
        difficulty: c.difficulty,
      });
    }

    // Subtask completions
    for (const [subtaskId, sc] of state.subtaskCompletions) {
      if (!sc.completed || !sc.completed_at) continue;
      // Parse: "week-3-train-1-sub-2"
      const match = subtaskId.match(/^week-(\d+)-(.+)-sub-\d+$/);
      if (!match) continue;
      const weekNum = parseInt(match[1]);
      const slotKey = match[2];
      const week = getWeekByNumber(weekNum, studyPlan.phases);
      const phase = getPhaseForWeek(weekNum, studyPlan.phases);
      const display = getSlotDisplay(slotKey, scheduleConfig);

      // Find subtask label from study plan
      const slot = week?.slots.find(s => `${s.type}-${s.slotNumber}` === slotKey);
      const subtask = slot?.subtasks?.find(st => st.id === subtaskId);

      log.push({
        id: subtaskId,
        type: 'subtask',
        label: subtask?.label || subtaskId,
        slotLabel: display.label,
        weekNumber: weekNum,
        weekTitle: week?.title || `Week ${weekNum}`,
        phaseNumber: phase?.number || 0,
        phaseTitle: phase?.title || '',
        completedAt: sc.completed_at,
        difficulty: null,
      });
    }

    // Sort newest first
    log.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return log;
  }, [state.completions, state.subtaskCompletions, studyPlan.phases, scheduleConfig]);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === (filter === 'slots' ? 'slot' : 'subtask'));

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const dateKey = e.completedAt.split('T')[0];
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(e);
    }
    return groups;
  }, [filtered]);

  const difficultyLabels: Record<number, { label: string; color: string }> = {
    1: { label: 'Easy', color: 'var(--color-accent-secondary)' },
    2: { label: 'Medium', color: 'var(--color-accent-warning)' },
    3: { label: 'Hard', color: 'var(--color-accent-primary)' },
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Activity Log</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        {entries.length} completed items
      </p>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4">
        {(['all', 'slots', 'subtasks'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full cursor-pointer capitalize"
            style={{
              backgroundColor: filter === f ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
              color: filter === f ? 'white' : 'var(--color-text-secondary)',
            }}>
            {f}
          </button>
        ))}
      </div>

      {grouped.size === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>
          No completed items yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, items]) => (
            <div key={dateKey}>
              <div className="text-sm font-semibold mb-2 sticky top-14 py-1 backdrop-blur-sm z-10"
                style={{ color: 'var(--color-text-primary)', backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 90%, transparent)' }}>
                {format(parseISO(dateKey), 'EEEE, d MMMM yyyy')}
                <span className="ml-2 font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
                  ({items.length} item{items.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="space-y-1.5">
                {items.map(entry => {
                  const phaseColor = getPhaseColor(entry.phaseNumber);
                  const IconComp = getIcon(getSlotDisplay(`${entry.id.match(/week-\d+-(.+?)(-sub-\d+)?$/)?.[1] || ''}`, scheduleConfig).icon);
                  const time = format(parseISO(entry.completedAt), 'HH:mm');

                  return (
                    <div key={entry.id}
                      className="flex items-start gap-3 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                      <span className="text-xs font-mono w-12 pt-0.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                        {time}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {entry.type === 'slot' && <IconComp size={14} style={{ color: 'var(--color-text-tertiary)' }} />}
                          <span className={`text-sm ${entry.type === 'slot' ? 'font-semibold' : ''}`}
                            style={{ color: entry.type === 'slot' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {entry.type === 'subtask' && (
                              <span className="text-xs mr-1" style={{ color: 'var(--color-text-tertiary)' }}>[{entry.slotLabel}]</span>
                            )}
                            {entry.label}
                          </span>
                          {entry.difficulty && difficultyLabels[entry.difficulty] && (
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `color-mix(in srgb, ${difficultyLabels[entry.difficulty].color} 15%, transparent)`, color: difficultyLabels[entry.difficulty].color }}>
                              {difficultyLabels[entry.difficulty].label}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                          <Link to={`/p/${projectSlug}/week/${entry.weekNumber}`} className="hover:underline" style={{ color: phaseColor }}>
                            Phase {entry.phaseNumber}: {entry.phaseTitle}
                          </Link>
                          {' · '}
                          <Link to={`/p/${projectSlug}/week/${entry.weekNumber}`} className="hover:underline">
                            Week {entry.weekNumber}: {entry.weekTitle}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
