import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StatsCard from '../../components/admin/StatsCard';
import busService from '../../services/busService';
import adminService from '../../services/adminService';
import stationService from '../../services/stationService';
import tripService from '../../services/tripService';
import bookingService from '../../services/bookingService';
import { toast } from '../../utils/toast';
import { tokenManager } from '../../utils/tokenManager';
import LoadingSpinner from '../../components/LoadingSpinner';

const Dashboard = () => {
  const user = tokenManager.getUserInfo();
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalDrivers: 0,
    totalStations: 0,
    totalTrips: 0,
    pendingRequests: 0,
    totalBookingsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [busesRes, driverRequestsRes, stationsRes, tripsRes, bookingsRes] = await Promise.allSettled([
        busService.getAll(),
        adminService.getAllDriverRequests(),
        stationService.getAll(),
        tripService.getAll(),
        bookingService.getAll()
      ]);

      // Count buses
      if (busesRes.status === 'fulfilled' && busesRes.value.isSuccess) {
        setStats((prev) => ({ ...prev, totalBuses: busesRes.value.result?.length || 0 }));
      }

      // Count pending driver requests
      if (driverRequestsRes.status === 'fulfilled' && driverRequestsRes.value.isSuccess) {
        const pending = driverRequestsRes.value.result?.filter(r => r.status === 'Suspend').length || 0;
        setStats((prev) => ({ ...prev, pendingRequests: pending }));
      }

      // Count stations
      if (stationsRes.status === 'fulfilled' && stationsRes.value.isSuccess) {
        setStats((prev) => ({ ...prev, totalStations: stationsRes.value.result?.length || 0 }));
      }

      // Count trips
      if (tripsRes.status === 'fulfilled' && tripsRes.value.isSuccess) {
        setStats((prev) => ({ ...prev, totalTrips: tripsRes.value.result?.length || 0 }));
      }

      // Count today's bookings
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.isSuccess) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = bookingsRes.value.result?.filter((booking) => {
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate >= today && booking.status === 'Booked';
        }).length || 0;
        setStats((prev) => ({ ...prev, totalBookingsToday: todayBookings }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  if (loading && stats.totalBuses === 0) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.username || user?.email || 'Admin'}!
          </h2>
          <p className="text-gray-600 mt-1">Here's an overview of your system</p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {getRelativeTime(lastUpdated)}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total Buses"
            value={stats.totalBuses}
            icon="🚌"
            change={`+0 this month`}
            changeType="neutral"
          />
          <StatsCard
            title="Pending Driver Requests"
            value={stats.pendingRequests}
            icon="👨‍✈️"
            change={stats.pendingRequests > 0 ? 'Requires attention' : 'All clear'}
            changeType={stats.pendingRequests > 0 ? 'negative' : 'positive'}
          />
          <StatsCard
            title="Total Stations"
            value={stats.totalStations}
            icon="🚏"
            change={`Active stations`}
            changeType="neutral"
          />
          <StatsCard
            title="Total Trips"
            value={stats.totalTrips}
            icon="🛣️"
            change={`Available routes`}
            changeType="neutral"
          />
          <StatsCard
            title="Today's Bookings"
            value={stats.totalBookingsToday}
            icon="📖"
            change="Booked today"
            changeType="neutral"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/admin/buses'}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">🚌</div>
              <div className="text-sm font-medium">Add Bus</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin/trips'}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">🛣️</div>
              <div className="text-sm font-medium">Add Trip</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin/schedules'}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-medium">Create Schedule</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin/driver-requests'}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">👨‍✈️</div>
              <div className="text-sm font-medium">Review Requests</div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
