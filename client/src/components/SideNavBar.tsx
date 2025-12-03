import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../types';
import { BRAND } from '../config/brand';
import { useAuth } from '../hooks/useAuth';

interface NavLinkProps {
  icon: string;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, onClick, isActive = false }) => {
  const activeClasses = 'bg-primary/10 text-primary';
  const inactiveClasses = 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-primary/10 hover:text-primary';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 w-full text-left ${isActive ? activeClasses : inactiveClasses}`}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <p className={`text-sm font-medium leading-normal ${isActive && 'font-bold'}`}>{label}</p>
    </button>
  );
};

interface SideNavBarProps {
  onNavigate?: (page: Page) => void;
}

const SideNavBar: React.FC<SideNavBarProps> = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleNavigation = (page: Page) => {
    switch (page) {
      case 'tenantDashboard':
        navigate('/dashboard/tenant');
        break;
      case 'bookings':
        navigate('/bookings');
        break;
      case 'payments':
        navigate('/payments');
        break;
      case 'messages':
        navigate('/messages');
        break;
      default:
        navigate('/');
    }
  };

  // Helper to get avatar URL
  const getAvatarUrl = () => {
    if (!user) return BRAND.defaultAvatar;
    if (user.image_id) {
      if (user.image_id.startsWith('http')) return user.image_id;
      return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'degncsmrz'}/image/upload/${user.image_id}`;
    }
    return BRAND.defaultAvatar;
  };

  return (
    <aside className="hidden lg:flex flex-shrink-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col justify-between p-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <span className="material-symbols-outlined text-primary text-3xl">real_estate_agent</span>
          <h1 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">{BRAND.long}</h1>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink icon="dashboard" label="Dashboard" onClick={() => handleNavigation('tenantDashboard')} isActive={true} />
          <NavLink icon="calendar_month" label="Bookings" onClick={() => handleNavigation('bookings')} />
          <NavLink icon="credit_card" label="Payments" onClick={() => handleNavigation('payments')} />
          <NavLink icon="chat" label="Messages" onClick={() => handleNavigation('messages')} />
          {/* Only show settings for admin users */}
          {user?.role === 'ADMIN' && (
            <NavLink icon="settings" label="Settings" onClick={() => handleNavigation('tenantDashboard')} />
          )}
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-3 p-2 border-t border-border-light dark:border-border-dark pt-4">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="flex flex-col">
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <img
                src={getAvatarUrl()}
                alt={user.name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = BRAND.defaultAvatar;
                }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">{user.name || 'User'}</span>
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Guest</span>
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Not logged in</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SideNavBar;