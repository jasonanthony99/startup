import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationTracking from './pages/ApplicationTracking';
import AdminDashboard from './pages/AdminDashboard';
import QueueManagement from './pages/QueueManagement';
import ReportsPage from './pages/ReportsPage';
import TransparencyDashboard from './pages/TransparencyDashboard';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'citizen') return <Navigate to="/citizen" replace />;
    if (user.role === 'barangay_admin') return <Navigate to="/admin" replace />;
    if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
  }

  return children;
}

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'citizen' ? '/citizen' : '/admin'} replace />
          : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'citizen' ? '/citizen' : '/admin'} replace />
          : <RegisterPage />
      } />
      <Route path="/track" element={<ApplicationTracking />} />
      <Route path="/transparency" element={<TransparencyDashboard />} />
      <Route path="/transparency/:code" element={<TransparencyDashboard />} />

      {/* Citizen Routes */}
      <Route path="/citizen" element={
        <ProtectedRoute roles={['citizen']}>
          <DashboardLayout>
            <CitizenDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/citizen/apply" element={
        <ProtectedRoute roles={['citizen']}>
          <DashboardLayout>
            <ApplicationForm />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['barangay_admin', 'super_admin']}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/queue" element={
        <ProtectedRoute roles={['barangay_admin', 'super_admin']}>
          <DashboardLayout>
            <QueueManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute roles={['barangay_admin', 'super_admin']}>
          <DashboardLayout>
            <ReportsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
