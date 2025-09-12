const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendSMS } = require('../services/twilioService');
const { generateVerificationCode, generateToken } = require('../utils/helpers');
const aiModerationService = require('../services/aiModerationService');

const router = express.Router();
const prisma = new PrismaClient();

// Register new user
router.post('/register', validate(schemas.userRegistration), async (req, res) => {
  try {
    const { email, phoneNumber, password, firstName, lastName, dateOfBirth, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phoneNumber,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        role,
        verificationCode,
        verificationExpiry,
        status: 'PENDING_VERIFICATION'
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneVerified: true,
        createdAt: true
      }
    });

    // Send SMS verification code
    try {
      await sendSMS(phoneNumber, `Your Ride Club verification code is: ${verificationCode}. This code expires in 10 minutes.`);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Continue with registration even if SMS fails
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone number.',
      data: {
        user,
        token,
        needsPhoneVerification: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// User login
router.post('/login', validate(schemas.userLogin), async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact support.'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = generateToken({ userId: user.id, role: user.role });

    // Prepare user data (exclude sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      identityVerified: user.identityVerified,
      driverRating: user.driverRating,
      passengerRating: user.passengerRating,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        needsPhoneVerification: !user.phoneVerified,
        needsIdentityVerification: user.role === 'DRIVER' && !user.identityVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Send phone verification code
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already verified'
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new code
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationCode,
        verificationExpiry
      }
    });

    // Send SMS
    try {
      await sendSMS(req.user.phoneNumber, `Your Ride Club verification code is: ${verificationCode}. This code expires in 10 minutes.`);
      
      res.json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

// Verify phone number
router.post('/verify-phone', authenticateToken, validate(schemas.phoneVerification), async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already verified'
      });
    }

    if (!user.verificationCode || !user.verificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.'
      });
    }

    if (new Date() > user.verificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired. Please request a new one.'
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        status: 'ACTIVE',
        verificationCode: null,
        verificationExpiry: null
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneVerified: true,
        emailVerified: true,
        identityVerified: true
      }
    });

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Phone verification failed'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        role: true,
        status: true,
        profilePicture: true,
        bio: true,
        languages: true,
        phoneVerified: true,
        emailVerified: true,
        identityVerified: true,
        driverRating: true,
        passengerRating: true,
        totalTripsAsDriver: true,
        totalTripsAsPassenger: true,
        preferences: true,
        notificationSettings: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Refresh token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const token = generateToken({ userId: req.user.id, role: req.user.role });

    res.json({
      success: true,
      data: { token }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      firstName, 
      lastName, 
      bio, 
      languages, 
      profilePicture,
      notificationSettings,
      preferences 
    } = req.body;

    // Moderate profile content before updating
    const moderationResult = await aiModerationService.moderateProfileContent({
      bio,
      preferredName: firstName // Check if user is trying to use inappropriate preferred name
    });

    if (!moderationResult.approved) {
      return res.status(400).json({
        success: false,
        message: 'Profile contains inappropriate content and cannot be updated',
        details: {
          flaggedFields: moderationResult.flaggedFields,
          reasons: moderationResult.results
        }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        bio,
        languages,
        profilePicture,
        notificationSettings,
        preferences
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        role: true,
        status: true,
        profilePicture: true,
        bio: true,
        languages: true,
        phoneVerified: true,
        emailVerified: true,
        identityVerified: true,
        driverRating: true,
        passengerRating: true,
        totalTripsAsDriver: true,
        totalTripsAsPassenger: true,
        preferences: true,
        notificationSettings: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Get driver statistics
router.get('/driver-stats', 
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const driverId = req.user.id;

      const stats = await Promise.all([
        // Total rides as driver
        prisma.ride.count({
          where: { driverId, status: 'COMPLETED' }
        }),
        
        // Total passengers transported
        prisma.booking.aggregate({
          where: {
            ride: { driverId, status: 'COMPLETED' },
            status: 'COMPLETED'
          },
          _sum: { seatsBooked: true }
        }),
        
        // Total revenue
        prisma.booking.aggregate({
          where: {
            ride: { driverId, status: 'COMPLETED' },
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true }
        }),
        
        // Current active rides
        prisma.ride.count({
          where: {
            driverId,
            status: 'ACTIVE',
            departureDateTime: { gte: new Date() }
          }
        }),
        
        // Current credit balance
        prisma.driverCredit.aggregate({
          where: {
            driverId,
            creditsRemaining: { gt: 0 }
          },
          _sum: { creditsRemaining: true }
        })
      ]);

      const [totalRides, passengersData, revenueData, activeRides, creditsData] = stats;

      res.json({
        success: true,
        data: {
          totalRides,
          totalPassengers: passengersData._sum.seatsBooked || 0,
          totalRevenue: revenueData._sum.totalAmount || 0,
          activeRides,
          currentCredits: creditsData._sum.creditsRemaining || 0
        }
      });

    } catch (error) {
      console.error('Get driver stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver statistics'
      });
    }
  }
);

// Get passenger statistics
router.get('/passenger-stats',
  authenticateToken,
  requireRole('PASSENGER'),
  async (req, res) => {
    try {
      const passengerId = req.user.id;

      const stats = await Promise.all([
        // Total bookings as passenger
        prisma.booking.count({
          where: { passengerId, status: 'COMPLETED' }
        }),
        
        // Total amount spent
        prisma.booking.aggregate({
          where: { passengerId, status: 'COMPLETED' },
          _sum: { totalAmount: true }
        }),
        
        // Active bookings
        prisma.booking.count({
          where: {
            passengerId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            ride: {
              departureDateTime: { gte: new Date() }
            }
          }
        }),
        
        // Active requests
        prisma.rideRequest.count({
          where: {
            passengerId,
            status: 'OPEN',
            expiresAt: { gte: new Date() }
          }
        })
      ]);

      const [totalBookings, spentData, activeBookings, activeRequests] = stats;

      res.json({
        success: true,
        data: {
          totalBookings,
          totalSpent: spentData._sum.totalAmount || 0,
          activeBookings,
          activeRequests
        }
      });

    } catch (error) {
      console.error('Get passenger stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch passenger statistics'
      });
    }
  }
);

