import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(135deg, #e8f5e8 0%, #d4f1d4 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(/Pic/pic%201.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Box sx={{ width: '100%', py: 4 }}>
          {/* Logo Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img
              src="/Pic/Logo.png"
              alt="Ride Club"
              style={{
                height: isMobile ? 80 : 100,
                width: 'auto',
                marginBottom: 16,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 1,
                fontSize: isMobile ? '1.75rem' : '2.25rem',
              }}
            >
              Ride Club
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: isMobile ? '0.875rem' : '1rem',
              }}
            >
              Canadian Ridesharing Platform
            </Typography>
          </Box>

          {/* Auth Form Container */}
          <Paper
            elevation={8}
            sx={{
              p: isMobile ? 3 : 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {children}
          </Paper>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem',
              }}
            >
              © 2024 Ride Club. Safe, Affordable, Eco-Friendly Travel Across Canada.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;