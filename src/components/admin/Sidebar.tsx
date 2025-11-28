import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await adminService.getAllDriverRequests();
        if (response.isSuccess && response.result) {
          const pending = response.result.filter(r => r.status === 'Suspend').length;
          setPendingCount(pending);
        }
      } catch (error) {
        console.error('Failed to fetch pending requests:', error);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/driver-requests', label: 'Driver Requests', icon: '👨‍✈️', badge: pendingCount },
    { path: '/admin/buses', label: 'Buses', icon: '🚌' },
    { path: '/admin/stations', label: 'Stations', icon: '🚏' },
    { path: '/admin/trips', label: 'Trips', icon: '🛣️' },
    { path: '/admin/routes', label: 'Routes', icon: '🗺️' },
    { path: '/admin/schedules', label: 'Schedules', icon: '📅' },
    { path: '/admin/tickets', label: 'Tickets', icon: '🎫' },
    { path: '/admin/bookings', label: 'Bookings', icon: '📖' }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚌</span>
              <span className="font-bold text-lg">Waselny</span>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              Admin Dashboard v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
