import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  ContactSupport as ContactSupportIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  priority: number;
  tags: string[];
}

const HelpPage: React.FC = () => {
  const { actualMode: mode } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Comprehensive FAQ data based on mobile app
  const faqs: FAQ[] = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I create my first ride as a driver?',
      answer: 'After verifying your phone number, go to "Create Ride" from the main navigation. Fill in your departure and destination cities, date, time, available seats, and price per seat. You can also set preferences like no smoking or pets allowed. Make sure to add your vehicle information in your profile first.',
      priority: 1,
      tags: ['create ride', 'driver', 'first ride', 'getting started']
    },
    {
      id: 2,
      category: 'Booking Rides',
      question: 'How do I book a ride as a passenger?',
      answer: 'Search for rides on the "Find Rides" page by entering your departure and destination cities and travel date. Browse available rides, check driver ratings, and click "Book Ride" on the ride that fits your needs. You\'ll need sufficient credits in your account to complete the booking.',
      priority: 1,
      tags: ['book ride', 'passenger', 'find rides', 'search']
    },
    {
      id: 3,
      category: 'Payments & Credits',
      question: 'How does the credit system work?',
      answer: 'Ride Club uses a credit-based payment system. Purchase credit packages through the "Credits" section, then use credits to book rides. Drivers receive credits when passengers book their rides. You can view your credit balance and transaction history in your profile. Credits never expire.',
      priority: 1,
      tags: ['credits', 'payment', 'money', 'balance']
    },
    {
      id: 4,
      category: 'Safety & Verification',
      question: 'How do I verify my phone number?',
      answer: 'Go to your Profile > Settings, find the phone verification section, enter your Canadian phone number, and we\'ll send you a 6-digit verification code via SMS. Enter the code to complete verification. Phone verification is required to create rides and enhances trust.',
      priority: 2,
      tags: ['phone verification', 'verify', 'safety', 'sms']
    },
    {
      id: 5,
      category: 'Ride Requests',
      question: 'What is a ride request and how does it work?',
      answer: 'If no existing rides match your schedule, create a ride request with your travel details on the "Request Ride" page. Drivers can see your request and offer to drive you. You\'ll get notifications when drivers make offers, and you can choose the best one based on price and driver ratings.',
      priority: 2,
      tags: ['ride request', 'custom ride', 'driver offers']
    },
    {
      id: 6,
      category: 'Messaging & Communication',
      question: 'How do I contact my driver or passenger?',
      answer: 'Use the secure in-app messaging system available in your ride details. After booking a ride, you can message each other through the "Messages" section. This keeps your personal contact information private while allowing necessary communication about pickup details and ride updates.',
      priority: 2,
      tags: ['messaging', 'contact', 'communication', 'chat']
    },
    {
      id: 7,
      category: 'Vehicle Management',
      question: 'How do I add or update my vehicle information?',
      answer: 'Go to your Profile > Vehicle Management to add your vehicle details including make, model, year, color, and license plate. This information helps passengers identify your car and builds trust. You need at least one verified vehicle to create rides as a driver.',
      priority: 2,
      tags: ['vehicle', 'car', 'driver', 'license plate']
    },
    {
      id: 8,
      category: 'Ratings & Reviews',
      question: 'How do ratings work in Ride Club?',
      answer: 'After each completed ride, both drivers and passengers can rate each other from 1-5 stars and leave optional comments. These ratings help build trust in the community and help others make informed decisions. Your average rating is displayed on your profile.',
      priority: 2,
      tags: ['ratings', 'reviews', 'feedback', 'stars']
    },
    {
      id: 9,
      category: 'Cancellations & Changes',
      question: 'Can I cancel or modify my ride booking?',
      answer: 'Yes, you can cancel bookings through the ride details page in "My Rides". Cancellation policies vary by timing - early cancellations (24+ hours) typically have no penalty, while last-minute cancellations may result in partial credit loss. Always communicate with your driver/passenger before cancelling.',
      priority: 3,
      tags: ['cancel', 'modify', 'change', 'booking']
    },
    {
      id: 10,
      category: 'Account Settings',
      question: 'How do I change my password or update my profile?',
      answer: 'Go to Profile > Settings > Account Management. You can change your password using the "Change Password" option. To update your profile information like name or phone number, use the respective sections in Settings. Some changes may require verification.',
      priority: 3,
      tags: ['password', 'profile', 'account', 'settings']
    },
    {
      id: 11,
      category: 'Geographic Coverage',
      question: 'Which Canadian cities does Ride Club serve?',
      answer: 'Ride Club serves all major Canadian cities and towns. You can search for rides between any Canadian locations. Our city autocomplete helps you find the exact pickup and drop-off points. We cover all provinces from coast to coast.',
      priority: 3,
      tags: ['cities', 'canada', 'coverage', 'locations']
    },
    {
      id: 12,
      category: 'Troubleshooting',
      question: 'I\'m not receiving verification codes. What should I do?',
      answer: 'Check that your phone has signal and can receive SMS messages. Make sure you entered the correct phone number with Canadian format (+1). SMS codes may take a few minutes to arrive. If you still don\'t receive it, try the "Resend Code" option after the countdown expires, or contact support.',
      priority: 3,
      tags: ['sms', 'verification', 'not receiving', 'troubleshooting']
    },
    {
      id: 13,
      category: 'Payments & Credits',
      question: 'What payment methods do you accept for credit purchases?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe payment system. You can purchase credit packages of various sizes. All transactions are encrypted and secure. We don\'t store your credit card information.',
      priority: 3,
      tags: ['payment methods', 'credit card', 'stripe', 'security']
    },
    {
      id: 14,
      category: 'Safety & Security',
      question: 'How do you ensure ride safety?',
      answer: 'Ride Club prioritizes safety through phone verification, user ratings, secure messaging, and ride tracking. All users must verify their phone numbers. We encourage users to check ratings before booking and to report any safety concerns immediately. Emergency contact information is available in-app.',
      priority: 2,
      tags: ['safety', 'security', 'verification', 'emergency']
    },
    {
      id: 15,
      category: 'Getting Started',
      question: 'Do I need to create a separate driver and passenger account?',
      answer: 'No! One account works for both. You can switch between being a driver and passenger anytime. When creating rides, you\'re acting as a driver. When booking rides, you\'re a passenger. Your profile tracks both your driver and passenger ratings separately.',
      priority: 1,
      tags: ['account', 'driver', 'passenger', 'dual role']
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      filterFaqs();
    }, 500);
  }, []);

  useEffect(() => {
    filterFaqs();
  }, [searchQuery]);

  const filterFaqs = () => {
    if (!searchQuery.trim()) {
      // Show all FAQs sorted by priority and category
      const sorted = [...faqs].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.category.localeCompare(b.category);
      });
      setFilteredFaqs(sorted);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = faqs.filter(faq => {
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });

    // Sort search results by relevance
    const sortedFiltered = filtered.sort((a, b) => {
      const aQuestion = a.question.toLowerCase().includes(query);
      const bQuestion = b.question.toLowerCase().includes(query);
      
      if (aQuestion && !bQuestion) return -1;
      if (!aQuestion && bQuestion) return 1;
      
      return a.priority - b.priority;
    });

    setFilteredFaqs(sortedFiltered);
  };

  const toggleFaq = (faqId: number) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const groupFaqsByCategory = (faqList: FAQ[]) => {
    if (searchQuery.trim()) {
      return { 'Search Results': faqList };
    }

    return faqList.reduce((groups: { [key: string]: FAQ[] }, faq) => {
      const category = faq.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(faq);
      return groups;
    }, {});
  };

  const handleContactSupport = () => {
    window.location.href = '/support';
  };

  const categoryOrder = [
    'Getting Started', 
    'Booking Rides', 
    'Payments & Credits', 
    'Safety & Verification', 
    'Safety & Security',
    'Ride Requests', 
    'Messaging & Communication', 
    'Vehicle Management', 
    'Ratings & Reviews', 
    'Cancellations & Changes', 
    'Account Settings', 
    'Geographic Coverage', 
    'Troubleshooting'
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 4,
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, #4CAF50, #2E7D32)'
              : 'linear-gradient(135deg, #66BB6A, #4CAF50)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          ❓ Help Center & FAQ
        </Typography>

        {/* Search Section */}
        <Paper sx={{ mb: 4, p: 3 }} elevation={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon /> Search FAQ
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search FAQ (e.g., 'how to book', 'credits', 'verify phone')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          {searchQuery.trim() && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
              </Typography>
            </Box>
          )}
        </Paper>

        {/* FAQ Content */}
        {loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading FAQ...</Typography>
          </Paper>
        ) : (
          <>
            {Object.entries(groupFaqsByCategory(filteredFaqs))
              .sort(([a], [b]) => {
                if (searchQuery.trim()) return 0;
                return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
              })
              .map(([category, categoryFaqs]) => (
                <Paper key={category} sx={{ mb: 3 }} elevation={2}>
                  <Box sx={{ p: 3, pb: 1 }}>
                    <Typography 
                      variant="h5" 
                      fontWeight="bold" 
                      sx={{ 
                        mb: 2, 
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <QuestionAnswerIcon />
                      {category}
                    </Typography>
                    
                    {categoryFaqs.map((faq, index) => (
                      <Accordion
                        key={faq.id}
                        expanded={expandedFaq === faq.id}
                        onChange={() => toggleFaq(faq.id)}
                        sx={{
                          mb: 1,
                          '&:before': {
                            display: 'none',
                          },
                          boxShadow: 'none',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '8px !important',
                          overflow: 'hidden'
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            backgroundColor: expandedFaq === faq.id ? 'action.hover' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            },
                            borderRadius: expandedFaq === faq.id ? '8px 8px 0 0' : '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="semibold" sx={{ flex: 1 }}>
                              {faq.question}
                            </Typography>
                            {faq.priority === 1 && (
                              <Chip 
                                label="Popular" 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails
                          sx={{
                            backgroundColor: 'background.default',
                            borderTop: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                            {faq.answer}
                          </Typography>
                          
                          {faq.tags.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {faq.tags.map((tag, tagIndex) => (
                                <Chip
                                  key={tagIndex}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                  onClick={() => setSearchQuery(tag)}
                                />
                              ))}
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Paper>
              ))}

            {/* No Results */}
            {filteredFaqs.length === 0 && searchQuery.trim() && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🤔 No FAQ found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Try searching with different keywords or contact our support team for assistance.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ContactSupportIcon />}
                  onClick={handleContactSupport}
                  sx={{
                    background: 'linear-gradient(135deg, #66BB6A, #4CAF50)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                    }
                  }}
                >
                  Contact Support
                </Button>
              </Paper>
            )}
          </>
        )}

        {/* Contact Support Section */}
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }} elevation={2}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Still need help?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Can't find what you're looking for? Our support team is here to help with any questions or issues.
          </Typography>
          
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                startIcon={<ContactSupportIcon />}
                onClick={handleContactSupport}
                sx={{
                  background: 'linear-gradient(135deg, #66BB6A, #4CAF50)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                  }
                }}
              >
                Contact Support
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => window.open('mailto:support@rideclub.ca', '_blank')}
              >
                📧 Email Us
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Tips */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            💡 Quick Tips for Better Experience
          </Typography>
          <Typography variant="body2">
            • Verify your phone number to build trust and access all features<br/>
            • Add vehicle information if you plan to offer rides<br/>
            • Check driver/passenger ratings before booking<br/>
            • Communicate through in-app messaging for safety<br/>
            • Report any safety concerns immediately
          </Typography>
        </Alert>
      </Container>
    </Box>
  );
};

export default HelpPage;