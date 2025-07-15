import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Storage utility
const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem('admin_token');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/admin/auth/login', { username, password });
    return response.data;
  },
  logout: async () => {
    await storage.removeItem('admin_token');
    const response = await api.post('/admin/auth/logout');
    return response.data;
  },
};

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },
};

export const serverService = {
  getServers: async () => {
    const response = await api.get('/servers');
    return response.data;
  },
  getServer: async (id: string) => {
    const response = await api.get(`/admin/servers/${id}`);
    return response.data;
  },
  updateServer: async (id: string, data: any) => {
    const response = await api.put(`/servers/${id}`, data);
    return response.data;
  },
  createServer: async (data: any) => {
    const response = await api.post('/servers', data);
    return response.data;
  },
  deleteServer: async (id: string) => {
    const response = await api.delete(`/servers/${id}`);
    return response.data;
  },
};

export const licenseService = {
  getLicenses: async () => {
    const response = await api.get('/admin/licenses');
    return response.data;
  },
  getLicense: async (id: string) => {
    const response = await api.get(`/admin/licenses/${id}`);
    return response.data;
  },
  createLicense: async (data: any) => {
    const response = await api.post('/admin/licenses', data);
    return response.data;
  },
  updateLicense: async (id: string, data: any) => {
    const response = await api.put(`/admin/licenses/${id}`, data);
    return response.data;
  },
  deleteLicense: async (id: string) => {
    const response = await api.delete(`/admin/licenses/${id}`);
    return response.data;
  },
};

export const statsService = {
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats/dashboard');
    return response.data;
  },
  getServerStats: async () => {
    const response = await api.get('/admin/stats/servers');
    return response.data;
  },
  getUserStats: async () => {
    const response = await api.get('/admin/stats/users');
    return response.data;
  },
  getRevenueStats: async () => {
    const response = await api.get('/admin/stats/revenue');
    return response.data;
  },
};

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },
  updateSettings: async (data: any) => {
    const response = await api.put('/admin/settings', data);
    return response.data;
  },
}; 