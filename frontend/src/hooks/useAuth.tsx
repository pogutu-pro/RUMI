import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'landlord' | 'caretaker' | 'tech_support' | 'super_admin';
  is_verified: boolean;
  phone_number?: string;
  profile_picture?: string;
  date_joined: string;
  last_login?: string;
  profile_complete?: boolean;
  can_list_hostels?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  role: 'student' | 'landlord' | 'caretaker';
  first_name: string;
  last_name: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('access_token');
    if (token) {
      // Validate token and get user data
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Validate token and get user profile
      const response = await authAPI.getProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, refresh_token, user } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : (error.response?.data?.detail || 'Login failed');
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(userData);
      // Registration doesn't return tokens immediately - user needs to verify email first
      // For now, just show success message
      console.log('Registration successful:', response.data);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : (error.response?.data?.detail || 'Registration failed');
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};