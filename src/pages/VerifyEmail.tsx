import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import { createFriendlyError, logError } from '../utils/errorHandler';

const VerifyEmail = () => {
  const authService = new AuthService();
  const navigate = useNavigate();
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState<string | undefined>();
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pending_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    const next = document.getElementById(`code-${index + 1}`) as HTMLInputElement | null;
    if (value && next) {
      next.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const fullCode = codeDigits.join('');
    if (fullCode.length !== 6 || !email) {
      setError('Please enter the 6-digit code and ensure email is available.');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.verifyEmail(email, fullCode);
      if (res.isAuthenticated) {
        setSuccessMsg('Email verified successfully. Redirecting...');
        const role = res.roles?.[0] ?? 'Passenger';
        setTimeout(() => {
          if (role === 'Admin') navigate('/admin/dashboard', { replace: true });
          else if (role === 'Driver') navigate('/driver/dashboard', { replace: true });
          else navigate('/passenger/dashboard', { replace: true });
        }, 1000);
      }
    } catch (err) {
      logError(err);
      setError(createFriendlyError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email
    ? `${email[0]}***@${email.split('@')[1] ?? ''}`
    : 'your email';

  const handleResend = () => {
    // Backend does not provide explicit resend endpoint in spec.
    setTimer(60);
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">Verify your email</h1>
        <p className="auth-subtitle">
          Enter the 6-digit code sent to <span className="font-semibold">{maskedEmail}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ErrorMessage message={error} />
          {successMsg && (
            <div className="rounded-md bg-green-50 p-2 text-xs text-green-700">
              {successMsg}
            </div>
          )}

          <div className="flex justify-between space-x-2">
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                className="h-10 w-10 rounded-md border border-gray-300 text-center text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              className="link disabled:text-gray-400"
              disabled={timer > 0}
              onClick={handleResend}
            >
              {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
            </button>
          </div>

          <Button type="submit" loading={loading}>
            Verify
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;


