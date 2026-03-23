import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { getWeekByNumber, getPhaseForWeek, getWeekProgress, getWeekHours, getPhaseColor, type Slot } from '../../utils/progressCalc';
import { formatDateRange, getCurrentWeekNumber, getWeekStartDate } from '../../utils/dateUtils';
import { getSlotDisplay } from '../../utils/scheduleConfig';
import { getIcon } from '../../utils/iconMap';
import { format, addDays } from 'date-fns';
import { weekNotesApi } from '../../api/client';
import { ProgressRing } from '../shared/ProgressRing';
import { Checkbox } from '../shared/Checkbox';
import { SlotCard } from './SlotCard';

export function WeekView() {
  const { weekNumber: weekParam } = useParams<{ weekNumber: string }>();
  const weekNumber = Number(weekParam);
  const { state, projectId, projectSlug, actualStartDate, studyPlan, scheduleConfig } = useProgress();
  const week = getWeekByNumber(weekNumber, studyPlan.phases);
  const phase = getPhaseForWeek(weekNumber, studyPlan.phases);
  const [weekNotes, setWeekNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    weekNotesApi(projectId).get(`week-${weekNumber}`).then(r => setWeekNotes(r.notes || '')).catch(() => {});
  }, [weekNumber, projectId]);

  // Build a slot lookup by key for this week
  const slotByKey = useMemo(() => {
    if (!week) return new Map<string, Slot>();
    const map = new Map<string, Slot>();
    for (const s of week.slots) map.set(`${s.type}-${s.slotNumber}`, s);
    return map;
  }, [week]);

  // Group slots by day of week using the schedule config's dayMapping
  const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABELS: Record<string, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

  const dayGroups = useMemo(() => {
    if (!week) return [];
    const assigned = new Set<string>();
    const groups: { day: string; label: string; date: string; slots: Slot[]; customSlotKeys: string[] }[] = [];
    const weekStart = getWeekStartDate(weekNumber, actualStartDate);

    for (let i = 0; i < DAY_ORDER.length; i++) {
      const day = DAY_ORDER[i];
      const dayDate = addDays(weekStart, i);
      const daySlotKeys = scheduleConfig.dayMapping[day] || [];
      const daySlots: Slot[] = [];
      const customKeys: string[] = [];

      for (const key of daySlotKeys) {
        const slot = slotByKey.get(key);
        if (slot) {
          daySlots.push(slot);
          assigned.add(key);
        } else {
          // Check if it's a custom slot
          const customDef = scheduleConfig.slots.find(s => s.key === key && s.isCustom);
          if (customDef) customKeys.push(key);
        }
      }

      if (daySlots.length > 0 || customKeys.length > 0) {
        groups.push({ day, label: DAY_LABELS[day], date: format(dayDate, 'EEE d MMM'), slots: daySlots, customSlotKeys: customKeys });
      }
    }

    // Unscheduled slots (in the plan but not mapped to any day)
    const unscheduled: Slot[] = [];
    for (const s of week.slots) {
      const key = `${s.type}-${s.slotNumber}`;
      if (!assigned.has(key)) unscheduled.push(s);
    }
    if (unscheduled.length > 0) {
      groups.push({ day: 'unscheduled', label: 'Unscheduled', date: '', slots: unscheduled, customSlotKeys: [] });
    }

    return groups;
  }, [week, scheduleConfig, weekNumber, actualStartDate, slotByKey]);

  if (state.loading) {
    return <div className="text-center py-12 animate-pulse" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</div>;
  }

  if (!week || !phase) {
    return <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>Week not found</div>;
  }

  const progress = getWeekProgress(week, state.completions);
  const hours = getWeekHours(week, state.completions);
  const phaseColor = getPhaseColor(phase.number);
  const currentWeek = getCurrentWeekNumber(actualStartDate);

  const saveNotes = async () => {
    setNotesSaving(true);
    await weekNotesApi(projectId).upsert(`week-${weekNumber}`, weekNotes);
    setNotesSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {weekNumber > 1 && (
              <Link to={`/p/${projectSlug}/week/${weekNumber - 1}`} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-tertiary)' }}>
                <ChevronLeft size={20} />
              </Link>
            )}
            <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Week {weekNumber} of {studyPlan.totalWeeks}
            </span>
            {weekNumber < studyPlan.totalWeeks && (
              <Link to={`/p/${projectSlug}/week/${weekNumber + 1}`} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-tertiary)' }}>
                <ChevronRight size={20} />
              </Link>
            )}
            {weekNumber === currentWeek && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: phaseColor, color: 'white' }}>
                Current
              </span>
            )}
            {week.isBuffer && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                Buffer Week
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {week.title}
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span style={{ color: phaseColor, fontWeight: 600 }}>Phase {phase.number}: {phase.title}</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>{formatDateRange(weekNumber, actualStartDate)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Hours</div>
            <div className="text-sm font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {hours.completed}/{hours.total}
            </div>
          </div>
          <ProgressRing percent={progress.percent} size={56} strokeWidth={5} color={phaseColor}>
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {progress.completed}/{progress.total}
            </span>
          </ProgressRing>
        </div>
      </div>

      {/* Phase 4 info banner */}
      {phase.number === 4 && (
        <div className="flex items-start gap-2 p-3 rounded-lg mb-4" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-warning) 10%, transparent)', borderLeft: '3px solid var(--color-accent-warning)' }}>
          <AlertCircle size={16} style={{ color: 'var(--color-accent-warning)', marginTop: 2 }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            MIT 18.650 problem sets do not have published solutions. Verify answers using lecture notes or companion texts.
          </span>
        </div>
      )}

      {/* Slots grouped by day of week */}
      <div className="space-y-6">
        {dayGroups.map(({ day, label, date, slots: daySlots, customSlotKeys }) => (
          <div key={day}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                {label}
              </h3>
              {date && (
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{date}</span>
              )}
              <div className="flex-1 border-b" style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div className="space-y-3">
              {daySlots.map(slot => (
                <SlotCard key={slot.id} slot={slot} weekNumber={weekNumber} siblingSlotIds={daySlots.map(s => s.id)} />
              ))}
              {customSlotKeys.map(key => (
                <CustomSlotCard key={key} slotKey={key} weekNumber={weekNumber} config={scheduleConfig} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Week Notes */}
      <div className="mt-8 rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          Week Notes
        </h3>
        <textarea
          value={weekNotes}
          onChange={e => setWeekNotes(e.target.value)}
          onBlur={saveNotes}
          className="w-full rounded-md border p-3 text-sm resize-y"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            minHeight: 80,
          }}
          placeholder="Notes for this week..."
        />
        {notesSaving && <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Saving...</span>}
        <Link
          to={`/p/${projectSlug}/confusion-log?week=week-${weekNumber}`}
          className="inline-flex items-center gap-1 text-sm mt-2 hover:underline"
          style={{ color: 'var(--color-accent-primary)' }}
        >
          + Add to confusion log
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {weekNumber > 1 ? (
          <Link to={`/p/${projectSlug}/week/${weekNumber - 1}`} className="flex items-center gap-1 text-sm hover:underline" style={{ color: 'var(--color-accent-primary)' }}>
            <ChevronLeft size={16} /> Week {weekNumber - 1}
          </Link>
        ) : <div />}
        {weekNumber < studyPlan.totalWeeks ? (
          <Link to={`/p/${projectSlug}/week/${weekNumber + 1}`} className="flex items-center gap-1 text-sm hover:underline" style={{ color: 'var(--color-accent-primary)' }}>
            Week {weekNumber + 1} <ChevronRight size={16} />
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}

/** A simple card for custom (user-added) slots with no study plan content */
function CustomSlotCard({ slotKey, weekNumber, config }: { slotKey: string; weekNumber: number; config: import('../../utils/scheduleConfig').ScheduleConfig }) {
  const { state, toggleCompletion } = useProgress();
  const display = getSlotDisplay(slotKey, config);
  const IconComp = getIcon(display.icon);
  const completionId = `week-${weekNumber}-${slotKey}`;
  const completion = state.completions.get(completionId);
  const isCompleted = !!completion?.completed;

  return (
    <div
      className="rounded-lg border p-3 flex items-center gap-3"
      style={{
        borderColor: isCompleted ? 'var(--color-accent-secondary)' : 'var(--color-border)',
        backgroundColor: isCompleted ? 'color-mix(in srgb, var(--color-accent-secondary) 5%, var(--color-bg-secondary))' : 'var(--color-bg-secondary)',
        opacity: isCompleted ? 0.85 : 1,
      }}
    >
      <Checkbox checked={isCompleted} onChange={(checked) => toggleCompletion(completionId, checked)} size={28} />
      <IconComp size={16} style={{ color: 'var(--color-text-tertiary)' }} />
      <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {display.label}
      </span>
      {isCompleted && (
        <span className="text-xs ml-auto" style={{ color: 'var(--color-accent-secondary)' }}>Done</span>
      )}
    </div>
  );
}
