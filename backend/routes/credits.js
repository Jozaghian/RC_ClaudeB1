const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireVerification } = require('../middleware/auth');
const { validate, validateParams, schemas } = require('../middleware/validation');
const { calculatePackagePrice } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// Get all available credit packages
router.get('/packages', async (req, res) => {
  try {
    // Get base rate from system settings
    const baseRateSetting = await prisma.systemSetting.findUnique({
      where: { key: 'base_ride_rate' }
    });

    const baseRate = parseFloat(baseRateSetting?.value || '1.00');

    // Get active packages
    const packages = await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    // Calculate current prices based on base rate
    const packagesWithPricing = packages.map(pkg => {
      const calculatedPrice = calculatePackagePrice(baseRate, pkg.rideCount, pkg.discountPercentage);
      
      return {
        ...pkg,
        price: calculatedPrice,
        baseRate,
        savings: pkg.discountPercentage > 0 
          ? (baseRate * pkg.rideCount) - calculatedPrice 
          : 0,
        pricePerRide: calculatedPrice / pkg.rideCount
      };
    });

    res.json({
      success: true,
      data: {
        packages: packagesWithPricing,
        baseRate,
        currency: 'CAD'
      }
    });

  } catch (error) {
    console.error('Get credit packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit packages'
    });
  }
});

// Get driver's credit balance and history
router.get('/balance',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const driverId = req.user.id;

      // Get current credits
      const driverCredits = await prisma.driverCredit.findMany({
        where: {
          driverId,
          creditsRemaining: {
            gt: 0
          }
        },
        include: {
          package: true
        },
        orderBy: {
          purchasedAt: 'asc'
        }
      });

      // Calculate total balance
      const totalCredits = driverCredits.reduce((sum, credit) => {
        return sum + credit.creditsRemaining;
      }, 0);

      // Get recent transactions
      const transactions = await prisma.creditTransaction.findMany({
        where: {
          credit: {
            driverId
          }
        },
        include: {
          credit: {
            include: {
              package: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      // Get purchase history
      const purchaseHistory = await prisma.driverCredit.findMany({
        where: { driverId },
        include: {
          package: true,
          payment: true
        },
        orderBy: {
          purchasedAt: 'desc'
        },
        take: 10
      });

      res.json({
        success: true,
        data: {
          totalCredits,
          activeCredits: driverCredits,
          recentTransactions: transactions,
          purchaseHistory,
          canPostRide: totalCredits > 0
        }
      });

    } catch (error) {
      console.error('Get credit balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch credit balance'
      });
    }
  }
);

// Purchase credit package
router.post('/purchase',
  authenticateToken,
  requireRole('DRIVER'),
  requireVerification('phone'),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const { packageId, paymentMethod = 'CREDIT_CARD' } = req.body;

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: 'Package ID is required'
        });
      }

      // Get package details
      const creditPackage = await prisma.creditPackage.findUnique({
        where: { id: packageId }
      });

      if (!creditPackage || !creditPackage.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Credit package not found or not available'
        });
      }

      // Get base rate for price calculation
      const baseRateSetting = await prisma.systemSetting.findUnique({
        where: { key: 'base_ride_rate' }
      });

      const baseRate = parseFloat(baseRateSetting?.value || '1.00');
      const finalPrice = calculatePackagePrice(baseRate, creditPackage.rideCount, creditPackage.discountPercentage);

      // Get user details for payment processing
      const user = await prisma.user.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true
        }
      });

      // Create driver credit record
      const driverCredit = await prisma.driverCredit.create({
        data: {
          driverId,
          packageId,
          creditsPurchased: creditPackage.rideCount,
          creditsRemaining: creditPackage.rideCount,
          amountPaid: finalPrice
        },
        include: {
          package: true
        }
      });

      // Handle different payment methods
      if (paymentMethod === 'CREDIT_CARD') {
        // Create payment record for Stripe processing
        const payment = await prisma.payment.create({
          data: {
            amount: finalPrice,
            paymentMethod: 'CREDIT_CARD',
            status: 'PENDING',
            creditPurchaseId: driverCredit.id,
            metadata: {
              customerId: user.id,
              customerEmail: user.email,
              packageName: creditPackage.name,
              rideCount: creditPackage.rideCount
            }
          }
        });

        // Return payment intent details for client-side Stripe processing
        res.status(201).json({
          success: true,
          message: 'Credit purchase initiated. Complete payment to receive credits.',
          data: {
            purchase: driverCredit,
            payment: {
              id: payment.id,
              amount: finalPrice,
              currency: 'CAD'
            },
            requiresPayment: true,
            // In production, you would create a Stripe PaymentIntent here
            clientSecret: `pi_test_${payment.id}` // Placeholder for testing
          }
        });

      } else {
        // For testing or alternative payment methods
        await prisma.payment.create({
          data: {
            amount: finalPrice,
            paymentMethod,
            status: 'COMPLETED',
            creditPurchaseId: driverCredit.id,
            completedAt: new Date()
          }
        });

        res.status(201).json({
          success: true,
          message: 'Credits purchased successfully!',
          data: {
            purchase: driverCredit,
            creditsAdded: creditPackage.rideCount,
            amountCharged: finalPrice,
            currency: 'CAD'
          }
        });
      }

    } catch (error) {
      console.error('Purchase credits error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to purchase credits'
      });
    }
  }
);

