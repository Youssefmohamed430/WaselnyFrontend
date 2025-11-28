import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import tripService, { Trip, CreateTripData } from '../../services/tripService';
import { toast } from '../../utils/toast';
import { formatters } from '../../utils/formatters';

const Trips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<CreateTripData>({
    from: '',
    to: '',
    duration: '01:00:00'
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripService.getAll();
      if (response.isSuccess && response.result) {
        setTrips(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleOpenModal = (trip?: Trip) => {
    if (trip) {
      setEditingTrip(trip);
      setFormData({
        from: trip.from,
        to: trip.to,
        duration: trip.duration
      });
    } else {
      setEditingTrip(null);
      setFormData({
        from: '',
        to: '',
        duration: '01:00:00'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTrip(null);
    setFormData({
      from: '',
      to: '',
      duration: '01:00:00'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.from.trim() || formData.from.length < 3) {
      toast.error('From location must be at least 3 characters');
      return;
    }

    if (!formData.to.trim() || formData.to.length < 3) {
      toast.error('To location must be at least 3 characters');
      return;
    }

    // Validate duration format (HH:MM:SS)
    const durationRegex = /^([0-9]{2}):([0-5][0-9]):([0-5][0-9])$/;
    if (!durationRegex.test(formData.duration)) {
      toast.error('Duration must be in HH:MM:SS format');
      return;
    }

    try {
      setProcessing(true);

      if (editingTrip) {
        await tripService.update(editingTrip.id, formData);
        toast.success('Trip updated successfully');
      } else {
        await tripService.create(formData);
        toast.success('Trip created successfully');
      }

      handleCloseModal();
      await fetchTrips();
    } catch (error) {
      console.error('Failed to save trip:', error);
      toast.error(editingTrip ? 'Failed to update trip' : 'Failed to create trip');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (trip: Trip) => {
    if (!confirm(`Are you sure you want to delete trip from "${trip.from}" to "${trip.to}"?`)) {
      return;
    }

    try {
      await tripService.delete(trip.id);
      toast.success('Trip deleted successfully');
      await fetchTrips();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  const columns = [
    { key: 'id', header: 'Trip ID', sortable: true },
    { key: 'from', header: 'From', sortable: true },
    { key: 'to', header: 'To', sortable: true },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      render: (item: Trip) => formatters.formatDuration(item.duration)
    }
  ];

  return (
    <AdminLayout title="Trip Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Trip
          </button>
        </div>

        {/* Table */}
        <DataTable
          data={trips}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search by from or to location..."
          pagination={{
            pageSize: 20,
            currentPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No trips found"
          actions={(item: Trip) => (
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
          title={editingTrip ? 'Edit Trip' : 'Add New Trip'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Location *
              </label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ramses"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Location *
              </label>
              <input
                type="text"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="6th October"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration * (HH:MM:SS)
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="01:30:00"
                pattern="^([0-9]{2}):([0-5][0-9]):([0-5][0-9])$"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: HH:MM:SS (e.g., 01:30:00)</p>
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
                {processing ? 'Saving...' : editingTrip ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Trips;
