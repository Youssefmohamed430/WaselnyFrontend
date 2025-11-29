import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import AuthService from '../../services/authService';
import walletService from '../../services/walletService';

type NavItem = {
  path: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { path: '/passenger/dashboard', label: 'Home', icon: '🏠' },
  { path: '/passenger/book-trip', label: 'Book Trip', icon: '🎫' },
  { path: '/passenger/bookings', label: 'My Bookings', icon: '📋' },
  { path: '/passenger/wallet', label: 'Wallet', icon: '💳' },
  { path: '/passenger/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/passenger/profile', label: 'Profile', icon: '👤' },
];

const PassengerLayout = () => {
  const authService = new AuthService();
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUserInfo();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    const loadWalletBalance = async () => {
      if (user?.id) {
        try {
          setLoadingBalance(true);
          const response = await walletService.getById(user.id);
          if (response.isSuccess && response.result) {
            setWalletBalance(response.result.balance);
          }
        } catch (error) {
          console.error('Failed to load wallet balance:', error);
        } finally {
          setLoadingBalance(false);
        }
      }
    };

    loadWalletBalance();
  }, [user?.id]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Waselny</h1>
              <span className="ml-2 text-sm text-gray-500">Passenger Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              {walletBalance !== null && (
                <div className="hidden items-center space-x-2 rounded-lg bg-green-50 px-3 py-1.5 sm:flex">
                  <span className="text-sm font-medium text-green-700">Wallet:</span>
                  <span className="text-sm font-bold text-green-800">
                    {loadingBalance ? '...' : `${walletBalance.toFixed(2)} EGP`}
                  </span>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.username || user?.email}</p>
                <p className="text-xs text-gray-500">Passenger</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <aside className="hidden w-64 border-r bg-white pr-4 pt-6 sm:block">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white sm:hidden">
            <div className="grid grid-cols-4 gap-1">
              {navItems.slice(0, 4).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center space-y-1 py-2 text-xs ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 pb-20 sm:pb-8">
            <div className="py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PassengerLayout;

