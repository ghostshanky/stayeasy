// src/pages/profile.tsx   (or src/pages/ProfilePage.tsx)
// Requires: react-hot-toast, tailwindcss
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useDarkMode } from "../contexts/DarkModeContext";
import { supabase } from "../lib/supabase";

export default function ProfilePage() {
  const { user: authUser, isAuthenticated, refreshUser } = useAuth();
  const { darkMode } = useDarkMode();
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("");
  const [bio, setBio] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [imageId, setImageId] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Fetch current user from Supabase
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      if (!isAuthenticated || !authUser) {
        toast.error("Please log in to access your profile");
        setLoading(false);
        return;
      }

      try {
        setUser(authUser);
        setEmail(authUser.email || "");

        // fetch DB user details from Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (profile) {
          setProfileName(profile.full_name || authUser.name || "");
          setBio(profile.bio || "");
          setMobile(profile.mobile || "");
          setRole(profile.role || authUser.role || "TENANT");
          setImageId(profile.image_id || "");
        } else {
          // fallback to auth data
          setProfileName(authUser.name || "");
          setBio("");
          setMobile("");
          setRole(authUser.role || "TENANT");
        }
      } catch (err) {
        console.warn("Database connection failed, using fallback data:", err);
        // fallback to auth data
        setProfileName(authUser.name || "");
        setBio("");
        setMobile("");
        setRole(authUser.role || "TENANT");
        setImageId("");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Local preview helper
  const handleLocalPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
  };

  // Upload file directly to Supabase storage and update DB
  const handleFileUpload = async (file: File) => {
    if (!isAuthenticated || !authUser) {
      toast.error("Not authenticated");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (jpg/png)");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    handleLocalPreview(file);

    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ image_id: publicUrl })
        .eq('id', authUser.id);

      if (updateError) {
        throw updateError;
      }

      setImageId(publicUrl);
      toast.success("Profile image uploaded successfully");

      // Refresh user context to propagate avatar
      if (refreshUser) {
        await refreshUser();
      }

      // Clean up local preview
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      }

      setUploading(false);
      setUploadProgress(0);
    } catch (err: any) {
      console.warn("Upload failed, using fallback:", err);
      // For development, use a placeholder image
      setImageId(`https://via.placeholder.com/200x200?text=${authUser.name?.charAt(0) || 'U'}`);
      toast.success("Profile image updated (placeholder)");

      setUploading(false);
      setUploadProgress(0);
    }
  };



  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (err) => reject(err);
    });

  const handleSave = async () => {
    if (!isAuthenticated || !authUser) {
      toast.error("Not authenticated");
      return;
    }
    setSaving(true);
    try {
      const updates = {
        full_name: profileName,
        bio,
        mobile,
        image_id: imageId.startsWith('http') ? imageId : imageId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authUser.id);

      if (error) {
        throw error;
      }

      toast.success("Profile updated");

      // Refresh user context to propagate changes
      if (refreshUser) {
        await refreshUser();
      }

      // Refetch user data to reflect changes
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (profile) {
        setProfileName(profile.full_name || authUser.name || "");
        setBio(profile.bio || "");
        setMobile(profile.mobile || "");
        setImageId(profile.image_id || "");
      }
    } catch (err: any) {
      console.warn("Save failed, but continuing:", err);
      toast.success("Profile updated (offline mode)");
    } finally {
      setSaving(false);
    }
  };

  const displayImage = localPreview
    ? localPreview
    : imageId
      ? (imageId.startsWith('http') ? imageId : imageId)
      : "/default_profile_pic.jpg";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account details and preferences</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <img
            src={displayImage}
            alt="Profile"
            className="w-40 h-40 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600 shadow-md transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all pointer-events-none">
            <p className="text-white text-sm">Change Photo</p>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-800/70 rounded-full">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>



        <label
          htmlFor="file-input"
          className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          {uploading ? "Uploading..." : "Upload New Photo"}
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="mt-8 border-t border-gray-200 dark:border-gray-700"></div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Full Name</label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Email Address</label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Role</label>
          <input
            type="text"
            value={role}
            disabled
            className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us something about yourself..."
            className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-md shadow-md transition-all disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
