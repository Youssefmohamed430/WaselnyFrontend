import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import scheduleService, { Schedule } from '../../services/scheduleService';
import notificationService from '../../services/notificationService';
import { tokenManager } from '../../utils/tokenManager';
import { formatEgyptTime, isScheduledNow, getTimeAgo } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const authService = new AuthService();
  const user = tokenManager.getUserInfo();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [recentSchedules, setRecentSchedules] = useState<Schedule[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    tripsToday: 0,
    completedTrips: 0,
    cancelledTrips: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      // Load current schedule
      const currentResponse = await scheduleService.getCurrentByDriverId(user.id);
      if (currentResponse.isSuccess && currentResponse.result) {
        setCurrentSchedule(currentResponse.result);
      }

      // Load all schedules for statistics
      const schedulesResponse = await scheduleService.getByDriverId(user.id);
      if (schedulesResponse.isSuccess && schedulesResponse.result) {
        const allSchedules = schedulesResponse.result;
        
        // Get recent schedules (last 5)
        const sorted = allSchedules.sort((a, b) => 
          new Date(b.departureDateTime).getTime() - new Date(a.departureDateTime).getTime()
        );
        setRecentSchedules(sorted.slice(0, 5));

        // Calculate statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tripsToday = allSchedules.filter(s => {
          const scheduleDate = new Date(s.departureDateTime);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.getTime() === today.getTime();
        }).length;

        setStats({
          totalTrips: allSchedules.length,
          tripsToday,
          completedTrips: 0, // Would need to get from trip status API
          cancelledTrips: 0, // Would need to get from trip status API
        });
      }

      // Load recent notifications
      const notificationsResponse = await notificationService.getByUserId(user.id);
      if (notificationsResponse.isSuccess && notificationsResponse.result) {
        const sorted = notificationsResponse.result.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setNotifications(sorted.slice(0, 5));
      }

    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = () => {
    if (currentSchedule) {
      navigate(`/driver/active-trip?scheduleId=${currentSchedule.schId}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome, {user?.username || user?.email || 'Driver'}! 👋
        </h1>
        <p className="text-gray-600">
          {formatEgyptTime(new Date(), true)}
        </p>
      </div>

      {/* Current Schedule Card */}
      {currentSchedule && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Today's Schedule</h2>
              <p className="text-blue-100 mb-1">
                <span className="font-semibold">{currentSchedule.from}</span> →{' '}
                <span className="font-semibold">{currentSchedule.to}</span>
              </p>
              <p className="text-blue-100">
                Departure: {formatEgyptTime(currentSchedule.departureDateTime, true)}
              </p>
              <p className="text-blue-100 mt-1">
                Bus: {currentSchedule.busCode} ({currentSchedule.busType})
              </p>
            </div>
            {isScheduledNow(currentSchedule.departureDateTime) && (
              <Button
                onClick={handleStartTrip}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
              >
                Start Trip
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Trips</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTrips}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Trips Today</p>
              <p className="text-2xl font-bold text-gray-800">{stats.tripsToday}</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedTrips}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelledTrips}</p>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/driver/my-schedules')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📅</span>
            <div className="text-left">
              <p className="font-medium text-gray-800">My Schedules</p>
              <p className="text-sm text-gray-600">View all schedules</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/driver/notifications')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">🔔</span>
            <div className="text-left">
              <p className="font-medium text-gray-800">Notifications</p>
              <p className="text-sm text-gray-600">
                {notifications.length > 0 ? `${notifications.length} new` : 'No new notifications'}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/driver/statistics')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <p className="font-medium text-gray-800">Statistics</p>
              <p className="text-sm text-gray-600">View performance</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Trip History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Trips</h2>
          <button
            onClick={() => navigate('/driver/trip-history')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
        {recentSchedules.length > 0 ? (
          <div className="space-y-3">
            {recentSchedules.map((schedule) => (
              <div
                key={schedule.schId}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {schedule.from} → {schedule.to}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatEgyptTime(schedule.departureDateTime, true)} • {schedule.busCode}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {getTimeAgo(schedule.departureDateTime)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent trips</p>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;

