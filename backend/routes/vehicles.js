const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { validate, validateParams, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all vehicle makes
router.get('/makes', async (req, res) => {
  try {
    const makes = await prisma.vehicleMake.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { models: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: { makes }
    });

  } catch (error) {
    console.error('Get vehicle makes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle makes'
    });
  }
});

// Get models for a specific make
router.get('/makes/:makeId/models', 
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const makeId = req.params.makeId;

      const make = await prisma.vehicleMake.findUnique({
        where: { id: makeId },
        include: {
          models: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        }
      });

      if (!make) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle make not found'
        });
      }

      res.json({
        success: true,
        data: {
          make: {
            id: make.id,
            name: make.name
          },
          models: make.models
        }
      });

    } catch (error) {
      console.error('Get vehicle models error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle models'
      });
    }
  }
);

// Get all vehicle models with make info
router.get('/models', async (req, res) => {
  try {
    const { makeId, type, search } = req.query;

    const where = {
      isActive: true
    };

    if (makeId) {
      where.makeId = makeId;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          make: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const models = await prisma.vehicleModel.findMany({
      where,
      include: {
        make: true
      },
      orderBy: [
        { make: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: { models }
    });

  } catch (error) {
    console.error('Get vehicle models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle models'
    });
  }
});

// Get user's vehicles
router.get('/my-vehicles',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const vehicles = await prisma.vehicle.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          make: true,
          model: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: { vehicles }
      });

    } catch (error) {
      console.error('Get user vehicles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicles'
      });
    }
  }
);

// Add vehicle (drivers only)
router.post('/',
  authenticateToken,
  requireRole('DRIVER'),
  requireVerification('phone'),
  validate(schemas.vehicleCreation),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        makeId, 
        modelId, 
        year, 
        color, 
        licensePlate, 
        seats,
        features = []
      } = req.body;

      // Verify make and model exist and are active
      const model = await prisma.vehicleModel.findFirst({
        where: {
          id: modelId,
          makeId,
          isActive: true
        },
        include: {
          make: {
            where: { isActive: true }
          }
        }
      });

      if (!model || !model.make) {
        return res.status(404).json({
          success: false,
          message: 'Invalid vehicle make or model selection'
        });
      }

      // Check if license plate is already registered
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          licensePlate: licensePlate.toUpperCase(),
          isActive: true
        }
      });

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          message: 'A vehicle with this license plate is already registered'
        });
      }

      // Check seat count is reasonable for the vehicle type
      const minSeats = model.type === 'TRUCK' ? 2 : 4;
      const maxSeats = model.type === 'VAN' ? 15 : model.type === 'SUV' ? 8 : 5;

      if (seats < minSeats || seats > maxSeats) {
        return res.status(400).json({
          success: false,
          message: `Seat count must be between ${minSeats} and ${maxSeats} for ${model.type}`
        });
      }

      // Create vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          userId,
          makeId,
          modelId,
          year,
          color: color.trim(),
          licensePlate: licensePlate.toUpperCase(),
          type: model.type,
          seats,
          features
        },
        include: {
          make: true,
          model: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Vehicle added successfully',
        data: { vehicle }
      });

    } catch (error) {
      console.error('Add vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add vehicle'
      });
    }
  }
);

// Update vehicle
router.put('/:id',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  validate(schemas.vehicleCreation),
  async (req, res) => {
    try {
      const vehicleId = req.params.id;
      const userId = req.user.id;

      // Verify vehicle belongs to user
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId,
          isActive: true
        }
      });

      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or not owned by user'
        });
      }

      // Check if license plate conflicts with other vehicles
      if (req.body.licensePlate !== existingVehicle.licensePlate) {
        const conflictVehicle = await prisma.vehicle.findFirst({
          where: {
            licensePlate: req.body.licensePlate.toUpperCase(),
            isActive: true,
            id: {
              not: vehicleId
            }
          }
        });

        if (conflictVehicle) {
          return res.status(409).json({
            success: false,
            message: 'A vehicle with this license plate is already registered'
          });
        }
      }

      // Update vehicle
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          makeId: req.body.makeId,
          modelId: req.body.modelId,
          year: req.body.year,
          color: req.body.color.trim(),
          licensePlate: req.body.licensePlate.toUpperCase(),
          seats: req.body.seats,
          features: req.body.features || []
        },
        include: {
          make: true,
          model: true
        }
      });

      res.json({
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle: updatedVehicle }
      });

    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle'
      });
    }
  }
);

