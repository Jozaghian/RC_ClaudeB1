const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { validate, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { canPostRide, deductCredits, paginate, createPaginationMeta, calculateDistance } = require('../utils/helpers');
const aiModerationService = require('../services/aiModerationService');

const router = express.Router();
const prisma = new PrismaClient();

// Get all rides with filtering and pagination
router.get('/', validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'departureDateTime', sortOrder = 'asc' } = req.query;
    const { skip, take } = paginate(page, limit);

    // Build where conditions
    const where = {
      status: 'ACTIVE',
      departureDateTime: {
        gte: new Date() // Only future rides
      },
      availableSeats: {
        gt: 0 // Only rides with available seats
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
          originDetails: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          destinationDetails: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get total count
    const total = await prisma.ride.count({ where });

    // Get rides with relations
    const rides = await prisma.ride.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
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
        vehicle: {
          include: {
            make: true,
            model: true
          }
        },
        originCity: true,
        destinationCity: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          select: {
            id: true,
            seatsBooked: true,
            status: true
          }
        }
      }
    });

    // Calculate booked seats for each ride
    const ridesWithBookingInfo = rides.map(ride => ({
      ...ride,
      bookedSeats: ride.bookings.reduce((total, booking) => total + booking.seatsBooked, 0),
      bookings: undefined // Remove bookings from response
    }));

    const paginationMeta = createPaginationMeta(total, page, limit);

    res.json({
      success: true,
      data: {
        rides: ridesWithBookingInfo,
        pagination: paginationMeta
      }
    });

  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rides'
    });
  }
});

// Search rides by route and date
router.get('/search', async (req, res) => {
  try {
    const { 
      originCityId, 
      destinationCityId, 
      departureDate,
      passengers = 1,
      maxPrice,
      sortBy = 'departureDateTime',
      sortOrder = 'asc',
      radius = 50 // km radius for city proximity search
    } = req.query;

    if (!originCityId || !destinationCityId) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination cities are required'
      });
    }

    // Get city coordinates for proximity search
    const [originCity, destinationCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: originCityId } }),
      prisma.city.findUnique({ where: { id: destinationCityId } })
    ]);

    if (!originCity || !destinationCity) {
      return res.status(404).json({
        success: false,
        message: 'Invalid city selection'
      });
    }

    // Build date filter
    let dateFilter = {
      gte: new Date() // Future rides only
    };

    if (departureDate) {
      const searchDate = new Date(departureDate);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      dateFilter = {
        gte: searchDate,
        lt: nextDay
      };
    }

    // Build where conditions
    const where = {
      status: 'ACTIVE',
      departureDateTime: dateFilter,
      availableSeats: {
        gte: parseInt(passengers)
      }
    };

    // Add price filter
    if (maxPrice) {
      where.pricePerPerson = {
        lte: parseFloat(maxPrice)
      };
    }

    // Get all rides first
    const allRides = await prisma.ride.findMany({
      where,
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
        vehicle: {
          include: {
            make: true,
            model: true
          }
        },
        originCity: true,
        destinationCity: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          select: {
            seatsBooked: true
          }
        }
      }
    });

    // Filter by geographic proximity and calculate distances
    const matchingRides = allRides
      .map(ride => {
        const originDistance = calculateDistance(
          originCity.latitude,
          originCity.longitude,
          ride.originCity.latitude,
          ride.originCity.longitude
        );

        const destinationDistance = calculateDistance(
          destinationCity.latitude,
          destinationCity.longitude,
          ride.destinationCity.latitude,
          ride.destinationCity.longitude
        );

        // Include ride if both origin and destination are within radius
        if (originDistance <= radius && destinationDistance <= radius) {
          return {
            ...ride,
            originDistance,
            destinationDistance,
            totalDistance: originDistance + destinationDistance,
            bookedSeats: ride.bookings.reduce((total, booking) => total + booking.seatsBooked, 0),
            bookings: undefined // Remove from response
          };
        }

        return null;
      })
      .filter(Boolean);

    // Sort results
    const sortedRides = matchingRides.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return sortOrder === 'asc' 
            ? a.pricePerPerson - b.pricePerPerson
            : b.pricePerPerson - a.pricePerPerson;
        case 'distance':
          return sortOrder === 'asc'
            ? a.totalDistance - b.totalDistance
            : b.totalDistance - a.totalDistance;
        case 'rating':
          const aRating = a.driver.driverRating || 0;
          const bRating = b.driver.driverRating || 0;
          return sortOrder === 'asc' ? aRating - bRating : bRating - aRating;
        case 'departureDateTime':
        default:
          return sortOrder === 'asc'
            ? new Date(a.departureDateTime) - new Date(b.departureDateTime)
            : new Date(b.departureDateTime) - new Date(a.departureDateTime);
      }
    });

    res.json({
      success: true,
      data: {
        rides: sortedRides,
        searchCriteria: {
          origin: originCity,
          destination: destinationCity,
          departureDate,
          passengers: parseInt(passengers),
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          radius
        },
        resultsCount: sortedRides.length
      }
    });

  } catch (error) {
    console.error('Search rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search rides'
    });
  }
});

