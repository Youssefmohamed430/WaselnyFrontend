import { NavLink } from 'react-router-dom';

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

const PassengerSidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const navItems = [
    { path: '/passenger/dashboard', label: 'Home', icon: '🏠' },
    { path: '/passenger/book-trip', label: 'Book Trip', icon: '🎫' },
    { path: '/passenger/bookings', label: 'My Bookings', icon: '📋' },
    { path: '/passenger/wallet', label: 'Wallet', icon: '💳' },
    { path: '/passenger/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/passenger/profile', label: 'Profile', icon: '👤' },
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
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              Passenger Portal v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default PassengerSidebar;

