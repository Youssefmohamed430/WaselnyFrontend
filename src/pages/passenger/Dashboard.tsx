import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/authService';
import walletService from '../../services/walletService';
import passengerBookingService from '../../services/passengerBookingService';
import type { BookingDTO } from '../../services/passengerBookingService';
import LoadingSpinner from '../../components/LoadingSpinner';

const Dashboard = () => {
  const authService = new AuthService();
  const user = authService.getUserInfo();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [walletResponse, bookingsResponse] = await Promise.all([
          walletService.getById(user.id),
          passengerBookingService.getByPassengerId(user.id),
        ]);

        if (walletResponse.isSuccess && walletResponse.result) {
          setWalletBalance(walletResponse.result.balance);
        }

        if (bookingsResponse.isSuccess && bookingsResponse.result) {
          const now = new Date();
          const upcoming = bookingsResponse.result
            .filter((booking) => {
              const bookingDate = new Date(booking.bookingDate);
              return bookingDate >= now && booking.status === 'Booked';
            })
            .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime())
            .slice(0, 3);
          setUpcomingBookings(upcoming);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome back, {user?.username || user?.email}!</h1>
        <p className="mt-2 text-blue-100">Manage your trips, wallet, and bookings all in one place.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Wallet Balance Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {walletBalance !== null ? `${walletBalance.toFixed(2)} EGP` : '...'}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <span className="text-2xl">💳</span>
            </div>
          </div>
          <Link
            to="/passenger/wallet"
            className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Charge Wallet →
          </Link>
        </div>

        {/* Upcoming Bookings Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Trips</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{upcomingBookings.length}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <span className="text-2xl">🎫</span>
            </div>
          </div>
          <Link
            to="/passenger/bookings"
            className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All →
          </Link>
        </div>

        {/* Quick Actions Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Quick Actions</p>
          <div className="mt-4 space-y-2">
            <Link
              to="/passenger/book-trip"
              className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Book a Trip
            </Link>
            <Link
              to="/passenger/notifications"
              className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings List */}
      {upcomingBookings.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Upcoming Trips</h2>
          </div>
          <div className="divide-y">
            {upcomingBookings.map((booking) => (
              <div key={booking.bookingId} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {booking.stationFrom?.name || `Station ${booking.stationFromId}`} →{' '}
                      {booking.stationTo?.name || `Station ${booking.stationToId}`}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(booking.bookingDate).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''} • {booking.busType} •{' '}
                      {booking.totalPrice} EGP
                    </p>
                  </div>
                  <Link
                    to={`/passenger/track/${booking.bookingId}`}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Track
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingBookings.length === 0 && (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">No upcoming trips. Book your first trip to get started!</p>
          <Link
            to="/passenger/book-trip"
            className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Book a Trip
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

