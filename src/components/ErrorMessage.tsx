type Props = {
  message?: string;
};

const ErrorMessage = ({ message }: Props) => {
  if (!message) return null;
  return (
    <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
      {message}
    </div>
  );
};

export default ErrorMessage;


