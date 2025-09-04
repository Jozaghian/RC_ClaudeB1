const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { validate, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { calculateDistance, paginate, createPaginationMeta } = require('../utils/helpers');
const { sendRideRequestNotification } = require('../services/twilioService');
const aiModerationService = require('../services/aiModerationService');

const router = express.Router();
const prisma = new PrismaClient();

// Get all ride requests with filtering
router.get('/', validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'OPEN', search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const { skip, take } = paginate(page, limit);

    // Build where conditions
    const where = {
      status,
      expiresAt: {
        gte: new Date() // Only non-expired requests
      }
    };

    // Add search conditions
    if (search) {
      where.OR = [
        {
          originCity: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          destinationCity: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get total count
    const total = await prisma.rideRequest.count({ where });

    // Get requests with relations
    const requests = await prisma.rideRequest.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            passengerRating: true,
            totalTripsAsPassenger: true
          }
        },
        originCity: true,
        destinationCity: true,
        bids: {
          where: {
            status: {
              in: ['PENDING', 'ACCEPTED']
            }
          },
          select: {
            id: true,
            priceOffer: true,
            status: true,
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                driverRating: true
              }
            }
          }
        }
      }
    });

    const paginationMeta = createPaginationMeta(total, page, limit);

    res.json({
      success: true,
      data: {
        requests,
        pagination: paginationMeta
      }
    });

  } catch (error) {
    console.error('Get ride requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride requests'
    });
  }
});

// Search ride requests by route and criteria (drivers only)
router.get('/search',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const { 
        originCityId,
        destinationCityId,
        maxDistance = 50,
        minBudget,
        maxBudget,
        sortBy = 'preferredDateTime',
        sortOrder = 'asc'
      } = req.query;

      const driverId = req.user.id;

      // Base conditions
      const where = {
        status: 'OPEN',
        expiresAt: {
          gte: new Date()
        }
      };

      // Get all active requests first
      let requests = await prisma.rideRequest.findMany({
        where,
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              passengerRating: true,
              totalTripsAsPassenger: true
            }
          },
          originCity: true,
          destinationCity: true,
          bids: {
            where: {
              driverId,
              status: {
                in: ['PENDING', 'ACCEPTED']
              }
            }
          }
        }
      });

      // Filter by geographic proximity if cities specified
      if (originCityId || destinationCityId) {
        let originCity, destinationCity;

        if (originCityId) {
          originCity = await prisma.city.findUnique({ where: { id: originCityId } });
        }
        if (destinationCityId) {
          destinationCity = await prisma.city.findUnique({ where: { id: destinationCityId } });
        }

        requests = requests.filter(request => {
          let originMatch = true;
          let destinationMatch = true;

          if (originCity) {
            const originDistance = calculateDistance(
              originCity.latitude,
              originCity.longitude,
              request.originCity.latitude,
              request.originCity.longitude
            );
            originMatch = originDistance <= maxDistance;
          }

          if (destinationCity) {
            const destinationDistance = calculateDistance(
              destinationCity.latitude,
              destinationCity.longitude,
              request.destinationCity.latitude,
              request.destinationCity.longitude
            );
            destinationMatch = destinationDistance <= maxDistance;
          }

          return originMatch && destinationMatch;
        });
      }

      // Filter by budget if specified
      if (minBudget || maxBudget) {
        requests = requests.filter(request => {
          let budgetMatch = true;

          if (minBudget && request.maxBudget) {
            budgetMatch = budgetMatch && request.maxBudget >= parseFloat(minBudget);
          }

          if (maxBudget && request.minBudget) {
            budgetMatch = budgetMatch && request.minBudget <= parseFloat(maxBudget);
          }

          return budgetMatch;
        });
      }

      // Sort results
      requests.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'budget':
            aValue = a.maxBudget || 0;
            bValue = b.maxBudget || 0;
            break;
          case 'preferredDateTime':
          default:
            aValue = new Date(a.preferredDateTime);
            bValue = new Date(b.preferredDateTime);
            break;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      res.json({
        success: true,
        data: {
          requests,
          searchCriteria: {
            maxDistance: parseInt(maxDistance),
            minBudget: minBudget ? parseFloat(minBudget) : null,
            maxBudget: maxBudget ? parseFloat(maxBudget) : null
          },
          resultsCount: requests.length
        }
      });

    } catch (error) {
      console.error('Search ride requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search ride requests'
      });
    }
  }
);

