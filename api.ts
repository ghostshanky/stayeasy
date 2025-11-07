
import axios from 'axios';
import { Listing, StatCardData, ListingStatus, StatChangeDirection } from './types';

// Use environment variable or default to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

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
    // In a real app:
    // const response = await apiClient.get('/properties');
    // return response.data; // Assuming backend returns data in the correct format

    // Mock response
    await new Promise(res => setTimeout(res, 1000));
    return [
        {
            id: 1,
            name: 'Cozy Shared Room near University',
            location: 'Koramangala, Bangalore',
            price: '₹8,500',
            priceValue: 8500,
            rating: 4.8,
            imageUrl: 'https://example.com/image1.jpg',
            status: ListingStatus.Listed,
            details: 'Shared room'
        },
        {
            id: 2,
            name: 'Modern PG for Professionals',
            location: 'Hiranandani, Mumbai',
            price: '₹15,000',
            priceValue: 15000,
            rating: 4.5,
            imageUrl: 'https://example.com/image2.jpg',
            status: ListingStatus.Listed,
            details: 'Private room'
        },
        {
            id: 3,
            name: 'Student Hub Downtown',
            location: 'FC Road, Pune',
            price: '₹7,200',
            priceValue: 7200,
            rating: 4.6,
            imageUrl: 'https://example.com/image3.jpg',
            status: ListingStatus.Listed,
            details: 'Shared room'
        },
        {
            id: 4,
            name: 'The Executive Stay',
            location: 'Cyber City, Gurgaon',
            price: '₹22,500',
            priceValue: 22500,
            rating: 4.9,
            imageUrl: 'https://example.com/image4.jpg',
            status: ListingStatus.Listed,
            details: 'Private room'
        }
    ] as Listing[];
};

export default {
    loginUser,
    registerUser,
    sendMessageToHost,
    getProperties
};
    