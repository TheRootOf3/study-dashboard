import { Routes, Route } from 'react-router-dom';
import { useProjects } from './context/ProjectsContext';
import { AppShell } from './components/layout/AppShell';
import { CombinedDashboardView } from './components/dashboard/CombinedDashboardView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { CombinedCalendarView } from './components/calendar/CombinedCalendarView';
import { WeekView } from './components/weekly/WeekView';
import { PhaseView } from './components/phases/PhaseView';
import { ResourcesView } from './components/resources/ResourcesView';
import { ConfusionLogView } from './components/confusion/ConfusionLogView';
import { SettingsView } from './components/settings/SettingsView';
import { TargetView } from './components/target/TargetView';
import { ActivityLogView } from './components/log/ActivityLogView';
import { WelcomeView } from './components/welcome/WelcomeView';
import { ProjectShell } from './components/projects/ProjectShell';
import { ProjectSettingsView } from './components/projects/ProjectSettingsView';

export function AppGate() {
  const { projects, loading: projectsLoading } = useProjects();

  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p className="text-lg animate-pulse" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-heading)' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return <WelcomeView />;
  }

  // Always multi-project mode — one unified route tree
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Combined views */}
        <Route path="/" element={<CombinedDashboardView />} />
        <Route path="/calendar" element={<CombinedCalendarView />} />
        <Route path="/settings" element={<SettingsView />} />

        {/* Per-project views */}
        <Route path="/p/:slug" element={<ProjectShell />}>
          <Route index element={<DashboardView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="week/:weekNumber" element={<WeekView />} />
          <Route path="phases" element={<PhaseView />} />
          <Route path="resources" element={<ResourcesView />} />
          <Route path="target" element={<TargetView />} />
          <Route path="activity-log" element={<ActivityLogView />} />
          <Route path="confusion-log" element={<ConfusionLogView />} />
          <Route path="settings" element={<ProjectSettingsView />} />
        </Route>
      </Route>
    </Routes>
  );
}
