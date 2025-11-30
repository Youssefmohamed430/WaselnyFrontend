import { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DriverApplication from './pages/DriverApplication';
import DashboardLayout from './pages/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/admin/Dashboard';
import DriverRequests from './pages/admin/DriverRequests';
import Buses from './pages/admin/Buses';
import Stations from './pages/admin/Stations';
import Trips from './pages/admin/Trips';
import RoutesPage from './pages/admin/Routes';
import Schedules from './pages/admin/Schedules';
import Tickets from './pages/admin/Tickets';
import Bookings from './pages/admin/Bookings';
import PassengerLayout from './pages/passenger/PassengerLayout';
import PassengerDashboard from './pages/passenger/Dashboard';
import BookTrip from './pages/passenger/BookTrip';
import MyBookings from './pages/passenger/MyBookings';
import TrackBus from './pages/passenger/TrackBus';
import Wallet from './pages/passenger/Wallet';
import Notifications from './pages/passenger/Notifications';
import Profile from './pages/passenger/Profile';
import DriverLayout from './pages/driver/DriverLayout';
import DriverDashboard from './pages/driver/Dashboard';
import MySchedules from './pages/driver/MySchedules';
import ActiveTrip from './pages/driver/ActiveTrip';
import TripHistory from './pages/driver/TripHistory';
import Statistics from './pages/driver/Statistics';
import DriverNotifications from './pages/driver/Notifications';
import { tokenManager } from './utils/tokenManager';
import AuthService from './services/authService';

const authService = new AuthService();

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
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenManager.getToken();

      // If we have a token, check if refresh token is still valid
      if (token && tokenManager.isRefreshTokenValid()) {
        try {
          // Attempt to refresh the token to ensure it's valid
          await authService.refreshToken();
        } catch (error) {
          console.log('Token refresh failed on app init:', error);
          // Clear invalid tokens
          tokenManager.clearAll();
        }
      } else if (token && !tokenManager.isRefreshTokenValid()) {
        // Token exists but refresh token expired, clear everything
        tokenManager.clearAll();
      }

      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/driver-requests"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DriverRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/buses"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Buses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stations"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Stations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trips"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Trips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/routes"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <RoutesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedules"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Schedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Tickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Bookings />
            </ProtectedRoute>
          }
        />
        {/* Driver Routes */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={['Driver']}>
              <DriverLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/driver/dashboard" replace />} />
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="my-schedules" element={<MySchedules />} />
          <Route path="active-trip" element={<ActiveTrip />} />
          <Route path="trip-history" element={<TripHistory />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="notifications" element={<DriverNotifications />} />
        </Route>
        {/* Passenger Routes */}
        <Route
          path="/passenger"
          element={
            <ProtectedRoute allowedRoles={['Passenger']}>
              <PassengerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/passenger/dashboard" replace />} />
          <Route path="dashboard" element={<PassengerDashboard />} />
          <Route path="book-trip" element={<BookTrip />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="track/:bookingId" element={<TrackBus />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;


