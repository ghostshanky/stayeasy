import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface EditPropertyFormProps {
  propertyId: string;
  onPropertyUpdated: () => void;
  onCancel: () => void;
}

interface Amenity {
  name: string;
  value: string;
}

interface PropertyImage {
  id: string;
  url: string;
  file_name: string;
}

const EditPropertyForm: React.FC<EditPropertyFormProps> = ({ propertyId, onPropertyUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price_per_night: '',
    capacity: '',
    amenities: [] as Amenity[]
  });
  
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }

        const property = await response.json();
        
        setFormData({
          title: property.title,
          description: property.description || '',
          location: property.location,
          price_per_night: property.price_per_night.toString(),
          capacity: property.capacity.toString(),
          amenities: property.amenities || []
        });

        // Fetch existing images
        const imagesResponse = await fetch(`/api/images/user/${property.owner_id}?purpose=PROPERTY_IMAGE`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          setExistingImages(imagesData.data.filter((img: PropertyImage) => img.file_name.includes(propertyId)));
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property data');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

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
      if (newFiles.length + selectedFiles.length > 10) {
        toast.error('Maximum 10 images allowed');
        return;
      }
      setNewFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: localStorage.getItem('userId')
        }),
      });

      if (response.ok) {
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
        toast.success('Image removed');
      } else {
        throw new Error('Failed to remove image');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleFileUpload = async () => {
    if (newFiles.length === 0) return;

    setUploading(true);
    try {
      const base64Files = await Promise.all(
        newFiles.map(file => fileToBase64(file))
      );

      const response = await fetch('/api/images/upload-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          files: base64Files,
          propertyId: propertyId,
          userId: localStorage.getItem('userId')
        }),
      });

      const result = await response.json();

      if (result.success) {
        return result.uploadedFiles;
      } else {
        throw new Error(result.error || 'Failed to upload images');
      }
    } catch (error) {
      throw new Error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

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
    
    if (!formData.title || !formData.location || !formData.price_per_night) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Update property
      const propertyResponse = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          price_per_night: parseFloat(formData.price_per_night),
          capacity: parseInt(formData.capacity) || 1,
          amenities: formData.amenities.filter(a => a.name && a.value)
        }),
      });

      const propertyResult = await propertyResponse.json();

      if (!propertyResult.success) {
        throw new Error(propertyResult.error?.message || 'Failed to update property');
      }

      // Upload new images if any
      if (newFiles.length > 0) {
        await handleFileUpload();
      }

      toast.success('Property updated successfully!');
      onPropertyUpdated();
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Property</h1>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="1"
                min="1"
              />
            </div>
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

        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Property Images</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add New Images (Max 10)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            {newFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {newFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Property ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.file_name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {submitting ? 'Updating...' : uploading ? 'Uploading...' : 'Update Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPropertyForm;