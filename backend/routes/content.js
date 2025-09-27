const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get public content (Privacy Policy, Terms of Service, etc.)
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const content = await prisma.contentPage.findUnique({
      where: {
        key,
        isPublished: true
      },
      select: {
        id: true,
        key: true,
        title: true,
        content: true,
        updatedAt: true
      }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content'
    });
  }
});

// Admin: Get all content pages
router.get('/admin/pages',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { published } = req.query;

      const where = {};
      if (published === 'true') {
        where.isPublished = true;
      } else if (published === 'false') {
        where.isPublished = false;
      }

      const pages = await prisma.contentPage.findMany({
        where,
        select: {
          id: true,
          key: true,
          title: true,
          isPublished: true,
          lastUpdatedBy: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.json({
        success: true,
        data: pages
      });

    } catch (error) {
      console.error('Get all content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve content pages'
      });
    }
  }
);

// Admin: Get content page by ID with full details
router.get('/admin/pages/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const page = await prisma.contentPage.findUnique({
        where: { id }
      });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Content page not found'
        });
      }

      res.json({
        success: true,
        data: page
      });

    } catch (error) {
      console.error('Get content page error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve content page'
      });
    }
  }
);

// Admin: Create new content page
router.post('/admin/pages',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { key, title, content, isPublished = true } = req.body;
      const userId = req.user.id;

      if (!key || !title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Key, title, and content are required'
        });
      }

      // Check if key already exists
      const existingPage = await prisma.contentPage.findUnique({
        where: { key }
      });

      if (existingPage) {
        return res.status(409).json({
          success: false,
          message: 'Content page with this key already exists'
        });
      }

      const newPage = await prisma.contentPage.create({
        data: {
          key,
          title,
          content,
          isPublished,
          lastUpdatedBy: userId
        }
      });

      res.status(201).json({
        success: true,
        message: 'Content page created successfully',
        data: newPage
      });

    } catch (error) {
      console.error('Create content page error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create content page'
      });
    }
  }
);

// Admin: Update content page
router.put('/admin/pages/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, isPublished } = req.body;
      const userId = req.user.id;

      const existingPage = await prisma.contentPage.findUnique({
        where: { id }
      });

      if (!existingPage) {
        return res.status(404).json({
          success: false,
          message: 'Content page not found'
        });
      }

      const updatedPage = await prisma.contentPage.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(typeof isPublished === 'boolean' && { isPublished }),
          lastUpdatedBy: userId,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Content page updated successfully',
        data: updatedPage
      });

    } catch (error) {
      console.error('Update content page error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update content page'
      });
    }
  }
);

// Admin: Delete content page
router.delete('/admin/pages/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingPage = await prisma.contentPage.findUnique({
        where: { id }
      });

      if (!existingPage) {
        return res.status(404).json({
          success: false,
          message: 'Content page not found'
        });
      }

      await prisma.contentPage.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Content page deleted successfully'
      });

    } catch (error) {
      console.error('Delete content page error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete content page'
      });
    }
  }
);

