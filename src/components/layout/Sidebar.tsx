import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, Target, BookOpen, Library, AlertCircle, ClipboardList, Settings, ChevronDown, ChevronRight, Menu, X, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useProjects } from '../../context/ProjectsContext';
import { ProgressBar } from '../shared/ProgressBar';
import { studyPlanApi, completionsApi, confusionApi, type Completion, type ConfusionEntry } from '../../api/client';
import type { StudyPlan } from '../../utils/progressCalc';
import { getPhaseProgress, getOverallProgress, getWeekProgress, getPhaseColor } from '../../utils/progressCalc';
import { getCurrentWeekNumber } from '../../utils/dateUtils';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { projects } = useProjects();
  const location = useLocation();
  const activeProject = projects.find(p => location.pathname.startsWith(`/p/${p.slug}`)) ?? null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 272, backgroundColor: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}>
            Study Dashboard
          </h1>
          <button onClick={onClose} className="lg:hidden p-1 rounded cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Combined views */}
          <NavLink to="/" end onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
            style={({ isActive }) => navLinkStyle(isActive)}>
            <LayoutDashboard size={18} /> This Week
          </NavLink>
          <NavLink to="/calendar" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
            style={({ isActive }) => navLinkStyle(isActive)}>
            <Calendar size={18} /> Calendar
          </NavLink>

          {/* Projects */}
          <div className="pt-3 pb-1 flex items-center justify-between px-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Projects
            </span>
            <Link to="/settings" onClick={onClose} className="p-0.5 rounded cursor-pointer hover:opacity-70" style={{ color: 'var(--color-text-tertiary)' }} title="Manage projects">
              <Plus size={14} />
            </Link>
          </div>

          {projects.map(p => {
            const projectBase = `/p/${p.slug}`;
            const isActive = location.pathname.startsWith(projectBase);
            return (
              <div key={p.id}>
                <NavLink
                  to={projectBase}
                  onClick={onClose}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-semibold' : 'hover:opacity-80'}`}
                  style={{
                    color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined,
                  }}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || 'var(--color-accent-primary)' }} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
                {/* Show project nav when this project's route is active */}
                {isActive && (
                  <ProjectNav
                    basePath={projectBase}
                    projectId={p.id}
                    actualStartDate={p.actual_start_date}
                    onClose={onClose}
                  />
                )}
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>No projects yet</p>
              <Link to="/settings" onClick={onClose} className="text-xs hover:underline" style={{ color: 'var(--color-accent-primary)' }}>
                Create a project
              </Link>
            </div>
          )}

          <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <NavLink to="/settings" onClick={onClose} className={({ isActive }) => navLinkClass(isActive)}
              style={({ isActive }) => navLinkStyle(isActive)}>
              <Settings size={18} /> Settings
            </NavLink>
          </div>
        </nav>

        <SidebarFooter projectId={activeProject?.id ?? null} />
      </aside>
    </>
  );
}

/** Per-project navigation — shown inline under the active project in the sidebar.
 *
 * This component lives OUTSIDE the ProgressProvider (Sidebar is a sibling of the
 * route Outlet), so it fetches its own data directly from the API rather than
 * relying on useProgressOptional(). */
