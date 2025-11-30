type Props = {
  message?: string;
};

const ErrorMessage = ({ message }: Props) => {
  if (!message) return null;
  
  // Check if message contains newlines (validation errors with bullet points)
  const hasMultipleLines = message.includes('\n');
  
  return (
    <div className={`rounded-md bg-red-50 p-3 text-xs text-red-700 ${hasMultipleLines ? 'whitespace-pre-line' : ''}`}>
      {message}
    </div>
  );
};

export default ErrorMessage;


