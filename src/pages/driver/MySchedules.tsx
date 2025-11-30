import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import scheduleService, { Schedule } from '../../services/scheduleService';
import { tokenManager } from '../../utils/tokenManager';
import { formatEgyptTime, isScheduledNow, isPastSchedule, isFutureSchedule } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';

const MySchedules = () => {
  const navigate = useNavigate();
  const user = tokenManager.getUserInfo();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'current' | 'past'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [schedules, filter, dateFilter]);

  const loadSchedules = async () => {
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
        // Sort by departure date (newest first)
        const sorted = response.result.sort((a, b) => 
          new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime()
        );
        setSchedules(sorted);
      } else {
        setError(response.message || 'Failed to load schedules');
      }
    } catch (err: any) {
      console.error('Failed to load schedules:', err);
      setError(err.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schedules];

    // Apply status filter
    if (filter === 'upcoming') {
      filtered = filtered.filter(s => isFutureSchedule(s.departureDateTime));
    } else if (filter === 'current') {
      filtered = filtered.filter(s => isScheduledNow(s.departureDateTime));
    } else if (filter === 'past') {
      filtered = filtered.filter(s => isPastSchedule(s.departureDateTime));
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.departureDateTime);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === filterDate.getTime();
      });
    }

    setFilteredSchedules(filtered);
  };

  const getScheduleStatus = (schedule: Schedule): { label: string; color: string } => {
    if (isScheduledNow(schedule.departureDateTime)) {
      return { label: 'Current', color: 'bg-blue-100 text-blue-800' };
    } else if (isPastSchedule(schedule.departureDateTime)) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { label: 'Upcoming', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleStartTrip = (schedule: Schedule) => {
    navigate(`/driver/active-trip?scheduleId=${schedule.schId}`);
  };

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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Schedules</h1>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('current')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'current'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'past'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex-1">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by date"
            />
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((schedule) => {
            const status = getScheduleStatus(schedule);
            return (
              <div
                key={schedule.schId}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {schedule.from} → {schedule.to}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Departure Time</p>
                        <p className="font-medium text-gray-800">
                          {formatEgyptTime(schedule.departureDateTime, true)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Bus</p>
                        <p className="font-medium text-gray-800">
                          {schedule.busCode} ({schedule.busType})
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Trip ID</p>
                        <p className="font-medium text-gray-800">#{schedule.tripId}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Schedule ID</p>
                        <p className="font-medium text-gray-800">#{schedule.schId}</p>
                      </div>
                    </div>
                  </div>

                  {isScheduledNow(schedule.departureDateTime) && (
                    <div className="lg:ml-4">
                      <Button
                        onClick={() => handleStartTrip(schedule)}
                        className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2"
                      >
                        Start Trip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No schedules found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filter !== 'all' || dateFilter
                ? 'Try adjusting your filters'
                : 'You have no schedules assigned yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySchedules;

