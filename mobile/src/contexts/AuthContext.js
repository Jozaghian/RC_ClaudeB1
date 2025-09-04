import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check if user is authenticated on app start
  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking auth state...');
      
      // Check for stored token and user data
      const storedToken = await SecureStore.getItemAsync('ride_club_token');
      const storedUserData = await SecureStore.getItemAsync('ride_club_user');
      
      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          console.log('✅ Found stored auth data for user:', userData.email);
          
          // Set auth data
          setToken(storedToken);
          setUser(userData);
          authService.setAuthToken(storedToken);
          
          console.log('✅ Auth state restored successfully');
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          // Clear invalid stored data
          await SecureStore.deleteItemAsync('ride_club_token');
          await SecureStore.deleteItemAsync('ride_club_user');
          setUser(null);
          setToken(null);
        }
      } else {
        console.log('❌ No stored auth data found');
        setUser(null);
        setToken(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Check auth state error:', error);
      setLoading(false);
      setUser(null);
      setToken(null);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('🔑 Attempting login with:', credentials.emailOrPhone);
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        
        console.log('✅ Login successful for user:', userData.email);
        
        // Store in secure storage
        await SecureStore.setItemAsync('ride_club_token', authToken);
        await SecureStore.setItemAsync('ride_club_user', JSON.stringify(userData));
        
        // Set in state and service
        setToken(authToken);
        setUser(userData);
        authService.setAuthToken(authToken);
        
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success) {
        const { user: newUser, token: authToken } = response.data;
        
        // Store in secure storage
        await SecureStore.setItemAsync('ride_club_token', authToken);
        await SecureStore.setItemAsync('ride_club_user', JSON.stringify(newUser));
        
        // Set in state and service
        setToken(authToken);
        setUser(newUser);
        authService.setAuthToken(authToken);
        
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear secure storage
      await SecureStore.deleteItemAsync('ride_club_token');
      await SecureStore.deleteItemAsync('ride_club_user');
      
      // Clear state and service
      setToken(null);
      setUser(null);
      authService.clearAuthToken();
      
      // Optionally call logout API
      try {
        await authService.logout();
      } catch (error) {
        console.log('Logout API call failed:', error);
      }
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verify phone number
  const verifyPhone = async (verificationData) => {
    try {
      setLoading(true);
      const response = await authService.verifyPhone(verificationData);
      
      if (response.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        
        // Update stored user data
        await SecureStore.setItemAsync('ride_club_user', JSON.stringify(updatedUser));
        
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send verification code
  const sendVerificationCode = async () => {
    try {
      const response = await authService.sendVerificationCode();
      return response;
    } catch (error) {
      console.error('Send verification code error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const response = await authService.updateProfile(updates);
      
      if (response.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        
        // Update stored user data
        await SecureStore.setItemAsync('ride_club_user', JSON.stringify(updatedUser));
        
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile from server
  const refreshProfile = async () => {
    try {
      const response = await authService.getProfile();
      
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);
        
        // Update stored user data
        await SecureStore.setItemAsync('ride_club_user', JSON.stringify(userData));
        
        return userData;
      }
    } catch (error) {
      console.error('Refresh profile error:', error);
      // Don't throw error, just return current user
      return user;
    }
  };

  // Check if user needs verification
  const needsPhoneVerification = () => {
    return user && !user.phoneVerified;
  };

  const needsIdentityVerification = () => {
    return user && user.role === 'DRIVER' && !user.identityVerified;
  };

  // Get user role
  const isDriver = () => {
    return user && user.role === 'DRIVER';
  };

  const isPassenger = () => {
    return user && user.role === 'PASSENGER';
  };

  const isAdmin = () => {
    return user && user.role === 'ADMIN';
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    verifyPhone,
    sendVerificationCode,
    updateProfile,
    refreshProfile,
    refreshUser: refreshProfile, // Alias for refreshProfile
    checkAuthState,
    needsPhoneVerification,
    needsIdentityVerification,
    isDriver,
    isPassenger,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};