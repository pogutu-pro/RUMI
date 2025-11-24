import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'landlord' | 'caretaker' | 'tech_support' | 'super_admin';
  is_verified: boolean;
  profile_picture?: string;
  auth_provider?: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (code: string, role: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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

interface JWTPayload {
  user_id: number;
  email: string;
  role: string;
  exp: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
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
    // Check for existing token on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          // Try to refresh token
          refreshToken();
        } else {
          // Fetch user profile
          fetchUserProfile();
        }
      } catch (error) {
        console.error('Token decode error:', error);
        logout();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/v1/accounts/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user || data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        logout();
        return;
      }

      const response = await fetch('/api/v1/accounts/refresh-token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refresh })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        fetchUserProfile();
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/v1/accounts/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Set user
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (code: string, role: string) => {
    try {
      const response = await fetch('/api/v1/accounts/auth/google/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Google login failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Set user
      setUser(data.user);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await fetch('/api/v1/accounts/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      return data; // Returns user_id and verification info
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token');
    
    // Call logout endpoint
    if (refresh) {
      fetch('/api/v1/accounts/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ refresh_token: refresh })
      }).catch(console.error);
    }

    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear user state
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};