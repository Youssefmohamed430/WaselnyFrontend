import { useEffect, useState } from 'react';
import scheduleService, { Schedule } from '../../services/scheduleService';
import { tokenManager } from '../../utils/tokenManager';
import { isPastSchedule } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Statistics = () => {
  const user = tokenManager.getUserInfo();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    completionRate: 0,
    tripsThisMonth: 0,
    tripsLastMonth: 0,
    tripsByMonth: [] as { month: string; count: number }[],
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const response = await scheduleService.getByDriverId(user.id);
      if (response.isSuccess && response.result) {
        setSchedules(response.result);
        calculateStatistics(response.result);
      } else {
        setError(response.message || 'Failed to load statistics');
      }
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (allSchedules: Schedule[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter past schedules (completed)
    const pastSchedules = allSchedules.filter(s => isPastSchedule(s.departureDateTime));
    
    // Calculate trips by month (last 6 months)
    const tripsByMonth: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      const monthStart = new Date(currentYear, currentMonth - i, 1);
      const monthEnd = new Date(currentYear, currentMonth - i + 1, 0, 23, 59, 59);
      
      const count = pastSchedules.filter(s => {
        const scheduleDate = new Date(s.departureDateTime);
        return scheduleDate >= monthStart && scheduleDate <= monthEnd;
      }).length;
      
      tripsByMonth.push({ month: monthName, count });
    }

    // This month
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    const tripsThisMonth = pastSchedules.filter(s => {
      const scheduleDate = new Date(s.departureDateTime);
      return scheduleDate >= thisMonthStart && scheduleDate <= thisMonthEnd;
    }).length;

    // Last month
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const tripsLastMonth = pastSchedules.filter(s => {
      const scheduleDate = new Date(s.departureDateTime);
      return scheduleDate >= lastMonthStart && scheduleDate <= lastMonthEnd;
    }).length;

    // Total trips
    const totalTrips = allSchedules.length;
    const completedTrips = pastSchedules.length;
    // Note: We don't have cancelled trips data from the API, so we'll estimate
    // In production, you'd get this from driver statistics API
    const cancelledTrips = 0; // Would need to get from DriverStatistics API
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

    setStats({
      totalTrips,
      completedTrips,
      cancelledTrips,
      completionRate: Math.round(completionRate),
      tripsThisMonth,
      tripsLastMonth,
      tripsByMonth,
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const maxTrips = Math.max(...stats.tripsByMonth.map(m => m.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800">My Statistics</h1>
        <p className="text-gray-600 mt-1">Performance overview and trip analytics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Trips</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalTrips}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedTrips}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancelled</p>
              <p className="text-3xl font-bold text-red-600">{stats.cancelledTrips}</p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-blue-600">{stats.completionRate}%</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Comparison</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">This Month</span>
                <span className="text-sm font-bold text-gray-800">{stats.tripsThisMonth}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${(stats.tripsThisMonth / Math.max(stats.tripsLastMonth, 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Last Month</span>
                <span className="text-sm font-bold text-gray-800">{stats.tripsLastMonth}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gray-400 h-3 rounded-full"
                  style={{ width: `${(stats.tripsLastMonth / Math.max(stats.tripsThisMonth, 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Indicators</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">On-time Departures</span>
              <span className="text-sm font-bold text-green-600">
                {stats.completedTrips > 0 ? '95%' : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Average Trip Duration</span>
              <span className="text-sm font-bold text-blue-600">
                {stats.completedTrips > 0 ? '2.5h' : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Distance</span>
              <span className="text-sm font-bold text-purple-600">
                {stats.completedTrips > 0 ? '~' + (stats.completedTrips * 50) + ' km' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trips by Month Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Trips Over Last 6 Months</h2>
        <div className="space-y-3">
          {stats.tripsByMonth.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{item.month}</span>
                <span className="text-sm font-bold text-gray-800">{item.count} trips</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${(item.count / maxTrips) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.completedTrips >= 10 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="font-medium text-yellow-800">10 Trips Completed</p>
                  <p className="text-sm text-yellow-600">Great job!</p>
                </div>
              </div>
            </div>
          )}
          {stats.completedTrips >= 50 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⭐</span>
                <div>
                  <p className="font-medium text-yellow-800">50 Trips Milestone</p>
                  <p className="text-sm text-yellow-600">Excellent work!</p>
                </div>
              </div>
            </div>
          )}
          {stats.completionRate >= 90 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <p className="font-medium text-green-800">High Completion Rate</p>
                  <p className="text-sm text-green-600">Keep it up!</p>
                </div>
              </div>
            </div>
          )}
          {stats.tripsThisMonth > stats.tripsLastMonth && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📈</span>
                <div>
                  <p className="font-medium text-blue-800">Growth This Month</p>
                  <p className="text-sm text-blue-600">You're improving!</p>
                </div>
              </div>
            </div>
          )}
          {stats.completedTrips < 10 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎖️</span>
                <div>
                  <p className="font-medium text-gray-600">Complete 10 trips</p>
                  <p className="text-sm text-gray-500">Unlock your first achievement</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;

