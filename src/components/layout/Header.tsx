import { Flame } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useCurrentWeek } from '../../hooks/useCurrentWeek';
import { getStreakDays, getPhaseColor } from '../../utils/progressCalc';
import { SidebarToggle } from './Sidebar';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { state, studyPlan } = useProgress();
  const { weekNumber, phase } = useCurrentWeek();
  const streak = getStreakDays(state.completions, studyPlan.phases);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b backdrop-blur-sm"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 90%, transparent)',
      }}
    >
      <div className="flex items-center gap-3">
        <SidebarToggle onClick={onMenuClick} />
        <div>
          <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Week {weekNumber} of 31
          </div>
          {phase && (
            <div className="text-sm font-semibold" style={{ color: getPhaseColor(phase.number) }}>
              Phase {phase.number}: {phase.title}
            </div>
          )}
        </div>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <Flame size={16} className="text-orange-500" />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {streak}-day streak
          </span>
        </div>
      )}
    </header>
  );
}
