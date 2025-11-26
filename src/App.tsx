import { useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DriverApplication from './pages/DriverApplication';
import DashboardLayout from './pages/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Component to handle GitHub Pages routing
const GitHubPagesRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a query parameter from 404.html redirect
    const queryParams = new URLSearchParams(location.search);
    const redirectPath = queryParams.get('/');
    
    if (redirectPath) {
      // Clean up the query parameter and navigate
      const cleanPath = redirectPath.replace(/~and~/g, '&');
      navigate(cleanPath, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

const App = () => {
  return (
    <>
      <GitHubPagesRedirect />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/driver-application" element={<DriverApplication />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DashboardLayout role="Admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Driver']}>
              <DashboardLayout role="Driver" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Passenger']}>
              <DashboardLayout role="Passenger" />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;