// Get single request details
router.get('/:id', validateParams(schemas.uuidParam), async (req, res) => {
  try {
    const requestId = req.params.id;

    const request = await prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            passengerRating: true,
            totalTripsAsPassenger: true,
            phoneNumber: true, // Include for contact after bid acceptance
            bio: true,
            languages: true
          }
        },
        originCity: true,
        destinationCity: true,
        bids: {
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
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
    }

    // Hide sensitive passenger info unless user is authorized
    let passengerInfo = {
      id: request.passenger.id,
      firstName: request.passenger.firstName,
      lastName: request.passenger.lastName,
      profilePicture: request.passenger.profilePicture,
      passengerRating: request.passenger.passengerRating,
      totalTripsAsPassenger: request.passenger.totalTripsAsPassenger,
      bio: request.passenger.bio,
      languages: request.passenger.languages
    };

    // If user is authenticated and either the passenger or has an accepted bid, show contact info
    if (req.user) {
      const isPassenger = req.user.id === request.passenger.id;
      const hasAcceptedBid = request.bids.some(
        bid => bid.driver.id === req.user.id && bid.status === 'ACCEPTED'
      );
      
      if (isPassenger || hasAcceptedBid) {
        passengerInfo.phoneNumber = request.passenger.phoneNumber;
      }
    }

    res.json({
      success: true,
      data: {
        ...request,
        passenger: passengerInfo
      }
    });

  } catch (error) {
    console.error('Get ride request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride request details'
    });
  }
});

// Create a new ride request (passengers only)
router.post('/',
  authenticateToken,
  requireRole('PASSENGER'),
  requireVerification('phone'),
  validate(schemas.requestCreation),
  async (req, res) => {
    try {
      const passengerId = req.user.id;
      const {
        originCityId,
        destinationCityId,
        originDetails,
        destinationDetails,
        preferredDateTime,
        timeFlexibility = 0,
        passengerCount,
        maxBudget,
        minBudget,
        needsLargeLuggage = false,
        needsChildSeat = false,
        needsWheelchairAccess = false,
        specialRequirements,
        description
      } = req.body;

      // Verify cities exist
      const [originCity, destinationCity] = await Promise.all([
        prisma.city.findUnique({ where: { id: originCityId } }),
        prisma.city.findUnique({ where: { id: destinationCityId } })
      ]);

      if (!originCity || !destinationCity) {
        return res.status(400).json({
          success: false,
          message: 'Invalid city selection'
        });
      }

      if (originCityId === destinationCityId) {
        return res.status(400).json({
          success: false,
          message: 'Origin and destination must be different cities'
        });
      }

      // Moderate content before creating request
      const moderationResult = await aiModerationService.moderateRequestContent({
        originDetails,
        destinationDetails,
        specialRequirements,
        description
      });

      if (!moderationResult.approved) {
        return res.status(400).json({
          success: false,
          message: 'Content contains inappropriate material and cannot be posted',
          details: {
            flaggedFields: moderationResult.flaggedFields,
            reasons: moderationResult.results
          }
        });
      }

      // Validate preferred time is in the future
      const preferredTime = new Date(preferredDateTime);
      if (preferredTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Preferred departure time must be in the future'
        });
      }

      // Calculate expiry time (default 72 hours)
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      // Validate budget range
      if (minBudget && maxBudget && minBudget > maxBudget) {
        return res.status(400).json({
          success: false,
          message: 'Minimum budget cannot be higher than maximum budget'
        });
      }

      // Create the ride request
      const rideRequest = await prisma.rideRequest.create({
        data: {
          passengerId,
          originCityId,
          destinationCityId,
          originDetails,
          destinationDetails,
          preferredDateTime: preferredTime,
          timeFlexibility,
          passengerCount,
          maxBudget,
          minBudget,
          needsLargeLuggage,
          needsChildSeat,
          needsWheelchairAccess,
          specialRequirements,
          description,
          expiresAt
        },
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              passengerRating: true
            }
          },
          originCity: true,
          destinationCity: true
        }
      });

      // TODO: Send notifications to nearby drivers
      // This would require implementing a notification system to alert drivers
      // about new requests that match their typical routes

      res.status(201).json({
        success: true,
        message: 'Ride request posted successfully',
        data: { request: rideRequest }
      });

    } catch (error) {
      console.error('Create ride request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create ride request'
      });
    }
  }
);

