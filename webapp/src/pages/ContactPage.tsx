import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Send,
  Help,
  BugReport,
  Feedback,
  Support,
} from '@mui/icons-material';
import apiService from '../services/apiService';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Send to real API endpoint
      const response = await apiService.sendContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });
      
      console.log('Contact form sent:', response.data);
      setShowSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setShowSuccess(false), 10000);
    } catch (error: any) {
      console.error('Failed to send contact form:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: <Email sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      contact: 'support@rideclub.ca',
      action: 'mailto:support@rideclub.ca',
    },
    {
      icon: <Phone sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Phone Support',
      description: 'Speak with our team Monday-Friday 9AM-6PM EST',
      contact: '1-800-RIDE-CLUB',
      action: 'tel:1-800-743-3258',
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: 'info.main' }} />,
      title: 'Office Location',
      description: 'Visit our headquarters in Toronto',
      contact: 'Toronto, ON, Canada',
      action: '#',
    },
  ];

  const supportTopics = [
    {
      icon: <Help />,
      title: 'General Questions',
      description: 'Account setup, how to use the platform, ride policies',
    },
    {
      icon: <BugReport />,
      title: 'Technical Issues',
      description: 'App bugs, login problems, payment issues',
    },
    {
      icon: <Support />,
      title: 'Safety Concerns',
      description: 'Report safety issues, emergency situations',
    },
    {
      icon: <Feedback />,
      title: 'Feedback & Suggestions',
      description: 'Share ideas to improve Ride Club',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              Contact Us
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
              We're here to help! Reach out with any questions or concerns.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                Send us a Message
              </Typography>
              
              {showSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Thank you for your message! We'll get back to you within 24 hours.
                </Alert>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      multiline
                      rows={6}
                      variant="outlined"
                      placeholder="Please describe your question or concern in detail..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? undefined : <Send />}
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                Get in Touch
              </Typography>
              <Grid container spacing={3}>
                {contactMethods.map((method, index) => (
                  <Grid item xs={12} key={index}>
                    <Card
                      component="a"
                      href={method.action}
                      sx={{
                        textDecoration: 'none',
                        display: 'block',
                        p: 3,
                        '&:hover': {
                          boxShadow: (theme) => theme.shadows[4],
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease-in-out',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {method.icon}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {method.title}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {method.description}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {method.contact}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 8 }} />

        {/* Support Topics */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
            Common Support Topics
          </Typography>
          <Typography
            variant="body1"
            sx={{ textAlign: 'center', color: 'text.secondary', mb: 6, maxWidth: 800, mx: 'auto' }}
          >
            Before reaching out, you might find answers in our help center or FAQ section. 
            Here are some common topics we can help with:
          </Typography>
          <Grid container spacing={3}>
            {supportTopics.map((topic, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', p: 3, textAlign: 'center' }}>
                  <CardContent>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {topic.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {topic.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {topic.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Looking for Quick Answers?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Check out our Help Center for instant answers to common questions.
          </Typography>
          <Button
            variant="outlined"
            size="large"
            href="/help"
            sx={{ mr: 2 }}
          >
            Visit Help Center
          </Button>
          <Button
            variant="outlined"
            size="large"
            href="/support"
          >
            Safety & Support
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactPage;