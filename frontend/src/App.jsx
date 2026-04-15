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
import TenantManagement from './pages/TenantManagement';
import AssistanceTypeManagement from './pages/AssistanceTypeManagement';
import AdminMessages from './pages/AdminMessages';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import RequestDocument from './pages/RequestDocument';
import MyDocuments from './pages/MyDocuments';
import AdminDocumentRequests from './pages/AdminDocumentRequests';
import DocumentTypeManagement from './pages/DocumentTypeManagement';

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
      <Route path="/citizen/request-document" element={
        <ProtectedRoute roles={['citizen']}>
          <DashboardLayout>
            <RequestDocument />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/citizen/documents" element={
        <ProtectedRoute roles={['citizen']}>
          <DashboardLayout>
            <MyDocuments />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Common Routes */}
      <Route path="/profile" element={
        <ProtectedRoute roles={['citizen', 'barangay_admin', 'super_admin']}>
          <DashboardLayout>
            <Profile />
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
        <ProtectedRoute roles={['barangay_admin']}>
          <DashboardLayout>
            <QueueManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute roles={['barangay_admin']}>
          <DashboardLayout>
            <ReportsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['barangay_admin']}>
          <DashboardLayout>
            <UserManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/messages" element={
        <ProtectedRoute roles={['barangay_admin']}>
          <DashboardLayout>
            <AdminMessages />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/assistance-types" element={
        <ProtectedRoute roles={['barangay_admin']}>
          <DashboardLayout>
            <AssistanceTypeManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/document-requests" element={
        <ProtectedRoute roles={['barangay_admin']}>
          <DashboardLayout>
            <AdminDocumentRequests />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/document-types" element={
        <ProtectedRoute roles={['barangay_admin']}>
          <DashboardLayout>
            <DocumentTypeManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/tenants" element={
        <ProtectedRoute roles={['super_admin']}>
          <DashboardLayout>
            <TenantManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
