/**
 * Format Canadian phone number to standard format
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number (+1XXXXXXXXXX)
 */
export const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it starts with 1 (North American country code)
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned}`;
  } else if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  return phoneNumber; // Return original if format is unclear
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate Canadian phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} Is valid phone number
 */
export const isValidPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: CAD)
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'CAD') => {
  const currencySymbols = {
    CAD: '$',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'time')
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'short') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false }
  };
  
  return dateObj.toLocaleDateString('en-CA', options[format]);
};

/**
 * Format time to 24-hour format
 * @param {Date|string} time - Time to format
 * @returns {string} Formatted time (HH:MM)
 */
export const formatTime = (time) => {
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  return timeObj.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Calculate time until departure
 * @param {Date|string} departureTime - Departure time
 * @returns {string} Time until departure
 */
export const getTimeUntilDeparture = (departureTime) => {
  const departure = typeof departureTime === 'string' ? new Date(departureTime) : departureTime;
  const now = new Date();
  const diffMs = departure - now;
  
  if (diffMs < 0) {
    return 'Departed';
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

/**
 * Get relative date string (Today, Tomorrow, etc.)
 * @param {Date|string} date - Date to check
 * @returns {string} Relative date string
 */
export const getRelativeDate = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = dateObj.toDateString() === today.toDateString();
  const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();
  
  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';
  
  return formatDate(dateObj, 'short');
};

/**
 * Validate Canadian postal code
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} Is valid postal code
 */
export const isValidPostalCode = (postalCode) => {
  const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
};

/**
 * Generate initials from first and last name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Initials
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if string contains only numbers
 * @param {string} str - String to check
 * @returns {boolean} Is numeric
 */
export const isNumeric = (str) => {
  return !isNaN(str) && !isNaN(parseFloat(str));
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get distance string
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Check if two arrays are equal
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} Are arrays equal
 */
export const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

/**
 * Remove duplicates from array
 * @param {Array} arr - Array with potential duplicates
 * @returns {Array} Array without duplicates
 */
export const removeDuplicates = (arr) => {
  return [...new Set(arr)];
};

/**
 * Sort array of objects by property
 * @param {Array} arr - Array to sort
 * @param {string} property - Property to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
export const sortByProperty = (arr, property, direction = 'asc') => {
  return arr.sort((a, b) => {
    if (direction === 'asc') {
      return a[property] > b[property] ? 1 : -1;
    } else {
      return a[property] < b[property] ? 1 : -1;
    }
  });
};