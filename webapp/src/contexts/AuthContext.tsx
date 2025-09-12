import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/apiService';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  bio?: string;
  preferredName?: string;
  isVerified: boolean;
  credits: number;
  averageRating?: number;
  totalRides?: number;
  role: 'DRIVER' | 'PASSENGER';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  preferredName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app start
    const storedToken = localStorage.getItem('rideclub_token');
    const storedUser = localStorage.getItem('rideclub_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        apiService.setAuthHeader(storedToken);
        
        // Refresh user data in background
        refreshUserData().catch(console.error);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });

      if (response.success) {
        const { token: authToken, user: userData } = response.data;
        
        // Store token and user data
        localStorage.setItem('rideclub_token', authToken);
        localStorage.setItem('rideclub_user', JSON.stringify(userData));
        
        // Update state
        setToken(authToken);
        setUser(userData);
        
        // Set auth header for future requests
        apiService.setAuthHeader(authToken);
        
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await apiService.post('/auth/register', userData);

      if (response.success) {
        const { token: authToken, user: newUser } = response.data;
        
        // Store token and user data
        localStorage.setItem('rideclub_token', authToken);
        localStorage.setItem('rideclub_user', JSON.stringify(newUser));
        
        // Update state
        setToken(authToken);
        setUser(newUser);
        
        // Set auth header for future requests
        apiService.setAuthHeader(authToken);
        
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('rideclub_token');
    localStorage.removeItem('rideclub_user');
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear auth header
    apiService.clearAuthHeader();
    
    // Redirect to login
    window.location.href = '/login';
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await apiService.patch('/auth/profile', userData);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        localStorage.setItem('rideclub_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await apiService.get('/auth/profile');
      
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('rideclub_user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
      // Don't throw error to avoid disrupting app flow
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};