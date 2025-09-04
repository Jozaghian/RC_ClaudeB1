import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departureDateTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: 'active' | 'completed' | 'cancelled';
  passengers?: Array<{
    id: string;
    name: string;
    seatsBooked: number;
  }>;
}

const MyRidesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [rides, setRides] = useState<Ride[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const isDriver = user?.role === 'DRIVER';

  useEffect(() => {
    // Check for success message from navigation state
    if (location.state?.message) {
      setMessage(location.state.message);
      setMessageType(location.state.type || 'info');
      
      // Clear the state
      window.history.replaceState({}, document.title);
    }

    loadRides();
  }, [activeTab]);

  const loadRides = async () => {
    // Mock data for demonstration
    const mockRides: Ride[] = [
      {
        id: '1',
        origin: 'Toronto, ON',
        destination: 'Montreal, QC',
        departureDateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        price: 45,
        availableSeats: 2,
        totalSeats: 3,
        status: 'active',
        passengers: [
          { id: '1', name: 'John D.', seatsBooked: 1 }
        ]
      },
      {
        id: '2',
        origin: 'Vancouver, BC',
        destination: 'Calgary, AB',
        departureDateTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        price: 60,
        availableSeats: 0,
        totalSeats: 3,
        status: 'completed',
        passengers: [
          { id: '2', name: 'Sarah M.', seatsBooked: 2 },
          { id: '3', name: 'Mike L.', seatsBooked: 1 }
        ]
      }
    ];

    setRides(mockRides);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, ride: Ride) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedRide(ride);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRide(null);
  };

  const handleEditRide = () => {
    if (selectedRide) {
      // Navigate to edit page (would be implemented)
      console.log('Edit ride:', selectedRide.id);
    }
    handleMenuClose();
  };

  const handleCancelRide = () => {
    if (selectedRide) {
      // Cancel ride logic (would be implemented)
      console.log('Cancel ride:', selectedRide.id);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderRideCard = (ride: Ride) => {
    const { date, time } = formatDateTime(ride.departureDateTime);

    return (
      <Card
        key={ride.id}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: 3,
          },
          mb: 2,
        }}
        onClick={() => navigate(`/ride/${ride.id}`)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {ride.origin} → {ride.destination}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {date} at {time}
                  </Typography>
                </Box>
                <Chip
                  label={getStatusText(ride.status)}
                  color={getStatusColor(ride.status) as any}
                  size="small"
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                ${ride.price}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, ride)}
              >
                <MoreIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {ride.totalSeats - ride.availableSeats}/{ride.totalSeats} seats booked
                </Typography>
              </Box>
            </Grid>
            
            {ride.passengers && ride.passengers.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Passengers:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ride.passengers.map((passenger) => (
                    <Chip
                      key={passenger.id}
                      label={`${passenger.name} (${passenger.seatsBooked})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const filteredRides = rides.filter(ride => {
    switch (activeTab) {
      case 0: return ride.status === 'active';
      case 1: return ride.status === 'completed';
      case 2: return ride.status === 'cancelled';
      default: return true;
    }
  });

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {isDriver ? '🚗 My Rides' : '🎒 My Bookings'}
          </Typography>
          {isDriver && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-ride')}
            >
              Create New Ride
            </Button>
          )}
        </Box>

        {/* Success/Error Messages */}
        {message && (
          <Alert 
            severity={messageType} 
            sx={{ mb: 3 }}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Active" />
            <Tab label="Completed" />
            <Tab label="Cancelled" />
          </Tabs>
        </Paper>

        {/* Rides List */}
        {filteredRides.length > 0 ? (
          <Box>
            {filteredRides.map(renderRideCard)}
          </Box>
        ) : (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No {getStatusText(activeTab === 0 ? 'active' : activeTab === 1 ? 'completed' : 'cancelled').toLowerCase()} rides found
            </Typography>
            {isDriver && activeTab === 0 && (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Start earning by creating your first ride listing.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/create-ride')}
                >
                  Create Your First Ride
                </Button>
              </>
            )}
            {!isDriver && activeTab === 0 && (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't booked any rides yet.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/find-rides')}
                >
                  Find Rides
                </Button>
              </>
            )}
          </Paper>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          {selectedRide?.status === 'active' && (
            <MenuItem onClick={handleEditRide}>
              Edit Ride
            </MenuItem>
          )}
          {selectedRide?.status === 'active' && (
            <MenuItem onClick={handleCancelRide} sx={{ color: 'error.main' }}>
              Cancel Ride
            </MenuItem>
          )}
          <MenuItem onClick={() => navigate(`/ride/${selectedRide?.id}`)}>
            View Details
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default MyRidesPage;