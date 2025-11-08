import React, { useState, useEffect } from 'react';
import { supabase } from '../../client/src/lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';

interface Property {
  id: string;
  name: string;
  address: string;
  description: string;
  price: number;
  capacity: number;
  available: boolean;
}

const EditPropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<Property>({
    id: '',
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
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProperty(id);
    }
  }, [id]);

  const fetchProperty = async (propertyId: string) => {
    try {
      setFetching(true);
      const { data: property, error } = await (supabase as any)
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) {
        throw error;
      }

      if (property) {
        setFormData({
          id: property.id,
          name: property.name,
          address: property.address,
          description: property.description,
          price: property.price,
          capacity: property.capacity,
          available: property.available
        });
      }
    } catch (err) {
      console.error('Error fetching property:', err);
      setError('Failed to fetch property details.');
    } finally {
      setFetching(false);
    }
  };

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

      // Update property
      const { error: updateError } = await (supabase as any)
        .from('properties')
        .update({
          name: formData.name,
          address: formData.address,
          description: formData.description,
          price: formData.price,
          capacity: formData.capacity,
          available: formData.available
        })
        .eq('id', formData.id)
        .eq('owner_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${formData.id}.${fileExt}`;
        const filePath = `property-images/${fileName}`;

        // Delete existing image if any
        await (supabase as any).storage
          .from('property-images')
          .remove([filePath]);

        // Upload new image
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

          // Update or insert file record
          await (supabase as any)
            .from('files')
            .upsert({
              user_id: userId,
              property_id: formData.id,
              file_name: fileName,
              file_type: imageFile.type,
              url: publicUrl.publicUrl,
              purpose: 'PROPERTY_IMAGE',
              status: 'AVAILABLE'
            });
        }
      }

      // Success - redirect to listings
      navigate('/owner-dashboard');
    } catch (err) {
      console.error('Error updating property:', err);
      setError('Failed to update property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading property details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary">Edit Property</h2>
      
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
            Property Image (Leave blank to keep current image)
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
            {loading ? 'Updating...' : 'Update Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPropertyForm;