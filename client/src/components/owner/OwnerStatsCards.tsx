import React from 'react';

interface OwnerStats {
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
}

interface OwnerStatsCardsProps {
    stats: OwnerStats;
}

const OwnerStatsCards: React.FC<OwnerStatsCardsProps> = ({ stats }) => {
    const cards = [
        {
            title: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: 'payments',
            color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
        },
        {
            title: 'Total Bookings',
            value: stats.totalBookings,
            icon: 'book_online',
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        },
        {
            title: 'Properties',
            value: stats.totalProperties,
            icon: 'apartment',
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
        },
        {
            title: 'Average Rating',
            value: stats.averageRating.toFixed(1),
            icon: 'star',
            color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{card.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg ${card.color}`}>
                            <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OwnerStatsCards;
