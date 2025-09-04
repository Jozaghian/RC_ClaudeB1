const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { sendPaymentConfirmation } = require('../services/twilioService');

const router = express.Router();
const prisma = new PrismaClient();

// Create payment intent for credit purchase
router.post('/create-intent',
  authenticateToken,
  async (req, res) => {
    try {
      const { packageId, paymentMethod = 'CREDIT_CARD' } = req.body;

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: 'Package ID is required'
        });
      }

      // This would create a mock payment intent for development
      // In production, you would integrate with Stripe here
      res.json({
        success: true,
        data: {
          clientSecret: `pi_test_${Date.now()}`,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
          paymentIntentId: `pi_${Date.now()}`
        }
      });

    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent'
      });
    }
  }
);

// Create Stripe payment intent for credit purchase
router.post('/stripe/create-intent',
  authenticateToken,
  async (req, res) => {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      // Get payment record
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          creditPurchase: {
            include: {
              driver: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phoneNumber: true
                }
              },
              package: true
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      if (payment.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Payment is not in pending status'
        });
      }

      // Create or retrieve Stripe customer
      const driver = payment.creditPurchase.driver;
      let customer;

      try {
        // Try to find existing customer
        const customers = await stripe.customers.list({
          email: driver.email,
          limit: 1
        });

        if (customers.data.length > 0) {
          customer = customers.data[0];
        } else {
          // Create new customer
          customer = await stripe.customers.create({
            email: driver.email,
            name: `${driver.firstName} ${driver.lastName}`,
            phone: driver.phoneNumber,
            metadata: {
              userId: driver.id
            }
          });
        }
      } catch (stripeError) {
        console.error('Stripe customer error:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Failed to process customer information'
        });
      }

      // Create payment intent
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(payment.amount * 100), // Convert to cents
          currency: 'cad',
          customer: customer.id,
          metadata: {
            paymentId: payment.id,
            userId: driver.id,
            packageName: payment.creditPurchase.package.name,
            rideCount: payment.creditPurchase.creditsPurchased.toString()
          },
          description: `Ride Club Credits: ${payment.creditPurchase.package.name}`,
          receipt_email: driver.email
        });

        // Update payment record with Stripe details
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            stripePaymentId: paymentIntent.id,
            stripeCustomerId: customer.id
          }
        });

        res.json({
          success: true,
          data: {
            clientSecret: paymentIntent.client_secret,
            customerId: customer.id,
            amount: payment.amount,
            currency: 'CAD',
            description: `${payment.creditPurchase.creditsPurchased} Ride Credits`
          }
        });

      } catch (stripeError) {
        console.error('Stripe payment intent error:', stripeError);
        res.status(500).json({
          success: false,
          message: 'Failed to create payment intent'
        });
      }

    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent'
      });
    }
  }
);

// Stripe webhook handler
router.post('/stripe/webhook', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object);
          break;
          
        case 'payment_intent.canceled':
          await handlePaymentCancellation(event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    const paymentId = paymentIntent.metadata.paymentId;
    
    // Update payment status
    const payment = await prisma.payment.update({
      where: { 
        stripePaymentId: paymentIntent.id 
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        creditPurchase: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                phoneNumber: true
              }
            },
            package: true
          }
        }
      }
    });

    if (payment && payment.creditPurchase) {
      // Send confirmation SMS
      try {
        await sendPaymentConfirmation(
          payment.creditPurchase.driver.phoneNumber,
          {
            amount: payment.amount.toFixed(2),
            packageName: payment.creditPurchase.package.name,
            creditsReceived: payment.creditPurchase.creditsPurchased
          }
        );
      } catch (smsError) {
        console.error('SMS confirmation failed:', smsError);
        // Don't fail the payment for SMS issues
      }

      console.log(`Payment successful: ${payment.amount} CAD for ${payment.creditPurchase.creditsPurchased} credits`);
    }

  } catch (error) {
    console.error('Handle payment success error:', error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
  try {
    // Update payment status
    const payment = await prisma.payment.update({
      where: { 
        stripePaymentId: paymentIntent.id 
      },
      data: {
        status: 'FAILED'
      },
      include: {
        creditPurchase: true
      }
    });

    if (payment && payment.creditPurchase) {
      // Remove the credit record since payment failed
      await prisma.driverCredit.delete({
        where: { id: payment.creditPurchaseId }
      });

      console.log(`Payment failed: removing credit record for payment ${payment.id}`);
    }

  } catch (error) {
    console.error('Handle payment failure error:', error);
    throw error;
  }
}

// Handle payment cancellation
async function handlePaymentCancellation(paymentIntent) {
  try {
    // Update payment status
    const payment = await prisma.payment.update({
      where: { 
        stripePaymentId: paymentIntent.id 
      },
      data: {
        status: 'FAILED'
      },
      include: {
        creditPurchase: true
      }
    });

    if (payment && payment.creditPurchase) {
      // Remove the credit record since payment was cancelled
      await prisma.driverCredit.delete({
        where: { id: payment.creditPurchaseId }
      });

      console.log(`Payment cancelled: removing credit record for payment ${payment.id}`);
    }

  } catch (error) {
    console.error('Handle payment cancellation error:', error);
    throw error;
  }
}

// Get payment status
router.get('/:id/status',
  authenticateToken,
  async (req, res) => {
    try {
      const paymentId = req.params.id;
      const userId = req.user.id;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          creditPurchase: {
            include: {
              driver: {
                select: { id: true }
              },
              package: true
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Verify user owns this payment
      if (payment.creditPurchase.driver.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          package: payment.creditPurchase.package
        }
      });

    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment status'
      });
    }
  }
);

// Admin: Get payment analytics
router.get('/admin/analytics',
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { period = '30' } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Total revenue
      const totalRevenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      // Revenue by package
      const revenueByPackage = await prisma.payment.groupBy({
        by: ['creditPurchaseId'],
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      // Payment method distribution
      const paymentMethods = await prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      // Daily revenue (last 7 days)
      const dailyRevenue = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          amount: true,
          completedAt: true
        }
      });

      const dailyStats = dailyRevenue.reduce((acc, payment) => {
        const date = payment.completedAt.toISOString().slice(0, 10);
        acc[date] = (acc[date] || 0) + payment.amount;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          totalRevenue: totalRevenue._sum.amount || 0,
          totalTransactions: totalRevenue._count,
          revenueByPackage,
          paymentMethods,
          dailyStats,
          period: parseInt(period)
        }
      });

    } catch (error) {
      console.error('Get payment analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment analytics'
      });
    }
  }
);

// Confirm payment (alternative to webhook)
router.post('/confirm',
  authenticateToken,
  async (req, res) => {
    try {
      const { paymentIntentId, clientSecret } = req.body;

      // This is a simplified confirmation endpoint
      // In production, you would verify with Stripe API
      
      // For development, we'll mock success
      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          status: 'succeeded',
          paymentIntentId
        }
      });

    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm payment'
      });
    }
  }
);

module.exports = router;