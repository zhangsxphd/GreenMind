import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import GreenhousesPage from './pages/GreenhousesPage';
import AlertsPage from './pages/AlertsPage';
import AnalysisPage from './pages/AnalysisPage';
import ResearchPage from './pages/ResearchPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="greenhouses" element={<GreenhousesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
