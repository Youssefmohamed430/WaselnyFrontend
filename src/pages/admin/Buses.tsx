import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import busService, { Bus, CreateBusData } from '../../services/busService';
import { toast } from '../../utils/toast';

const Buses = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState<CreateBusData>({
    busCode: '',
    busType: 'Normal',
    totalSeats: 20
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await busService.getAll();
      if (response.isSuccess && response.result) {
        setBuses(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch buses:', error);
      toast.error('Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleOpenModal = (bus?: Bus) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        busCode: bus.busCode,
        busType: bus.busType,
        totalSeats: bus.totalSeats
      });
    } else {
      setEditingBus(null);
      setFormData({
        busCode: '',
        busType: 'Normal',
        totalSeats: 20
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBus(null);
    setFormData({
      busCode: '',
      busType: 'Normal',
      totalSeats: 20
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.busCode.trim()) {
      toast.error('Bus code is required');
      return;
    }

    if (formData.totalSeats < 10 || formData.totalSeats > 50) {
      toast.error('Total seats must be between 10 and 50');
      return;
    }

    try {
      setProcessing(true);

      if (editingBus) {
        await busService.update(editingBus.busId, formData);
        toast.success('Bus updated successfully');
      } else {
        await busService.create(formData);
        toast.success('Bus created successfully');
      }

      handleCloseModal();
      await fetchBuses();
    } catch (error: unknown) {
      console.error('Failed to save bus:', error);
      toast.error(editingBus ? 'Failed to update bus' : 'Failed to create bus');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (bus: Bus) => {
    if (!confirm(`Are you sure you want to delete bus ${bus.busCode}?`)) {
      return;
    }

    try {
      await busService.delete(bus.busId);
      toast.success('Bus deleted successfully');
      await fetchBuses();
    } catch (error) {
      console.error('Failed to delete bus:', error);
      toast.error('Failed to delete bus');
    }
  };

  const filteredBuses = buses.filter((bus) => {
    if (typeFilter && bus.busType !== typeFilter) return false;
    return true;
  });

  const getTypeBadge = (type: string) => {
    const colors = {
      Normal: 'bg-gray-100 text-gray-800',
      AirConditioned: 'bg-blue-100 text-blue-800',
      Luxury: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const columns = [
    { key: 'busCode', header: 'Bus Code', sortable: true },
    {
      key: 'busType',
      header: 'Type',
      sortable: true,
      render: (item: Bus) => getTypeBadge(item.busType)
    },
    { key: 'totalSeats', header: 'Total Seats', sortable: true }
  ];

  return (
    <AdminLayout title="Bus Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="flex gap-3 sm:gap-4 flex-1 sm:flex-initial">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Normal">Normal</option>
              <option value="AirConditioned">Air Conditioned</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            + Add Bus
          </button>
        </div>

        {/* Table */}
        <DataTable
          data={filteredBuses}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search by bus code..."
          pagination={{
            pageSize: 20,
            currentPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No buses found"
          actions={(item: Bus) => (
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(item);
                }}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
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
          title={editingBus ? 'Edit Bus' : 'Add New Bus'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus Code *
              </label>
              <input
                type="text"
                value={formData.busCode}
                onChange={(e) => setFormData({ ...formData, busCode: e.target.value.toUpperCase() })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="BUS001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus Type *
              </label>
              <select
                value={formData.busType}
                onChange={(e) => setFormData({ ...formData, busType: e.target.value as CreateBusData['busType'] })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Normal">Normal</option>
                <option value="AirConditioned">Air Conditioned</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Seats * (10-50)
              </label>
              <input
                type="number"
                value={formData.totalSeats}
                onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 20 })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="10"
                max="50"
                required
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : editingBus ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Buses;