// Change password
router.put('/change-password', authenticateToken, validate(schemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current
    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Delete account (GDPR/PIPEDA compliant)
router.delete('/delete-account', authenticateToken, validate(schemas.deleteAccount), async (req, res) => {
  try {
    const { password, confirmDeletion } = req.body;
    const userId = req.user.id;

    // Validate confirmation
    if (confirmDeletion !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        success: false,
        message: 'Account deletion not confirmed'
      });
    }

    // Get user with password for verification
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Check for active bookings or rides that would be affected
    const activeBookings = await prisma.booking.count({
      where: {
        passengerId: userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ride: {
          departureDateTime: { gte: new Date() }
        }
      }
    });

    const activeRides = await prisma.ride.count({
      where: {
        driverId: userId,
        status: 'ACTIVE',
        departureDateTime: { gte: new Date() }
      }
    });

    if (activeBookings > 0 || activeRides > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active bookings or rides. Please cancel them first.',
        details: {
          activeBookings,
          activeRides
        }
      });
    }

    // Begin transaction to delete all user data (GDPR/PIPEDA compliance)
    await prisma.$transaction(async (tx) => {
      // Delete in order of dependencies (foreign key constraints)
      
      // 1. Delete credit transactions
      await tx.creditTransaction.deleteMany({
        where: {
          credit: {
            driverId: userId
          }
        }
      });

      // 2. Delete driver credits and payments
      await tx.driverCredit.deleteMany({
        where: { driverId: userId }
      });

      // 3. Delete payments for bookings
      await tx.payment.deleteMany({
        where: {
          booking: {
            passengerId: userId
          }
        }
      });

      // 4. Delete bookings as passenger
      await tx.booking.deleteMany({
        where: { passengerId: userId }
      });

      // 5. Delete bids as driver
      await tx.bid.deleteMany({
        where: { driverId: userId }
      });

      // 6. Delete ride requests as passenger
      await tx.rideRequest.deleteMany({
        where: { passengerId: userId }
      });

      // 7. Delete rides as driver
      await tx.ride.deleteMany({
        where: { driverId: userId }
      });

      // 8. Delete trip schedules
      await tx.tripSchedule.deleteMany({
        where: { driverId: userId }
      });

      // 9. Delete vehicles
      await tx.vehicle.deleteMany({
        where: { userId }
      });

      // 10. Delete ratings (given and received)
      await tx.rating.deleteMany({
        where: {
          OR: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        }
      });

      // 11. Delete messages (sent and received)
      await tx.message.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      });

      // 12. Delete notifications
      await tx.notification.deleteMany({
        where: { userId }
      });

      // 13. Delete support tickets
      await tx.supportTicket.deleteMany({
        where: { userId }
      });

      // 14. Finally, delete the user account
      await tx.user.delete({
        where: { id: userId }
      });
    });

    // Log account deletion for audit purposes
    console.log(`Account deleted for user ID: ${userId}, email: ${user.email} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

// Logout (optional - mainly for clearing client-side data)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;