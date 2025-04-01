/**
 * Configuration utility for the application
 * Contains environment-specific settings and constants
 */

const config = {
  // API configuration
  api: {
    // Base URL for the Flask API
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005',
    // Default timeout for API requests (in milliseconds)
    timeout: 30000,
  },

  // Authentication configuration
  auth: {
    // Local storage key for the authentication token
    tokenKey: 'uva_brain_auth_token',
    // Cookie name for the authentication token
    cookieName: 'uva_brain_auth_token',
    // Expiration time for the token (in days)
    tokenExpiration: 7,
  },

  // Route configuration
  routes: {
    // Authentication routes
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    // Application routes
    home: '/',
    dashboard: '/dashboard',
    profile: '/profile',
    patients: '/patients',
  },

  // Feature flags
  features: {
    // Enable/disable features based on environment
    enableSearch: true,
    enableAdvancedFilters: true,
    enableExport: process.env.NODE_ENV === 'production',
  },
};

export default config;