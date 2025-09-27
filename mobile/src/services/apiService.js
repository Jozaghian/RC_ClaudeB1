import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'https://rideclubnet.com/api'; // Production

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // 15 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response.data;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // Handle specific HTTP status codes
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuthHeader();
          // You might want to trigger logout here
        } else if (error.response?.status === 429) {
          // Rate limit exceeded
          console.warn('Rate limit exceeded');
        } else if (error.response?.status >= 500) {
          // Server error
          console.error('Server error occurred');
        } else if (error.response?.status === 400 && error.response?.data?.details?.flaggedFields) {
          // Content moderation error
          console.warn('Content blocked by moderation:', error.response.data.details);
        }

        return Promise.reject(error);
      }
    );
  }

  // Set authorization header
  setAuthHeader(token) {
    this.client.defaults.headers.common['Authorization'] = token;
  }

  // Clear authorization header
  clearAuthHeader() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // GET request
  async get(url, params = {}) {
    return this.client.get(url, { params });
  }

  // POST request
  async post(url, data = {}) {
    return this.client.post(url, data);
  }

  // PUT request
  async put(url, data = {}) {
    return this.client.put(url, data);
  }

  // PATCH request
  async patch(url, data = {}) {
    return this.client.patch(url, data);
  }

  // DELETE request
  async delete(url) {
    return this.client.delete(url);
  }

  // Upload file
  async uploadFile(url, formData) {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get base URL
  getBaseURL() {
    return API_BASE_URL;
  }

  // Check if API is available
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response;
    } catch (error) {
      throw new Error('API service unavailable');
    }
  }

  // Password reset
  async resetPassword(email) {
    try {
      const response = await this.post('/auth/reset-password', { email });
      return response;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to send reset email. Please try again.');
    }
  }

  // Support and Contact Methods
  async createSupportTicket(ticketData) {
    try {
      const response = await this.post('/support/tickets', ticketData);
      return response;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create support ticket. Please try again.');
    }
  }

  async getUserSupportTickets(params = {}) {
    try {
      const response = await this.get('/support/tickets', params);
      return response;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch support tickets. Please try again.');
    }
  }

  async getSupportTicketById(ticketId) {
    try {
      const response = await this.get(`/support/tickets/${ticketId}`);
      return response;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch support ticket. Please try again.');
    }
  }

  async sendContactForm(contactData) {
    try {
      const response = await this.post('/support/contact', contactData);
      return response;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to send message. Please try again.');
    }
  }

  async getSupportStatus() {
    try {
      const response = await this.get('/support/status');
      return response;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get support status. Please try again.');
    }
  }

  // Handle moderation errors
  handleModerationError(error) {
    if (error.response?.status === 400 && error.response?.data?.details?.flaggedFields) {
      const { flaggedFields, reasons } = error.response.data.details;
      
      // Create user-friendly error message
      const fieldNames = flaggedFields.map(field => {
        switch (field) {
          case 'pickupDetails': return 'pickup location details';
          case 'dropoffDetails': return 'drop-off location details';
          case 'notes': return 'additional notes';
          case 'bio': return 'bio';
          case 'preferredName': return 'preferred name';
          case 'originDetails': return 'pickup details';
          case 'destinationDetails': return 'drop-off details';
          case 'specialRequirements': return 'special requirements';
          case 'description': return 'description';
          default: return field;
        }
      });

      return {
        isModerationError: true,
        message: `Your ${fieldNames.join(', ')} contains inappropriate content and cannot be posted. Please revise and try again.`,
        flaggedFields,
        reasons
      };
    }
    
    return {
      isModerationError: false,
      message: error.response?.data?.message || error.message || 'An error occurred'
    };
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;