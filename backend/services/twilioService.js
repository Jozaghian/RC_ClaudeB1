const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Initialize Twilio client
const initializeTwilio = () => {
  if (!accountSid || !authToken || !fromPhoneNumber) {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
    return null;
  }

  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    return null;
  }
};

/**
 * Send SMS message
 * @param {string} to - Phone number to send to (must include country code)
 * @param {string} body - Message content
 * @returns {Promise<Object>} Twilio message response
 */
const sendSMS = async (to, body) => {
  if (!client) {
    client = initializeTwilio();
  }

  if (!client) {
    throw new Error('Twilio service not available');
  }

  try {
    // Ensure phone number format is correct
    const formattedTo = to.startsWith('+') ? to : `+${to}`;

    const message = await client.messages.create({
      body,
      from: fromPhoneNumber,
      to: formattedTo
    });

    console.log(`SMS sent successfully to ${formattedTo}, SID: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status,
      to: formattedTo
    };

  } catch (error) {
    console.error('Failed to send SMS:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21614) {
      throw new Error('Invalid phone number format');
    } else if (error.code === 21211) {
      throw new Error('Invalid phone number');
    } else if (error.code === 21408) {
      throw new Error('Permission denied for sending to this number');
    } else if (error.code === 21610) {
      throw new Error('Message cannot be sent to landline number');
    }

    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

/**
 * Send verification code SMS
 * @param {string} to - Phone number
 * @param {string} code - Verification code
 * @returns {Promise<Object>} Send result
 */
const sendVerificationCode = async (to, code) => {
  const message = `Your Ride Club verification code is: ${code}. This code expires in 10 minutes. Never share this code with anyone.`;
  return await sendSMS(to, message);
};

/**
 * Send booking confirmation SMS
 * @param {string} to - Phone number
 * @param {Object} bookingDetails - Booking information
 * @returns {Promise<Object>} Send result
 */
const sendBookingConfirmation = async (to, bookingDetails) => {
  const { rideName, date, time, pickup, destination, driverName } = bookingDetails;
  
  const message = `🚗 Ride Club Booking Confirmed!
  
Trip: ${pickup} → ${destination}
Date: ${date}
Time: ${time}
Driver: ${driverName}

Safe travels! For support, contact us at support@rideclub.ca`;

  return await sendSMS(to, message);
};

/**
 * Send ride request notification to drivers
 * @param {string} to - Driver's phone number
 * @param {Object} requestDetails - Request information
 * @returns {Promise<Object>} Send result
 */
const sendRideRequestNotification = async (to, requestDetails) => {
  const { pickup, destination, date, time, passengerCount, maxBudget } = requestDetails;
  
  const message = `🚗 New Ride Request on Ride Club!

${pickup} → ${destination}
Date: ${date} at ${time}
Passengers: ${passengerCount}
Budget: Up to $${maxBudget} CAD

Open the app to place your bid!`;

  return await sendSMS(to, message);
};

/**
 * Send bid acceptance notification
 * @param {string} to - Driver's phone number
 * @param {Object} bidDetails - Bid information
 * @returns {Promise<Object>} Send result
 */
const sendBidAcceptedNotification = async (to, bidDetails) => {
  const { pickup, destination, date, time, passengerName } = bidDetails;
  
  const message = `🎉 Your bid was accepted!

Trip: ${pickup} → ${destination}
Date: ${date} at ${time}
Passenger: ${passengerName}

Check the app for contact details. Safe travels!`;

  return await sendSMS(to, message);
};

/**
 * Send trip reminder SMS
 * @param {string} to - Phone number
 * @param {Object} tripDetails - Trip information
 * @param {number} hoursBeforeDeparture - Hours before departure
 * @returns {Promise<Object>} Send result
 */
const sendTripReminder = async (to, tripDetails, hoursBeforeDeparture = 2) => {
  const { pickup, destination, time, otherPersonName, isDriver } = tripDetails;
  
  const role = isDriver ? 'driver' : 'passenger';
  const otherRole = isDriver ? 'passengers' : 'driver';
  
  const message = `⏰ Ride Club Reminder

Your trip as ${role} leaves in ${hoursBeforeDeparture} hours:

${pickup} → ${destination}
Departure: ${time}
${otherRole}: ${otherPersonName}

Please be ready on time. Safe travels!`;

  return await sendSMS(to, message);
};

/**
 * Send payment confirmation SMS
 * @param {string} to - Phone number
 * @param {Object} paymentDetails - Payment information
 * @returns {Promise<Object>} Send result
 */
const sendPaymentConfirmation = async (to, paymentDetails) => {
  const { amount, packageName, creditsReceived } = paymentDetails;
  
  const message = `💳 Payment Confirmed - Ride Club

Package: ${packageName}
Amount: $${amount} CAD
Credits Added: ${creditsReceived}

You can now post rides! Thank you for choosing Ride Club.`;

  return await sendSMS(to, message);
};

/**
 * Check if SMS service is available
 * @returns {boolean} Is SMS service available
 */
const isServiceAvailable = () => {
  return client !== null || (accountSid && authToken && fromPhoneNumber);
};

/**
 * Get Twilio account status
 * @returns {Promise<Object>} Account status
 */
const getAccountStatus = async () => {
  if (!client) {
    client = initializeTwilio();
  }

  if (!client) {
    return { available: false, error: 'Twilio not configured' };
  }

  try {
    const account = await client.api.accounts(accountSid).fetch();
    
    return {
      available: true,
      status: account.status,
      friendlyName: account.friendlyName,
      dateCreated: account.dateCreated
    };
  } catch (error) {
    console.error('Failed to get Twilio account status:', error);
    return { available: false, error: error.message };
  }
};

module.exports = {
  sendSMS,
  sendVerificationCode,
  sendBookingConfirmation,
  sendRideRequestNotification,
  sendBidAcceptedNotification,
  sendTripReminder,
  sendPaymentConfirmation,
  isServiceAvailable,
  getAccountStatus
};