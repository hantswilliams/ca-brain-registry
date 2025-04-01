import { useState, useEffect, useCallback } from 'react';
import apiClient from '../apiClient';
import { useRouter } from 'next/navigation';

interface UseAuthProps {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useAuth({ redirectTo, redirectIfFound = false }: UseAuthProps = {}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch the user
  const fetchUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Set the auth token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setAuthToken(token);
      }
      
      // Get the user data from the Flask API
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      setError('Failed to load user data');
      setLoading(false);
      
      // Clear token if it's invalid or expired
      localStorage.removeItem('token');
      apiClient.setAuthToken('');
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.login(email, password);
      
      // Store the token
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        apiClient.setAuthToken(response.access_token);
        
        // Update the user data
        await fetchUser();
        
        return true;
      } else {
        throw new Error('No access token received');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    apiClient.setAuthToken('');
    setUser(null);
    
    // Redirect to login page after logout
    if (window.location.pathname !== '/login') {
      router.push('/login');
    }
  }, [router]);

  // Register function
  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.register(userData);
      
      // Auto-login if registration is successful
      if (response.success) {
        return await login(userData.email, userData.password);
      }
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register');
      setLoading(false);
      return false;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  // Handle redirects
  useEffect(() => {
    if (!redirectTo || loading) return;
    
    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !user) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && user)
    ) {
      router.push(redirectTo);
    }
  }, [user, redirectIfFound, redirectTo, loading, router]);

  // Initial fetch
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated,
    fetchUser,
  };
}