// Get single ride details
router.get('/:id', validateParams(schemas.uuidParam), async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            driverRating: true,
            totalTripsAsDriver: true,
            phoneNumber: true, // Include for contact after booking
            bio: true,
            languages: true
          }
        },
        vehicle: {
          include: {
            make: true,
            model: true
          }
        },
        originCity: true,
        destinationCity: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          select: {
            id: true,
            seatsBooked: true,
            passenger: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                passengerRating: true
              }
            }
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Calculate booked seats
    const bookedSeats = ride.bookings.reduce((total, booking) => total + booking.seatsBooked, 0);

    // Hide sensitive driver info unless user is booked or is the driver
    let driverInfo = {
      id: ride.driver.id,
      firstName: ride.driver.firstName,
      lastName: ride.driver.lastName,
      profilePicture: ride.driver.profilePicture,
      driverRating: ride.driver.driverRating,
      totalTripsAsDriver: ride.driver.totalTripsAsDriver,
      bio: ride.driver.bio,
      languages: ride.driver.languages
    };

    // If user is authenticated and either booked or is the driver, show contact info
    if (req.user) {
      const isDriver = req.user.id === ride.driver.id;
      const isBooked = ride.bookings.some(booking => booking.passenger.id === req.user.id);
      
      if (isDriver || isBooked) {
        driverInfo.phoneNumber = ride.driver.phoneNumber;
      }
    }

    res.json({
      success: true,
      data: {
        ...ride,
        driver: driverInfo,
        bookedSeats,
        availableSeats: ride.totalSeats - bookedSeats,
        passengers: ride.bookings.map(booking => booking.passenger)
      }
    });

  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride details'
    });
  }
});

// Create a new ride (drivers only)
router.post('/', 
  authenticateToken, 
  requireRole('DRIVER'),
  requireVerification('phone'),
  validate(schemas.rideCreation),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const {
        vehicleId,
        originCityId,
        destinationCityId,
        originDetails,
        destinationDetails,
        departureDateTime,
        totalSeats,
        pricePerPerson,
        allowsLargeLuggage = false,
        allowsPets = false,
        allowsSmoking = false,
        additionalNotes
      } = req.body;

      // Verify vehicle belongs to driver
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId: driverId,
          isActive: true
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or not owned by driver'
        });
      }

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

      // Check if driver has enough credits
      const driverCredits = await prisma.driverCredit.findMany({
        where: {
          driverId,
          creditsRemaining: {
            gt: 0
          }
        },
        orderBy: {
          purchasedAt: 'asc' // Use oldest credits first
        }
      });

      if (!canPostRide(driverCredits)) {
        return res.status(402).json({
          success: false,
          message: 'Insufficient credits. Please purchase a credit package to post rides.',
          requiresPayment: true
        });
      }

      // Moderate content before creating ride
      const moderationResult = await aiModerationService.moderateRideContent({
        pickupDetails: originDetails,
        dropoffDetails: destinationDetails,
        notes: additionalNotes
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

      // Validate departure time is in the future
      const departureTime = new Date(departureDateTime);
      if (departureTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Departure time must be in the future'
        });
      }

      // Check for conflicting rides (same driver, overlapping time)
      const conflictingRides = await prisma.ride.findMany({
        where: {
          driverId,
          status: 'ACTIVE',
          departureDateTime: {
            gte: new Date(departureTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            lte: new Date(departureTime.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
          }
        }
      });

      if (conflictingRides.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You have another ride scheduled around this time. Please choose a different time.'
        });
      }

      // Create the ride
      const rideData = {
        driverId,
        vehicleId,
        originCityId,
        destinationCityId,
        originDetails,
        destinationDetails,
        departureDateTime: departureTime,
        totalSeats,
        availableSeats: totalSeats,
        pricePerPerson,
        allowsLargeLuggage,
        allowsPets,
        allowsSmoking,
        additionalNotes,
        tripType: req.body.tripType || 'SINGLE'
      };

      // Add return trip data if provided
      if (req.body.tripType === 'RETURN' && req.body.returnDateTime) {
        rideData.returnDateTime = new Date(req.body.returnDateTime);
        rideData.returnNotes = req.body.returnNotes;
      }

      const ride = await prisma.ride.create({
        data: rideData,
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              driverRating: true
            }
          },
          vehicle: {
            include: {
              make: true,
              model: true
            }
          },
          originCity: true,
          destinationCity: true
        }
      });

      // Deduct credit from driver account
      const updatedCredits = deductCredits(driverCredits, 1);
      
      // Update credits in database
      for (let i = 0; i < updatedCredits.length; i++) {
        if (updatedCredits[i].creditsRemaining !== driverCredits[i].creditsRemaining) {
          await prisma.driverCredit.update({
            where: { id: updatedCredits[i].id },
            data: { creditsRemaining: updatedCredits[i].creditsRemaining }
          });

          // Create transaction record
          await prisma.creditTransaction.create({
            data: {
              creditId: updatedCredits[i].id,
              rideId: ride.id,
              creditsUsed: 1,
              transactionType: 'ride_post',
              description: `Ride posting: ${originCity.name} to ${destinationCity.name}`
            }
          });
          break;
        }
      }

      res.status(201).json({
        success: true,
        message: 'Ride posted successfully',
        data: { ride }
      });

    } catch (error) {
      console.error('Create ride error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create ride'
      });
    }
  }
);

