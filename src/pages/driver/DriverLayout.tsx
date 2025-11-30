import { useEffect, useState } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import DriverSidebar from '../../components/driver/DriverSidebar';
import DriverHeader from '../../components/driver/DriverHeader';
import AuthService from '../../services/authService';
import notificationService from '../../services/notificationService';
import scheduleService from '../../services/scheduleService';
import { tokenManager } from '../../utils/tokenManager';

const DriverLayout = () => {
  const authService = new AuthService();
  const user = authService.getUserInfo();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [tripStatus, setTripStatus] = useState<'Available' | 'On Trip' | 'Off Duty'>('Available');
  const [hasActiveTrip, setHasActiveTrip] = useState(false);

  // Get page title from location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('my-schedules')) return 'My Schedules';
    if (path.includes('active-trip')) return 'Active Trip';
    if (path.includes('trip-history')) return 'Trip History';
    if (path.includes('statistics')) return 'Statistics';
    if (path.includes('notifications')) return 'Notifications';
    return 'Dashboard';
  };

  // Load notifications count
  useEffect(() => {
    const loadNotifications = async () => {
      if (user?.id) {
        try {
          const response = await notificationService.getByUserId(user.id);
          if (response.isSuccess && response.result) {
            const unread = response.result.filter(n => !n.isRead).length;
            setUnreadNotifications(unread);
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      }
    };

    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Check for active trip
  useEffect(() => {
    const checkActiveTrip = async () => {
      if (user?.id) {
        try {
          const response = await scheduleService.getCurrentByDriverId(user.id);
          if (response.isSuccess && response.result) {
            // Check if trip is active (you might want to check trip status from localStorage or API)
            const activeTripId = localStorage.getItem('activeTripId');
            if (activeTripId) {
              setHasActiveTrip(true);
              setTripStatus('On Trip');
            } else {
              setHasActiveTrip(false);
              setTripStatus('Available');
            }
          } else {
            setHasActiveTrip(false);
            setTripStatus('Available');
          }
        } catch (error) {
          console.error('Failed to check active trip:', error);
        }
      }
    };

    checkActiveTrip();
    
    // Check every minute
    const interval = setInterval(checkActiveTrip, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleNotificationClick = () => {
    navigate('/driver/notifications');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        unreadNotifications={unreadNotifications}
        hasActiveTrip={hasActiveTrip}
      />
      <div className="lg:pl-64">
        <DriverHeader
          title={getPageTitle()}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          tripStatus={tripStatus}
          unreadNotifications={unreadNotifications}
          onNotificationClick={handleNotificationClick}
        />
        <main className="p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;

