const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { validate, validateParams, schemas } = require('../middleware/validation');
const { sendBidAcceptedNotification } = require('../services/twilioService');
const moment = require('moment');

const router = express.Router();
const prisma = new PrismaClient();

// Create a new bid (drivers only)
router.post('/',
  authenticateToken,
  requireRole('DRIVER'),
  requireVerification('phone'),
  validate(schemas.bidCreation),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const { requestId, priceOffer, proposedDateTime, message } = req.body;

      // Get request details
      const request = await prisma.rideRequest.findUnique({
        where: { id: requestId },
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true
            }
          },
          originCity: true,
          destinationCity: true,
          bids: {
            where: { driverId },
            select: { id: true }
          }
        }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Ride request not found'
        });
      }

      if (request.status !== 'OPEN') {
        return res.status(400).json({
          success: false,
          message: 'Ride request is not open for bidding'
        });
      }

      // Check if request has expired
      if (new Date() > new Date(request.expiresAt)) {
        return res.status(400).json({
          success: false,
          message: 'Ride request has expired'
        });
      }

      // Check if driver is the passenger
      if (request.passenger.id === driverId) {
        return res.status(400).json({
          success: false,
          message: 'Drivers cannot bid on their own requests'
        });
      }

      // Check if driver already has a bid on this request
      if (request.bids.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You already have a bid on this request'
        });
      }

      // Validate price offer
      if (request.maxBudget && priceOffer > request.maxBudget) {
        return res.status(400).json({
          success: false,
          message: `Price offer cannot exceed maximum budget of $${request.maxBudget}`
        });
      }

      if (request.minBudget && priceOffer < request.minBudget) {
        return res.status(400).json({
          success: false,
          message: `Price offer cannot be below minimum budget of $${request.minBudget}`
        });
      }

      // Validate proposed date/time if provided
      if (proposedDateTime) {
        const proposedTime = new Date(proposedDateTime);
        const requestTime = new Date(request.preferredDateTime);
        const flexibility = request.timeFlexibility || 0;
        
        const earliestTime = new Date(requestTime.getTime() - flexibility * 60 * 60 * 1000);
        const latestTime = new Date(requestTime.getTime() + flexibility * 60 * 60 * 1000);

        if (proposedTime < earliestTime || proposedTime > latestTime) {
          return res.status(400).json({
            success: false,
            message: `Proposed time must be within ${flexibility} hours of preferred time`
          });
        }
      }

      // Set bid expiration (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create the bid
      const bid = await prisma.bid.create({
        data: {
          requestId,
          driverId,
          priceOffer,
          proposedDateTime: proposedDateTime ? new Date(proposedDateTime) : null,
          message,
          expiresAt
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              driverRating: true,
              totalTripsAsDriver: true
            }
          },
          request: {
            include: {
              originCity: true,
              destinationCity: true,
              passenger: {
                select: {
                  firstName: true,
                  phoneNumber: true
                }
              }
            }
          }
        }
      });

      // Send notification to passenger (optional, might be noisy)
      // TODO: Implement notification preferences
      
      res.status(201).json({
        success: true,
        message: 'Bid submitted successfully',
        data: { bid }
      });

    } catch (error) {
      console.error('Create bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create bid'
      });
    }
  }
);

// Update bid (driver only, before acceptance)
router.put('/:id',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  validate(schemas.bidCreation),
  async (req, res) => {
    try {
      const bidId = req.params.id;
      const driverId = req.user.id;

      // Find bid and verify ownership
      const existingBid = await prisma.bid.findFirst({
        where: {
          id: bidId,
          driverId,
          status: 'PENDING'
        },
        include: {
          request: {
            include: {
              originCity: true,
              destinationCity: true
            }
          }
        }
      });

      if (!existingBid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found, not owned by driver, or already processed'
        });
      }

      // Check if bid has expired
      if (new Date() > new Date(existingBid.expiresAt)) {
        return res.status(400).json({
          success: false,
          message: 'Bid has expired and cannot be updated'
        });
      }

      // Check if request is still open
      if (existingBid.request.status !== 'OPEN') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update bid - request is no longer open'
        });
      }

      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: {
          priceOffer: req.body.priceOffer,
          proposedDateTime: req.body.proposedDateTime ? new Date(req.body.proposedDateTime) : null,
          message: req.body.message
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              driverRating: true,
              totalTripsAsDriver: true
            }
          },
          request: {
            include: {
              originCity: true,
              destinationCity: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Bid updated successfully',
        data: { bid: updatedBid }
      });

    } catch (error) {
      console.error('Update bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update bid'
      });
    }
  }
);

// Withdraw bid (driver only)
router.delete('/:id',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const bidId = req.params.id;
      const driverId = req.user.id;

      const bid = await prisma.bid.findFirst({
        where: {
          id: bidId,
          driverId,
          status: 'PENDING'
        }
      });

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found, not owned by driver, or already processed'
        });
      }

      // Update bid status to rejected (withdrawn)
      await prisma.bid.update({
        where: { id: bidId },
        data: { status: 'REJECTED' }
      });

      res.json({
        success: true,
        message: 'Bid withdrawn successfully'
      });

    } catch (error) {
      console.error('Withdraw bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw bid'
      });
    }
  }
);

// Accept bid (passenger only)
router.patch('/:id/accept',
  authenticateToken,
  requireRole('PASSENGER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const bidId = req.params.id;
      const passengerId = req.user.id;

      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          request: {
            include: {
              passenger: {
                select: { id: true, firstName: true, phoneNumber: true }
              },
              originCity: true,
              destinationCity: true
            }
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              profilePicture: true,
              driverRating: true
            }
          }
        }
      });

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found'
        });
      }

      // Verify passenger owns the request
      if (bid.request.passenger.id !== passengerId) {
        return res.status(403).json({
          success: false,
          message: 'You can only accept bids on your own requests'
        });
      }

      // Check bid status
      if (bid.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Bid is no longer available'
        });
      }

      // Check if bid has expired
      if (new Date() > new Date(bid.expiresAt)) {
        return res.status(400).json({
          success: false,
          message: 'Bid has expired'
        });
      }

      // Check if request is still open
      if (bid.request.status !== 'OPEN') {
        return res.status(400).json({
          success: false,
          message: 'Request is no longer open'
        });
      }

      // Accept the bid and reject all others
      await prisma.$transaction(async (tx) => {
        // Accept this bid
        await tx.bid.update({
          where: { id: bidId },
          data: { status: 'ACCEPTED' }
        });

        // Reject all other bids on this request
        await tx.bid.updateMany({
          where: {
            requestId: bid.requestId,
            id: {
              not: bidId
            },
            status: 'PENDING'
          },
          data: { status: 'REJECTED' }
        });

        // Close the request
        await tx.rideRequest.update({
          where: { id: bid.requestId },
          data: { status: 'CLOSED' }
        });
      });

      // Send acceptance notification to driver
      try {
        await sendBidAcceptedNotification(
          bid.driver.phoneNumber,
          {
            pickup: bid.request.originCity.name,
            destination: bid.request.destinationCity.name,
            date: moment(bid.request.preferredDateTime).format('MMM DD, YYYY'),
            time: moment(bid.request.preferredDateTime).format('HH:mm'),
            passengerName: bid.request.passenger.firstName
          }
        );
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
        // Continue even if SMS fails
      }

      // Get updated bid with all details
      const acceptedBid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          request: {
            include: {
              passenger: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                  profilePicture: true,
                  passengerRating: true
                }
              },
              originCity: true,
              destinationCity: true
            }
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              profilePicture: true,
              driverRating: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Bid accepted successfully! You can now contact the driver.',
        data: {
          bid: acceptedBid,
          driverContact: {
            name: bid.driver.firstName,
            phone: bid.driver.phoneNumber
          }
        }
      });

    } catch (error) {
      console.error('Accept bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept bid'
      });
    }
  }
);

// Reject bid (passenger only)
router.patch('/:id/reject',
  authenticateToken,
  requireRole('PASSENGER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const bidId = req.params.id;
      const passengerId = req.user.id;

      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          request: {
            include: {
              passenger: { select: { id: true } }
            }
          }
        }
      });

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found'
        });
      }

      // Verify passenger owns the request
      if (bid.request.passenger.id !== passengerId) {
        return res.status(403).json({
          success: false,
          message: 'You can only reject bids on your own requests'
        });
      }

      // Check bid status
      if (bid.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Bid is no longer pending'
        });
      }

      // Reject the bid
      await prisma.bid.update({
        where: { id: bidId },
        data: { status: 'REJECTED' }
      });

      res.json({
        success: true,
        message: 'Bid rejected'
      });

    } catch (error) {
      console.error('Reject bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject bid'
      });
    }
  }
);

// Get driver's bids
router.get('/driver/my-bids',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const { status } = req.query;

      const where = {
        driverId
      };

      if (status) {
        where.status = status;
      }

      const bids = await prisma.bid.findMany({
        where,
        include: {
          request: {
            include: {
              passenger: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  passengerRating: true,
                  phoneNumber: true // Include for accepted bids
                }
              },
              originCity: true,
              destinationCity: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: { bids }
      });

    } catch (error) {
      console.error('Get driver bids error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver bids'
      });
    }
  }
);

// Get bids for a specific request (passenger only)
router.get('/request/:requestId',
  authenticateToken,
  requireRole('PASSENGER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const passengerId = req.user.id;

      // Verify request belongs to passenger
      const request = await prisma.rideRequest.findFirst({
        where: {
          id: requestId,
          passengerId
        }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or not owned by user'
        });
      }

      const bids = await prisma.bid.findMany({
        where: { requestId },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              driverRating: true,
              totalTripsAsDriver: true,
              phoneNumber: true, // Include for accepted bids
              bio: true,
              languages: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // Accepted bids first
          { priceOffer: 'asc' } // Then by price
        ]
      });

      res.json({
        success: true,
        data: { 
          bids,
          statistics: {
            totalBids: bids.length,
            pendingBids: bids.filter(bid => bid.status === 'PENDING').length,
            acceptedBids: bids.filter(bid => bid.status === 'ACCEPTED').length,
            averagePrice: bids.length > 0 
              ? bids.reduce((sum, bid) => sum + bid.priceOffer, 0) / bids.length
              : 0,
            lowestPrice: bids.length > 0 
              ? Math.min(...bids.map(bid => bid.priceOffer))
              : 0,
            highestPrice: bids.length > 0
              ? Math.max(...bids.map(bid => bid.priceOffer))
              : 0
          }
        }
      });

    } catch (error) {
      console.error('Get request bids error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch request bids'
      });
    }
  }
);

module.exports = router;