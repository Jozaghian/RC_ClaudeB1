const twilio = require('twilio');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    // Initialize Twilio client (with fallback for missing credentials)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('📱 Twilio SMS service initialized');
    } else {
      console.log('⚠️ Twilio credentials not found. SMS features will be disabled.');
      this.twilioClient = null;
    }
    
    // Initialize email transporter (with fallback for missing credentials)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      console.log('📧 Email service initialized (Gmail)');
    } else {
      console.log('⚠️ Email credentials not found. Email features will be disabled.');
      this.emailTransporter = null;
    }
  }

  // Send SMS notification
  async sendSMS(phoneNumber, message) {
    try {
      if (!this.twilioClient) {
        console.log('📱 SMS simulation (Twilio not configured):', { phoneNumber, message });
        return { success: true, messageId: 'sms_simulated_' + Date.now() };
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      console.log(`SMS sent successfully: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email notification
  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (!this.emailTransporter) {
        console.log('📧 Email simulation (credentials not configured):', { to, subject });
        return { success: true, messageId: 'email_simulated_' + Date.now() };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@rideclub.ca',
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification (Firebase Cloud Messaging)
  async sendPushNotification(deviceToken, title, body, data = {}) {
    try {
      // Note: In production, you would use Firebase Admin SDK
      // For now, this is a placeholder implementation
      console.log(`Push notification sent to ${deviceToken}: ${title} - ${body}`);
      
      // Simulated push notification
      const notification = {
        token: deviceToken,
        notification: {
          title,
          body
        },
        data
      };
      
      // In production: admin.messaging().send(notification)
      return { success: true, notificationId: `push_${Date.now()}` };
    } catch (error) {
      console.error('Push notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Ride booking confirmation
  async notifyRideBooked(driver, passenger, ride) {
    const driverMessage = `New booking! ${passenger.firstName} booked your ride from ${ride.origin} to ${ride.destination} on ${ride.departureDate}. Check your app for details.`;
    const passengerMessage = `Booking confirmed! Your ride with ${driver.firstName} from ${ride.origin} to ${ride.destination} on ${ride.departureDate}. Driver will contact you soon.`;

    // Send notifications to both parties
    await Promise.all([
      this.sendSMS(driver.phoneNumber, driverMessage),
      this.sendSMS(passenger.phoneNumber, passengerMessage),
      this.sendEmail(
        driver.email,
        'New Ride Booking - Ride Club',
        this.generateRideBookedEmailTemplate(driver, passenger, ride, 'driver')
      ),
      this.sendEmail(
        passenger.email,
        'Booking Confirmed - Ride Club',
        this.generateRideBookedEmailTemplate(driver, passenger, ride, 'passenger')
      )
    ]);
  }

  // Ride cancellation notification
  async notifyRideCancelled(driver, passenger, ride, cancelledBy) {
    const message = `Ride cancelled: ${ride.origin} to ${ride.destination} on ${ride.departureDate}. Cancelled by ${cancelledBy}.`;
    
    await Promise.all([
      this.sendSMS(driver.phoneNumber, message),
      this.sendSMS(passenger.phoneNumber, message),
      this.sendEmail(
        driver.email,
        'Ride Cancelled - Ride Club',
        this.generateCancellationEmailTemplate(driver, passenger, ride, cancelledBy)
      ),
      this.sendEmail(
        passenger.email,
        'Ride Cancelled - Ride Club',
        this.generateCancellationEmailTemplate(driver, passenger, ride, cancelledBy)
      )
    ]);
  }

  // New ride request notification
  async notifyNewRideRequest(drivers, request) {
    const message = `New ride request: ${request.origin} to ${request.destination} on ${request.departureDate}. Budget: $${request.budgetPerSeat}/seat. Bid now!`;
    
    // Send to all nearby drivers
    const notifications = drivers.map(driver => 
      Promise.all([
        this.sendSMS(driver.phoneNumber, message),
        this.sendPushNotification(
          driver.deviceToken,
          'New Ride Request',
          message,
          { requestId: request.id, type: 'ride_request' }
        )
      ])
    );
    
    await Promise.all(notifications);
  }

  // New bid notification
  async notifyNewBid(passenger, driver, bid, request) {
    const message = `New bid received! ${driver.firstName} offered $${bid.priceOffer}/seat for your ride from ${request.origin} to ${request.destination}.`;
    
    await Promise.all([
      this.sendSMS(passenger.phoneNumber, message),
      this.sendPushNotification(
        passenger.deviceToken,
        'New Bid Received',
        message,
        { bidId: bid.id, requestId: request.id, type: 'new_bid' }
      ),
      this.sendEmail(
        passenger.email,
        'New Bid for Your Ride Request - Ride Club',
        this.generateNewBidEmailTemplate(passenger, driver, bid, request)
      )
    ]);
  }

  // Payment confirmation
  async notifyPaymentProcessed(user, amount, description) {
    const message = `Payment processed: $${amount} for ${description}. Thank you for using Ride Club!`;
    
    await Promise.all([
      this.sendSMS(user.phoneNumber, message),
      this.sendEmail(
        user.email,
        'Payment Confirmation - Ride Club',
        this.generatePaymentEmailTemplate(user, amount, description)
      )
    ]);
  }

  // Welcome notification for new users
  async sendWelcomeNotification(user) {
    const message = `Welcome to Ride Club, ${user.firstName}! Your account is ready. Start sharing rides across Canada. Safe travels!`;
    
    await Promise.all([
      this.sendSMS(user.phoneNumber, message),
      this.sendEmail(
        user.email,
        'Welcome to Ride Club - Canada\'s Ridesharing Platform',
        this.generateWelcomeEmailTemplate(user)
      )
    ]);
  }

  // Email Templates
  generateRideBookedEmailTemplate(driver, passenger, ride, userType) {
    const isDriver = userType === 'driver';
    const otherUser = isDriver ? passenger : driver;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C8102E 0%, #A50E1F 100%); color: white; padding: 20px; text-align: center;">
          <h1>🚗 Ride Club</h1>
          <h2>${isDriver ? 'New Booking Received!' : 'Booking Confirmed!'}</h2>
        </div>
        
        <div style="padding: 20px;">
          <h3>Ride Details:</h3>
          <p><strong>Route:</strong> ${ride.origin} → ${ride.destination}</p>
          <p><strong>Date:</strong> ${ride.departureDate}</p>
          <p><strong>Time:</strong> ${ride.departureTime}</p>
          <p><strong>${isDriver ? 'Passenger' : 'Driver'}:</strong> ${otherUser.firstName} ${otherUser.lastName}</p>
          <p><strong>Phone:</strong> ${otherUser.phoneNumber}</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Next Steps:</strong></p>
            <p style="margin: 5px 0;">
              ${isDriver 
                ? 'Contact your passenger to confirm pickup details and coordinate the meeting point.'
                : 'Your driver will contact you soon to confirm pickup details. Keep your phone handy!'
              }
            </p>
          </div>
          
          <p>Safe travels!</p>
          <p>The Ride Club Team</p>
        </div>
      </div>
    `;
  }

  generateCancellationEmailTemplate(driver, passenger, ride, cancelledBy) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
          <h1>🚗 Ride Club</h1>
          <h2>Ride Cancelled</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>We're sorry to inform you that the following ride has been cancelled:</p>
          
          <h3>Ride Details:</h3>
          <p><strong>Route:</strong> ${ride.origin} → ${ride.destination}</p>
          <p><strong>Date:</strong> ${ride.departureDate}</p>
          <p><strong>Time:</strong> ${ride.departureTime}</p>
          <p><strong>Cancelled by:</strong> ${cancelledBy}</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>What's Next:</strong></p>
            <p style="margin: 5px 0;">You can search for alternative rides in the Ride Club app, or post a new ride request.</p>
          </div>
          
          <p>Thank you for using Ride Club.</p>
          <p>The Ride Club Team</p>
        </div>
      </div>
    `;
  }

  generateNewBidEmailTemplate(passenger, driver, bid, request) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C8102E 0%, #A50E1F 100%); color: white; padding: 20px; text-align: center;">
          <h1>🚗 Ride Club</h1>
          <h2>New Bid Received!</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Great news! You've received a new bid for your ride request:</p>
          
          <h3>Request Details:</h3>
          <p><strong>Route:</strong> ${request.origin} → ${request.destination}</p>
          <p><strong>Date:</strong> ${request.departureDate}</p>
          <p><strong>Seats Needed:</strong> ${request.seatsNeeded}</p>
          
          <h3>Bid Details:</h3>
          <p><strong>Driver:</strong> ${driver.firstName} ${driver.lastName}</p>
          <p><strong>Price Offered:</strong> $${bid.priceOffer} per seat</p>
          <p><strong>Driver Rating:</strong> ⭐ ${driver.rating || 'New driver'}</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Next Steps:</strong></p>
            <p style="margin: 5px 0;">Open the Ride Club app to review this bid and accept if it meets your needs.</p>
          </div>
          
          <p>Happy travels!</p>
          <p>The Ride Club Team</p>
        </div>
      </div>
    `;
  }

  generatePaymentEmailTemplate(user, amount, description) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
          <h1>🚗 Ride Club</h1>
          <h2>Payment Confirmed</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi ${user.firstName},</p>
          <p>Your payment has been successfully processed:</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Thank you for using Ride Club!</p>
          <p>The Ride Club Team</p>
        </div>
      </div>
    `;
  }

  generateWelcomeEmailTemplate(user) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C8102E 0%, #A50E1F 100%); color: white; padding: 20px; text-align: center;">
          <h1>🚗 Welcome to Ride Club!</h1>
          <h2>Canada's Premier Ridesharing Platform</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi ${user.firstName},</p>
          <p>Welcome to the Ride Club community! Your account is now active and ready to use.</p>
          
          <h3>Getting Started:</h3>
          <ul>
            <li><strong>As a Passenger:</strong> Search for rides or post ride requests</li>
            <li><strong>As a Driver:</strong> Purchase credits and start posting rides</li>
            <li><strong>Safety First:</strong> Complete your profile verification for the best experience</li>
          </ul>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Need Help?</strong></p>
            <p style="margin: 5px 0;">Contact us at support@rideclub.ca or call 1-800-RIDE-CLUB</p>
          </div>
          
          <p>Safe travels across Canada!</p>
          <p>The Ride Club Team 🇨🇦</p>
        </div>
      </div>
    `;
  }
}

module.exports = new NotificationService();