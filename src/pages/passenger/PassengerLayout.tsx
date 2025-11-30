import { useEffect, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import PassengerSidebar from '../../components/passenger/PassengerSidebar';
import PassengerHeader from '../../components/passenger/PassengerHeader';
import walletService from '../../services/walletService';
import AuthService from '../../services/authService';

const PassengerLayout = () => {
  const authService = new AuthService();
  const user = authService.getUserInfo();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Get page title from location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('book-trip')) return 'Book Trip';
    if (path.includes('bookings')) return 'My Bookings';
    if (path.includes('track')) return 'Track Bus';
    if (path.includes('wallet')) return 'Wallet';
    if (path.includes('notifications')) return 'Notifications';
    if (path.includes('profile')) return 'Profile';
    return 'Dashboard';
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <PassengerSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-64">
        <PassengerHeader
          title={getPageTitle()}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          walletBalance={walletBalance}
          loadingBalance={loadingBalance}
        />
        <main className="p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PassengerLayout;

