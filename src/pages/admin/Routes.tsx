import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import routeService, { Route as RouteType, CreateRouteData } from '../../services/routeService';
import tripService from '../../services/tripService';
import stationService from '../../services/stationService';
import { toast } from '../../utils/toast';
import { Trip } from '../../services/tripService';
import { Station } from '../../services/stationService';

const Routes = () => {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<CreateRouteData>({
    tripId: 0,
    stationId: 0,
    order: 1
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tripFilter, setTripFilter] = useState<number | ''>('');

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeService.getAll();
      if (response.isSuccess && response.result) {
        setRoutes(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
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

  const fetchStations = async () => {
    try {
      const response = await stationService.getAll();
      if (response.isSuccess && response.result) {
        setStations(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchRoutes(), fetchTrips(), fetchStations()]);
  }, []);

  const handleOpenModal = (route?: RouteType) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        tripId: route.tripId,
        stationId: route.stationId,
        order: route.order
      });
    } else {
      setEditingRoute(null);
      setFormData({
        tripId: tripFilter && typeof tripFilter === 'number' ? tripFilter : trips[0]?.id || 0,
        stationId: stations[0]?.id || 0,
        order: 1
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRoute(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tripId === 0) {
      toast.error('Please select a trip');
      return;
    }

    if (formData.stationId === 0) {
      toast.error('Please select a station');
      return;
    }

    if (formData.order < 1) {
      toast.error('Order must be a positive integer');
      return;
    }

    try {
      setProcessing(true);
      // Note: API doesn't have route ID in Route type, so we'll need to handle update differently
      // For now, assuming we need the route ID from somewhere
      if (editingRoute) {
        // await routeService.update(routeId, formData);
        toast.error('Update route functionality requires route ID');
      } else {
        await routeService.create(formData);
        toast.success('Route created successfully');
      }

      handleCloseModal();
      await fetchRoutes();
    } catch (error) {
      console.error('Failed to save route:', error);
      toast.error(editingRoute ? 'Failed to update route' : 'Failed to create route');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (route: RouteType) => {
    if (!confirm(`Are you sure you want to remove "${route.stationName}" from this route?`)) {
      return;
    }

    try {
      // Note: Need route ID for deletion - API structure may need adjustment
      toast.error('Delete route functionality requires route ID');
      // await routeService.delete(routeId);
      // await fetchRoutes();
    } catch (error) {
      console.error('Failed to delete route:', error);
      toast.error('Failed to delete route');
    }
  };

  const filteredRoutes = routes.filter((route) => {
    if (tripFilter && route.tripId !== tripFilter) return false;
    return true;
  });

  // Group routes by trip
  const groupedRoutes = filteredRoutes.reduce((acc, route) => {
    const key = `${route.tripId}-${route.from}-${route.to}`;
    if (!acc[key]) {
      acc[key] = {
        tripId: route.tripId,
        from: route.from,
        to: route.to,
        stations: []
      };
    }
    acc[key].stations.push(route);
    return acc;
    }, {} as Record<string, { tripId: number; from: string; to: string; stations: RouteType[] }>);

  const columns = [
    { key: 'stationName', header: 'Station Name', sortable: true },
    { key: 'order', header: 'Order', sortable: true }
  ];

  return (
    <AdminLayout title="Route Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="flex gap-3 sm:gap-4 flex-1 sm:flex-initial">
            <select
              value={tripFilter}
              onChange={(e) => {
                setTripFilter(e.target.value ? parseInt(e.target.value) : '');
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Trips</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.from} → {trip.to}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            + Add Station to Route
          </button>
        </div>

        {/* Routes grouped by trip */}
        {Object.entries(groupedRoutes).map(([key, group]) => (
          <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Route: {group.from} → {group.to}
              </h3>
            </div>
            <DataTable
              data={group.stations.sort((a, b) => a.order - b.order)}
              columns={columns}
              loading={false}
              searchable={false}
              emptyMessage="No stations in this route"
              actions={(item: RouteType) => (
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
          </div>
        ))}

        {Object.keys(groupedRoutes).length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">No routes found</div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingRoute ? 'Edit Route' : 'Add Station to Route'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip *
              </label>
              <select
                value={formData.tripId}
                onChange={(e) => setFormData({ ...formData, tripId: parseInt(e.target.value) || 0 })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station *
              </label>
              <select
                value={formData.stationId}
                onChange={(e) => setFormData({ ...formData, stationId: parseInt(e.target.value) || 0 })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="0">Select a station</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} ({station.area})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order * (Sequence in route)
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
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
                {processing ? 'Saving...' : editingRoute ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Routes;
