
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

export const loginUser = async (email, password) => {
    try {
        const response = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('authToken', response.data.token);
        return response.data.user;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
};

export const registerUser = async (name, email, password) => {
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

export const getProperties = async (): Promise<Listing[]> => {
    // In a real app:
    // const response = await apiClient.get('/properties');
    // return response.data; // Assuming backend returns data in the correct format
    
    // Mock response
    await new Promise(res => setTimeout(res, 1000));
    return [
        { id: 1, name: 'Cozy Shared Room near University', location: 'Koramangala, Bangalore', price: '₹8,500', priceValue: 8500, rating: 4.8, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuf3ytkxTOxPWPinQq4OzWuo2Jgztap9Jbj5roahI3J8RaA4U-kVex9oDU2ohN30YXGXJqD5xjTIfvZBrJBFMKmqlK8iha6G1zvsNsZP-TpPgA9xnwFnlmbBL0GcIsQlSGjDF_IgqLBPvsdWyYFdhhrCsrhKntkjB5Z7ab32hSCZFFE6mFvBMAnhQd3Ju6UKKZruTOk0t8JGauTJEEKEPFck1nciDPNzKbDg_pFPvLj3wlaa5F6Uj-K21yxUzAAiVjvA5yVC8_mhI', status: ListingStatus.Listed, details: 'Shared room' },
        { id: 2, name: 'Modern PG for Professionals', location: 'Hiranandani, Mumbai', price: '₹15,000', priceValue: 15000, rating: 4.5, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYsdPENLfpxrrGmVqommjHYQ4CrbbA8BPbHxLhm0fkuXnIrs400RxushY9cZB_3mI2Li5T17GbgUzKxj5_F4LE0DnqttJ9iRBfP8jY4H7nVbNUmcv1KxX64dWGMGZeFCKB8Zix1VgXTbpRNODR6bLvK195MHkbEpk2doTar7t2qf-CNfYRzejd7NIzKjKJ5eiUpBIYZ9BjaykYL7dI1PhsgcRtnwAfOyg02qY8x2hHPD-ZGVCK9nFbsPz9NEilHB1ZJfgRIuCo40U', status: ListingStatus.Listed, details: 'Private room' },
        { id: 3, name: 'Student Hub Downtown', location: 'FC Road, Pune', price: '₹7,200', priceValue: 7200, rating: 4.6, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9gV1sYhJ9fW1bXJ8jG9e7mZ9rY_9zL_3vF_0bJ1iWk_4xY2dZ_0vJ_0eJ_1cQ_1xY_1aX_1zY_0xJ_0aX_0yZ_0bJ_0=', status: ListingStatus.Listed, details: 'Shared room' },
        { id: 4, name: 'The Executive Stay', location: 'Cyber City, Gurgaon', price: '₹22,500', priceValue: 22500, rating: 4.9, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0z_0b_0a_0x_0y_0-ABCDEFG.jpeg', status: ListingStatus.Listed, details: 'Private room' },
    ];
};

export const getOwnerStats = async (): Promise<StatCardData[]> => {
     // Mock response
    await new Promise(res => setTimeout(res, 500));
    return [
        {
            title: 'Total Earnings',
            value: '₹9,85,000',
            change: '+5.2%',
            changeDirection: StatChangeDirection.Increase,
            changeColorClass: 'text-success'
        },
        {
            title: 'New Booking Requests',
            value: '3',
            change: '+1 from yesterday',
            changeDirection: StatChangeDirection.Increase,
            changeColorClass: 'text-warning'
        },
        {
            title: 'Occupancy Rate',
            value: '85%',
            change: '-1.5%',
            changeDirection: StatChangeDirection.Decrease,
            changeColorClass: 'text-error'
        }
    ];
}

export const getOwnerProperties = async (): Promise<Listing[]> => {
    // Mock response
    await new Promise(res => setTimeout(res, 1000));
    return [
        {
            id: 1,
            name: 'Sunnyvale Student Hostel',
            details: '4 Beds | Shared Room',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuNwHQQj0J24TfToBT_OEbFrs_Ql68Lp4loE2pthwKMuSZ-kg6e346MqvpUtLzC5e7ut7ta8Y0XMwNbAnu2N-Of4NVoTaWjt4H2P3RNpBhwOZD6LDWvURHB0p14LrOks_K6yI-c5eJoiYdny9tA91K9zyNOiQ49VAyRxT67AEU3URvLqohrbVuxhgYVN2mKOpohTZO0tftPDk5XGoiDNgXqHnl3Jy6WM3DdkKfqq189M1WVHzcJP_-I5q3RrRzktJPZN8QopHgj9A',
            location: 'Mumbai, India',
            status: ListingStatus.Listed,
            price: '₹9,000',
            priceValue: 9000,
        },
        {
            id: 2,
            name: 'Tech Park Co-Living',
            details: '1 Bed | Private Room',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdKFrqypQ6r3RoWjZyPtFYMe01bG8gOc7VCXS7x4juwcLmBLR6xivoAfNbPZNmutLy0j3i2aaOPg58nVypxAjoWb5_Dm5hDrDRj047wJRYUPUJnMwC0io9bEvEzwHrq4tZURUwOENPALmBrygDBeYCGjDlHH0wuiBzlW2ZdCLo9ttVQvWhal5jgSB1Rv4eIePv3-2L5tn5eXO_zRXm2sdkp2EkVnzXEQqDMz5bU4idPW4bzrfr-7HIHcxD8CTlN-DonhCLh4SRLEg',
            location: 'Bangalore, India',
            status: ListingStatus.Listed,
            price: '₹18,500',
            priceValue: 18500,
        }
    ];
};