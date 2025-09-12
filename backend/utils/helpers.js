const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate 6-digit verification code
 * @returns {string} 6-digit code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate unique reference ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique reference ID
 */
const generateReferenceId = (prefix = 'RC') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point  
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Format Canadian phone number
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
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
 * Validate Canadian postal code
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} Is valid
 */
const isValidCanadianPostalCode = (postalCode) => {
  const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
};

/**
 * Generate secure random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateSecureRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Sanitize file name
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
const sanitizeFileName = (fileName) => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Calculate credit package price based on base rate
 * @param {number} baseRate - Base rate per credit
 * @param {number} creditCount - Number of credits
 * @param {number} discountPercentage - Discount percentage (0-100)
 * @returns {number} Final price
 */
const calculatePackagePrice = (baseRate, creditCount, discountPercentage = 0) => {
  const basePrice = baseRate * creditCount;
  const discount = (basePrice * discountPercentage) / 100;
  return Math.round((basePrice - discount) * 100) / 100; // Round to 2 decimal places
};

/**
 * Check if user can post ride (has enough credits)
 * @param {Array} driverCredits - Array of driver credit records
 * @returns {boolean} Can post ride
 */
const canPostRide = (driverCredits) => {
  const totalCredits = driverCredits.reduce((sum, credit) => {
    return sum + credit.creditsRemaining;
  }, 0);
  
  return totalCredits > 0;
};

/**
 * Deduct credits from driver account
 * @param {Array} driverCredits - Array of driver credit records (sorted by oldest first)
 * @param {number} creditsToDeduct - Number of credits to deduct
 * @returns {Array} Updated credit records
 */
const deductCredits = (driverCredits, creditsToDeduct = 1) => {
  let remaining = creditsToDeduct;
  const updatedCredits = [];
  
  for (const credit of driverCredits) {
    if (remaining <= 0) {
      updatedCredits.push(credit);
      continue;
    }
    
    if (credit.creditsRemaining > 0) {
      const deductFromThis = Math.min(credit.creditsRemaining, remaining);
      updatedCredits.push({
        ...credit,
        creditsRemaining: credit.creditsRemaining - deductFromThis
      });
      remaining -= deductFromThis;
    } else {
      updatedCredits.push(credit);
    }
  }
  
  return updatedCredits;
};

/**
 * Check if two time ranges overlap
 * @param {Date} start1 - Start of first range
 * @param {Date} end1 - End of first range
 * @param {Date} start2 - Start of second range
 * @param {Date} end2 - End of second range
 * @returns {boolean} Do ranges overlap
 */
const timeRangesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: CAD)
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'CAD') => {
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
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Get time zone for Canadian cities
 * @param {string} province - Province code
 * @returns {string} Time zone
 */
const getCanadianTimeZone = (province) => {
  const timeZones = {
    'BC': 'America/Vancouver',
    'AB': 'America/Edmonton',
    'SK': 'America/Regina',
    'MB': 'America/Winnipeg',
    'ON': 'America/Toronto',
    'QC': 'America/Montreal',
    'NB': 'America/Moncton',
    'NS': 'America/Halifax',
    'PE': 'America/Halifax',
    'NL': 'America/St_Johns',
    'YT': 'America/Whitehorse',
    'NT': 'America/Yellowknife',
    'NU': 'America/Iqaluit'
  };
  
  return timeZones[province] || 'America/Toronto';
};

/**
 * Paginate results
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Skip and take values for database query
 */
const paginate = (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

/**
 * Create pagination meta information
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination meta
 */
const createPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev
  };
};

module.exports = {
  generateToken,
  generateVerificationCode,
  generateReferenceId,
  calculateDistance,
  formatPhoneNumber,
  isValidCanadianPostalCode,
  generateSecureRandomString,
  sanitizeFileName,
  calculatePackagePrice,
  canPostRide,
  deductCredits,
  timeRangesOverlap,
  formatCurrency,
  isValidEmail,
  getCanadianTimeZone,
  paginate,
  createPaginationMeta
};