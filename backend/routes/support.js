const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const notificationService = require('../services/notificationService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/support/tickets
 * @desc    Create a new support ticket
 * @access  Public (can be used without authentication for contact forms)
 */
router.post('/tickets', validate(schemas.supportTicketCreation), async (req, res) => {
  try {
    const { subject, message, priority = 'MEDIUM' } = req.body;
    const userId = req.user?.id || null; // Optional authentication
    
    // Get user info if authenticated (for better support experience)
    let userInfo = null;
    if (userId) {
      userInfo = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true
        }
      });
    }

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
        priority,
        status: 'OPEN'
      }
    });

    console.log(`🎫 Support ticket created: ${ticket.id} (Priority: ${priority})`);

    // Send confirmation email to user (if authenticated)
    if (userInfo && userInfo.email) {
      try {
        await notificationService.sendEmail(
          userInfo.email,
          'Support Request Received - Ride Club',
          generateTicketConfirmationEmail(userInfo, ticket)
        );
        console.log(`📧 Confirmation email sent for ticket ${ticket.id}`);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send notification to support team
    try {
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@rideclub.ca';
      await notificationService.sendEmail(
        supportEmail,
        `New Support Ticket: ${subject} (Priority: ${priority})`,
        generateNewTicketNotification(userInfo, ticket)
      );
      console.log(`📧 Support team notified for ticket ${ticket.id}`);
    } catch (emailError) {
      console.error('Failed to notify support team:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketId: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
});

/**
 * @route   GET /api/support/tickets
 * @desc    Get user's support tickets
 * @access  Private
 */
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          subject: true,
          message: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true
        }
      }),
      prisma.supportTicket.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

/**
 * @route   GET /api/support/tickets/:id
 * @desc    Get specific support ticket details
 * @access  Private
 */
router.get('/tickets/:id', authenticateToken, validate(schemas.uuidParam), async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId // Ensure user can only access their own tickets
      },
      select: {
        id: true,
        subject: true,
        message: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        assignedAdminId: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });

  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support ticket'
    });
  }
});

/**
 * @route   POST /api/support/contact
 * @desc    Send contact form email (public endpoint)
 * @access  Public
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    console.log(`📧 Contact form submission from ${email}: ${subject}`);

    // Send email to support team
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@rideclub.ca';
    await notificationService.sendEmail(
      supportEmail,
      `Contact Form: ${subject}`,
      generateContactFormEmail({ name, email, subject, message, phone })
    );

    // Send confirmation to user
    await notificationService.sendEmail(
      email,
      'Thank you for contacting Ride Club',
      generateContactConfirmationEmail({ name, subject })
    );

    console.log(`📧 Contact form processed successfully for ${email}`);

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!'
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

/**
 * @route   GET /api/support/status
 * @desc    Get support system status and info
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    // Get basic support statistics
    const totalTickets = await prisma.supportTicket.count();
    const openTickets = await prisma.supportTicket.count({
      where: { status: 'OPEN' }
    });
    const resolvedToday = await prisma.supportTicket.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    res.json({
      success: true,
      data: {
        supportHours: 'Monday - Friday: 9 AM - 6 PM EST',
        emergencySupport: 'Available for urgent safety issues',
        responseTime: 'Within 24 hours for most inquiries',
        contacts: {
          general: 'support@rideclub.ca',
          safety: 'safety@rideclub.ca'
        },
        statistics: {
          totalTickets,
          openTickets,
          resolvedToday
        }
      }
    });

  } catch (error) {
    console.error('Error fetching support status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support status'
    });
  }
});

// Email Templates
function generateTicketConfirmationEmail(user, ticket) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 20px; text-align: center;">
        <h1>🎫 Ride Club Support</h1>
        <h2>Your Support Request Received</h2>
      </div>
      
      <div style="padding: 20px;">
        <p>Hi ${user.firstName},</p>
        <p>Thank you for contacting Ride Club support. We've received your support request and our team will review it shortly.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2E7D32;">Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p><strong>Created:</strong> ${ticket.createdAt.toLocaleString()}</p>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">What happens next?</h4>
          <p style="margin: 0;">Our support team will review your request and respond within 24 hours. For urgent issues, please call our emergency line or email safety@rideclub.ca.</p>
        </div>
        
        <p>You can track your ticket status in the Ride Club app under Support > My Tickets.</p>
        
        <p>Best regards,<br/>The Ride Club Support Team</p>
      </div>
    </div>
  `;
}

function generateNewTicketNotification(user, ticket) {
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Anonymous User';
  const userEmail = user?.email || 'No email provided';
  const userPhone = user?.phoneNumber || 'No phone provided';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
        <h1>🚨 New Support Ticket</h1>
        <h2>Priority: ${ticket.priority}</h2>
      </div>
      
      <div style="padding: 20px;">
        <h3>Ticket Information:</h3>
        <p><strong>ID:</strong> ${ticket.id}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Created:</strong> ${ticket.createdAt.toLocaleString()}</p>
        
        <h3>User Information:</h3>
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${userPhone}</p>
        
        <h3>Message:</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap; margin: 0;">${ticket.message}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: ${ticket.priority === 'URGENT' ? '#ffebee' : '#f8f9fa'}; border-radius: 8px;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please review and assign this ticket in the admin panel.</p>
        </div>
      </div>
    </div>
  `;
}

function generateContactFormEmail({ name, email, subject, message, phone }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 20px; text-align: center;">
        <h1>📧 Contact Form Submission</h1>
        <h2>Ride Club Website</h2>
      </div>
      
      <div style="padding: 20px;">
        <h3>Contact Details:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        
        <h3>Message:</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap; margin: 0;">${message}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please respond to this inquiry at ${email}</p>
        </div>
      </div>
    </div>
  `;
}

function generateContactConfirmationEmail({ name, subject }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 20px; text-align: center;">
        <h1>🚗 Thank You for Contacting Ride Club</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Hi ${name},</p>
        <p>Thank you for reaching out to us! We've received your message about "${subject}" and our team will review it shortly.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">What happens next?</h4>
          <p style="margin: 0;">Our support team will respond to your inquiry within 24 hours during business hours (Monday-Friday, 9 AM - 6 PM EST). For urgent matters, please call our support line.</p>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">Need immediate help?</h4>
          <p style="margin: 0;">
            • General support: support@rideclub.ca<br/>
            • Safety concerns: safety@rideclub.ca<br/>
            • Check our FAQ: <a href="https://rideclub.ca/help">rideclub.ca/help</a>
          </p>
        </div>
        
        <p>We appreciate your interest in Ride Club - Canada's premier ridesharing platform!</p>
        
        <p>Best regards,<br/>The Ride Club Team 🇨🇦</p>
      </div>
    </div>
  `;
}

module.exports = router;