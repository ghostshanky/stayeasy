import React from 'react';
import { StatCardData } from '../../types';

interface AdminStatCardProps extends StatCardData {
  icon?: string;
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title,
  value,
  change,
  changeDirection,
  changeColorClass = 'text-gray-600',
  icon
}) => {
  const getChangeIcon = () => {
    if (!change) return null;
    return changeDirection === 'increase' ? 'trending_up' : 'trending_down';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${changeColorClass}`}>
              <span className="material-symbols-outlined text-lg mr-1">
                {getChangeIcon()}
              </span>
              <span>{change}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="bg-primary/10 rounded-full p-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              {icon}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStatCard;
