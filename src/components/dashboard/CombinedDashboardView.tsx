import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { useProjects } from '../../context/ProjectsContext';
import { studyPlanApi, completionsApi, type Project, type Completion } from '../../api/client';
import type { StudyPlan, Slot } from '../../utils/progressCalc';
import { getCurrentWeekNumber, getTodaySlotTypes } from '../../utils/dateUtils';
import { getWeekByNumber, getOverallProgress } from '../../utils/progressCalc';
import { DEFAULT_SCHEDULE_CONFIG, getSlotDisplay, type ScheduleConfig } from '../../utils/scheduleConfig';
import { getIcon } from '../../utils/iconMap';
import { ProgressBar } from '../shared/ProgressBar';
import { Checkbox } from '../shared/Checkbox';

interface ProjectData {
  project: Project;
  plan: StudyPlan | null;
  completions: Map<string, Completion>;
  scheduleConfig: ScheduleConfig;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CombinedDashboardView() {
  const { projects } = useProjects();
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const results: ProjectData[] = [];
      for (const project of projects) {
        try {
          const [plan, comps] = await Promise.all([
            studyPlanApi(project.id).get().catch(() => null),
            completionsApi(project.id).getAll().catch(() => []),
          ]);
          const compMap = new Map<string, Completion>();
          for (const c of comps) compMap.set(c.slot_id, c);
          const scheduleConfig: ScheduleConfig = project.schedule_config
            ? JSON.parse(project.schedule_config)
            : DEFAULT_SCHEDULE_CONFIG;
          results.push({ project, plan: plan as unknown as StudyPlan | null, completions: compMap, scheduleConfig });
        } catch {
          results.push({ project, plan: null, completions: new Map(), scheduleConfig: DEFAULT_SCHEDULE_CONFIG });
        }
      }
      setProjectData(results);
      setLoading(false);
    }
    load();
  }, [projects]);

  const dayName = DAY_NAMES[new Date().getDay()];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-center py-12 animate-pulse" style={{ color: 'var(--color-text-tertiary)' }}>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>This Week</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Today is {dayName}</p>
        </div>
        <Link to="/settings" className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg hover:opacity-80" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
          <Plus size={14} /> New Project
        </Link>
      </div>

      {projectData.length === 0 && (
        <div className="text-center py-12 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }}>No projects yet.</p>
          <Link to="/settings" className="text-sm hover:underline mt-2 inline-block" style={{ color: 'var(--color-accent-primary)' }}>Create your first project</Link>
        </div>
      )}

      <div className="space-y-6">
        {projectData.map(({ project, plan, completions, scheduleConfig }) => {
          if (!plan) {
            return (
              <ProjectSection key={project.id} project={project}>
                <div className="p-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  <p className="text-sm">No study plan uploaded yet.</p>
                  <Link to={`/p/${project.slug}/settings`} className="text-xs hover:underline" style={{ color: 'var(--color-accent-primary)' }}>Upload a plan</Link>
                </div>
              </ProjectSection>
            );
          }

          const weekNumber = getCurrentWeekNumber(project.actual_start_date);
          const week = getWeekByNumber(weekNumber, plan.phases);
          const overall = getOverallProgress(plan.phases, completions);
          const todaySlotTypes = getTodaySlotTypes(scheduleConfig.dayMapping);
          const todaySlots = week?.slots.filter(s => todaySlotTypes.includes(`${s.type}-${s.slotNumber}`)) || [];
          const allDone = todaySlots.length > 0 && todaySlots.every(s => completions.get(s.id)?.completed);

          return (
            <ProjectSection key={project.id} project={project}>
              {/* Progress bar */}
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>Week {weekNumber} of {plan.totalWeeks}{week ? `: ${week.title}` : ''}</span>
                  <span>{overall.completed}/{overall.total} ({overall.percent}%)</span>
                </div>
                <ProgressBar percent={overall.percent} color={project.color} height={4} />
              </div>

              {/* Today's slots */}
              <div className="px-4 pb-4">
                {todaySlots.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: 'var(--color-text-tertiary)' }}>No sessions scheduled today</p>
                ) : allDone ? (
                  <p className="text-xs py-2" style={{ color: 'var(--color-accent-secondary)' }}>All done for today!</p>
                ) : (
                  <div className="space-y-1.5">
                    {todaySlots.map(slot => (
                      <TodaySlotRow key={slot.id} slot={slot} project={project} completions={completions} scheduleConfig={scheduleConfig} />
                    ))}
                  </div>
                )}

                <Link to={`/p/${project.slug}/week/${weekNumber}`}
                  className="inline-flex items-center gap-1 text-xs mt-2 hover:underline"
                  style={{ color: 'var(--color-accent-primary)' }}>
                  View week <ArrowRight size={12} />
                </Link>
              </div>
            </ProjectSection>
          );
        })}
      </div>
    </div>
  );
}

function ProjectSection({ project, children }: { project: Project; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)', borderLeft: `4px solid ${project.color}` }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
        <Link to={`/p/${project.slug}`} className="font-semibold text-sm hover:underline" style={{ color: 'var(--color-text-primary)' }}>
          {project.name}
        </Link>
      </div>
      {children}
    </div>
  );
}

function TodaySlotRow({ slot, project, completions, scheduleConfig }: { slot: Slot; project: Project; completions: Map<string, Completion>; scheduleConfig: ScheduleConfig }) {
  const slotKey = `${slot.type}-${slot.slotNumber}`;
  const display = getSlotDisplay(slotKey, scheduleConfig);
  const Icon = getIcon(display.icon);
  const isCompleted = !!completions.get(slot.id)?.completed;
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setToggling(true);
    try {
      await completionsApi(project.id).upsert(slot.id, { completed: checked ? 1 : 0 });
      // Optimistic update - just toggle locally
      if (checked) {
        completions.set(slot.id, { slot_id: slot.id, completed: 1, completed_at: new Date().toISOString(), notes: '', difficulty: null });
      } else {
        completions.delete(slot.id);
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg" style={{
      backgroundColor: isCompleted ? 'color-mix(in srgb, var(--color-accent-secondary) 5%, transparent)' : 'var(--color-bg-primary)',
      opacity: toggling ? 0.6 : 1,
    }}>
      <Checkbox checked={isCompleted} onChange={handleToggle} size={22} />
      <Icon size={14} style={{ color: 'var(--color-text-tertiary)' }} />
      <span className="text-sm flex-1" style={{
        color: isCompleted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
        textDecoration: isCompleted ? 'line-through' : 'none',
      }}>
        {display.label}
      </span>
      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{slot.estimatedMinutes / 60}h</span>
    </div>
  );
}
