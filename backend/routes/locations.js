const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { calculateDistance } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get all cities with optional province filter
router.get('/cities', async (req, res) => {
  try {
    const { province, search, country = 'Canada' } = req.query;

    const where = {
      country,
      isActive: true
    };

    if (province) {
      where.province = province;
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
          province: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: [
        { province: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group by province for easier frontend handling
    const citiesByProvince = cities.reduce((acc, city) => {
      if (!acc[city.province]) {
        acc[city.province] = [];
      }
      acc[city.province].push(city);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        cities,
        citiesByProvince,
        totalCities: cities.length
      }
    });

  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities'
    });
  }
});

// Search cities with autocomplete
router.get('/cities/search', async (req, res) => {
  try {
    const { q, limit = 10, province } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const where = {
      isActive: true,
      name: {
        contains: q,
        mode: 'insensitive'
      }
    };

    if (province) {
      where.province = province;
    }

    const cities = await prisma.city.findMany({
      where,
      take: parseInt(limit),
      orderBy: [
        {
          name: {
            sort: 'asc',
            // Prioritize exact matches
          }
        }
      ]
    });

    // Sort to prioritize cities that start with the search query
    const sortedCities = cities.sort((a, b) => {
      const aStartsWith = a.name.toLowerCase().startsWith(q.toLowerCase());
      const bStartsWith = b.name.toLowerCase().startsWith(q.toLowerCase());
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      data: {
        cities: sortedCities,
        query: q,
        hasMore: cities.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Search cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search cities'
    });
  }
});

// Get city details by ID
router.get('/cities/:id', async (req, res) => {
  try {
    const cityId = req.params.id;

    const city = await prisma.city.findUnique({
      where: { id: cityId }
    });

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Get nearby cities (within 100km)
    const allCities = await prisma.city.findMany({
      where: {
        isActive: true,
        id: {
          not: cityId
        }
      }
    });

    const nearbyCities = allCities
      .map(nearbyCity => ({
        ...nearbyCity,
        distance: calculateDistance(
          city.latitude,
          city.longitude,
          nearbyCity.latitude,
          nearbyCity.longitude
        )
      }))
      .filter(nearbyCity => nearbyCity.distance <= 100)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    // Get ride statistics for this city
    const rideStats = await Promise.all([
      prisma.ride.count({
        where: {
          OR: [
            { originCityId: cityId },
            { destinationCityId: cityId }
          ],
          status: 'ACTIVE',
          departureDateTime: {
            gte: new Date()
          }
        }
      }),
      prisma.ride.count({
        where: {
          OR: [
            { originCityId: cityId },
            { destinationCityId: cityId }
          ],
          status: 'COMPLETED',
          departureDateTime: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        city,
        nearbyCities,
        stats: {
          activeRides: rideStats[0],
          completedRidesLast30Days: rideStats[1]
        }
      }
    });

  } catch (error) {
    console.error('Get city details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city details'
    });
  }
});

// Get all Canadian provinces
router.get('/provinces', async (req, res) => {
  try {
    const provinces = await prisma.city.groupBy({
      by: ['province'],
      where: {
        country: 'Canada',
        isActive: true
      },
      _count: {
        id: true
      },
      orderBy: {
        province: 'asc'
      }
    });

    const provinceList = provinces.map(p => ({
      code: p.province,
      name: getProvinceName(p.province),
      cityCount: p._count.id
    }));

    res.json({
      success: true,
      data: {
        provinces: provinceList
      }
    });

  } catch (error) {
    console.error('Get provinces error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provinces'
    });
  }
});

// Get popular routes
router.get('/routes/popular', async (req, res) => {
  try {
    const { limit = 10, period = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get most popular routes based on completed rides
    const popularRoutes = await prisma.ride.groupBy({
      by: ['originCityId', 'destinationCityId'],
      where: {
        status: 'COMPLETED',
        departureDateTime: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: parseInt(limit)
    });

    // Get city details for each route
    const routesWithCityDetails = await Promise.all(
      popularRoutes.map(async (route) => {
        const [originCity, destinationCity] = await Promise.all([
          prisma.city.findUnique({
            where: { id: route.originCityId }
          }),
          prisma.city.findUnique({
            where: { id: route.destinationCityId }
          })
        ]);

        const distance = calculateDistance(
          originCity.latitude,
          originCity.longitude,
          destinationCity.latitude,
          destinationCity.longitude
        );

        return {
          originCity,
          destinationCity,
          tripCount: route._count.id,
          distance: Math.round(distance)
        };
      })
    );

    res.json({
      success: true,
      data: {
        routes: routesWithCityDetails,
        period: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Get popular routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular routes'
    });
  }
});

// Calculate distance between two cities
router.post('/distance', async (req, res) => {
  try {
    const { originCityId, destinationCityId } = req.body;

    if (!originCityId || !destinationCityId) {
      return res.status(400).json({
        success: false,
        message: 'Both origin and destination city IDs are required'
      });
    }

    const [originCity, destinationCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: originCityId } }),
      prisma.city.findUnique({ where: { id: destinationCityId } })
    ]);

    if (!originCity || !destinationCity) {
      return res.status(404).json({
        success: false,
        message: 'One or both cities not found'
      });
    }

    const distance = calculateDistance(
      originCity.latitude,
      originCity.longitude,
      destinationCity.latitude,
      destinationCity.longitude
    );

    // Calculate estimated travel time (average 80 km/h)
    const estimatedTravelTimeMinutes = Math.round((distance / 80) * 60);

    res.json({
      success: true,
      data: {
        originCity: {
          id: originCity.id,
          name: originCity.name,
          province: originCity.province
        },
        destinationCity: {
          id: destinationCity.id,
          name: destinationCity.name,
          province: destinationCity.province
        },
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        estimatedTravelTimeMinutes,
        estimatedTravelTimeHours: Math.round(estimatedTravelTimeMinutes / 6) / 10 // Round to 1 decimal
      }
    });

  } catch (error) {
    console.error('Calculate distance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate distance'
    });
  }
});

// Helper function to get full province names
function getProvinceName(code) {
  const provinceNames = {
    'AB': 'Alberta',
    'BC': 'British Columbia',
    'MB': 'Manitoba',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'NS': 'Nova Scotia',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
    'ON': 'Ontario',
    'PE': 'Prince Edward Island',
    'QC': 'Quebec',
    'SK': 'Saskatchewan',
    'YT': 'Yukon'
  };
  
  return provinceNames[code] || code;
}

module.exports = router;