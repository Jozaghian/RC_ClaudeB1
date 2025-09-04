import apiService from './apiService';

class AuthService {
  constructor() {
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      apiService.setAuthHeader(`Bearer ${token}`);
    } else {
      apiService.clearAuthHeader();
    }
  }

  clearAuthToken() {
    this.authToken = null;
    apiService.clearAuthHeader();
  }

  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      if (this.authToken) {
        await apiService.post('/auth/logout');
      }
    } catch (error) {
      console.log('Logout API call failed:', error);
      // Don't throw error for logout
    }
  }

  async getProfile() {
    try {
      const response = await apiService.get('/auth/profile');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(updates) {
    try {
      const response = await apiService.put('/auth/profile', updates);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendVerificationCode() {
    try {
      const response = await apiService.post('/auth/send-verification');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyPhone(verificationData) {
    try {
      const response = await apiService.post('/auth/verify-phone', verificationData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshToken() {
    try {
      const response = await apiService.post('/auth/refresh-token');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(email) {
    try {
      const response = await apiService.post('/auth/reset-password', { email });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await apiService.post('/auth/change-password', passwordData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const serverError = error.response.data;
      return new Error(serverError.message || 'Server error occurred');
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      return new Error('An unexpected error occurred');
    }
  }
}

export const authService = new AuthService();
export default authService;