function ProjectNav({
  basePath,
  projectId,
  actualStartDate,
  onClose,
}: {
  basePath: string;
  projectId: string;
  actualStartDate: string | null;
  onClose: () => void;
}) {
  const location = useLocation();
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [completions, setCompletions] = useState<Map<string, Completion>>(new Map());
  const [confusionLog, setConfusionLog] = useState<ConfusionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let plan: Record<string, unknown> | null;
      try {
        plan = await studyPlanApi(projectId).get();
      } catch {
        plan = null;
      }
      if (!plan) {
        setStudyPlan(null);
        setLoading(false);
        return;
      }
      const [rawCompletions, rawConfusion] = await Promise.all([
        completionsApi(projectId).getAll(),
        confusionApi(projectId).getAll(),
      ]);
      const cMap = new Map<string, Completion>();
      for (const c of rawCompletions) cMap.set(c.slot_id, c);
      setStudyPlan(plan as unknown as StudyPlan);
      setCompletions(cMap);
      setConfusionLog(rawConfusion);
    } catch {
      // On error, leave what we have
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const currentWeekNumber = getCurrentWeekNumber(actualStartDate);
  const unresolvedCount = confusionLog.filter(e => !e.resolved).length;

  const togglePhase = (n: number) => {
    const next = new Set(expandedPhases);
    if (next.has(n)) next.delete(n); else next.add(n);
    setExpandedPhases(next);
  };

  const link = (path: string) => `${basePath}${path}`;

  // Loading skeleton — show nav structure with placeholder bars
  if (loading) {
    return (
      <div className="pl-5 pr-1 py-1 space-y-0.5">
        <NavLink to={link('/target')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)}
          style={({ isActive }) => subNavStyle(isActive)}>
          <Target size={14} /> Progress
        </NavLink>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1">
            <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', opacity: 0.4 }} />
            <div className="flex-1 h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
          </div>
        ))}
        <NavLink to={link('/phases')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <BookOpen size={14} /> Phases
        </NavLink>
        <NavLink to={link('/resources')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <Library size={14} /> Resources
        </NavLink>
        <NavLink to={link('/confusion-log')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <AlertCircle size={14} /> Confusion Log
        </NavLink>
        <NavLink to={link('/activity-log')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <ClipboardList size={14} /> Activity Log
        </NavLink>
        <NavLink to={link('/settings')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <Settings size={14} /> Project Settings
        </NavLink>
      </div>
    );
  }

  // No study plan yet — show nav links without phase tree
  if (!studyPlan) {
    return (
      <div className="pl-5 pr-1 py-1 space-y-0.5">
        <NavLink to={link('/target')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)}
          style={({ isActive }) => subNavStyle(isActive)}>
          <Target size={14} /> Progress
        </NavLink>
        <div className="px-2 py-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          No study plan yet
        </div>
        <NavLink to={link('/phases')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <BookOpen size={14} /> Phases
        </NavLink>
        <NavLink to={link('/resources')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <Library size={14} /> Resources
        </NavLink>
        <NavLink to={link('/confusion-log')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <AlertCircle size={14} /> Confusion Log
        </NavLink>
        <NavLink to={link('/activity-log')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <ClipboardList size={14} /> Activity Log
        </NavLink>
        <NavLink to={link('/settings')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
          <Settings size={14} /> Project Settings
        </NavLink>
      </div>
    );
  }

  return (
    <div className="pl-5 pr-1 py-1 space-y-0.5">
      <NavLink to={basePath} end onClick={onClose} className={({ isActive }) => subNavClass(isActive)}
        style={({ isActive }) => subNavStyle(isActive)}>
        <LayoutDashboard size={14} /> Dashboard
      </NavLink>
      <NavLink to={link('/calendar')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)}
        style={({ isActive }) => subNavStyle(isActive)}>
        <Calendar size={14} /> Calendar
      </NavLink>
      <NavLink to={link('/target')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)}
        style={({ isActive }) => subNavStyle(isActive)}>
        <Target size={14} /> Progress Target
      </NavLink>

      {studyPlan.phases.map(phase => {
        const pp = getPhaseProgress(phase, completions);
        const isExpanded = expandedPhases.has(phase.number);
        const phaseColor = getPhaseColor(phase.number);

        return (
          <div key={phase.id}>
            <button
              onClick={() => togglePhase(phase.number)}
              className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:opacity-80 cursor-pointer text-left"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span className="flex-1 truncate">
                <span style={{ color: phaseColor }}>{phase.number}.</span> {phase.title}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{pp.percent}%</span>
            </button>

            {isExpanded && (
              <div className="pl-4 space-y-0.5">
                {phase.weeks.map(week => {
                  const wp = getWeekProgress(week, completions);
                  const isCurrent = week.weekNumber === currentWeekNumber;
                  const weekPath = link(`/week/${week.weekNumber}`);
                  const isWeekActive = location.pathname === weekPath;
                  return (
                    <NavLink key={week.id} to={weekPath} onClick={onClose}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs"
                      style={{
                        color: isWeekActive ? 'var(--color-accent-primary)' : isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                        backgroundColor: isWeekActive ? 'var(--color-bg-tertiary)' : undefined,
                        fontWeight: isCurrent || isWeekActive ? 600 : 400,
                      }}>
                      <span className="flex-1">Wk {week.weekNumber}{week.isBuffer ? ' (buf)' : ''}</span>
                      <span className="font-mono">
                        {wp.completed === wp.total && wp.total > 0
                          ? <span style={{ color: 'var(--color-accent-secondary)' }}>&#10003;</span>
                          : wp.completed > 0 ? `${wp.completed}/${wp.total}` : <span className="opacity-40">-</span>}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <NavLink to={link('/phases')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
        <BookOpen size={14} /> Phase Overview
      </NavLink>
      <NavLink to={link('/resources')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
        <Library size={14} /> Resources
      </NavLink>
      <NavLink to={link('/confusion-log')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
        <AlertCircle size={14} /> Confusion Log
        {unresolvedCount > 0 && (
          <span className="ml-auto text-xs px-1 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-accent-warning)', color: 'white', fontSize: 10 }}>{unresolvedCount}</span>
        )}
      </NavLink>
      <NavLink to={link('/activity-log')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
        <ClipboardList size={14} /> Activity Log
      </NavLink>
      <NavLink to={link('/settings')} onClick={onClose} className={({ isActive }) => subNavClass(isActive)} style={({ isActive }) => subNavStyle(isActive)}>
        <Settings size={14} /> Project Settings
      </NavLink>
    </div>
  );
}

function SidebarFooter({ projectId }: { projectId: string | null }) {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [completions, setCompletions] = useState<Map<string, Completion>>(new Map());

  useEffect(() => {
    if (!projectId) {
      setStudyPlan(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const plan = await studyPlanApi(projectId).get();
        if (cancelled) return;
        const rawCompletions = await completionsApi(projectId).getAll();
        if (cancelled) return;
        const cMap = new Map<string, Completion>();
        for (const c of rawCompletions) cMap.set(c.slot_id, c);
        setStudyPlan(plan as unknown as StudyPlan);
        setCompletions(cMap);
      } catch {
        if (!cancelled) setStudyPlan(null);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  if (!projectId || !studyPlan) return null;

  const overall = getOverallProgress(studyPlan.phases, completions);

  return (
    <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <div className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
        {overall.completed} / {overall.total} tasks
      </div>
      <ProgressBar percent={overall.percent} showLabel />
    </div>
  );
}

const navLinkClass = (isActive: boolean) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-semibold' : 'hover:opacity-80'}`;

const navLinkStyle = (isActive: boolean) => ({
  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
  backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined,
});

const subNavClass = (isActive: boolean) =>
  `flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${isActive ? 'font-semibold' : 'hover:opacity-80'}`;

const subNavStyle = (isActive: boolean) => ({
  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
  backgroundColor: isActive ? 'var(--color-bg-tertiary)' : undefined,
});

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lg:hidden p-2 rounded-lg cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
      <Menu size={24} />
    </button>
  );
}
