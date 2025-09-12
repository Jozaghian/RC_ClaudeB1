import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        py: 4,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* Company Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #C8102E 0%, #A50E1F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              mr: 2,
            }}
          >
            🚗
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #C8102E 0%, #A50E1F 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ride Club
          </Typography>
        </Box>

        <Typography 
          variant="body2" 
          sx={{ color: 'grey.400', mb: 3, lineHeight: 1.7, textAlign: 'center' }}
        >
          Canada's premier ridesharing platform connecting drivers and passengers 
          across Canadian cities. Safe, reliable, and affordable transportation for everyone.
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3, mb: 3 }}>
          <Link 
            component={RouterLink} 
            to="/find-rides" 
            sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
          >
            Find Rides
          </Link>
          <Link 
            component={RouterLink} 
            to="/create-ride" 
            sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
          >
            Create Ride
          </Link>
          <Link 
            component={RouterLink} 
            to="/my-rides" 
            sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
          >
            My Rides
          </Link>
          <Link 
            component={RouterLink} 
            to="/profile" 
            sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
          >
            Profile
          </Link>
          <Link 
            component={RouterLink} 
            to="/help" 
            sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
          >
            Help
          </Link>
          <Link 
            component={RouterLink} 
            to="/support" 
            sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
          >
            Support
          </Link>
        </Box>

        {/* Social Media */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
          <IconButton sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}>
            <Facebook />
          </IconButton>
          <IconButton sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}>
            <Twitter />
          </IconButton>
          <IconButton sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}>
            <Instagram />
          </IconButton>
          <IconButton sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}>
            <LinkedIn />
          </IconButton>
        </Box>

        <Divider sx={{ my: 3, backgroundColor: 'grey.700' }} />

        {/* Bottom Section */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'grey.500', mb: 1 }}>
            © 2024 Ride Club Canada. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500', mb: 2 }}>
            Made in Canada 🇨🇦 with ❤️
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            📧 support@rideclub.ca • 📞 1-800-RIDE-CLUB • 🏢 Toronto, ON
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}