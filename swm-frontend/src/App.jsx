import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CitizenDashboard from './pages/CitizenDashboard.jsx';
import ReportWaste from './pages/ReportWaste.jsx';
import MyComplaints from './pages/MyComplaints.jsx';
import TrackComplaint from './pages/TrackComplaint.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminComplaints from './pages/AdminComplaints.jsx';
import ComplaintManagement from './pages/ComplaintManagement.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute roles={['citizen', 'admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/report" element={<ReportWaste />} />
        <Route path="/complaints" element={<MyComplaints />} />
        <Route path="/complaints/:id" element={<TrackComplaint />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/admin/complaints/:id" element={<ComplaintManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