// Delete vehicle (soft delete)
router.delete('/:id',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const vehicleId = req.params.id;
      const userId = req.user.id;

      // Verify vehicle belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId,
          isActive: true
        },
        include: {
          rides: {
            where: {
              status: 'ACTIVE',
              departureDateTime: {
                gte: new Date()
              }
            }
          }
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or not owned by user'
        });
      }

      // Check if vehicle has active rides
      if (vehicle.rides.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete vehicle with active rides. Please cancel rides first.'
        });
      }

      // Soft delete vehicle
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { isActive: false }
      });

      res.json({
        success: true,
        message: 'Vehicle deleted successfully'
      });

    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle'
      });
    }
  }
);

// Get vehicle details
router.get('/:id',
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const vehicleId = req.params.id;

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          make: true,
          model: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              driverRating: true
            }
          }
        }
      });

      if (!vehicle || !vehicle.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Get vehicle's ride history (last 5 completed rides)
      const recentRides = await prisma.ride.findMany({
        where: {
          vehicleId,
          status: 'COMPLETED'
        },
        include: {
          originCity: true,
          destinationCity: true
        },
        orderBy: {
          departureDateTime: 'desc'
        },
        take: 5
      });

      res.json({
        success: true,
        data: {
          vehicle,
          recentRides
        }
      });

    } catch (error) {
      console.error('Get vehicle details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle details'
      });
    }
  }
);

// Get vehicle statistics (for owner)
router.get('/:id/stats',
  authenticateToken,
  requireRole('DRIVER'),
  validateParams(schemas.uuidParam),
  async (req, res) => {
    try {
      const vehicleId = req.params.id;
      const userId = req.user.id;

      // Verify ownership
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or not owned by user'
        });
      }

      // Get statistics
      const stats = await Promise.all([
        // Total rides
        prisma.ride.count({
          where: { vehicleId, status: 'COMPLETED' }
        }),
        
        // Total distance (approximate)
        prisma.ride.findMany({
          where: { vehicleId, status: 'COMPLETED' },
          include: {
            originCity: true,
            destinationCity: true
          }
        }),
        
        // Total passengers transported
        prisma.booking.aggregate({
          where: {
            ride: {
              vehicleId,
              status: 'COMPLETED'
            },
            status: 'COMPLETED'
          },
          _sum: {
            seatsBooked: true
          }
        }),
        
        // Revenue generated
        prisma.booking.aggregate({
          where: {
            ride: {
              vehicleId,
              status: 'COMPLETED'
            },
            status: 'COMPLETED'
          },
          _sum: {
            totalAmount: true
          }
        })
      ]);

      const [totalRides, rideDetails, passengersTransported, revenueGenerated] = stats;

      // Calculate total distance
      const totalDistance = rideDetails.reduce((sum, ride) => {
        const distance = calculateDistance(
          ride.originCity.latitude,
          ride.originCity.longitude,
          ride.destinationCity.latitude,
          ride.destinationCity.longitude
        );
        return sum + distance;
      }, 0);

      res.json({
        success: true,
        data: {
          totalRides,
          totalDistance: Math.round(totalDistance),
          passengersTransported: passengersTransported._sum.seatsBooked || 0,
          revenueGenerated: revenueGenerated._sum.totalAmount || 0,
          averageDistancePerRide: totalRides > 0 ? Math.round(totalDistance / totalRides) : 0
        }
      });

    } catch (error) {
      console.error('Get vehicle stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle statistics'
      });
    }
  }
);

module.exports = router;