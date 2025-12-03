import React, { useState, useEffect } from 'react';
import { useOwnerProfile } from '../../hooks/useOwnerProfile';
import { supabase } from '../../lib/supabase';
import { BRAND } from '../../config/brand';

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  upi_id?: string;
  avatar_url?: string;
}

const OwnerProfileSettings: React.FC = () => {
  const { profile, loading, error } = useOwnerProfile();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    upi_id: '',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        upi_id: profile.upi_id || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("No authenticated user");
      }

      const userId = session.user.id;

      // Upload avatar if provided
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Delete existing avatar if any
        await (supabase as any).storage
          .from('avatars')
          .remove([filePath]);

        // Upload new avatar
        const { error: uploadError } = await (supabase as any).storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: publicUrl } = (supabase as any).storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl.publicUrl;
      }

      // Update profile
      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          upi_id: profileData.upi_id,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6">Profile Settings</h2>

      {saveError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={avatarFile ? URL.createObjectURL(avatarFile) : (profileData.avatar_url || BRAND.defaultAvatar)}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">Profile Picture</h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              JPG, GIF or PNG. Max size of 800K
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleChange}
              required
              disabled
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profileData.phone || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            />
          </div>

          <div>
            <label htmlFor="upi_id" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              UPI ID
            </label>
            <input
              type="text"
              id="upi_id"
              name="upi_id"
              value={profileData.upi_id || ''}
              onChange={handleChange}
              placeholder="yourname@upi"
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            />
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Used for receiving payments from guests
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OwnerProfileSettings;