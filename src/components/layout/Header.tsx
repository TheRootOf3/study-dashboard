import { Flame, Sun, Moon } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useCurrentWeek } from '../../hooks/useCurrentWeek';
import { getStreakDays, getPhaseColor } from '../../utils/progressCalc';
import { SidebarToggle } from './Sidebar';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { state, studyPlan, updateSettings } = useProgress();
  const { weekNumber, phase } = useCurrentWeek();
  const streak = getStreakDays(state.completions, studyPlan.phases);
  const isDark = state.settings.theme === 'dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

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
      <div className="flex items-center gap-2">
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <Flame size={16} className="text-orange-500" />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {streak}-day streak
            </span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text-secondary)' }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
