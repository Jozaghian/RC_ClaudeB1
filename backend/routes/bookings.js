const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { validate, validateParams, schemas } = require('../middleware/validation');
const { sendBookingConfirmation } = require('../services/twilioService');
const moment = require('moment');

const router = express.Router();
const prisma = new PrismaClient();

// Create a new booking (passengers only)
router.post('/',
  authenticateToken,
  requireRole('PASSENGER'),
  requireVerification('phone'),
  validate(schemas.bookingCreation),
  async (req, res) => {
    try {
      const passengerId = req.user.id;
      const { rideId, seatsBooked, paymentMethod, specialRequests } = req.body;

      // Get ride details with driver info
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true
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
              seatsBooked: true,
              passengerId: true
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

      if (ride.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'Ride is not available for booking'
        });
      }

      // Check if ride is in the future
      if (new Date(ride.departureDateTime) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book rides that have already departed'
        });
      }

      // Check if passenger is the driver
      if (ride.driver.id === passengerId) {
        return res.status(400).json({
          success: false,
          message: 'Drivers cannot book their own rides'
        });
      }

      // Check if passenger already has a booking for this ride
      const existingBooking = ride.bookings.find(booking => booking.passengerId === passengerId);
      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: 'You already have a booking for this ride'
        });
      }

      // Calculate available seats
      const bookedSeats = ride.bookings.reduce((total, booking) => total + booking.seatsBooked, 0);
      const availableSeats = ride.totalSeats - bookedSeats;

      if (seatsBooked > availableSeats) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableSeats} seats available, but ${seatsBooked} requested`
        });
      }

      // Calculate total amount
      const totalAmount = ride.pricePerPerson * seatsBooked;

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          rideId,
          passengerId,
          seatsBooked,
          totalAmount,
          paymentMethod,
          specialRequests,
          status: paymentMethod === 'CREDIT_CARD' ? 'PENDING' : 'CONFIRMED'
        },
        include: {
          ride: {
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phoneNumber: true
                }
              },
              originCity: true,
              destinationCity: true,
              vehicle: {
                include: {
                  make: true,
                  model: true
                }
              }
            }
          },
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true
            }
          }
        }
      });

      // Update available seats in ride
      await prisma.ride.update({
        where: { id: rideId },
        data: {
          availableSeats: availableSeats - seatsBooked
        }
      });

      // If payment method is cash or e-transfer, send confirmation SMS
      if (paymentMethod !== 'CREDIT_CARD') {
        try {
          // Send SMS to passenger
          await sendBookingConfirmation(
            booking.passenger.phoneNumber,
            {
              rideName: `${ride.originCity.name} to ${ride.destinationCity.name}`,
              date: moment(ride.departureDateTime).format('MMM DD, YYYY'),
              time: moment(ride.departureDateTime).format('HH:mm'),
              pickup: ride.originCity.name,
              destination: ride.destinationCity.name,
              driverName: ride.driver.firstName
            }
          );

          // Send notification to driver (implement notification system later)
          // TODO: Notify driver of new booking
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Continue with booking even if SMS fails
        }
      }

      res.status(201).json({
        success: true,
        message: paymentMethod === 'CREDIT_CARD' 
          ? 'Booking created. Please complete payment to confirm.'
          : 'Booking confirmed successfully!',
        data: {
          booking,
          paymentRequired: paymentMethod === 'CREDIT_CARD',
          driverContact: paymentMethod !== 'CREDIT_CARD' ? {
            name: ride.driver.firstName,
            phone: ride.driver.phoneNumber
          } : null
        }
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking'
      });
    }
  }
);

// Get passenger's bookings
router.get('/my-bookings',
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

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          ride: {
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  driverRating: true,
                  phoneNumber: true
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: { bookings }
      });

    } catch (error) {
      console.error('Get passenger bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings'
      });
    }
  }
);

// Get specific booking details
router.get('/:id',
  authenticateToken,
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          ride: {
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  driverRating: true,
                  phoneNumber: true
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
          },
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              passengerRating: true,
              phoneNumber: true
            }
          },
          payment: true
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Verify user has access to this booking
      const isPassenger = booking.passenger.id === userId;
      const isDriver = booking.ride.driver.id === userId;

      if (!isPassenger && !isDriver) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: { booking }
      });

    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking details'
      });
    }
  }
);

// Update booking status (driver only)
router.patch('/:id/status',
  authenticateToken,
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;
      const { status, reason } = req.body;

      if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be CONFIRMED or CANCELLED'
        });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          ride: {
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  phoneNumber: true
                }
              }
            }
          },
          passenger: {
            select: {
              firstName: true,
              phoneNumber: true
            }
          }
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Only driver can update booking status
      if (booking.ride.driver.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the driver can update booking status'
        });
      }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          ride: {
            include: {
              originCity: true,
              destinationCity: true
            }
          },
          passenger: {
            select: {
              firstName: true,
              phoneNumber: true
            }
          }
        }
      });

      // If cancelling, restore seats to ride
      if (status === 'CANCELLED') {
        await prisma.ride.update({
          where: { id: booking.rideId },
          data: {
            availableSeats: {
              increment: booking.seatsBooked
            }
          }
        });

        // TODO: Process refund if payment was made
        // TODO: Send cancellation notification
      }

      res.json({
        success: true,
        message: `Booking ${status.toLowerCase()} successfully`,
        data: { booking: updatedBooking }
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking status'
      });
    }
  }
);

// Cancel booking (passenger only, before departure)
router.delete('/:id',
  authenticateToken,
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          ride: {
            include: {
              driver: {
                select: {
                  firstName: true,
                  phoneNumber: true
                }
              }
            }
          },
          passenger: {
            select: {
              id: true,
              firstName: true
            }
          }
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Verify passenger owns this booking
      if (booking.passenger.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your own bookings'
        });
      }

      // Check if booking is already cancelled
      if (booking.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled'
        });
      }

      // Check cancellation deadline (e.g., 2 hours before departure)
      const departureTime = new Date(booking.ride.departureDateTime);
      const now = new Date();
      const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

      if (hoursUntilDeparture < 2) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel bookings less than 2 hours before departure'
        });
      }

      // Cancel the booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });

      // Restore seats to ride
      await prisma.ride.update({
        where: { id: booking.rideId },
        data: {
          availableSeats: {
            increment: booking.seatsBooked
          }
        }
      });

      // TODO: Process refund for credit card payments
      // TODO: Send cancellation notifications

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: {
          refundProcessing: booking.paymentMethod === 'CREDIT_CARD',
          seatsRestored: booking.seatsBooked
        }
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking'
      });
    }
  }
);

// Mark trip as completed (driver only)
router.patch('/:id/complete',
  authenticateToken,
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          ride: {
            include: {
              driver: { select: { id: true } }
            }
          }
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Only driver can mark trip as completed
      if (booking.ride.driver.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the driver can mark trips as completed'
        });
      }

      if (booking.status !== 'CONFIRMED') {
        return res.status(400).json({
          success: false,
          message: 'Only confirmed bookings can be completed'
        });
      }

      // Mark booking as completed
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' }
      });

      // TODO: Trigger rating request
      // TODO: Update trip statistics

      res.json({
        success: true,
        message: 'Trip marked as completed',
        data: { booking: updatedBooking }
      });

    } catch (error) {
      console.error('Complete booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete booking'
      });
    }
  }
);

// Get bookings for a specific ride (driver only)
router.get('/ride/:rideId',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const rideId = req.params.rideId;
      const driverId = req.user.id;

      // Verify ride belongs to driver
      const ride = await prisma.ride.findFirst({
        where: {
          id: rideId,
          driverId
        }
      });

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found or not owned by driver'
        });
      }

      const bookings = await prisma.booking.findMany({
        where: { rideId },
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              passengerRating: true,
              phoneNumber: true,
              totalTripsAsPassenger: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      res.json({
        success: true,
        data: { bookings }
      });

    } catch (error) {
      console.error('Get ride bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ride bookings'
      });
    }
  }
);

module.exports = router;