// Update ride (driver only, before bookings)
router.put('/:id',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  validate(schemas.rideCreation),
  async (req, res) => {
    try {
      const rideId = req.params.id;
      const driverId = req.user.id;

      // Find ride and verify ownership
      const existingRide = await prisma.ride.findFirst({
        where: {
          id: rideId,
          driverId,
          status: 'ACTIVE'
        },
        include: {
          bookings: {
            where: {
              status: {
                in: ['PENDING', 'CONFIRMED']
              }
            }
          }
        }
      });

      if (!existingRide) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found or not owned by driver'
        });
      }

      // Don't allow updates if there are confirmed bookings
      if (existingRide.bookings.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot update ride with existing bookings'
        });
      }

      const updatedRide = await prisma.ride.update({
        where: { id: rideId },
        data: {
          ...req.body,
          departureDateTime: new Date(req.body.departureDateTime),
          availableSeats: req.body.totalSeats // Reset available seats
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              driverRating: true
            }
          },
          vehicle: {
            include: {
              make: true,
              model: true
            }
          },
          originCity: true,
          destinationCity: true
        }
      });

      res.json({
        success: true,
        message: 'Ride updated successfully',
        data: { ride: updatedRide }
      });

    } catch (error) {
      console.error('Update ride error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ride'
      });
    }
  }
);

// Cancel ride (driver only)
router.delete('/:id',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const rideId = req.params.id;
      const driverId = req.user.id;

      const ride = await prisma.ride.findFirst({
        where: {
          id: rideId,
          driverId,
          status: 'ACTIVE'
        },
        include: {
          bookings: {
            where: {
              status: {
                in: ['PENDING', 'CONFIRMED']
              }
            },
            include: {
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

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found or not owned by driver'
        });
      }

      // Cancel the ride
      await prisma.ride.update({
        where: { id: rideId },
        data: { status: 'CANCELLED' }
      });

      // Cancel all bookings and refund payments if applicable
      for (const booking of ride.bookings) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED' }
        });

        // TODO: Process refunds for credit card payments
        // TODO: Send cancellation notifications to passengers
      }

      res.json({
        success: true,
        message: 'Ride cancelled successfully',
        data: {
          cancelledBookings: ride.bookings.length
        }
      });

    } catch (error) {
      console.error('Cancel ride error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel ride'
      });
    }
  }
);

// Get driver's rides
router.get('/driver/my-rides',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const { status = 'ACTIVE' } = req.query;

      const rides = await prisma.ride.findMany({
        where: {
          driverId,
          ...(status && { status })
        },
        include: {
          vehicle: {
            include: {
              make: true,
              model: true
            }
          },
          originCity: true,
          destinationCity: true,
          bookings: {
            where: {
              status: {
                in: ['PENDING', 'CONFIRMED']
              }
            },
            include: {
              passenger: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  passengerRating: true,
                  phoneNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          departureDateTime: 'asc'
        }
      });

      const ridesWithBookingInfo = rides.map(ride => ({
        ...ride,
        bookedSeats: ride.bookings.reduce((total, booking) => total + booking.seatsBooked, 0),
        passengers: ride.bookings.map(booking => booking.passenger)
      }));

      res.json({
        success: true,
        data: { rides: ridesWithBookingInfo }
      });

    } catch (error) {
      console.error('Get driver rides error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver rides'
      });
    }
  }
);

