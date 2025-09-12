const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Submit a rating
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { rideId, ratedUserId, rating, comment } = req.body;
    const raterId = req.user.id;

    // Validate input
    if (!rideId || !ratedUserId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if rating already exists
    const existingRating = await prisma.rating.findFirst({
      where: {
        rideId,
        raterId,
        ratedUserId
      }
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this user for this ride' });
    }

    // Create the rating
    const newRating = await prisma.rating.create({
      data: {
        rideId,
        raterId,
        ratedUserId,
        rating,
        comment,
        createdAt: new Date()
      }
    });

    res.status(201).json(newRating);
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ratings for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await prisma.rating.findMany({
      where: { ratedUserId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;