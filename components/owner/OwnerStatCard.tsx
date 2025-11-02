import React from 'react';
import { StatCardData, StatChangeDirection } from '../../types';

const OwnerStatCard: React.FC<StatCardData> = ({ title, value, change, changeDirection, changeColorClass }) => {
    return (
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
            <p className="text-text-light-primary dark:text-text-dark-primary text-base font-medium leading-normal">{title}</p>
            <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-3xl font-bold leading-tight">{value}</p>
            {change && changeDirection && (
              <p className={`${changeColorClass} text-sm font-semibold leading-normal flex items-center gap-1`}>
                  <span className="material-symbols-outlined text-base">
                      {changeDirection === StatChangeDirection.Increase ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  <span>{change}</span>
              </p>
            )}
        </div>
    );
};

export default OwnerStatCard;
