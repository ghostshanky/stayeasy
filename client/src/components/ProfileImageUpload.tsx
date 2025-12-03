import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { BRAND } from '../config/brand';

interface ProfileImageUploadProps {
  currentImageId?: string;
  onImageUpload: (imageId: string) => void;
  size?: number;
  editable?: boolean;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageId,
  onImageUpload,
  size = 150,
  editable = true
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'stayeasy_preset'); // Replace with your Cloudinary upload preset

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        // Extract public ID from the URL or use the one returned
        onImageUpload(data.public_id);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getCloudinaryUrl = (publicId: string, width: number, height: number) => {
    if (!publicId) return BRAND.defaultAvatar;
    // Check if it's already a full URL (legacy data)
    if (publicId.startsWith('http')) return publicId;
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_${width},h_${height},q_auto/${publicId}`;
  };

  return (
    <div className="relative inline-block">
      <div
        className={`relative overflow-hidden rounded-full border-4 border-white dark:border-gray-700 shadow-lg ${editable ? 'cursor-pointer group' : ''}`}
        style={{ width: size, height: size }}
        onClick={triggerFileInput}
      >
        <img
          src={currentImageId ? getCloudinaryUrl(currentImageId, size, size) : BRAND.defaultAvatar}
          alt="Profile"
          className="w-full h-full object-cover"
        />

        {editable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {editable && (
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      )}
    </div>
  );
};

export default ProfileImageUpload;