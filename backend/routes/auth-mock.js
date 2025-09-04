const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Mock user storage (in-memory for development)
const mockUsers = new Map();
let userIdCounter = 1;

// Register new user (MOCK) - simplified validation for development
router.post('/register', async (req, res) => {
  try {
    const { email, phoneNumber, password, firstName, lastName, dateOfBirth, role } = req.body;

    // Very basic validation for mock - just require email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = Array.from(mockUsers.values()).find(user => 
      user.email === email || user.phoneNumber === phoneNumber
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create mock user
    const userId = `user_${userIdCounter++}`;
    const mockUser = {
      id: userId,
      email,
      phoneNumber: phoneNumber || '123-456-7890',
      password: hashedPassword,
      firstName: firstName || 'Test',
      lastName: lastName || 'User',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      role: role || 'PASSENGER',
      phoneVerified: false,
      identityVerified: false,
      profileCompleted: false,
      status: 'PENDING_VERIFICATION',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockUsers.set(userId, mockUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
      process.env.JWT_SECRET || 'default-secret-for-development',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = mockUser;

    console.log(`✅ Mock user registered: ${email} as ${role}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token
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

// Login user (MOCK) - accepts ANY credentials for development  
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Mock login attempt: ${email}`);

    // Accept ANY email/password for mock authentication
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Always create/return a successful user
    const userId = `user_${Date.now()}`;
    const user = {
      id: userId,
      email,
      phoneNumber: '123-456-7890',
      firstName: 'Demo',
      lastName: 'User',
      role: 'PASSENGER',
      phoneVerified: true,
      identityVerified: false,
      profileCompleted: true,
      status: 'ACTIVE',
      credits: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret-for-development',
      { expiresIn: '7d' }
    );

    console.log(`✅ Mock login successful: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Send verification code (MOCK)
router.post('/send-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Find user by phone number
    const user = Array.from(mockUsers.values()).find(user => 
      user.phoneNumber === phoneNumber
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mock verification code (always 123456 for development)
    console.log(`📱 Mock verification code for ${phoneNumber}: 123456`);

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

// Verify phone (MOCK)
router.post('/verify-phone', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    // Find user by phone number
    const user = Array.from(mockUsers.values()).find(user => 
      user.phoneNumber === phoneNumber
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mock verification (accept any 6-digit code or 123456)
    if (code.length !== 6 || (code !== '123456' && !/^\d{6}$/.test(code))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Update user
    user.phoneVerified = true;
    user.status = 'ACTIVE';
    user.updatedAt = new Date();
    mockUsers.set(user.id, user);

    // Return updated user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    console.log(`✅ Phone verified for user: ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Phone verification failed'
    });
  }
});


module.exports = router;