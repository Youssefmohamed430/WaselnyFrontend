import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

type Props = {
  role: 'Admin' | 'Driver' | 'Passenger';
};

const DashboardLayout = ({ role }: Props) => {
  const authService = new AuthService();
  const navigate = useNavigate();
  const user = authService.getUserInfo();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Waselny Dashboard</h1>
          <p className="text-xs text-gray-500 capitalize">{role.toLowerCase()} portal</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right text-xs">
            <p className="font-medium text-gray-800">{user?.username || user?.email}</p>
            <p className="capitalize text-gray-500">{role.toLowerCase()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-gray-800">
            Welcome, {user?.username || user?.email}
          </h2>
          <p className="text-sm text-gray-600">
            This is a placeholder dashboard for the <span className="font-semibold">{role}</span>{' '}
            role. Integrate your real application views and navigation here.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;


