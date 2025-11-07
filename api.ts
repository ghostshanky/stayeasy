
import axios from 'axios';
import { Listing, StatCardData, ListingStatus, StatChangeDirection } from './types';
import { supabase } from './lib/supabase';

// Use environment variable or default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the auth token to every request if it exists
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear auth token and redirect to login
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// --- API Functions ---

// Note: The backend would return data that we map to our frontend types.
// These are mock implementations that simulate API calls and data transformation.

export const loginUser = async (email: string, password: string) => {
    try {
        const response = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('authToken', response.data.token);
        return response.data.user;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
};

export const registerUser = async (name: string, email: string, password: string) => {
    try {
        const response = await apiClient.post('/auth/signup', { name, email, password });
        localStorage.setItem('authToken', response.data.token);
        return response.data.user;
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
};

export const sendMessageToHost = async (hostId: string, message: string) => {
    try {
        const response = await apiClient.post('/chats', { 
            recipientId: hostId, 
            content: message 
        });
        return response.data;
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
}

export const getOwnerProperties = async (): Promise<Listing[]> => {
    try {
        const response = await apiClient.get('/owner/properties');
        return response.data.data.map((property: any) => ({
            id: property.id,
            name: property.name,
            location: property.address,
            price: `₹${property.price}`,
            priceValue: property.price,
            rating: property.averageRating || 0,
            imageUrl: property.images?.[0]?.url || 'https://example.com/default.jpg',
            status: property.available ? ListingStatus.Listed : ListingStatus.Unlisted,
            details: property.description || 'No description'
        }));
    } catch (error) {
        console.error('Failed to fetch owner properties:', error);
        throw error;
    }
};

export const getOwnerStats = async (): Promise<StatCardData[]> => {
    try {
        const response = await apiClient.get('/owner/stats');
        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch owner stats:', error);
        // Mock response for now
        return [
            {
                title: 'Total Properties',
                value: '5',
                change: '+2',
                changeDirection: StatChangeDirection.Increase,
                changeColorClass: 'text-green-600'
            },
            {
                title: 'Active Bookings',
                value: '12',
                change: '+3',
                changeDirection: StatChangeDirection.Increase,
                changeColorClass: 'text-green-600'
            },
            {
                title: 'Monthly Revenue',
                value: '₹45,000',
                change: '+15%',
                changeDirection: StatChangeDirection.Increase,
                changeColorClass: 'text-green-600'
            },
            {
                title: 'Average Rating',
                value: '4.7',
                change: '+0.2',
                changeDirection: StatChangeDirection.Increase,
                changeColorClass: 'text-green-600'
            }
        ];
    }
};

export const getProperties = async (): Promise<Listing[]> => {
    try {
        // Fetch properties from Supabase
        const { data: properties, error } = await supabase
            .from('properties')
            .select(`
                id,
                name,
                address,
                price,
                available,
                description,
                files!inner(url),
                reviews(rating)
            `)
            .eq('available', true)
            .limit(20);

        if (error) {
            console.error('Error fetching properties:', error);
            throw error;
        }

        // Calculate average ratings and map to Listing format
        const listings: Listing[] = properties.map((property: any) => {
            const reviews = property.reviews || [];
            const averageRating = reviews.length > 0
                ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
                : 0;

            return {
                id: property.id,
                name: property.name,
                location: property.address,
                price: `₹${property.price.toLocaleString()}`,
                priceValue: property.price,
                rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                imageUrl: property.files?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image',
                status: property.available ? ListingStatus.Listed : ListingStatus.Unlisted,
                details: property.description || 'No description available'
            };
        });

        return listings;
    } catch (error) {
        console.error('Failed to fetch properties from Supabase:', error);
        // Fallback to mock data if Supabase fails
        return [
            {
                id: '1',
                name: 'Cozy Shared Room near University',
                location: 'Koramangala, Bangalore',
                price: '₹8,500',
                priceValue: 8500,
                rating: 4.8,
                imageUrl: 'https://via.placeholder.com/400x300?text=Property+1',
                status: ListingStatus.Listed,
                details: 'Shared room'
            },
            {
                id: '2',
                name: 'Modern PG for Professionals',
                location: 'Hiranandani, Mumbai',
                price: '₹15,000',
                priceValue: 15000,
                rating: 4.5,
                imageUrl: 'https://via.placeholder.com/400x300?text=Property+2',
                status: ListingStatus.Listed,
                details: 'Private room'
            },
            {
                id: '3',
                name: 'Student Hub Downtown',
                location: 'FC Road, Pune',
                price: '₹7,200',
                priceValue: 7200,
                rating: 4.6,
                imageUrl: 'https://via.placeholder.com/400x300?text=Property+3',
                status: ListingStatus.Listed,
                details: 'Shared room'
            },
            {
                id: '4',
                name: 'The Executive Stay',
                location: 'Cyber City, Gurgaon',
                price: '₹22,500',
                priceValue: 22500,
                rating: 4.9,
                imageUrl: 'https://via.placeholder.com/400x300?text=Property+4',
                status: ListingStatus.Listed,
                details: 'Private room'
            }
        ] as Listing[];
    }
};

// API functions for admin dashboard
export const getAdminStats = async (): Promise<any> => {
    try {
        const response = await apiClient.get('/admin/stats');
        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        throw error;
    }
};

export const getAdminUsers = async (params?: { role?: string; page?: number; limit?: number }): Promise<any> => {
    try {
        const response = await apiClient.get('/admin/users', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        throw error;
    }
};

export const getAuditLogs = async (params?: { userId?: string; action?: string; page?: number; limit?: number }): Promise<any> => {
    try {
        const response = await apiClient.get('/admin/audit-logs', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        throw error;
    }
};

export const updateUser = async (userId: string, updates: any): Promise<any> => {
    try {
        const response = await apiClient.put(`/admin/users/${userId}`, updates);
        return response.data;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
};

export const deleteUser = async (userId: string): Promise<any> => {
    try {
        const response = await apiClient.delete(`/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};

export const removeContent = async (type: string, id: string): Promise<any> => {
    try {
        const response = await apiClient.delete(`/admin/content/${type}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to remove content:', error);
        throw error;
    }
};

export default {
    loginUser,
    registerUser,
    sendMessageToHost,
    getProperties
};
    