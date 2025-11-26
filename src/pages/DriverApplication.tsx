import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/authService';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import { Validators } from '../utils/validator';
import { createFriendlyError, logError } from '../utils/errorHandler';

const DriverApplication = () => {
  const authService = new AuthService();
  const [form, setForm] = useState({
    name: '',
    ssn: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!Validators.name(form.name)) newErrors.name = 'Name must be at least 3 letters.';
    if (!Validators.ssn(form.ssn)) newErrors.ssn = 'SSN must be exactly 14 digits.';
    if (!Validators.phone(form.phone)) newErrors.phone = 'Phone must be 11 digits.';
    if (!Validators.email(form.email)) newErrors.email = 'Enter a valid email.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement & { name: string }>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(undefined);
    setSuccessMsg(undefined);
    if (!validate()) return;
    setLoading(true);
    try {
      const { message } = await authService.driverRequest(form);
      setSuccessMsg(message || "Application submitted, we'll contact you.");
      setForm({ name: '', ssn: '', phone: '', email: '' });
    } catch (err) {
      logError(err);
      setApiError(createFriendlyError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title">Driver application</h1>
        <p className="auth-subtitle">
          Fill in your details and we&apos;ll contact you after reviewing your request.
        </p>

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
            label="SSN"
            name="ssn"
            value={form.ssn}
            onChange={handleChange}
            error={errors.ssn}
            required
          />
          <FormInput
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
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

          <Button type="submit" loading={loading}>
            Submit application
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already a driver or passenger?{' '}
          <Link to="/login" className="link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default DriverApplication;