// Update ride request (passenger only, before any bids)
router.put('/:id',
  authenticateToken,
  requireRole('PASSENGER'),
  validateParams(schemas.uuidParam),
  validate(schemas.requestCreation),
  async (req, res) => {
    try {
      const requestId = req.params.id;
      const passengerId = req.user.id;

      // Find request and verify ownership
      const existingRequest = await prisma.rideRequest.findFirst({
        where: {
          id: requestId,
          passengerId,
          status: 'OPEN'
        },
        include: {
          bids: {
            where: {
              status: {
                in: ['PENDING', 'ACCEPTED']
              }
            }
          }
        }
      });

      if (!existingRequest) {
        return res.status(404).json({
          success: false,
          message: 'Ride request not found or not owned by user'
        });
      }

      // Don't allow updates if there are pending or accepted bids
      if (existingRequest.bids.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot update request with existing bids'
        });
      }

      const updatedRequest = await prisma.rideRequest.update({
        where: { id: requestId },
        data: {
          ...req.body,
          preferredDateTime: new Date(req.body.preferredDateTime)
        },
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              passengerRating: true
            }
          },
          originCity: true,
          destinationCity: true
        }
      });

      res.json({
        success: true,
        message: 'Ride request updated successfully',
        data: { request: updatedRequest }
      });

    } catch (error) {
      console.error('Update ride request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ride request'
      });
    }
  }
);

// Cancel ride request (passenger only)
router.delete('/:id',
  authenticateToken,
  requireRole('PASSENGER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const requestId = req.params.id;
      const passengerId = req.user.id;

      const request = await prisma.rideRequest.findFirst({
        where: {
          id: requestId,
          passengerId,
          status: 'OPEN'
        },
        include: {
          bids: {
            where: {
              status: {
                in: ['PENDING', 'ACCEPTED']
              }
            },
            include: {
              driver: {
                select: {
                  firstName: true,
                  phoneNumber: true
                }
              }
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Ride request not found or not owned by user'
        });
      }

      // Update request status to closed
      await prisma.rideRequest.update({
        where: { id: requestId },
        data: { status: 'CLOSED' }
      });

      // Reject all pending bids
      for (const bid of request.bids) {
        await prisma.bid.update({
          where: { id: bid.id },
          data: { status: 'REJECTED' }
        });

        // TODO: Send notification to drivers about bid rejection
      }

      res.json({
        success: true,
        message: 'Ride request cancelled successfully',
        data: {
          rejectedBids: request.bids.length
        }
      });

    } catch (error) {
      console.error('Cancel ride request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel ride request'
      });
    }
  }
);

// Get passenger's ride requests
router.get('/passenger/my-requests',
  authenticateToken,
  requireRole('PASSENGER'),
  async (req, res) => {
    try {
      const passengerId = req.user.id;
      const { status } = req.query;

      const where = {
        passengerId
      };

      if (status) {
        where.status = status;
      }

      const requests = await prisma.rideRequest.findMany({
        where,
        include: {
          originCity: true,
          destinationCity: true,
          bids: {
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  driverRating: true,
                  totalTripsAsDriver: true,
                  phoneNumber: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const requestsWithBidInfo = requests.map(request => ({
        ...request,
        totalBids: request.bids.length,
        acceptedBid: request.bids.find(bid => bid.status === 'ACCEPTED'),
        lowestBid: request.bids.length > 0 
          ? Math.min(...request.bids.map(bid => bid.priceOffer))
          : null,
        highestBid: request.bids.length > 0
          ? Math.max(...request.bids.map(bid => bid.priceOffer))
          : null
      }));

      res.json({
        success: true,
        data: { requests: requestsWithBidInfo }
      });

    } catch (error) {
      console.error('Get passenger requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch passenger requests'
      });
    }
  }
);

module.exports = router;