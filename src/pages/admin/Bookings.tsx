import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import bookingService, { Booking } from '../../services/bookingService';
import { toast } from '../../utils/toast';
import { formatters } from '../../utils/formatters';

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let response;

      if (filters.dateFrom && filters.dateTo) {
        response = await bookingService.getByDateRange(filters.dateFrom, filters.dateTo);
      } else {
        response = await bookingService.getAll();
      }

      if (response.isSuccess && response.result) {
        setBookings(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filters.dateFrom, filters.dateTo]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filters.status && booking.status !== filters.status) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !booking.passengerName.toLowerCase().includes(searchLower) &&
          !booking.bookingId.toString().includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, filters]);

  const stats = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings
      .filter((b) => b.status === 'Booked')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const averageTickets = filteredBookings.length > 0
      ? filteredBookings.reduce((sum, b) => sum + b.numberOfTickets, 0) / filteredBookings.length
      : 0;

    return { totalBookings, totalRevenue, averageTickets: averageTickets.toFixed(1) };
  }, [filteredBookings]);

  const getStatusBadge = (status: string) => {
    const colors = {
      Booked: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { key: 'bookingId', header: 'Booking ID', sortable: true },
    {
      key: 'bookingDate',
      header: 'Date',
      sortable: true,
      render: (item: Booking) => formatters.formatDateTime(item.bookingDate)
    },
    { key: 'passengerName', header: 'Passenger', sortable: true },
    {
      key: 'tripId',
      header: 'Trip',
      sortable: false,
      render: (item: Booking) => `Trip #${item.tripId}`
    },
    { key: 'numberOfTickets', header: 'Tickets', sortable: true },
    {
      key: 'totalPrice',
      header: 'Total Price',
      sortable: true,
      render: (item: Booking) => formatters.formatCurrency(item.totalPrice)
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item: Booking) => getStatusBadge(item.status)
    }
  ];

  return (
    <AdminLayout title="Booking Management">
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatters.formatCurrency(stats.totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Avg Tickets/Booking</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageTickets}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by passenger or booking ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Booked">Booked</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => {
                setFilters({ ...filters, dateFrom: e.target.value });
                if (e.target.value && !filters.dateTo) {
                  setFilters({ ...filters, dateFrom: e.target.value, dateTo: e.target.value });
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From Date"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To Date"
              min={filters.dateFrom}
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={filteredBookings}
          columns={columns}
          loading={loading}
          searchable={false}
          pagination={{
            pageSize: 20,
            currentPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No bookings found"
        />
      </div>
    </AdminLayout>
  );
};

export default Bookings;
