const CombinedSummaryCard = ({
  title,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  icon: Icon,
  trend,
  trendUp,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="px-6 py-3">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">{primaryLabel}</span>
            <span className="text-2xl font-bold text-gray-900">
              {primaryValue}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">{secondaryLabel}</span>
            <span className="text-2xl font-bold text-gray-900">
              {secondaryValue}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedSummaryCard;
