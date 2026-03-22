import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { getWeekByNumber, getPhaseForWeek, getWeekProgress, getWeekHours, getPhaseColor } from '../../utils/progressCalc';
import { formatDateRange, getCurrentWeekNumber } from '../../utils/dateUtils';
import { weekNotesApi } from '../../api/client';
import { ProgressRing } from '../shared/ProgressRing';
import { SlotCard } from './SlotCard';
import { useEffect } from 'react';

export function WeekView() {
  const { weekNumber: weekParam } = useParams<{ weekNumber: string }>();
  const weekNumber = Number(weekParam);
  const { state, studyPlan } = useProgress();
  const week = getWeekByNumber(weekNumber, studyPlan.phases);
  const phase = getPhaseForWeek(weekNumber, studyPlan.phases);
  const [weekNotes, setWeekNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    weekNotesApi.get(`week-${weekNumber}`).then(r => setWeekNotes(r.notes || '')).catch(() => {});
  }, [weekNumber]);

  if (!week || !phase) {
    return <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>Week not found</div>;
  }

  const progress = getWeekProgress(week, state.completions);
  const hours = getWeekHours(week, state.completions);
  const phaseColor = getPhaseColor(phase.number);
  const currentWeek = getCurrentWeekNumber(state.settings.actual_start_date);

  const mainSlots = week.slots.filter(s => !s.isBookSlot);
  const bookSlots = week.slots.filter(s => s.isBookSlot);

  const saveNotes = async () => {
    setNotesSaving(true);
    await weekNotesApi.upsert(`week-${weekNumber}`, weekNotes);
    setNotesSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {weekNumber > 1 && (
              <Link to={`/week/${weekNumber - 1}`} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-tertiary)' }}>
                <ChevronLeft size={20} />
              </Link>
            )}
            <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Week {weekNumber} of 31
            </span>
            {weekNumber < 31 && (
              <Link to={`/week/${weekNumber + 1}`} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-tertiary)' }}>
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
            <span style={{ color: 'var(--color-text-tertiary)' }}>{formatDateRange(weekNumber, state.settings.actual_start_date)}</span>
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Track */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Main Track
          </h3>
          <div className="space-y-3">
            {mainSlots.map(slot => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
          </div>
        </div>

        {/* Parallel Track (Book) */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-accent-book)' }}>
            Parallel Track (Book)
          </h3>
          <div className="space-y-3">
            {bookSlots.map(slot => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
          </div>
        </div>
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
          to={`/confusion-log?week=week-${weekNumber}`}
          className="inline-flex items-center gap-1 text-sm mt-2 hover:underline"
          style={{ color: 'var(--color-accent-primary)' }}
        >
          + Add to confusion log
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {weekNumber > 1 ? (
          <Link to={`/week/${weekNumber - 1}`} className="flex items-center gap-1 text-sm hover:underline" style={{ color: 'var(--color-accent-primary)' }}>
            <ChevronLeft size={16} /> Week {weekNumber - 1}
          </Link>
        ) : <div />}
        {weekNumber < 31 ? (
          <Link to={`/week/${weekNumber + 1}`} className="flex items-center gap-1 text-sm hover:underline" style={{ color: 'var(--color-accent-primary)' }}>
            Week {weekNumber + 1} <ChevronRight size={16} />
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
