import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const OwnerSettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    notificationPreferences: {
      email: true,
      push: true,
      sms: false
    }
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const response = await apiClient.get(`/users/${user.id}`);

      if (response.success && response.data) {
        const userData = response.data;
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.mobile || '',
          bio: userData.bio || '',
          notificationPreferences: {
            email: true, // Default values as these might not be in DB yet
            push: true,
            sms: false
          }
        });
      } else {
        toast.error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user) return;

      const payload = {
        name: formData.name,
        mobile: formData.phone,
        bio: formData.bio,
        // Notification preferences would go here if backend supported it
      };

      const response = await apiClient.put(`/users/${user.id}`, payload);

      if (response.success) {
        toast.success('Profile updated successfully!');
        // Ideally update local user context here if name changed
      } else {
        throw new Error(response.error?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Enter new password (min 6 chars):');
    if (!newPassword) return;

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      if (!user) return;

      const response = await apiClient.put(`/users/${user.id}/password`, {
        currentPassword,
        newPassword
      });

      if (response.success) {
        toast.success('Password updated successfully! Please login again.');
        await logout();
        navigate('/auth');
      } else {
        throw new Error(response.error?.message || 'Failed to update password');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    try {
      if (!user) return;

      const response = await apiClient.delete(`/users/${user.id}`);

      if (response.success) {
        toast.success('Account deleted successfully.');
        await logout();
        navigate('/');
      } else {
        throw new Error(response.error?.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary h-screen">
        <OwnerSideNavBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Settings...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary h-screen">
      <OwnerSideNavBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName={formData.name} />

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Settings</h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">Manage your account and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Settings */}
              <SettingsSection title="Profile Information">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </SettingsSection>

              {/* Notification Preferences */}
              <SettingsSection title="Notification Preferences">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notificationPreferences.email}
                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notificationPreferences.push}
                        onChange={(e) => handleNotificationChange('push', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">SMS Notifications</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive SMS alerts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notificationPreferences.sms}
                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </SettingsSection>

              {/* Security Settings */}
              <SettingsSection title="Security">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handlePasswordChange}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Change Password
                    </button>

                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </SettingsSection>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/dashboard/owner')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/my-listings')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    My Listings
                  </button>
                  <button
                    onClick={() => navigate('/bookings')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Bookings
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <a href="/help" className="block text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                    Help Center
                  </a>
                  <a href="/help" className="block text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerSettingsPage;