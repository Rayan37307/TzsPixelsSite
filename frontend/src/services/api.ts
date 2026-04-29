import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const orderApi = {
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  fetchShopifyOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  connectShopify: async (shopUrl: string, clientId: string, clientSecret: string) => {
    // Mocking connection for now as backend handles this via ENV
    // In a real scenario, this would persist the credentials to the DB
    return { accessToken: 'shp_mock_' + Math.random().toString(36).substring(7) };
  }
};

export default api;
