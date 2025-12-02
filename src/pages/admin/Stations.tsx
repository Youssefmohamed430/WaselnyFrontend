import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import stationService, { Station, CreateStationData } from '../../services/stationService';
import { toast } from '../../utils/toast';
import MapPicker from '../../components/MapPicker';

const Stations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState<CreateStationData>({
    name: '',
    area: '',
    location: '',
    latitude: 0,
    longitude: 0
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getAll();
      if (response.isSuccess && response.result) {
        setStations(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      toast.error('Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const uniqueAreas = Array.from(new Set(stations.map(s => s.area))).filter(Boolean);

  const handleOpenModal = (station?: Station) => {
    if (station) {
      setEditingStation(station);
      setFormData({
        name: station.name,
        area: station.area,
        location: station.location,
        latitude: station.latitude,
        longitude: station.longitude
      });
    } else {
      setEditingStation(null);
      setFormData({
        name: '',
        area: '',
        location: '',
        latitude: 0,
        longitude: 0
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStation(null);
    setFormData({
      name: '',
      area: '',
      location: '',
      latitude: 0,
      longitude: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || formData.name.length < 3) {
      toast.error('Station name must be at least 3 characters');
      return;
    }

    if (!formData.area.trim()) {
      toast.error('Area is required');
      return;
    }

    if (formData.latitude < -90 || formData.latitude > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }

    if (formData.longitude < -180 || formData.longitude > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    try {
      setProcessing(true);

      if (editingStation) {
        await stationService.update(editingStation.id, formData);
        toast.success('Station updated successfully');
      } else {
        await stationService.create(formData);
        toast.success('Station created successfully');
      }

      handleCloseModal();
      await fetchStations();
    } catch (error) {
      console.error('Failed to save station:', error);
      toast.error(editingStation ? 'Failed to update station' : 'Failed to create station');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (station: Station) => {
    if (!confirm(`Are you sure you want to delete station "${station.name}"?`)) {
      return;
    }

    try {
      await stationService.delete(station.id);
      toast.success('Station deleted successfully');
      await fetchStations();
    } catch (error) {
      console.error('Failed to delete station:', error);
      toast.error('Failed to delete station');
    }
  };

  const filteredStations = stations.filter((station) => {
    if (areaFilter && station.area !== areaFilter) return false;
    return true;
  });

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'area', header: 'Area', sortable: true },
    { key: 'location', header: 'Location', sortable: true },
    {
      key: 'map',
      header: 'Location Link',
      render: (item: Station) => (
        <a
          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          View on Map
        </a>
      )
    }
  ];

  return (
    <AdminLayout title="Station Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="flex gap-3 sm:gap-4 flex-1 sm:flex-initial">
            <select
              value={areaFilter}
              onChange={(e) => {
                setAreaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Areas</option>
              {uniqueAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            + Add Station
          </button>
        </div>

        {/* Table */}
        <DataTable
          data={filteredStations}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search by name..."
          pagination={{
            pageSize: 20,
            currentPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No stations found"
          actions={(item: Station) => (
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
          title={editingStation ? 'Edit Station' : 'Add New Station'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ramses Station"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Downtown"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ramses Square"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Location on Map *
              </label>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng) => {
                  setFormData({ ...formData, latitude: lat, longitude: lng });
                }}
                height="350px"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={formData.latitude.toFixed(6)}
                  readOnly
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={formData.longitude.toFixed(6)}
                  readOnly
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
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
                {processing ? 'Saving...' : editingStation ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Stations;
