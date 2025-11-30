import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import { createFriendlyErrorWithContext, logError } from '../utils/errorHandler';

const Login = () => {
  const authService = new AuthService();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const from = location.state?.from?.pathname as string | undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const res = await authService.login(userName, password);
      if (res.isAuthenticated) {
        const role = res.roles?.[0] ?? 'Passenger';
        if (from) {
          navigate(from, { replace: true });
        } else if (role === 'Admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'Driver') {
          navigate('/driver/dashboard', { replace: true });
        } else {
          navigate('/passenger/dashboard', { replace: true });
        }
      }
    } catch (err) {
      logError(err);
      setError(createFriendlyErrorWithContext(err, {
        operation: 'login',
        userRole: 'Passenger'
      }).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue to Waselny.</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <ErrorMessage message={error} />
          <FormInput
            label="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 text-xs text-gray-500"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <Link to="/forgot-password" className="link">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading}>
            Login
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="link">
              Register
            </Link>
          </p>
          <p>
            Want to drive with us?{' '}
            <Link to="/driver-application" className="link">
              Apply as Driver
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


