// API Configuration
export const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:3000',
    apiURL: 'http://localhost:3000/api'
  },
  // Production - Vercel (serverless functions)
  production: {
    baseURL: typeof window !== 'undefined' ? window.location.origin : 'https://vpn-6ibtiaqas-batuhans-projects-e2efe5f7.vercel.app',
    apiURL: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'https://vpn-6ibtiaqas-batuhans-projects-e2efe5f7.vercel.app/api'
  }
};

// Get current environment
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Export current API URLs
export const API_BASE_URL = isDevelopment ? API_CONFIG.development.baseURL : API_CONFIG.production.baseURL;
export const API_URL = isDevelopment ? API_CONFIG.development.apiURL : API_CONFIG.production.apiURL;

// API Endpoints
export const API_ENDPOINTS = {
  // License
  validateLicense: '/validate-license',
  createCheckoutSession: '/create-checkout-session',
  
  // Admin
  adminLogin: '/admin/login',
  adminVerify: '/admin/verify',
  
  // CRUD Operations
  licenses: '/licenses',
  users: '/users',
  servers: '/servers',
  settings: '/settings',
  
  // Webhook
  webhook: '/webhook'
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_URL}${endpoint}`;
};

// Helper function to get full base URL
export const getBaseUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
}; 