// Initialize default content pages (Privacy Policy and Terms of Service)
router.post('/admin/initialize-defaults',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const defaultPages = [
        {
          key: 'privacy-policy',
          title: 'Privacy Policy',
          content: `Privacy Policy
Last Updated: December 5, 2024
Version: 1.1

Ride Club Inc. ("Ride Club," "we," "our," or "the Service") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.

## 1. Information We Collect
• Registration Data: When you create an account, we collect basic details such as your name, email address, and phone number.
• Cookies & Usage Data: We use cookies to make login easier and to improve your experience. Some features may not work properly if cookies are disabled.
• Log Data: We collect IP addresses and technical information to analyze trends, improve the Service, and ensure security.
• Identity Verification: We may ask for ID documents during registration to verify identity. These images are deleted once verification is complete.

## 2. How We Use Information
• To verify accounts and provide access to the Service.
• To communicate with Members about their account or service updates.
• To improve safety, prevent fraud, and comply with legal obligations.
• To improve user experience through analytics and service optimization.

## 3. Data Sharing and Legal Compliance
We do not sell personal information. We may share data only when required:
• With government or law enforcement, if required by law.
• To prevent fraud, protect safety, or enforce our Terms of Service.
• With trusted service providers (e.g., payment processors, hosting, email providers) who are bound by confidentiality and security obligations.

## 4. Data Retention
• We keep information while your account is active.
• When you delete your account, your data will be removed from our systems within 90 days, except where law requires longer retention.

## 5. Your Rights
• You may request to access, correct, or delete your data at any time.
• You can cancel your account via Account Settings > Close Account or by contacting us.
• You may opt out of marketing emails by using the unsubscribe link provided in those messages.

## 6. Children's Privacy
Ride Club is not intended for individuals under 18 years of age. We do not knowingly collect information from minors. If we become aware that a minor has registered, their account will be deleted.

## 7. App Permissions and Disclosures
• Android: We may collect your phone number and limited device information. Phone numbers are shared only between Members who have accepted a trip together. Installed application information is not shared with third parties.
• iOS: We comply with Apple's App Privacy requirements and do not track users across third-party apps or websites.

## 8. Security
We take reasonable measures to protect data, including encryption and access controls. However, no method of storage or transmission is completely secure. Members use Ride Club at their own risk.

## 9. International Data Transfers
If data is stored outside Canada (e.g., on U.S.-based servers), we ensure safeguards are in place to comply with Canadian privacy law (PIPEDA).

## 10. Governing Law
This Privacy Policy is governed by the laws of Canada and the Province of Ontario, without regard to conflict of law provisions.

## 11. Changes to This Policy
We may update this Privacy Policy from time to time. When we make significant changes, we will notify Members by email and post the updated version here.

## 12. Contact Us
For questions, requests, or complaints regarding privacy, contact us at:
📧 privacy@rideclubnet.com
📍 Ride Club Inc., 720 Cambrian Heights Dr, Greater Sudbury P3C5L8, Canada`
        },
        {
          key: 'terms-of-service',
          title: 'Terms of Service',
          content: `Terms of Service
Last Updated: November 4, 2024

Welcome to Ride Club ("Company," "we," "our," or "us"), a company registered in Canada under the Canada Business Corporations Act. We operate the website https://www.rideclubnet.com (the "Site"), the mobile application Ride Club (the "App"), and related services (collectively, the "Services").

By using our Services, you agree to these Terms of Service ("Terms"). If you do not agree, you must not use the Services.

## 1. Nature of the Service
Ride Club is a carpooling platform where Drivers and Passengers can connect to arrange shared rides. Ride Club is not a taxi service, transportation provider, insurer, agent, or broker. We do not control or guarantee the actions of Members, and we are not a party to any agreement between Drivers and Passengers.

All arrangements for rides, including safety, timing, pick-up/drop-off, and cost, are the sole responsibility of the Members involved.

## 2. Eligibility
• You must be at least 18 years old and legally able to enter into binding agreements.
• You may only register for an account on your own behalf.
• By using the Services, you confirm that the information you provide is accurate and up to date.

## 3. Intellectual Property
All rights to the Site, App, trademarks, logos, content, and software belong to Ride Club or its licensors. We grant you a limited, revocable, non-transferable license to use the Services for personal, non-commercial purposes.

You may not copy, sell, modify, or distribute our Services or Content without written permission.

## 4. Fees and Payments
Ride Club may introduce service fees, subscription fees, or other charges. We reserve the right to update or change fees at any time, with or without prior notice. By continuing to use the Services after such changes, you agree to the updated fees.

All payments are processed by Stripe, our third-party payment processor. Ride Club does not collect or store your payment details. By making a payment, you agree to Stripe's terms and privacy policy. Ride Club is not responsible for Stripe's handling of your payment information.

## 5. User Responsibilities
When using the Services, you agree to:
• Drive safely and follow all traffic laws (if you are a Driver).
• Treat other Members with respect and avoid harassment or abuse.
• Use the Services only for lawful, non-commercial purposes unless authorized by Ride Club.
• Avoid posting false, offensive, or harmful content.
• Promptly report inappropriate or unsafe behavior to Ride Club.

You acknowledge that Ride Club does not perform criminal background checks and does not guarantee the conduct of Members. You are solely responsible for your safety and decisions when arranging rides.

## 6. Account Suspension and Termination
We may suspend or terminate your account at any time, without notice, if you violate these Terms, misuse the Services, or if necessary for security or legal reasons.

## 7. Limitation of Liability
To the maximum extent permitted by law:
• Ride Club is not liable for accidents, injuries, damages, losses, delays, cancellations, disputes, or other issues arising from rides or interactions between Members.
• Our total liability to you will not exceed the amount you paid to use the Services in the 12 months before any claim.

## 8. Indemnification
You agree to defend, indemnify, and hold harmless Ride Club, its employees, directors, and affiliates from any claims, damages, or expenses arising from your use of the Services, your interactions with other Members, or your violation of these Terms.

## 9. Governing Law & Dispute Resolution
These Terms are governed by the laws of Canada and the Province of Ontario. Any disputes will be resolved exclusively in the courts of Ontario.

## 10. Changes to These Terms
We may update these Terms at any time. If we make significant changes, we will notify you by email or through the App. Continued use of the Services after changes take effect means you accept the revised Terms.

## 11. Contact Us
If you have questions about these Terms, please contact us at:
📧 info@rideclubnet.com
📍 Ride Club Inc., 720 Cambrian Heights Dr, Greater Sudbury P3C5L8, Canada
📞 +1 437-326-5222`
        }
      ];

      const results = [];

      for (const page of defaultPages) {
        // Check if page already exists
        const existing = await prisma.contentPage.findUnique({
          where: { key: page.key }
        });

        if (!existing) {
          const created = await prisma.contentPage.create({
            data: {
              ...page,
              lastUpdatedBy: userId
            }
          });
          results.push(created);
        } else {
          results.push({ ...existing, status: 'already exists' });
        }
      }

      res.json({
        success: true,
        message: 'Default content pages initialized',
        data: results
      });

    } catch (error) {
      console.error('Initialize defaults error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize default content pages'
      });
    }
  }
);

module.exports = router;