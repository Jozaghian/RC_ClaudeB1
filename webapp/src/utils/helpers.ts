import { format, parseISO, isValid } from 'date-fns';

// Format currency
export const formatCurrency = (amount: number, currency: string = 'CAD'): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return 'Invalid date';
    }
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

// Format date with time
export const formatDateTime = (dateString: string): string => {
  return formatDate(dateString, 'MMM dd, yyyy HH:mm');
};

// Format relative date
export const formatRelativeDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString, 'MMM dd, yyyy');
    }
  } catch (error) {
    console.error('Relative date formatting error:', error);
    return 'Unknown';
  }
};

// Format phone number
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a Canadian number (starts with 1 and has 11 digits)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Check if it's a 10-digit number (Canadian without country code)
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return phoneNumber; // Return original if formatting fails
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate Canadian phone number
export const isValidCanadianPhone = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Must be 10 digits or 11 digits starting with 1
  if (cleaned.length === 10) {
    return true;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return true;
  }
  
  return false;
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Generate avatar initials
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Generate random color for avatar
export const getAvatarColor = (text: string): string => {
  const colors = [
    '#C8102E', '#2C3E50', '#27AE60', '#F39C12', '#E74C3C',
    '#3498DB', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'
  ];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Capitalize first letter
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Format rating
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

// Generate star rating display
export const getStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
};

// Format vehicle info
export const formatVehicle = (make: string, model: string, year: number): string => {
  return `${year} ${make} ${model}`;
};

// Generate ride status color
export const getRideStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'confirmed':
      return '#27AE60'; // success green
    case 'pending':
    case 'requested':
      return '#F39C12'; // warning orange
    case 'cancelled':
    case 'declined':
      return '#E74C3C'; // error red
    case 'completed':
      return '#3498DB'; // info blue
    default:
      return '#7F8C8D'; // secondary gray
  }
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatPhoneNumber,
  isValidEmail,
  isValidCanadianPhone,
  calculateDistance,
  getInitials,
  getAvatarColor,
  truncateText,
  capitalize,
  formatRating,
  getStarRating,
  formatVehicle,
  getRideStatusColor,
  debounce,
  deepClone,
  isEmpty,
  fileToBase64,
  generateId,
};