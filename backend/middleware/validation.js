const Joi = require('joi');

/**
 * Request body validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Request params validation middleware
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Request query validation middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    req.query = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // Common schemas
  uuidParam: Joi.object({
    id: Joi.string().uuid().required()
  }),

  // Auth schemas
  userRegistration: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    role: Joi.string().valid('DRIVER', 'PASSENGER').default('PASSENGER'),
    preferredName: Joi.string().min(1).max(50).optional()
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Vehicle schemas
  vehicleCreation: Joi.object({
    makeId: Joi.string().uuid().required(),
    modelId: Joi.string().uuid().required(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).required(),
    color: Joi.string().min(1).max(30).required(),
    licensePlate: Joi.string().min(1).max(10).required(),
    seats: Joi.number().integer().min(2).max(15).required(),
    features: Joi.array().items(Joi.string()).default([])
  }),

  // Ride schemas
  rideCreation: Joi.object({
    vehicleId: Joi.string().uuid().required(),
    originCityId: Joi.string().uuid().required(),
    destinationCityId: Joi.string().uuid().required(),
    departureDate: Joi.date().min('now').required(),
    departureTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    availableSeats: Joi.number().integer().min(1).max(8).required(),
    pricePerSeat: Joi.number().positive().precision(2).required(),
    description: Joi.string().max(500).optional(),
    stops: Joi.array().items(Joi.string().uuid()).default([]),
    isReturnRide: Joi.boolean().default(false),
    returnDate: Joi.date().min(Joi.ref('departureDate')).when('isReturnRide', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    returnTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isReturnRide', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    preferences: Joi.object({
      smokingAllowed: Joi.boolean().default(false),
      petsAllowed: Joi.boolean().default(false),
      musicPreference: Joi.string().valid('QUIET', 'BACKGROUND', 'CONVERSATION').default('BACKGROUND'),
      maxDetourMinutes: Joi.number().integer().min(0).max(60).default(15)
    }).default()
  }),

  // Booking schemas
  bookingCreation: Joi.object({
    rideId: Joi.string().uuid().required(),
    seatsBooked: Joi.number().integer().min(1).max(8).required(),
    message: Joi.string().max(200).optional(),
    pickupLocationName: Joi.string().max(100).optional(),
    dropoffLocationName: Joi.string().max(100).optional()
  }),

  // Credit schemas
  creditPurchase: Joi.object({
    package: Joi.string().valid('STARTER', 'REGULAR', 'PREMIUM', 'BUSINESS').required(),
    paymentMethodId: Joi.string().required()
  }),

  // Request schemas
  rideRequest: Joi.object({
    originCityId: Joi.string().uuid().required(),
    destinationCityId: Joi.string().uuid().required(),
    departureDate: Joi.date().min('now').required(),
    flexibleTiming: Joi.boolean().default(false),
    seatsNeeded: Joi.number().integer().min(1).max(8).required(),
    budgetPerSeat: Joi.number().positive().precision(2).required(),
    description: Joi.string().max(500).optional(),
    preferences: Joi.object({
      smokingAllowed: Joi.boolean().default(false),
      petsAllowed: Joi.boolean().default(false),
      genderPreference: Joi.string().valid('ANY', 'MALE', 'FEMALE').default('ANY')
    }).default()
  })
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  schemas
};