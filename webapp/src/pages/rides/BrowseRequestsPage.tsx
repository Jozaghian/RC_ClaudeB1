import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const BrowseRequestsPage: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          🔍 Browse Ride Requests
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Browse requests page coming soon...
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default BrowseRequestsPage;