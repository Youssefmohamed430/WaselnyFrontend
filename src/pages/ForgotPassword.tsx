import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/authService';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import { Validators } from '../utils/validator';
import { createFriendlyErrorWithContext, logError } from '../utils/errorHandler';

const ForgotPassword = () => {
  const authService = new AuthService();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSuccessMsg(undefined);
    if (!Validators.email(email)) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      const { message } = await authService.forgotPassword(email);
      setSuccessMsg(message || 'Reset password link has been sent to your email.');
    } catch (err) {
      logError(err);
      setError(createFriendlyErrorWithContext(err, {
        operation: 'forgot password',
        userRole: 'Passenger'
      }).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">Forgot password</h1>
        <p className="auth-subtitle">
          Enter your email and we&apos;ll send you a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ErrorMessage message={error} />
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
            required
          />
          <Button type="submit" loading={loading}>
            Send reset link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;


