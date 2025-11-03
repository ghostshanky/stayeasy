import React from 'react';

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

const SideNavBar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-shrink-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col justify-between p-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <span className="material-symbols-outlined text-primary text-3xl">real_estate_agent</span>
          <h1 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">Stays.io</h1>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink icon="dashboard" label="Dashboard" onClick={() => console.log('Dashboard clicked')} isActive={true} />
          <NavLink icon="apartment" label="My Listings" onClick={() => console.log('My Listings clicked')} />
          <NavLink icon="calendar_month" label="Bookings" onClick={() => console.log('Bookings clicked')} />
          <NavLink icon="credit_card" label="Payments" onClick={() => console.log('Payments clicked')} />
          <NavLink icon="chat" label="Messages" onClick={() => console.log('Messages clicked')} />
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <NavLink icon="settings" label="Settings" onClick={() => console.log('Settings clicked')} />
        <div className="flex gap-3 p-2 border-t border-border-light dark:border-border-dark pt-4">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
            style={{ backgroundImage: `url('https://picsum.photos/id/64/100/100')` }}
            role="img"
            aria-label="Profile picture of Alex Chen"
          ></div>
          <div className="flex flex-col">
            <h1 className="text-text-light-primary dark:text-text-dark-primary text-sm font-semibold leading-normal">Alex Chen</h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs font-normal leading-normal">Property Owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideNavBar;