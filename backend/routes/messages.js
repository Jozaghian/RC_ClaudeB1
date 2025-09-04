const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const aiModerationService = require('../services/aiModerationService');
const prisma = new PrismaClient();
const router = express.Router();

// Send a message
router.post('/send',
  authenticateToken,
  [
    body('recipientId').isUUID().withMessage('Valid recipient ID is required'),
    body('content').isLength({ min: 1, max: 1000 }).withMessage('Message content is required and must be less than 1000 characters'),
    body('rideId').optional().isUUID().withMessage('Valid ride ID is required if provided')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipientId, content, rideId } = req.body;
      const senderId = req.user.id;

      // Moderate message content before sending
      const moderationResult = await aiModerationService.moderateMessage(content);

      if (moderationResult.flagged) {
        return res.status(400).json({
          success: false,
          message: 'Message contains inappropriate content and cannot be sent',
          details: {
            reason: moderationResult.reason,
            flaggedCategories: Object.keys(moderationResult.categories).filter(cat => moderationResult.categories[cat])
          }
        });
      }

      // Check if sender and recipient have a connection (shared ride)
      if (rideId) {
        const ride = await prisma.ride.findFirst({
          where: {
            id: rideId,
            OR: [
              { 
                driverId: senderId,
                bookings: { some: { passengerId: recipientId } }
              },
              { 
                driverId: recipientId,
                bookings: { some: { passengerId: senderId } }
              }
            ]
          }
        });

        if (!ride) {
          return res.status(403).json({ error: 'You can only message users from shared rides' });
        }
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          senderId,
          recipientId,
          content,
          rideId,
          createdAt: new Date()
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get conversation between two users
router.get('/conversation/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      const { page = 1, limit = 50 } = req.query;

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUserId, recipientId: userId },
            { senderId: userId, recipientId: currentUserId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          ride: {
            select: {
              id: true,
              origin: true,
              destination: true,
              departureDate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          senderId: userId,
          recipientId: currentUserId,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      });

      res.json(messages.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get unique conversation partners
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: { recipientId: true },
      distinct: ['recipientId']
    });

    const receivedMessages = await prisma.message.findMany({
      where: { recipientId: userId },
      select: { senderId: true },
      distinct: ['senderId']
    });

    const partnerIds = [
      ...sentMessages.map(m => m.recipientId),
      ...receivedMessages.map(m => m.senderId)
    ];

    const uniquePartnerIds = [...new Set(partnerIds)];

    // Get conversation details for each partner
    const conversations = await Promise.all(
      uniquePartnerIds.map(async (partnerId) => {
        // Get latest message
        const latestMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, recipientId: partnerId },
              { senderId: partnerId, recipientId: userId }
            ]
          },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });

        // Get unread count
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partnerId,
            recipientId: userId,
            readAt: null
          }
        });

        // Get partner info
        const partner = await prisma.user.findUnique({
          where: { id: partnerId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            averageRating: true
          }
        });

        return {
          partner,
          latestMessage,
          unreadCount
        };
      })
    );

    // Sort by latest message time
    conversations.sort((a, b) => 
      new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt)
    );

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await prisma.message.count({
      where: {
        recipientId: userId,
        readAt: null
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
router.patch('/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.updateMany({
      where: {
        id: messageId,
        recipientId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    if (message.count === 0) {
      return res.status(404).json({ error: 'Message not found or already read' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a message (soft delete)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or you can only delete your own messages' });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a specific ride
router.get('/ride/:rideId', authenticateToken, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    // Check if user is part of the ride
    const ride = await prisma.ride.findFirst({
      where: {
        id: rideId,
        OR: [
          { driverId: userId },
          { bookings: { some: { passengerId: userId } } }
        ]
      }
    });

    if (!ride) {
      return res.status(403).json({ error: 'You can only view messages for rides you are part of' });
    }

    const messages = await prisma.message.findMany({
      where: {
        rideId,
        deletedAt: null
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching ride messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;