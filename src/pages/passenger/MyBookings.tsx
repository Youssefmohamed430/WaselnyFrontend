import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/authService';
import passengerBookingService from '../../services/passengerBookingService';
import type { BookingDTO } from '../../services/passengerBookingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { showToast } from '../../utils/toast';

type BookingStatus = 'All' | 'Booked' | 'Cancelled' | 'Completed';

const MyBookings = () => {
  const authService = new AuthService();
  const user = authService.getUserInfo();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user?.id]);

  useEffect(() => {
    if (statusFilter === 'All') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === statusFilter));
    }
  }, [statusFilter, bookings]);

  const loadBookings = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await passengerBookingService.getByPassengerId(user.id);
      if (response.isSuccess && response.result) {
        // Sort by date (newest first)
        const sorted = response.result.sort(
          (a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
        );
        setBookings(sorted);
      } else {
        setError(response.message || 'Failed to load bookings');
      }
    } catch (error) {
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking? The amount will be refunded to your wallet.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const response = await passengerBookingService.cancel(bookingId);
      if (response.isSuccess) {
        showToast('Booking cancelled successfully. Amount refunded to wallet.', 'success');
        await loadBookings();
      } else {
        showToast(response.message || 'Failed to cancel booking', 'error');
      }
    } catch (error) {
      showToast('Failed to cancel booking. Please try again.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (booking: BookingDTO): boolean => {
    const bookingDate = new Date(booking.bookingDate);
    const now = new Date();
    return booking.status === 'Booked' && bookingDate > now;
  };

  const canTrack = (booking: BookingDTO): boolean => {
    const bookingDate = new Date(booking.bookingDate);
    const now = new Date();
    const oneHourBefore = new Date(bookingDate.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(bookingDate.getTime() + 60 * 60 * 1000);
    return booking.status === 'Booked' && now >= oneHourBefore && now <= oneHourAfter;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
        <p className="mt-2 text-gray-600">View and manage your trip bookings</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(['All', 'Booked', 'Cancelled', 'Completed'] as BookingStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">
            {statusFilter === 'All' ? 'No bookings found. Book your first trip!' : `No ${statusFilter.toLowerCase()} bookings.`}
          </p>
          {statusFilter === 'All' && (
            <Link
              to="/passenger/book-trip"
              className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Book a Trip
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.bookingId} className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {booking.stationFrom?.name || `Station ${booking.stationFromId}`} →{' '}
                      {booking.stationTo?.name || `Station ${booking.stationToId}`}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        booking.status === 'Booked'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <p>
                      <span className="font-medium">Date & Time:</span>{' '}
                      {new Date(booking.bookingDate).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Tickets:</span> {booking.numberOfTickets} × {booking.busType}
                    </p>
                    <p>
                      <span className="font-medium">Total Price:</span> {booking.totalPrice.toFixed(2)} EGP
                    </p>
                    <p>
                      <span className="font-medium">Booking ID:</span> #{booking.bookingId}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 sm:ml-4 sm:flex-row sm:space-x-2 sm:space-y-0">
                  {canTrack(booking) && (
                    <Link
                      to={`/passenger/track/${booking.bookingId}`}
                      className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Track Bus
                    </Link>
                  )}
                  {canCancel(booking) && (
                    <button
                      onClick={() => handleCancel(booking.bookingId)}
                      disabled={cancellingId === booking.bookingId}
                      className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancellingId === booking.bookingId ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;