// Create recurring trips
router.post('/recurring',
  authenticateToken,
  requireRole('DRIVER'),
  requireVerification('phone'),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const {
        scheduleName,
        recurrencePattern,
        selectedDays,
        selectedDates,
        startDate,
        endDate,
        ...tripData
      } = req.body;

      // Moderate content before creating schedule
      const moderationResult = await aiModerationService.moderateRideContent({
        pickupDetails: tripData.pickupDetails,
        dropoffDetails: tripData.dropoffDetails,
        notes: tripData.notes
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

      // Verify cities exist
      const [originCity, destinationCity] = await Promise.all([
        prisma.city.findUnique({ where: { id: tripData.originCityId } }),
        prisma.city.findUnique({ where: { id: tripData.destinationCityId } })
      ]);

      if (!originCity || !destinationCity) {
        return res.status(400).json({
          success: false,
          message: 'Invalid city selection'
        });
      }

      // Create trip schedule
      const tripSchedule = await prisma.tripSchedule.create({
        data: {
          driverId,
          name: scheduleName,
          originCityId: tripData.originCityId,
          destinationCityId: tripData.destinationCityId,
          originDetails: tripData.pickupDetails,
          destinationDetails: tripData.dropoffDetails,
          vehicleId: tripData.vehicleId,
          totalSeats: tripData.seatsAvailable,
          pricePerPerson: parseFloat(tripData.pricePerSeat),
          allowsLargeLuggage: tripData.luggage !== 'none',
          allowsPets: tripData.pets !== 'none',
          allowsSmoking: tripData.smokingAllowed,
          additionalNotes: tripData.notes,
          recurrencePattern,
          daysOfWeek: selectedDays || [],
          selectedDates: selectedDates || [],
          defaultTime: new Date(tripData.departureDateTime).toTimeString().slice(0, 5),
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null
        }
      });

      // Generate individual rides based on the schedule
      const rides = [];
      const maxRides = 50; // Limit to prevent abuse
      let ridesCreated = 0;

      if (recurrencePattern === 'WEEKLY' && selectedDays && selectedDays.length > 0) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days if no end date
        
        for (let current = new Date(start); current <= end && ridesCreated < maxRides; current.setDate(current.getDate() + 1)) {
          if (selectedDays.includes(current.getDay())) {
            const rideDateTime = new Date(tripData.departureDateTime);
            rideDateTime.setFullYear(current.getFullYear());
            rideDateTime.setMonth(current.getMonth());
            rideDateTime.setDate(current.getDate());

            if (rideDateTime > new Date()) { // Only future rides
              const ride = await prisma.ride.create({
                data: {
                  driverId,
                  vehicleId: tripData.vehicleId,
                  originCityId: tripData.originCityId,
                  destinationCityId: tripData.destinationCityId,
                  originDetails: tripData.pickupDetails,
                  destinationDetails: tripData.dropoffDetails,
                  departureDateTime: rideDateTime,
                  totalSeats: tripData.seatsAvailable,
                  availableSeats: tripData.seatsAvailable,
                  pricePerPerson: parseFloat(tripData.pricePerSeat),
                  allowsLargeLuggage: tripData.luggage !== 'none',
                  allowsPets: tripData.pets !== 'none',
                  allowsSmoking: tripData.smokingAllowed,
                  additionalNotes: tripData.notes,
                  tripType: 'RECURRING',
                  tripScheduleId: tripSchedule.id
                }
              });
              rides.push(ride);
              ridesCreated++;
            }
          }
        }
      }

      if (recurrencePattern === 'MONTHLY' && selectedDates && selectedDates.length > 0) {
        for (const dateStr of selectedDates) {
          if (ridesCreated >= maxRides) break;
          
          const rideDateTime = new Date(dateStr + 'T' + new Date(tripData.departureDateTime).toTimeString().slice(0, 8));
          
          if (rideDateTime > new Date()) { // Only future rides
            const ride = await prisma.ride.create({
              data: {
                driverId,
                vehicleId: tripData.vehicleId,
                originCityId: tripData.originCityId,
                destinationCityId: tripData.destinationCityId,
                originDetails: tripData.pickupDetails,
                destinationDetails: tripData.dropoffDetails,
                departureDateTime: rideDateTime,
                totalSeats: tripData.seatsAvailable,
                availableSeats: tripData.seatsAvailable,
                pricePerPerson: parseFloat(tripData.pricePerSeat),
                allowsLargeLuggage: tripData.luggage !== 'none',
                allowsPets: tripData.pets !== 'none',
                allowsSmoking: tripData.smokingAllowed,
                additionalNotes: tripData.notes,
                tripType: 'RECURRING',
                tripScheduleId: tripSchedule.id
              }
            });
            rides.push(ride);
            ridesCreated++;
          }
        }
      }

      res.status(201).json({
        success: true,
        message: `Recurring trip schedule created with ${ridesCreated} rides`,
        data: {
          schedule: tripSchedule,
          ridesCreated,
          rides: rides.length <= 10 ? rides : rides.slice(0, 10) // Return first 10 for preview
        }
      });

    } catch (error) {
      console.error('Create recurring trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create recurring trip'
      });
    }
  }
);

module.exports = router;