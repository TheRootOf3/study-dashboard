import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useProgress } from '../../context/ProgressContext';
import { useCurrentWeek } from '../../hooks/useCurrentWeek';
import {
  getTargetChartData,
  getTargetStatus,
  getProjectedCompletionWeek,
  getOverallProgress,
  getPhaseProgress,
  getExpectedSlotsAtWeek,
  getPhaseColor,
} from '../../utils/progressCalc';
import { getCurrentDayInPlan } from '../../utils/dateUtils';
import { ProgressBar } from '../shared/ProgressBar';

const STATUS_CONFIG = {
  ahead: { label: 'Ahead of schedule', color: 'var(--color-accent-secondary)', Icon: TrendingUp },
  'on-track': { label: 'On track', color: 'var(--color-accent-primary)', Icon: Minus },
  behind: { label: 'Behind schedule', color: 'var(--color-accent-warning)', Icon: TrendingDown },
} as const;

export function TargetView() {
  const { state, studyPlan } = useProgress();
  const { weekNumber } = useCurrentWeek();
  const currentDay = getCurrentDayInPlan(state.settings.actual_start_date);

  const chartData = getTargetChartData(currentDay, studyPlan.phases, state.completions);
  const target = getTargetStatus(weekNumber, studyPlan.phases, state.completions);
  const overall = getOverallProgress(studyPlan.phases, state.completions);
  const projectedWeek = getProjectedCompletionWeek(weekNumber, studyPlan.phases, state.completions);
  const { label, color, Icon } = STATUS_CONFIG[target.status];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Progress Target
      </h2>

      {/* Status banner */}
      <div
        className="rounded-lg border p-5 flex items-center gap-4"
        style={{
          borderColor: color,
          backgroundColor: `color-mix(in srgb, ${color} 8%, var(--color-bg-secondary))`,
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold" style={{ color }}>{label}</div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {target.actualSlots} / {target.expectedSlots} slots completed by week {weekNumber}
            {target.diff !== 0 && (
              <span className="ml-1 font-semibold" style={{ color }}>
                ({target.diff > 0 ? '+' : ''}{target.diff} slots)
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Overall</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {overall.percent}%
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Current week" value={`${weekNumber} / ${studyPlan.totalWeeks}`} />
        <MetricCard label="Slots completed" value={`${overall.completed} / ${overall.total}`} />
        <MetricCard
          label="Projected finish"
          value={projectedWeek ? `Week ${projectedWeek}` : '—'}
          note={
            projectedWeek
              ? projectedWeek <= studyPlan.totalWeeks
                ? 'On time'
                : `${projectedWeek - studyPlan.totalWeeks} weeks over`
              : undefined
          }
          noteColor={
            projectedWeek
              ? projectedWeek <= studyPlan.totalWeeks
                ? 'var(--color-accent-secondary)'
                : 'var(--color-accent-warning)'
              : undefined
          }
        />
        <MetricCard
          label="Slots per week"
          value={weekNumber > 0 ? (overall.completed / weekNumber).toFixed(1) : '—'}
          note={weekNumber > 0 ? `Target: ${(overall.total / studyPlan.totalWeeks).toFixed(1)}` : undefined}
        />
      </div>

      {/* Expected vs Actual chart */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Progress: Actual vs Target
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="day"
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
              tickFormatter={(d: number) => d % 7 === 0 ? `Wk ${Math.floor(d / 7) + 1}` : ''}
              interval={6}
            />
            <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-text-primary)',
                fontSize: 12,
              }}
              labelFormatter={(d) => {
                const day = Number(d);
                const wk = Math.floor(day / 7) + 1;
                const dayInWeek = (day % 7) + 1;
                return `Week ${wk}, Day ${dayInWeek}`;
              }}
              formatter={(value, name) => {
                const labels: Record<string, string> = { expected: 'Target', actual: 'Actual', predicted: 'Projected' };
                return [`${value} slots`, labels[name as string] || String(name)];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = { expected: 'Target', actual: 'Actual', predicted: 'Projected' };
                return labels[value] || value;
              }}
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine
              x={currentDay}
              stroke="var(--color-text-tertiary)"
              strokeDasharray="4 4"
              label={{
                value: 'Today',
                position: 'top',
                fill: 'var(--color-text-tertiary)',
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="expected"
              stroke="var(--color-text-tertiary)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--color-accent-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-accent-secondary)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-phase breakdown */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Phase Breakdown
        </h3>
        <div className="space-y-4">
          {studyPlan.phases.map(phase => {
            const pp = getPhaseProgress(phase, state.completions);
            const phaseColor = getPhaseColor(phase.number);
            const phaseEndWeek = phase.weekRange[1];
            const phaseDone = weekNumber > phaseEndWeek;
            const phaseStarted = weekNumber >= phase.weekRange[0];
            const expectedInPhase = phaseStarted
              ? phaseDone
                ? pp.total
                : (() => {
                    const expectedTotal = getExpectedSlotsAtWeek(weekNumber, studyPlan.phases);
                    const expectedBefore = phase.weekRange[0] > 1
                      ? getExpectedSlotsAtWeek(phase.weekRange[0] - 1, studyPlan.phases)
                      : 0;
                    return Math.min(expectedTotal - expectedBefore, pp.total);
                  })()
              : 0;
            const expectedPct = pp.total > 0 ? Math.round((expectedInPhase / pp.total) * 100) : 0;

            return (
              <div key={phase.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold" style={{ color: phaseColor }}>
                    Phase {phase.number}: {phase.title}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {pp.completed} / {pp.total} slots
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar percent={pp.percent} color={phaseColor} showLabel />
                  </div>
                  {phaseStarted && (
                    <span className="text-xs shrink-0" style={{
                      color: pp.percent >= expectedPct
                        ? 'var(--color-accent-secondary)'
                        : 'var(--color-accent-warning)',
                    }}>
                      {pp.percent >= expectedPct ? 'On track' : `Expected ${expectedPct}%`}
                    </span>
                  )}
                  {!phaseStarted && (
                    <span className="text-xs shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                      Not started
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  noteColor,
}: {
  label: string;
  value: string;
  note?: string;
  noteColor?: string;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div className="text-lg font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
      {note && (
        <div className="text-xs mt-0.5" style={{ color: noteColor || 'var(--color-text-tertiary)' }}>{note}</div>
      )}
    </div>
  );
}
