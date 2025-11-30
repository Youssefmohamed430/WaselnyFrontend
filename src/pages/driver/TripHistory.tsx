import { useEffect, useState } from 'react';
import scheduleService, { Schedule } from '../../services/scheduleService';
import { tokenManager } from '../../utils/tokenManager';
import { formatEgyptTime, isPastSchedule } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const TripHistory = () => {
  const user = tokenManager.getUserInfo();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadTripHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [schedules, dateFrom, dateTo, statusFilter]);

  const loadTripHistory = async () => {
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
        // Filter only past schedules
        const pastSchedules = response.result.filter(s => isPastSchedule(s.departureDateTime));
        
        // Sort by departure date (newest first)
        const sorted = pastSchedules.sort((a, b) => 
          new Date(b.departureDateTime).getTime() - new Date(a.departureDateTime).getTime()
        );
        
        setSchedules(sorted);
      } else {
        setError(response.message || 'Failed to load trip history');
      }
    } catch (err: any) {
      console.error('Failed to load trip history:', err);
      setError(err.message || 'Failed to load trip history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schedules];

    // Apply date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.departureDateTime);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.departureDateTime);
        return scheduleDate <= toDate;
      });
    }

    // Apply status filter (Note: We don't have actual status from API, so this is a placeholder)
    // In a real implementation, you'd check trip status from a separate API
    if (statusFilter === 'completed') {
      // For now, we'll assume all past schedules are completed
      // In production, you'd check actual trip status
    } else if (statusFilter === 'cancelled') {
      // For now, we can't determine cancelled trips without additional API
      filtered = [];
    }

    setFilteredSchedules(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getPaginatedSchedules = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSchedules.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Trip History</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-sm text-gray-600">
          Showing {getPaginatedSchedules().length} of {filteredSchedules.length} trips
        </p>
      </div>

      {/* Trip History Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {getPaginatedSchedules().length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedSchedules().map((schedule) => (
                    <tr key={schedule.schId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatEgyptTime(schedule.departureDateTime, false)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatEgyptTime(schedule.departureDateTime, true)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.from} → {schedule.to}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{schedule.busCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {schedule.busType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">#{schedule.tripId}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No trip history found</p>
            <p className="text-gray-400 text-sm mt-2">
              {dateFrom || dateTo || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'You have no completed trips yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripHistory;

