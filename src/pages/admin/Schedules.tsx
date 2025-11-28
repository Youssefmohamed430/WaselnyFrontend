import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import scheduleService, { Schedule, CreateScheduleData } from '../../services/scheduleService';
import busService from '../../services/busService';
import tripService from '../../services/tripService';
import adminService from '../../services/adminService';
import { toast } from '../../utils/toast';
import { formatters } from '../../utils/formatters';
import { Bus } from '../../services/busService';
import { Trip } from '../../services/tripService';
import { DriverRequest } from '../../services/adminService';

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<CreateScheduleData>({
    departureDateTime: '',
    busId: 0,
    driverId: '',
    tripId: 0
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    driver: '',
    trip: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleService.getAll();
      if (response.isSuccess && response.result) {
        setSchedules(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await busService.getAll();
      if (response.isSuccess && response.result) {
        setBuses(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    }
  };

  const fetchTrips = async () => {
    try {
      const response = await tripService.getAll();
      if (response.isSuccess && response.result) {
        setTrips(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      // Get accepted drivers from driver requests
      const response = await adminService.getAllDriverRequests();
      if (response.isSuccess && response.result) {
        const acceptedDrivers = response.result
          .filter(r => r.status === 'Accepted')
          .map(r => ({ id: String(r.id), name: r.name }));
        setDrivers(acceptedDrivers);
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchSchedules(), fetchBuses(), fetchTrips(), fetchDrivers()]);
  }, []);

  const handleOpenModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        departureDateTime: schedule.departureDateTime,
        busId: schedule.busId,
        driverId: schedule.driverId,
        tripId: schedule.tripId
      });
    } else {
      setEditingSchedule(null);
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
      setFormData({
        departureDateTime: now.toISOString().slice(0, 16),
        busId: buses[0]?.busId || 0,
        driverId: drivers[0]?.id || '',
        tripId: trips[0]?.id || 0
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const departureDate = new Date(formData.departureDateTime);
    if (departureDate <= new Date()) {
      toast.error('Departure time must be in the future');
      return;
    }

    if (formData.busId === 0) {
      toast.error('Please select a bus');
      return;
    }

    if (!formData.driverId) {
      toast.error('Please select a driver');
      return;
    }

    if (formData.tripId === 0) {
      toast.error('Please select a trip');
      return;
    }

    // Check for conflicts
    const conflictingSchedule = schedules.find(
      (s) =>
        (s.busId === formData.busId || s.driverId === formData.driverId) &&
        s.schId !== editingSchedule?.schId &&
        new Date(s.departureDateTime).toISOString() === new Date(formData.departureDateTime).toISOString()
    );

    if (conflictingSchedule) {
      toast.error('Bus or driver is already scheduled at this time');
      return;
    }

    try {
      setProcessing(true);
      const scheduleData = {
        ...formData,
        departureDateTime: new Date(formData.departureDateTime).toISOString()
      };

      if (editingSchedule) {
        await scheduleService.update(editingSchedule.schId, scheduleData);
        toast.success('Schedule updated successfully');
      } else {
        await scheduleService.create(scheduleData);
        toast.success('Schedule created successfully');
      }

      handleCloseModal();
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error(editingSchedule ? 'Failed to update schedule' : 'Failed to create schedule');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    if (!confirm(`Are you sure you want to delete this schedule?`)) {
      return;
    }

    try {
      await scheduleService.delete(schedule.schId);
      toast.success('Schedule deleted successfully');
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    if (filters.driver && schedule.driverName !== filters.driver) return false;
    if (filters.trip && schedule.tripId.toString() !== filters.trip) return false;
    if (filters.dateFrom) {
      const scheduleDate = new Date(schedule.departureDateTime);
      const fromDate = new Date(filters.dateFrom);
      if (scheduleDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const scheduleDate = new Date(schedule.departureDateTime);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      if (scheduleDate > toDate) return false;
    }
    return true;
  });

  const columns = [
    {
      key: 'departureDateTime',
      header: 'Departure Date & Time',
      sortable: true,
      render: (item: Schedule) => formatters.formatDateTime(item.departureDateTime)
    },
    { key: 'busCode', header: 'Bus Code', sortable: true },
    { key: 'driverName', header: 'Driver', sortable: true },
    { key: 'from', header: 'From', sortable: true },
    { key: 'to', header: 'To', sortable: true }
  ];

  return (
    <AdminLayout title="Schedule Management">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.driver}
              onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Drivers</option>
              {Array.from(new Set(schedules.map(s => s.driverName))).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={filters.trip}
              onChange={(e) => setFilters({ ...filters, trip: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Trips</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id.toString()}>
                  {trip.from} → {trip.to}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From Date"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To Date"
            />
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Schedule
          </button>
        </div>

        {/* Table */}
        <DataTable
          data={filteredSchedules}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search schedules..."
          pagination={{
            pageSize: 20,
            currentPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No schedules found"
          actions={(item: Schedule) => (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(item);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          )}
        />

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.departureDateTime}
                onChange={(e) => setFormData({ ...formData, departureDateTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus *
              </label>
              <select
                value={formData.busId}
                onChange={(e) => setFormData({ ...formData, busId: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="0">Select a bus</option>
                {buses.map((bus) => (
                  <option key={bus.busId} value={bus.busId}>
                    {bus.busCode} ({bus.busType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver *
              </label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip *
              </label>
              <select
                value={formData.tripId}
                onChange={(e) => setFormData({ ...formData, tripId: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="0">Select a trip</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.from} → {trip.to}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : editingSchedule ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Schedules;
