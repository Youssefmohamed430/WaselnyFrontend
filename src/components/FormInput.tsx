import { InputHTMLAttributes } from 'react';

type Props = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const FormInput = ({ label, error, ...rest }: Props) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        {...rest}
        className={`w-full rounded-md border px-3 py-2.5 sm:py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] ${error ? 'border-red-500' : 'border-gray-300'
          }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default FormInput;


