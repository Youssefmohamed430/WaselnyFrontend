export const Validators = {
  name: (value: string) => /^[a-zA-Z]{3,}$/.test(value.trim()),
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  phone: (value: string) => /^\d{11}$/.test(value.trim()),
  username: (value: string) => /^[a-zA-Z0-9]{10,}$/.test(value.trim()),
  password: (value: string) => /^[a-zA-Z0-9]{10,}$/.test(value),
  ssn: (value: string) => /^\d{14}$/.test(value.trim())
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (!password) return 'weak';
  let score = 0;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 'weak';
  if (score === 2 || score === 3) return 'medium';
  return 'strong';
};


