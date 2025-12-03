// src/pages/profile.tsx   (or src/pages/ProfilePage.tsx)
// Requires: react-hot-toast, tailwindcss
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../api/apiClient";
import { BRAND } from "../config/brand";


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [bio, setBio] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [imageId, setImageId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setEmail(user.email || "");

        const response = await apiClient.get(`/users/${user.id}`);

        if (response.success && response.data) {
          setProfileName(response.data.name || user.name || "");
          setBio(response.data.bio || "");
          setMobile(response.data.mobile || "");
          setRole(response.data.role || "TENANT");
          setImageId(response.data.image_id || "");
        } else {
          setProfileName(user.name || "");
          setBio("");
          setMobile("");
          setRole("TENANT");
        }
      } catch (err: any) {
        console.error("Profile load error:", err);
        setProfileName(user.name || "");
        setBio("");
        setMobile("");
        setRole("TENANT");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const updates = {
        name: profileName,
        bio,
        mobile,
        role,
        image_id: imageId,
      };

      const response = await apiClient.put(`/users/${user.id}`, updates);

      if (response.data && response.data.id) {
        toast.success("Profile updated successfully");
        setProfileName(response.data.name || profileName);
        setBio(response.data.bio || "");
        setMobile(response.data.mobile || "");
        setImageId(response.data.image_id || "");
      } else {
        const errorMessage = response.error?.message || response.error || "Failed to update profile";
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    } catch (err: any) {
      console.error("Profile save error:", err);
      toast.error(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const displayImage = imageId
    ? (imageId.startsWith('http') ? imageId : `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${imageId}`)
    : BRAND.defaultAvatar;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg p-8 md:p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-light-secondary dark:text-text-dark-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg p-8 md:p-10">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">Authentication Required</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg p-8 md:p-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">My Profile</h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Manage your account details and preferences</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <img
            src={displayImage}
            alt="Profile"
            className="w-40 h-40 rounded-full object-cover border-4 border-border-light dark:border-border-dark shadow-md"
          />
        </div>
      </div>

      <div className="mt-8 border-t border-border-light dark:border-border-dark"></div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Full Name</label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="mt-1 w-full border border-border-light dark:border-border-dark rounded-md p-2 bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Email Address</label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full border border-border-light dark:border-border-dark rounded-md p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1 w-full border border-border-light dark:border-border-dark rounded-md p-2 bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full border border-border-light dark:border-border-dark rounded-md p-2 bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          >
            <option value="TENANT">Tenant</option>
            <option value="OWNER">Owner</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us something about yourself..."
            className="mt-1 w-full border border-border-light dark:border-border-dark rounded-md p-2 bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
          />
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-md shadow-md transition-all disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
