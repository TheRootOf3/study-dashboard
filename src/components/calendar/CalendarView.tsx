import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { useProgress } from '../../context/ProgressContext';
import { getMonthDays, getWeekNumberForDate, getDaySlotTypes, isToday } from '../../utils/dateUtils';
import { getWeekByNumber, getPhaseForWeek, getPhaseColor } from '../../utils/progressCalc';

export function CalendarView() {
  const { state, studyPlan, dayMapping } = useProgress();
  const navigate = useNavigate();

  // Generate months from March 2026 to October 2026
  const months = useMemo(() => {
    const startYear = 2026;
    const result = [];
    for (let m = 2; m <= 9; m++) { // March=2 to October=9
      result.push({ year: startYear, month: m, days: getMonthDays(startYear, m) });
    }
    return result;
  }, []);

  const getDayStatus = (date: Date): 'done' | 'partial' | 'scheduled' | 'none' | 'future' => {
    const weekNum = getWeekNumberForDate(date, state.settings.actual_start_date);
    if (!weekNum) return 'none';

    const week = getWeekByNumber(weekNum, studyPlan.phases);
    if (!week) return 'none';

    const slotTypes = getDaySlotTypes(date, dayMapping);
    if (slotTypes.length === 0) return 'none';

    const daySlots = week.slots.filter(s => slotTypes.includes(`${s.type}-${s.slotNumber}`));
    if (daySlots.length === 0) return 'none';

    const completedCount = daySlots.filter(s => state.completions.get(s.id)?.completed).length;
    if (completedCount === daySlots.length) return 'done';
    if (completedCount > 0) return 'partial';
    return 'scheduled';
  };

  const handleDayClick = (date: Date) => {
    const weekNum = getWeekNumberForDate(date, state.settings.actual_start_date);
    if (weekNum) navigate(`/week/${weekNum}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Study Calendar</h2>

      <div className="space-y-8">
        {months.map(({ year, month, days }) => {
          const monthDate = new Date(year, month, 1);
          return (
            <div key={`${year}-${month}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {format(monthDate, 'MMMM yyyy')}
                </h3>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, i) => {
                  const inMonth = isSameMonth(date, monthDate);
                  const today = isToday(date);
                  const status = inMonth ? getDayStatus(date) : 'none';
                  const weekNum = inMonth ? getWeekNumberForDate(date, state.settings.actual_start_date) : null;
                  const phase = weekNum ? getPhaseForWeek(weekNum, studyPlan.phases) : null;
                  const week = weekNum ? getWeekByNumber(weekNum, studyPlan.phases) : null;

                  const dotColor = {
                    done: 'var(--color-accent-secondary)',
                    partial: 'var(--color-accent-warning)',
                    scheduled: 'var(--color-bg-tertiary)',
                    none: 'transparent',
                    future: 'transparent',
                  }[status];

                  return (
                    <button
                      key={i}
                      onClick={() => inMonth && handleDayClick(date)}
                      disabled={!inMonth || !weekNum}
                      className={`relative p-1.5 rounded-lg text-center transition-colors ${
                        inMonth && weekNum ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                      }`}
                      style={{
                        backgroundColor: today
                          ? 'color-mix(in srgb, var(--color-accent-primary) 12%, transparent)'
                          : phase && inMonth
                          ? `color-mix(in srgb, ${getPhaseColor(phase.number)} 6%, transparent)`
                          : undefined,
                        border: today ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                        opacity: inMonth ? 1 : 0.25,
                      }}
                    >
                      <div className="text-sm" style={{
                        color: today ? 'var(--color-accent-primary)' : inMonth ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                        fontWeight: today ? 700 : 400,
                      }}>
                        {format(date, 'd')}
                      </div>
                      {status !== 'none' && (
                        <div className="flex justify-center mt-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                        </div>
                      )}
                      {week?.isBuffer && inMonth && (
                        <div className="absolute inset-0 rounded-lg" style={{
                          background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, var(--color-border) 3px, var(--color-border) 4px)',
                          opacity: 0.3,
                          pointerEvents: 'none',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {[
          { color: 'var(--color-accent-secondary)', label: 'All done' },
          { color: 'var(--color-accent-warning)', label: 'Partial' },
          { color: 'var(--color-bg-tertiary)', label: 'Scheduled' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <div className="w-4 h-2.5 rounded" style={{
            background: 'repeating-linear-gradient(45deg, var(--color-border), var(--color-border) 2px, transparent 2px, transparent 4px)',
          }} />
          Buffer week
        </div>
      </div>
    </div>
  );
}
