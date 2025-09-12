import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Security,
  Agriculture as EcoIcon,
  People,
  Speed,
  Savings,
  Support,
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Safe & Secure',
      description: 'Background-checked drivers, ID verification, and real-time ride tracking for your safety.',
    },
    {
      icon: <EcoIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Eco-Friendly',
      description: 'Reduce carbon footprint by sharing rides and contributing to a cleaner environment.',
    },
    {
      icon: <People sx={{ fontSize: 40, color: 'info.main' }} />,
      title: 'Community-Driven',
      description: 'Connect with fellow Canadians and build lasting connections on your journey.',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Reliable',
      description: 'Dependable rides with real-time updates and communication with your ride partner.',
    },
    {
      icon: <Savings sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Cost-Effective',
      description: 'Save money by splitting gas costs and tolls with other passengers.',
    },
    {
      icon: <Support sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help you with any questions or concerns.',
    },
  ];

  const stats = [
    { number: '100,000+', label: 'Active Users' },
    { number: '500,000+', label: 'Rides Completed' },
    { number: '50+', label: 'Canadian Cities' },
    { number: '4.8/5', label: 'Average Rating' },
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
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              About Ride Club
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
              Canada's premier ridesharing platform connecting communities coast to coast
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Our Mission
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
              At Ride Club, we believe transportation should be accessible, affordable, and environmentally 
              responsible. We're building Canada's most trusted ridesharing community, connecting drivers 
              and passengers across the country.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              Whether you're commuting to work, traveling between cities, or exploring new destinations, 
              Ride Club makes it easy to find reliable, safe, and cost-effective transportation options 
              while reducing your environmental impact.
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="🇨🇦 Made in Canada" color="primary" />
              <Chip label="🌱 Carbon Neutral" color="success" />
              <Chip label="🔒 Privacy First" color="secondary" />
              <Chip label="📱 Mobile First" color="info" />
              <Chip label="🤝 Community Driven" color="warning" />
              <Chip label="⭐ 4.8 Rating" color="primary" />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Stats Section */}
      <Box sx={{ backgroundColor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 700, mb: 6 }}>
            Trusted by Canadians
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 4 }}>
            {stats.map((stat, index) => (
              <Box key={index} sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    color: 'primary.main',
                    mb: 1,
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 700, mb: 6 }}>
          Why Choose Ride Club?
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  boxShadow: (theme) => theme.shadows[8],
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Team Section */}
      <Box sx={{ backgroundColor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 700, mb: 2 }}>
            Built with ❤️ in Canada
          </Typography>
          <Typography
            variant="h6"
            sx={{ textAlign: 'center', color: 'text.secondary', mb: 6, maxWidth: 800, mx: 'auto' }}
          >
            From Toronto to Vancouver, Halifax to Calgary - we're proud to serve Canadian communities 
            with innovative transportation solutions.
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
              🏢 Headquarters: Toronto, Ontario
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
              🌍 Serving: All 10 provinces and 3 territories
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
              📞 Support: 1-800-RIDE-CLUB
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage;