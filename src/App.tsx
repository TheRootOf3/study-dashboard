import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { WeekView } from './components/weekly/WeekView';
import { PhaseView } from './components/phases/PhaseView';
import { ResourcesView } from './components/resources/ResourcesView';
import { ConfusionLogView } from './components/confusion/ConfusionLogView';
import { SettingsView } from './components/settings/SettingsView';
import { TargetView } from './components/target/TargetView';

function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/week/:weekNumber" element={<WeekView />} />
            <Route path="/phases" element={<PhaseView />} />
            <Route path="/resources" element={<ResourcesView />} />
            <Route path="/target" element={<TargetView />} />
            <Route path="/confusion-log" element={<ConfusionLogView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Route>
        </Routes>
      </ProgressProvider>
    </BrowserRouter>
  );
}

export default App;
