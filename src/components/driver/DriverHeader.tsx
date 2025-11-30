import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import { tokenManager } from '../../utils/tokenManager';
import { getCurrentEgyptTime, formatTime } from '../../utils/dateUtils';

type HeaderProps = {
  title: string;
  onMenuClick: () => void;
  tripStatus?: 'Available' | 'On Trip' | 'Off Duty';
  unreadNotifications?: number;
  onNotificationClick?: () => void;
};

const DriverHeader = ({ 
  title, 
  onMenuClick, 
  tripStatus = 'Available',
  unreadNotifications = 0,
  onNotificationClick
}: HeaderProps) => {
  const navigate = useNavigate();
  const authService = new AuthService();
  const user = tokenManager.getUserInfo();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const egyptTime = getCurrentEgyptTime();
      setCurrentTime(formatTime(egyptTime));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    }
  };

  const getStatusColor = () => {
    switch (tripStatus) {
      case 'On Trip':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Off Duty':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-14 sm:h-16">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-gray-900 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Current Time (Egypt) */}
          <div className="hidden sm:flex items-center space-x-2 rounded-lg bg-gray-50 px-3 py-1.5 border border-gray-200">
            <span className="text-sm font-medium text-gray-700">🕐</span>
            <span className="text-sm font-bold text-gray-800">{currentTime}</span>
          </div>

          {/* Trip Status */}
          <div className={`hidden sm:flex items-center space-x-2 rounded-lg px-3 py-1.5 border ${getStatusColor()}`}>
            <span className="text-xs font-medium">
              {tripStatus === 'On Trip' ? '🚌' : tripStatus === 'Off Duty' ? '⏸️' : '✅'}
            </span>
            <span className="text-xs font-bold">{tripStatus}</span>
          </div>

          {/* Notifications */}
          {onNotificationClick && (
            <button
              onClick={onNotificationClick}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0">
                {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'D'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                  {user?.username || user?.email || 'Driver'}
                </p>
                <p className="text-xs text-gray-500">Driver</p>
              </div>
              <svg
                className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {user?.username || user?.email || 'Driver'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/driver/dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DriverHeader;

