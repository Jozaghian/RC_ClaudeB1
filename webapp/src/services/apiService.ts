import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api'  // Development - Use localhost  
  : 'https://api.rideclub.ca/api'; // Production

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

interface ModerationError {
  isModerationError: boolean;
  message: string;
  flaggedFields?: string[];
  reasons?: string[];
}

class ApiService {
  private client: AxiosInstance;

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
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response.data;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // Handle specific HTTP status codes
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuthHeader();
          // Trigger logout
          window.location.href = '/login';
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
  setAuthHeader(token: string): void {
    this.client.defaults.headers.common['Authorization'] = token;
  }

  // Clear authorization header
  clearAuthHeader(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // GET request
  async get<T = any>(url: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    return this.client.get(url, { params });
  }

  // POST request
  async post<T = any>(url: string, data: Record<string, any> = {}): Promise<ApiResponse<T>> {
    return this.client.post(url, data);
  }

  // PUT request
  async put<T = any>(url: string, data: Record<string, any> = {}): Promise<ApiResponse<T>> {
    return this.client.put(url, data);
  }

  // PATCH request
  async patch<T = any>(url: string, data: Record<string, any> = {}): Promise<ApiResponse<T>> {
    return this.client.patch(url, data);
  }

  // DELETE request
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.client.delete(url);
  }

  // Upload file
  async uploadFile<T = any>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get base URL
  getBaseURL(): string {
    return API_BASE_URL;
  }

  // Check if API is available
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await this.get('/health');
      return response;
    } catch (error) {
      throw new Error('API service unavailable');
    }
  }

  // Password reset
  async resetPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await this.post('/auth/reset-password', { email });
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to send reset email. Please try again.');
    }
  }

  // Support and Contact Methods
  async createSupportTicket(ticketData: {
    subject: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }): Promise<ApiResponse> {
    try {
      const response = await this.post('/support/tickets', ticketData);
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create support ticket. Please try again.');
    }
  }

  async getUserSupportTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const response = await this.get('/support/tickets', params);
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch support tickets. Please try again.');
    }
  }

  async getSupportTicketById(ticketId: string): Promise<ApiResponse> {
    try {
      const response = await this.get(`/support/tickets/${ticketId}`);
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch support ticket. Please try again.');
    }
  }

  async sendContactForm(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }): Promise<ApiResponse> {
    try {
      const response = await this.post('/support/contact', contactData);
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to send message. Please try again.');
    }
  }

  async getSupportStatus(): Promise<ApiResponse> {
    try {
      const response = await this.get('/support/status');
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get support status. Please try again.');
    }
  }

  // Handle moderation errors
  handleModerationError(error: any): ModerationError {
    if (error.response?.status === 400 && error.response?.data?.details?.flaggedFields) {
      const { flaggedFields, reasons } = error.response.data.details;
      
      // Create user-friendly error message
      const fieldNames = flaggedFields.map((field: string) => {
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