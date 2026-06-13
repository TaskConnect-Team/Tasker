import React from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

/**
 * KPICard
 * Reusable component for displaying KPI metrics
 */
const KPICard = ({
  title,
  value,
  unit = "",
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
}) => {
  const colorStyles = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  const iconColorStyles = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div
      className={`rounded-lg border-2 p-6 transition-transform hover:shadow-lg ${colorStyles[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value}
            {unit && <span className="text-lg text-gray-500">{unit}</span>}
          </p>

          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-3 text-sm">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-green-600">
                {trendValue} {trend}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-lg ${iconColorStyles[color]}`}>
            <Icon size={28} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
