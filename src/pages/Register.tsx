import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import { Validators, getPasswordStrength } from '../utils/validator';
import { createFriendlyErrorWithContext, logError } from '../utils/errorHandler';

const Register = () => {
  const authService = new AuthService();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    userName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState<string | undefined>();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!Validators.name(form.name)) newErrors.name = 'Name must be at least 3 letters.';
    if (!Validators.email(form.email)) newErrors.email = 'Enter a valid email.';
    if (!Validators.phone(form.phoneNumber)) newErrors.phoneNumber = 'Phone must be 11 digits.';
    if (!Validators.username(form.userName))
      newErrors.userName = 'Username must be at least 10 alphanumeric characters.';
    if (!Validators.password(form.password))
      newErrors.password = 'Password must be at least 10 alphanumeric characters.';
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';
    if (!form.acceptTerms) newErrors.acceptTerms = 'You must accept the terms.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement & { name: string; checked: boolean }>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(undefined);
    setSuccessMsg(undefined);
    if (!validate()) return;
    setLoading(true);
    try {
      const { message } = await authService.register({
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        userName: form.userName,
        password: form.password
      });
      sessionStorage.setItem('pending_email', form.email);
      setSuccessMsg(message || 'Verification code sent to your email.');
      setTimeout(() => {
        navigate('/verify-email');
      }, 1000);
    } catch (err) {
      logError(err);
      setApiError(createFriendlyErrorWithContext(err, {
        operation: 'register',
        userRole: 'Passenger'
      }).message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join Waselny as a passenger.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ErrorMessage message={apiError} />
          {successMsg && (
            <div className="rounded-md bg-green-50 p-2 text-xs text-green-700">
              {successMsg}
            </div>
          )}

          <FormInput
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <FormInput
            label="Phone Number"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
            required
          />
          <FormInput
            label="Username"
            name="userName"
            value={form.userName}
            onChange={handleChange}
            error={errors.userName}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
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
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />
          </div>

          <div className="space-y-1 text-xs text-gray-500">
            <p>Password must be at least 10 characters, alphanumeric.</p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={form.acceptTerms}
              onChange={handleChange}
              className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="acceptTerms">
              I agree to the <span className="link">Terms &amp; Conditions</span>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-red-600">{errors.acceptTerms}</p>
          )}

          <Button type="submit" loading={loading}>
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;


