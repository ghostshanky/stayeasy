import React, { useState } from 'react';
import { supabase } from '../../client/src/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface PropertyFormData {
  name: string;
  address: string;
  description: string;
  price: number;
  capacity: number;
  available: boolean;
}

const AddPropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
    description: '',
    price: 0,
    capacity: 1,
    available: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'capacity' 
        ? Number(value) 
        : name === 'available' 
          ? (e.target as HTMLInputElement).checked 
          : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("No authenticated user");
      }

      const userId = session.user.id;

      // Insert property
      const { data: property, error: propertyError } = await (supabase as any)
        .from('properties')
        .insert([
          {
            owner_id: userId,
            name: formData.name,
            address: formData.address,
            description: formData.description,
            price: formData.price,
            capacity: formData.capacity,
            available: formData.available
          }
        ])
        .select()
        .single();

      if (propertyError) {
        throw propertyError;
      }

      // Upload image if provided
      if (imageFile && property) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${property.id}.${fileExt}`;
        const filePath = `property-images/${fileName}`;

        const { error: uploadError } = await (supabase as any).storage
          .from('property-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          // Update property with image URL
          const { data: publicUrl } = (supabase as any).storage
            .from('property-images')
            .getPublicUrl(filePath);

          await (supabase as any)
            .from('files')
            .insert([
              {
                user_id: userId,
                property_id: property.id,
                file_name: fileName,
                file_type: imageFile.type,
                url: publicUrl.publicUrl,
                purpose: 'PROPERTY_IMAGE',
                status: 'AVAILABLE'
              }
            ]);
        }
      }

      // Success - redirect to listings
      navigate('/owner-dashboard');
    } catch (err) {
      console.error('Error adding property:', err);
      setError('Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary">Add New Property</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            Property Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Price per Night (₹)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="1"
              required
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            Property Image
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="available"
            name="available"
            checked={formData.available}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-border-light dark:border-border-dark rounded"
          />
          <label htmlFor="available" className="ml-2 block text-sm text-text-light-primary dark:text-text-dark-primary">
            Available for Booking
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/owner-dashboard')}
            className="px-4 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm text-sm font-medium text-text-light-primary dark:text-text-dark-primary bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-background-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPropertyForm;