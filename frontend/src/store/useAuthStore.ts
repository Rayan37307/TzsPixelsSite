import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        loading: false 
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', userData);
      // Auto login after registration or redirect to login
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        loading: false 
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, loading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },
}));
