import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useCurrentWeek } from '../../hooks/useCurrentWeek';
import { getOverallProgress, getPhaseProgress, getWeekProgress, getWeekHours, getPhaseColor, getStreakDays } from '../../utils/progressCalc';
import { getTodaySlotTypes, getTimeProgress } from '../../utils/dateUtils';
import { ProgressBar } from '../shared/ProgressBar';
import { ProgressRing } from '../shared/ProgressRing';
import { SlotCard } from '../weekly/SlotCard';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DashboardView() {
  const { state, studyPlan, dayMapping } = useProgress();
  const { weekNumber, week, phase } = useCurrentWeek();
  const overall = getOverallProgress(studyPlan.phases, state.completions);
  const timeProgress = getTimeProgress(state.settings.actual_start_date);
  const streak = getStreakDays(state.completions, studyPlan.phases);
  const isBehind = timeProgress > overall.percent + 5;

  const todaySlotTypes = getTodaySlotTypes(dayMapping);
  const todaySlots = week?.slots.filter(s => {
    const slotKey = `${s.type}-${s.slotNumber}`;
    return todaySlotTypes.includes(slotKey);
  }) || [];

  // Find next uncompleted slots
  const nextUncompleted = week?.slots.filter(s => {
    const completion = state.completions.get(s.id);
    return !completion?.completed && !todaySlots.includes(s);
  }).slice(0, 3) || [];

  // Unresolved confusion entries
  const unresolvedConfusion = state.confusionLog.filter(e => !e.resolved).slice(0, 3);

  const dayName = DAY_NAMES[new Date().getDay()];
  const allTodayDone = todaySlots.length > 0 && todaySlots.every(s => state.completions.get(s.id)?.completed);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Today's tasks */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Today — {dayName}
            </h2>
            {todaySlots.length === 0 ? (
              <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  No slots scheduled for today. Enjoy your rest day!
                </p>
              </div>
            ) : allTodayDone ? (
              <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'var(--color-accent-secondary)', backgroundColor: 'color-mix(in srgb, var(--color-accent-secondary) 8%, var(--color-bg-secondary))' }}>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-accent-secondary)' }}>
                  All done for today!
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Great work. Here are some upcoming tasks you could tackle:
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySlots.map(slot => (
                  <SlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            )}
          </div>

          {/* Next up */}
          {nextUncompleted.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                Next Up
              </h3>
              <div className="space-y-2">
                {nextUncompleted.map(slot => (
                  <SlotCard key={slot.id} slot={slot} compact />
                ))}
              </div>
            </div>
          )}

          {/* Unresolved confusion log */}
          {unresolvedConfusion.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-accent-warning)' }}>
                  <AlertCircle size={14} /> Unresolved ({state.confusionLog.filter(e => !e.resolved).length})
                </h3>
                <Link to="/confusion-log" className="text-xs hover:underline" style={{ color: 'var(--color-accent-primary)' }}>
                  View all <ArrowRight size={12} className="inline" />
                </Link>
              </div>
              <div className="space-y-2">
                {unresolvedConfusion.map(entry => (
                  <div key={entry.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{entry.topic}</div>
                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{entry.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Progress */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overall ring */}
          <div className="rounded-lg border p-4 flex items-center gap-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
            <ProgressRing percent={overall.percent} size={72} strokeWidth={6}>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{overall.percent}%</span>
            </ProgressRing>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Overall Progress</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{overall.completed} / {overall.total} tasks</div>
              {isBehind && (
                <div className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-accent-warning)' }}>
                  Slightly behind schedule — buffer weeks can help
                </div>
              )}
            </div>
          </div>

          {/* Phase progress */}
          {phase && (
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <div className="text-sm font-semibold mb-2" style={{ color: getPhaseColor(phase.number) }}>
                Phase {phase.number}: {phase.title}
              </div>
              <ProgressBar percent={getPhaseProgress(phase, state.completions).percent} color={getPhaseColor(phase.number)} showLabel />
            </div>
          )}

          {/* This week */}
          {week && (
            <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  This Week
                </div>
                <Link to={`/week/${weekNumber}`} className="text-xs hover:underline" style={{ color: 'var(--color-accent-primary)' }}>
                  View <ArrowRight size={12} className="inline" />
                </Link>
              </div>
              {(() => {
                const wp = getWeekProgress(week, state.completions);
                const wh = getWeekHours(week, state.completions);
                return (
                  <>
                    <ProgressBar percent={wp.percent} showLabel />
                    <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      <span>{wp.completed}/{wp.total} slots</span>
                      <span>{wh.completed}/{wh.total} hrs</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Streak */}
          {streak > 0 && (
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <div className="text-3xl mb-1">&#128293;</div>
              <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{streak}-day streak</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Keep it up!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
