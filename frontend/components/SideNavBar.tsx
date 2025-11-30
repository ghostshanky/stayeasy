import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../types';
import { BRAND } from '../client/src/config/brand';
import { supabase } from '../client/src/lib/supabase';

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

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Fetch user profile from the database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to auth user data
          setUser({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            role: 'TENANT' as const,
            avatar_url: authUser.user_metadata?.avatar_url || '/default_profile_pic.jpg',
            createdAt: authUser.created_at,
            updatedAt: authUser.updated_at
          });
        } else {
          setUser({
            id: (profile as any).id,
            email: (profile as any).email || authUser.email,
            name: (profile as any).full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            role: (profile as any).role || 'TENANT' as const,
            avatar_url: (profile as any).avatar_url || authUser.user_metadata?.avatar_url || '/default_profile_pic.jpg',
            createdAt: (profile as any).created_at || authUser.created_at,
            updatedAt: (profile as any).updated_at || authUser.updated_at
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
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
                src={user.avatar_url || '/default_profile_pic.jpg'}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">{user.name}</span>
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