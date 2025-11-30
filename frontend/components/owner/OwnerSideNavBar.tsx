import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../../types';
import { BRAND } from '../../client/src/config/brand';
import AvatarMenu from '../../client/src/components/AvatarMenu';

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

interface OwnerSideNavBarProps {
  onNavigate?: (page: Page) => void;
}

const OwnerSideNavBar: React.FC<OwnerSideNavBarProps> = () => {
  const navigate = useNavigate();
  
  const handleNavigation = (page: Page) => {
    switch (page) {
      case 'ownerDashboard':
        navigate('/dashboard/owner');
        break;
      case 'myListings':
        navigate('/my-listings');
        break;
      case 'bookings':
        navigate('/dashboard/owner/bookings');
        break;
      case 'payments':
        navigate('/dashboard/owner/payments');
        break;
      case 'messages':
        navigate('/dashboard/owner/messages');
        break;
      case 'settings':
        navigate('/dashboard/owner/settings');
        break;
      default:
        navigate('/dashboard/owner');
    }
  };

  // Mock user data - in a real app, this would come from context or props
  const user = {
    id: 'owner123',
    email: 'alex@example.com',
    name: 'Alex Chen',
    role: 'OWNER' as const,
    avatar_url: '/default_profile_pic.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return (
    <aside className="hidden lg:flex flex-shrink-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col justify-between p-4 h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <span className="material-symbols-outlined text-primary text-3xl">real_estate_agent</span>
          <h1 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">{BRAND.long}</h1>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink icon="dashboard" label="Dashboard" onClick={() => handleNavigation('ownerDashboard')} isActive={true} />
          <NavLink icon="apartment" label="My Listings" onClick={() => handleNavigation('myListings')} />
          <NavLink icon="calendar_month" label="Bookings" onClick={() => handleNavigation('bookings')} />
          <NavLink icon="credit_card" label="Payments" onClick={() => handleNavigation('payments')} />
          <NavLink icon="chat" label="Messages" onClick={() => handleNavigation('messages')} />
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <NavLink icon="settings" label="Settings" onClick={() => navigate('/dashboard/owner/settings')} />
        <div className="flex gap-3 p-2 border-t border-border-light dark:border-border-dark pt-4">
          <AvatarMenu user={user} />
        </div>
      </div>
    </aside>
  );
};

export default OwnerSideNavBar;