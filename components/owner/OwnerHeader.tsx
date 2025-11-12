
import React from 'react';
import { useAuth } from '../../client/src/hooks/useAuth';

interface HeaderProps {
    userName?: string; // Keep as optional for backward compatibility
}

const OwnerHeader: React.FC<HeaderProps> = ({ userName }) => {
    const { user } = useAuth();
    
    // Use the actual user name if available, otherwise fall back to the prop
    const displayName = user?.name || user?.email?.split('@')[0] || userName || 'User';

    return (
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div className="flex flex-col gap-2">
                <p className="text-text-light-primary dark:text-text-dark-primary text-3xl font-bold leading-tight tracking-tight">Welcome back, {displayName}!</p>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal">Here's a summary of your property performance.</p>
            </div>
            <button className="flex items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-primary/90 transition-colors duration-200">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="truncate">Add New Listing</span>
            </button>
        </div>
    );
};

export default OwnerHeader;