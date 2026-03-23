import { Routes, Route } from 'react-router-dom';
import { useProgress } from './context/ProgressContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { WeekView } from './components/weekly/WeekView';
import { PhaseView } from './components/phases/PhaseView';
import { ResourcesView } from './components/resources/ResourcesView';
import { ConfusionLogView } from './components/confusion/ConfusionLogView';
import { SettingsView } from './components/settings/SettingsView';
import { TargetView } from './components/target/TargetView';
import { ActivityLogView } from './components/log/ActivityLogView';
import { WelcomeView } from './components/welcome/WelcomeView';

export function AppGate() {
  const { state } = useProgress();

  if (state.loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <p
          className="text-lg animate-pulse"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-heading)' }}
        >
          Loading...
        </p>
      </div>
    );
  }

  // No study plan loaded -- show the welcome/onboarding screen
  if (!state.studyPlan) {
    return <WelcomeView />;
  }

  // Normal app with sidebar + header
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardView />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/week/:weekNumber" element={<WeekView />} />
        <Route path="/phases" element={<PhaseView />} />
        <Route path="/resources" element={<ResourcesView />} />
        <Route path="/target" element={<TargetView />} />
        <Route path="/activity-log" element={<ActivityLogView />} />
        <Route path="/confusion-log" element={<ConfusionLogView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Route>
    </Routes>
  );
}
