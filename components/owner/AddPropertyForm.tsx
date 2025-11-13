import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface AddPropertyFormProps {
  onPropertyAdded: () => void;
  onCancel: () => void;
}

interface Amenity {
  name: string;
  value: string;
}

const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onPropertyAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price_per_night: '',
    capacity: '',
    amenities: [] as Amenity[],
    tags: [] as string[]
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (index: number, field: keyof Amenity, value: string) => {
    const updatedAmenities = [...formData.amenities];
    updatedAmenities[index] = { ...updatedAmenities[index], [field]: value };
    setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
  };

  const addAmenity = () => {
    setFormData(prev => ({ ...prev, amenities: [...prev.amenities, { name: '', value: '' }] }));
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      amenities: prev.amenities.filter((_, i) => i !== index) 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageLinks([e.target.value]);
  };

  const addImageLink = () => {
    if (imageLinks.length > 0 && imageLinks[0].trim()) {
      toast.success('Image link added successfully');
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // File upload is disabled for now since we don't have a storage bucket
  // const handleFileUpload = async (propertyId: string) => {
  //   if (files.length === 0) return [];
  //   // Implementation would go here when storage bucket is available
  //   return [];
  // };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.location || !formData.price_per_night || !formData.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Handle images - only image links for now
      let imageUrls: string[] = [];

      // Add image links if provided
      if (imageLinks.length > 0 && imageLinks[0].trim()) {
        imageUrls.push(imageLinks[0].trim());
      }

      // Create property
      const propertyResponse = await fetch('/api/owner/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          address: formData.location,
          price_per_night: parseFloat(formData.price_per_night),
          capacity: parseInt(formData.capacity),
          images: imageUrls,
          amenities: formData.amenities.filter(a => a.name && a.value).map(a => `${a.name}: ${a.value}`),
          tags: formData.tags || [],
          ownerId: localStorage.getItem('userId') || 'test-owner-id'
        }),
      });

      const propertyResult = await propertyResponse.json();

      if (!propertyResult.success) {
        throw new Error(propertyResult.error?.message || 'Failed to create property');
      }

      toast.success('Property added successfully!');
      onPropertyAdded();
    } catch (error: any) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Property</h1>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Property Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter property title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Describe your property..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter property address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price per Night (₹) *
            </label>
            <input
              type="number"
              name="price_per_night"
              value={formData.price_per_night}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capacity (Number of Guests) *
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="1"
              min="1"
              max="20"
              required
            />
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Amenities</h2>
            <button
              type="button"
              onClick={addAmenity}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add Amenity
            </button>
          </div>

          {formData.amenities.map((amenity, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amenity Name
                </label>
                <input
                  type="text"
                  value={amenity.name}
                  onChange={(e) => handleAmenityChange(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., WiFi"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value
                </label>
                <input
                  type="text"
                  value={amenity.value}
                  onChange={(e) => handleAmenityChange(index, 'value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Free"
                />
              </div>
              <button
                type="button"
                onClick={() => removeAmenity(index)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Tags</h2>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add a tag"
              value={newTag}
              onChange={handleTagChange}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Property Images</h2>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Add Image Link</h3>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageLinks[0] || ''}
                onChange={handleImageLinkChange}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={addImageLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Link
              </button>
            </div>
            {imageLinks.length > 0 && imageLinks[0].trim() && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Image Preview:</p>
                <div className="relative group">
                  <img
                    src={imageLinks[0].trim()}
                    alt="Property from link"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageLinks([])}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Note: File upload is temporarily disabled. Please use image links above.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : uploading ? 'Uploading...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPropertyForm;