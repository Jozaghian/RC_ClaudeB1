const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const {
  sendPasswordResetEmail,
  generatePasswordResetToken
} = require('../services/sesEmailService');

const router = express.Router();
const prisma = new PrismaClient();

// Password Reset - Request reset link
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      });
    }

    // Check for recent reset attempts (rate limiting)
    const recentReset = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        passwordResetExpiry: {
          gt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        }
      }
    });

    if (recentReset) {
      return res.status(429).json({
        success: false,
        message: 'A password reset email was recently sent. Please wait a few minutes before requesting another.'
      });
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry
      }
    });

    // Send password reset email via Amazon SES
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.firstName);

      console.log(`Password reset email sent to: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset email sent successfully. Please check your email.'
      });

    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);

      // Clean up the reset token since email failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null
        }
      });

      // Return specific error messages based on error type
      if (emailError.message.includes('MessageRejected')) {
        res.status(400).json({
          success: false,
          message: 'Invalid email address. Please check your email and try again.'
        });
      } else if (emailError.message.includes('SendingQuotaExceeded')) {
        res.status(429).json({
          success: false,
          message: 'Email service temporarily unavailable. Please try again in a few minutes.'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send password reset email. Please try again later.'
        });
      }
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.'
    });
  }
});

// Password Reset - Confirm reset with new password
router.post('/reset-password-confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Additional password validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasNonalphas = /\W/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Check if new password is the same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date()
      }
    });

    console.log(`Password successfully reset for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.'
    });
  }
});

// Verify reset token (for frontend to check if token is valid before showing form)
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        firstName: user.firstName
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

module.exports = router;