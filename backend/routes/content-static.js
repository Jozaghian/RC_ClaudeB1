const express = require('express');
const router = express.Router();

// Static content data - Privacy Policy and Terms of Service
const contentData = {
  'privacy-policy': {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    content: `# Privacy Policy

Last updated: September 2024

## Information We Collect

### Personal Information
• Full name and preferred name
• Email address and phone number
• Profile photos and vehicle information
• Payment and banking details for transactions
• Location data for ride matching and safety

### Usage Information
• App usage patterns and preferences
• Ride history and booking data
• Communication records with other users
• Device information and IP addresses

## How We Use Your Information

### Service Provision
• Facilitate ride sharing and carpooling connections
• Process payments and maintain transaction records
• Provide customer support and resolve disputes
• Ensure platform safety and security

### Communication
• Send booking confirmations and ride updates
• Provide important safety and security notifications
• Share promotional offers and platform updates
• Facilitate communication between drivers and passengers

## Information Sharing

### With Other Users
• Basic profile information for ride matching
• Contact details only after confirmed bookings
• Ratings and reviews for trust building
• Location information during active rides

### With Service Providers
• Payment processors for transaction handling
• SMS and email services for notifications
• Cloud storage providers for data backup
• Analytics services for platform improvement

### Legal Compliance
• Law enforcement when legally required
• Regulatory authorities for compliance
• Court orders and legal proceedings
• Safety investigations and incident reports

## Data Protection

### Security Measures
• End-to-end encryption for sensitive data
• Secure payment processing (PCI DSS compliant)
• Regular security audits and penetration testing
• Staff training on privacy and security protocols

### Data Retention
• Active account data retained while account exists
• Transaction records kept for 7 years for legal compliance
• Communication logs retained for 2 years
• Location data automatically deleted after 30 days

## Your Rights

### Access and Control
• View and download your personal data
• Update profile information at any time
• Delete your account and associated data
• Opt out of marketing communications

### Data Portability
• Export your ride history and preferences
• Transfer data to other compatible services
• Receive data in standard, machine-readable format

## Contact Information

For privacy-related questions or concerns:
• Email: privacy@rideclubnet.com
• Phone: 1-800-RIDE-CLUB
• Mail: Ride Club Privacy Office, Canada

## Updates to This Policy

We may update this Privacy Policy periodically. Users will be notified of significant changes via email and app notifications. Continued use constitutes acceptance of updated terms.`,
    updatedAt: '2024-09-26T00:00:00.000Z'
  },
  'terms-of-service': {
    id: 'terms-of-service',
    title: 'Terms of Service',
    content: `# Terms of Service

Last updated: September 2024

## Acceptance of Terms

By using Ride Club, you agree to these Terms of Service and our Privacy Policy. If you disagree with any part, please discontinue use immediately.

## Platform Overview

### Service Description
Ride Club is a peer-to-peer ridesharing platform connecting drivers and passengers across Canada. We facilitate introductions and provide communication tools but are not a transportation company.

### User Responsibilities
• Provide accurate and complete profile information
• Maintain respectful communication with other users
• Follow all applicable traffic laws and regulations
• Report safety concerns or inappropriate behavior

## Account Requirements

### Eligibility
• Must be 18 years or older
• Possess valid government-issued identification
• For drivers: valid driver's license and vehicle registration
• Comply with local ridesharing regulations

### Account Security
• Maintain confidentiality of login credentials
• Immediately report unauthorized account access
• Use only your own account (no sharing permitted)
• Keep profile information current and accurate

## Driver Requirements

### Vehicle Standards
• Valid registration and insurance coverage
• Regular safety inspections and maintenance
• Clean, safe, and roadworthy condition
• Compliance with local vehicle requirements

### Driver Conduct
• Safe and courteous driving practices
• Verification of passenger identity before departure
• Respect passenger comfort and safety preferences
• Maintain professional communication standards

## Passenger Guidelines

### Booking Conduct
• Provide accurate pickup and destination information
• Arrive punctually at designated pickup locations
• Respect driver's vehicle and driving preferences
• Cancel bookings promptly if plans change

### Payment Obligations
• Pay agreed-upon fare amounts promptly
• Cover any additional costs (tolls, parking fees)
• Report payment issues immediately
• Respect cancellation and refund policies

## Platform Rules

### Prohibited Activities
• Discriminatory behavior based on protected characteristics
• Harassment, threats, or abusive language
• Fraudulent bookings or payment methods
• Illegal activities or substance abuse

### Content Guidelines
• Keep communications relevant to ride coordination
• Respect privacy and confidentiality
• Report inappropriate content or behavior
• Maintain professional interaction standards

## Financial Terms

### Payment Processing
• All transactions processed through secure third-party providers
• Platform fees clearly disclosed before booking confirmation
• Refunds processed according to stated policies
• Dispute resolution available for payment issues

### Pricing Transparency
• All costs clearly displayed before booking
• No hidden fees or surprise charges
• Dynamic pricing during high-demand periods
• Credit system for drivers to post rides

## Safety and Security

### Background Checks
• Identity verification required for all users
• Ongoing monitoring of user behavior and feedback
• Immediate suspension for safety violations
• Cooperation with law enforcement when necessary

### Emergency Procedures
• 24/7 safety support hotline available
• GPS tracking during active rides
• Emergency contact notification system
• Incident reporting and investigation protocols

## Limitation of Liability

### Platform Role
Ride Club facilitates connections but is not responsible for:
• Driver or passenger conduct during rides
• Vehicle accidents or mechanical failures
• Personal property loss or damage
• Third-party actions or services

### User Responsibility
Users assume responsibility for:
• Personal safety decisions and precautions
• Verification of other users' credentials
• Compliance with local laws and regulations
• Insurance coverage for ride activities

## Termination

### Account Suspension
Accounts may be suspended or terminated for:
• Violation of these Terms of Service
• Safety concerns or inappropriate behavior
• Fraudulent or illegal activities
• Extended periods of inactivity

### Effect of Termination
• Immediate loss of platform access
• Forfeiture of unused credits or balances
• Removal of all account data and history
• Prohibition from creating new accounts

## Contact Information

For questions about these Terms:
• Email: legal@rideclubnet.com
• Phone: 1-800-RIDE-CLUB
• Mail: Ride Club Legal Department, Canada

## Updates to Terms

These Terms may be updated periodically. Users will receive notification of changes via email and app notifications. Continued platform use constitutes acceptance of updated Terms.`,
    updatedAt: '2024-09-26T00:00:00.000Z'
  }
};

// GET /api/content/:key - Get specific content
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;

    if (!contentData[key]) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: contentData[key]
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// GET /api/content - Get all content
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.values(contentData)
    });
  } catch (error) {
    console.error('Error fetching all content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

module.exports = router;