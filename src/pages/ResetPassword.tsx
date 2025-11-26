import { FormEvent, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import { Validators, getPasswordStrength } from '../utils/validator';
import { createFriendlyError, logError } from '../utils/errorHandler';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const ResetPassword = () => {
  const authService = new AuthService();
  const navigate = useNavigate();
  const query = useQuery();

  const initialEmail = query.get('email') || '';
  const token = query.get('token') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!Validators.email(email)) newErrors.email = 'Enter a valid email.';
    if (!Validators.password(password))
      newErrors.password = 'Password must be at least 10 alphanumeric characters.';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(undefined);
    setSuccessMsg(undefined);
    if (!token) {
      setApiError('Reset token is missing. Please use the link from your email.');
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      const { message } = await authService.resetPassword(email, token, password);
      setSuccessMsg(message || 'Password reset successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      logError(err);
      setApiError(createFriendlyError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ErrorMessage message={apiError} />
          {successMsg && (
            <div className="rounded-md bg-green-50 p-2 text-xs text-green-700">
              {successMsg}
            </div>
          )}

          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FormInput
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
              <div className="mt-1 flex items-center space-x-2">
                <div className="h-1 w-full rounded bg-gray-200">
                  <div
                    className={`h-1 rounded ${
                      strength === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : strength === 'medium'
                        ? 'w-2/3 bg-yellow-500'
                        : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-500 capitalize">{strength}</span>
              </div>
            </div>

            <FormInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              required
            />
          </div>

          <div className="space-y-1 text-xs text-gray-500">
            <p>Password must be at least 10 characters, alphanumeric.</p>
          </div>

          <Button type="submit" loading={loading}>
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;


