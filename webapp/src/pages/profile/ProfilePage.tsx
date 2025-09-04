import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const ProfilePage: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          👤 My Profile
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Profile page coming soon...
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfilePage;