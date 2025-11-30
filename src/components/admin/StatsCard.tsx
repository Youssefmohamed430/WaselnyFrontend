type StatsCardProps = {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
};

const StatsCard = ({ title, value, icon, change, changeType = 'neutral' }: StatsCardProps) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="text-3xl sm:text-4xl opacity-20 flex-shrink-0 ml-2">{icon}</div>
      </div>
    </div>
  );
};

export default StatsCard;
