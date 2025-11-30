// src/pages/profile.tsx   (or src/pages/ProfilePage.tsx)
// Requires: react-hot-toast, tailwindcss
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../client/src/hooks/useAuth";
import { getCloudinaryUrl } from "../components/CloudinaryImage";

export default function ProfilePage() {
  const { user: authUser, isAuthenticated } = useAuth();
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

  // Fetch current user from server API
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

        // fetch DB user details
        const token = localStorage.getItem("accessToken");
        const ures = await fetch(`/api/users/${authUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ures.ok) {
          const dbUser = await ures.json();
          setProfileName(dbUser.name || authUser.name || "");
          setBio(dbUser.bio || "");
          setMobile(dbUser.mobile || "");
          setRole(dbUser.role || authUser.role || "TENANT");
          setImageId(dbUser.image_id || "");
        } else {
          // fallback to auth data
          setProfileName(authUser.name || "");
          setBio("");
          setMobile("");
          setRole(authUser.role || "TENANT");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile data");
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

  // Upload file directly to ImageKit and update DB
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
      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Upload to server API
      const token = localStorage.getItem("accessToken");
      const response = await fetch('/api/images/upload-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileBase64: base64,
          userId: authUser.id,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      setImageId(data.imageUrl || data.imageId);
      toast.success("Profile image uploaded successfully");

      // Clean up local preview
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      }

      setUploading(false);
      setUploadProgress(0);
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed: " + (err.message || ""));
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
      const token = localStorage.getItem("accessToken");
      const updates = {
        name: profileName,
        bio,
        mobile,
        image_id: imageId.startsWith('http') ? imageId : imageId,
        updated_at: new Date().toISOString(),
      };
      const res = await fetch(`/api/users/${authUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Response status:', res.status, 'Response text:', text);
        let err;
        try {
          err = JSON.parse(text);
        } catch (e) {
          throw new Error(`Server error (${res.status}): ${text}`);
        }
        throw new Error(err.error || "Failed to save");
      }
      toast.success("Profile updated");

      // Refetch user data to reflect changes
      const ures = await fetch(`/api/users/${authUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ures.ok) {
        const dbUser = await ures.json();
        setProfileName(dbUser.name || authUser.name || "");
        setBio(dbUser.bio || "");
        setMobile(dbUser.mobile || "");
        setImageId(dbUser.image_id || "");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Save failed: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const displayImage = localPreview
    ? localPreview
    : imageId
    ? (imageId.startsWith('http') ? imageId : getCloudinaryUrl(imageId, 200, 200))
    : "/default-avatar.svg";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-lg p-8 md:p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-lg p-8 md:p-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account details and preferences</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <img
            src={displayImage}
            alt="Profile"
            className="w-40 h-40 rounded-full object-cover border-4 border-gray-300 shadow-md transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all pointer-events-none">
            <p className="text-white text-sm">Change Photo</p>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 rounded-full">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-700">{Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>



        <label
          htmlFor="file-input"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 transition"
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

      <div className="mt-8 border-t border-gray-200"></div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">Full Name</label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="mt-1 w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Email Address</label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full border rounded-md p-2 bg-gray-100 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1 w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Role</label>
          <input
            type="text"
            value={role}
            disabled
            className="mt-1 w-full border rounded-md p-2 bg-gray-100 text-gray-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us something about yourself..."
            className="mt-1 w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-md shadow-md transition-all disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
