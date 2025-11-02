import React from 'react';

interface NavLinkProps {
  icon: string;
  label: string;
  href: string;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, href, isActive = false }) => {
  const activeClasses = 'bg-primary/10 text-primary';
  const inactiveClasses = 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-primary/10 hover:text-primary';

  return (
    <a href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <p className={`text-sm font-medium leading-normal ${isActive && 'font-bold'}`}>{label}</p>
    </a>
  );
};


const OwnerSideNavBar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-shrink-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col justify-between p-4 h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <span className="material-symbols-outlined text-primary text-3xl">real_estate_agent</span>
          <h1 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">Stays.io</h1>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink icon="dashboard" label="Dashboard" href="#" isActive={true} />
          <NavLink icon="apartment" label="My Listings" href="#" />
          <NavLink icon="calendar_month" label="Bookings" href="#" />
          <NavLink icon="credit_card" label="Payments" href="#" />
          <NavLink icon="chat" label="Messages" href="#" />
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <NavLink icon="settings" label="Settings" href="#" />
        <div className="flex gap-3 p-2 border-t border-border-light dark:border-border-dark pt-4">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBCww12N-2nPUNW7Vji6RkWmDdh9cAneatYcHKdwW0EhJ1FB9M58r70mSUGzmzBA6GyjsdkQsZ1bGKTEk9D_SibO_HzfdfL_8LcG9a_XSaKoS6n1r-9qIeU5C8b4qlC3m6cFL7EpKsrqQQypMrJr6vqumO7TBcHJnMHIVDJBoCiuOzXmrjIK_-Dkwu2-Us_amVBha6dQXaiFoggOibGhI5eLN3BiRyuG1i_aXkTKQLHEU3MSwS1AAqO4Ou9bhjhGI34P6xdUUMW_kw')` }}
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

export default OwnerSideNavBar;