// Confirm credit card payment (webhook handler)
router.post('/payment/confirm',
  async (req, res) => {
    try {
      const { paymentId, status, stripePaymentId } = req.body;

      // Find payment record
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
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

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: status === 'succeeded' ? 'COMPLETED' : 'FAILED',
          stripePaymentId,
          completedAt: status === 'succeeded' ? new Date() : null
        }
      });

      if (status === 'succeeded') {
        // Credits are already created, just send confirmation
        // TODO: Send SMS confirmation
        // TODO: Send email receipt

        res.json({
          success: true,
          message: 'Payment confirmed and credits activated',
          data: {
            creditsAdded: payment.creditPurchase.creditsPurchased,
            totalCredits: payment.creditPurchase.creditsRemaining
          }
        });
      } else {
        // Payment failed - remove the credit record
        await prisma.driverCredit.delete({
          where: { id: payment.creditPurchaseId }
        });

        res.json({
          success: false,
          message: 'Payment failed. Credits not added.',
          error: 'payment_failed'
        });
      }

    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment confirmation'
      });
    }
  }
);

// Get credit transactions (driver)
router.get('/transactions',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const { page = 1, limit = 20, type } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        credit: { driverId }
      };

      if (type) {
        where.transactionType = type;
      }

      const [transactions, total] = await Promise.all([
        prisma.creditTransaction.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            credit: {
              include: {
                package: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.creditTransaction.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  }
);

// Get credit usage statistics (driver)
router.get('/stats',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const { period = '30' } = req.query; // days

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Get total credits purchased
      const totalPurchased = await prisma.driverCredit.aggregate({
        where: { driverId },
        _sum: {
          creditsPurchased: true,
          amountPaid: true
        }
      });

      // Get credits used in period
      const creditsUsed = await prisma.creditTransaction.count({
        where: {
          credit: {
            driverId
          },
          transactionType: 'ride_post',
          createdAt: {
            gte: startDate
          }
        }
      });

      // Get current balance
      const currentCredits = await prisma.driverCredit.aggregate({
        where: {
          driverId,
          creditsRemaining: {
            gt: 0
          }
        },
        _sum: {
          creditsRemaining: true
        }
      });

      // Get monthly usage
      const monthlyUsage = await prisma.creditTransaction.findMany({
        where: {
          credit: {
            driverId
          },
          transactionType: 'ride_post',
          createdAt: {
            gte: startDate
          }
        },
        select: {
          createdAt: true,
          creditsUsed: true
        }
      });

      // Group by month
      const usageByMonth = monthlyUsage.reduce((acc, transaction) => {
        const month = transaction.createdAt.toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + transaction.creditsUsed;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          totalCreditsPurchased: totalPurchased._sum.creditsPurchased || 0,
          totalAmountSpent: totalPurchased._sum.amountPaid || 0,
          currentBalance: currentCredits._sum.creditsRemaining || 0,
          creditsUsedInPeriod: creditsUsed,
          usageByMonth,
          period: parseInt(period)
        }
      });

    } catch (error) {
      console.error('Get credit stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch credit statistics'
      });
    }
  }
);

// Admin: Get all credit transactions
router.get('/admin/transactions',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, userId, packageId, transactionType } = req.query;
      const skip = (page - 1) * limit;

      const where = {};

      if (userId) {
        where.credit = {
          driverId: userId
        };
      }

      if (packageId) {
        where.credit = {
          ...where.credit,
          packageId
        };
      }

      if (transactionType) {
        where.transactionType = transactionType;
      }

      const transactions = await prisma.creditTransaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          credit: {
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              package: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const total = await prisma.creditTransaction.count({ where });

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get admin transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  }
);

// Confirm credit purchase (alternative method)
router.post('/confirm-purchase',
  authenticateToken,
  requireRole('DRIVER'),
  async (req, res) => {
    try {
      const { creditPurchaseId, paymentIntentId } = req.body;

      // This is an alternative endpoint for confirming purchases
      // It calls the same logic as the payment/confirm webhook
      const confirmResponse = await prisma.payment.findFirst({
        where: { creditPurchaseId },
        include: {
          creditPurchase: {
            include: {
              package: true
            }
          }
        }
      });

      if (!confirmResponse) {
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }

      // Update payment as completed
      await prisma.payment.update({
        where: { id: confirmResponse.id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Credits purchased successfully',
        data: {
          creditsAdded: confirmResponse.creditPurchase.creditsPurchased,
          totalCredits: confirmResponse.creditPurchase.creditsRemaining
        }
      });

    } catch (error) {
      console.error('Confirm purchase error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm purchase'
      });
    }
  }
);

// Admin: Refund credits to driver
router.post('/admin/refund',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { driverId, credits, reason } = req.body;

      if (!driverId || !credits || credits <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid driver ID and positive credit amount required'
        });
      }

      // Get or create a system package for refunds
      let refundPackage = await prisma.creditPackage.findFirst({
        where: { name: 'Admin Refund' }
      });

      if (!refundPackage) {
        refundPackage = await prisma.creditPackage.create({
          data: {
            name: 'Admin Refund',
            rideCount: 1,
            price: 0,
            discountPercentage: 0,
            isActive: false,
            description: 'System package for admin refunds'
          }
        });
      }

      // Create credit record
      const driverCredit = await prisma.driverCredit.create({
        data: {
          driverId,
          packageId: refundPackage.id,
          creditsPurchased: credits,
          creditsRemaining: credits,
          amountPaid: 0
        }
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          amount: 0,
          paymentMethod: 'CREDIT_CARD', // Doesn't matter for refunds
          status: 'COMPLETED',
          creditPurchaseId: driverCredit.id,
          completedAt: new Date(),
          metadata: {
            refundReason: reason,
            processedBy: req.user.id
          }
        }
      });

      res.json({
        success: true,
        message: 'Credits refunded successfully',
        data: {
          driverId,
          creditsAdded: credits,
          reason
        }
      });

    } catch (error) {
      console.error('Admin refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund'
      });
    }
  }
);

module.exports = router;