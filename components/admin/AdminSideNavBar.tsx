import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../../types';
import { supabase } from '../../client/src/lib/supabase';

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

interface AdminSideNavBarProps {
  onNavigate?: (page: Page) => void;
}

const AdminSideNavBar: React.FC<AdminSideNavBarProps> = () => {
  const navigate = useNavigate();
  
  const handleNavigation = (page: Page) => {
    switch (page) {
      case 'adminDashboard':
        navigate('/admin-dashboard');
        break;
      default:
        navigate('/admin-dashboard');
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
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Admin',
            role: 'ADMIN' as const,
            avatar_url: authUser.user_metadata?.avatar_url || '/default_profile_pic.jpg',
            createdAt: authUser.created_at,
            updatedAt: authUser.updated_at
          });
        } else {
          setUser({
            id: (profile as any).id,
            email: (profile as any).email || authUser.email,
            name: (profile as any).full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Admin',
            role: (profile as any).role || 'ADMIN' as const,
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
    <aside className="hidden lg:flex flex-shrink-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col justify-between p-4 h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
          <h1 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">Admin Panel</h1>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink icon="dashboard" label="Dashboard" onClick={() => handleNavigation('adminDashboard')} isActive={true} />
          <NavLink icon="people" label="User Management" onClick={() => handleNavigation('adminDashboard')} />
          <NavLink icon="analytics" label="Analytics" onClick={() => handleNavigation('adminDashboard')} />
          <NavLink icon="history" label="Audit Logs" onClick={() => handleNavigation('adminDashboard')} />
          <NavLink icon="content_copy" label="Content Moderation" onClick={() => handleNavigation('adminDashboard')} />
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <NavLink icon="settings" label="System Settings" onClick={() => handleNavigation('adminDashboard')} />
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
                <h1 className="text-text-light-primary dark:text-text-dark-primary text-sm font-semibold leading-normal">{user.name}</h1>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs font-normal leading-normal">{user.role}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex flex-col">
                <h1 className="text-text-light-primary dark:text-text-dark-primary text-sm font-semibold leading-normal">Guest</h1>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs font-normal leading-normal">Not logged in</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminSideNavBar;
