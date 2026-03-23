import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Target, BookOpen, Library, AlertCircle, ClipboardList, Settings, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { ProgressBar } from '../shared/ProgressBar';
import { getPhaseProgress, getOverallProgress, getWeekProgress, getPhaseColor } from '../../utils/progressCalc';
import { getCurrentWeekNumber } from '../../utils/dateUtils';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, studyPlan } = useProgress();
  const location = useLocation();
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const currentWeekNumber = getCurrentWeekNumber(state.settings.actual_start_date);
  const overall = getOverallProgress(studyPlan.phases, state.completions);
  const unresolvedCount = state.confusionLog.filter(e => !e.resolved).length;

  const togglePhase = (n: number) => {
    const next = new Set(expandedPhases);
    if (next.has(n)) next.delete(n); else next.add(n);
    setExpandedPhases(next);
  };

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'font-semibold'
        : 'hover:opacity-80'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 272,
          backgroundColor: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>
            Maths Dashboard
          </h1>
          <button onClick={onClose} className="lg:hidden p-1 rounded cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLink to="/" end onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
            style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/calendar" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
            style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
            <Calendar size={18} /> Calendar
          </NavLink>
          <NavLink to="/target" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
            style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
            <Target size={18} /> Progress Target
          </NavLink>

          <div className="pt-3 pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Phases
            </span>
          </div>

          {studyPlan.phases.map(phase => {
            const pp = getPhaseProgress(phase, state.completions);
            const isExpanded = expandedPhases.has(phase.number);
            const phaseColor = getPhaseColor(phase.number);

            return (
              <div key={phase.id}>
                <button
                  onClick={() => togglePhase(phase.number)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-colors cursor-pointer text-left"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="flex-1 truncate">
                    <span className="font-semibold" style={{ color: phaseColor }}>{phase.number}.</span>{' '}
                    {phase.title}
                  </span>
                </button>
                <div className="px-3 pb-1">
                  <ProgressBar percent={pp.percent} color={phaseColor} height={4} showLabel />
                </div>

                {isExpanded && (
                  <div className="pl-7 pr-3 pb-2 space-y-0.5">
                    {phase.weeks.map(week => {
                      const wp = getWeekProgress(week, state.completions);
                      const isCurrent = week.weekNumber === currentWeekNumber;
                      const weekPath = `/week/${week.weekNumber}`;
                      const isActive = location.pathname === weekPath;

                      return (
                        <NavLink
                          key={week.id}
                          to={weekPath}
                          onClick={onClose}
                          className="flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors"
                          style={{
                            color: isActive ? 'var(--color-accent-primary)' : isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                            backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined,
                            fontWeight: isCurrent || isActive ? 600 : 400,
                          }}
                        >
                          <span className="flex-1">
                            Wk {week.weekNumber}
                            {week.isBuffer && <span className="ml-1 opacity-60">(buffer)</span>}
                          </span>
                          <span className="font-mono">
                            {wp.completed === wp.total && wp.total > 0 ? (
                              <span style={{ color: 'var(--color-accent-secondary)' }}>&#10003;</span>
                            ) : wp.completed > 0 ? (
                              `${wp.completed}/${wp.total}`
                            ) : (
                              <span className="opacity-40">-</span>
                            )}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <NavLink to="/phases" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
              <BookOpen size={18} /> Phase Overview
            </NavLink>
            <NavLink to="/resources" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
              <Library size={18} /> Resources
            </NavLink>
            <NavLink to="/confusion-log" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
              <AlertCircle size={18} /> Confusion Log
              {unresolvedCount > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-accent-warning)', color: 'white' }}>
                  {unresolvedCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/activity-log" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
              <ClipboardList size={18} /> Activity Log
            </NavLink>
            <NavLink to="/settings" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined })}>
              <Settings size={18} /> Settings
            </NavLink>
          </div>
        </nav>

        {/* Footer with overall progress */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Overall: {overall.completed} / {overall.total} tasks
          </div>
          <ProgressBar percent={overall.percent} showLabel />
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg cursor-pointer"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <Menu size={24} />
    </button>
  );
}
