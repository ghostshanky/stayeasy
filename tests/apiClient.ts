import axios from 'axios';

// Create a test-specific API client instance
const testApiClient = axios.create({
  baseURL: process.env.TEST_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token interceptor
testApiClient.interceptors.request.use(
  (config) => {
    const token = process.env.TEST_AUTH_TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default testApiClient;