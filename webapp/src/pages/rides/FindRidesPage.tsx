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
  Avatar,
  Rating,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as TimeIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import apiService from '../../services/apiService';

interface Ride {
  id: string;
  driver: {
    firstName: string;
    lastName: string;
    rating: number;
    profilePicture?: string;
  };
  origin: string;
  destination: string;
  departureDateTime: string;
  price: number;
  availableSeats: number;
  duration: string;
  vehicle?: {
    make: string;
    model: string;
    color: string;
  };
}

const FindRidesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setLoading } = useLoading();

  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get search parameters from navigation state
  const searchParams = location.state || {};
  const { originCity, destinationCity, departureDate, passengers, noResults } = searchParams;

  useEffect(() => {
    if (searchParams.rides) {
      // If rides are already provided from search
      setRides(searchParams.rides);
    } else if (originCity && destinationCity) {
      // Search for rides based on parameters
      searchRides();
    } else {
      // Load all available rides
      loadAllRides();
    }
  }, []);

  const searchRides = async () => {
    setIsLoading(true);
    setError('');
    setLoading(true, 'Searching for rides...');

    try {
      const response = await apiService.get('/rides/search', {
        originCityId: originCity?.id,
        destinationCityId: destinationCity?.id,
        departureDate: departureDate ? new Date(departureDate).toISOString().split('T')[0] : undefined,
        passengers,
        sortBy: 'departureDateTime'
      });

      if (response.success) {
        setRides(response.data.rides);
      }
    } catch (error: any) {
      console.error('Search rides error:', error);
      setError('Failed to search rides. Please try again.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const loadAllRides = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.get('/rides');
      if (response.success) {
        setRides(response.data.rides);
      }
    } catch (error: any) {
      console.error('Load rides error:', error);
      setError('Failed to load rides. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRideClick = (ride: Ride) => {
    navigate(`/ride/${ride.id}`, { state: { ride } });
  };

  const handleBookRide = (ride: Ride) => {
    // Navigate to booking flow or show booking modal
    navigate(`/ride/${ride.id}`, { state: { ride, showBooking: true } });
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
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
          mb: 2,
        }}
        onClick={() => handleRideClick(ride)}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Driver Info */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={ride.driver.profilePicture}
                  sx={{ width: 40, height: 40 }}
                >
                  {ride.driver.firstName[0]}{ride.driver.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {ride.driver.firstName} {ride.driver.lastName[0]}.
                  </Typography>
                  <Rating
                    value={ride.driver.rating}
                    readOnly
                    size="small"
                    precision={0.1}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Route */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {ride.origin} → {ride.destination}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <TimeIcon fontSize="small" />
                  <Typography variant="body2">
                    {date} at {time}
                  </Typography>
                </Box>
                {ride.duration && (
                  <Typography variant="body2" color="text.secondary">
                    Duration: {ride.duration}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Price and Seats */}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  ${ride.price}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  per person
                </Typography>
                <Chip
                  icon={<PersonIcon />}
                  label={`${ride.availableSeats} seats left`}
                  size="small"
                  color={ride.availableSeats <= 2 ? 'warning' : 'success'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>

            {/* Book Button */}
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookRide(ride);
                }}
                disabled={ride.availableSeats === 0 || ride.driver.firstName === user?.firstName}
              >
                {ride.availableSeats === 0 ? 'Full' : 'Book'}
              </Button>
            </Grid>
          </Grid>

          {/* Vehicle Info */}
          {ride.vehicle && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            🔍 Find Rides
          </Typography>
          
          {originCity && destinationCity && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h6">
                {originCity.name} → {destinationCity.name}
              </Typography>
              <Typography variant="body2">
                {departureDate && new Date(departureDate).toLocaleDateString()} • {passengers} passenger{passengers > 1 ? 's' : ''}
              </Typography>
            </Paper>
          )}

          {noResults && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No rides found for your search criteria. Showing all available rides instead.
              <Button
                variant="text"
                onClick={() => navigate('/request-ride', { 
                  state: { originCity, destinationCity, departureDate, passengers } 
                })}
                sx={{ ml: 2 }}
              >
                Request a Ride
              </Button>
            </Alert>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Rides List */}
        {!isLoading && rides.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {rides.length} ride{rides.length > 1 ? 's' : ''} found
            </Typography>
            {rides.map(renderRideCard)}
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && rides.length === 0 && (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No rides found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search criteria or request a custom ride.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/request-ride')}
              >
                Request a Ride
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Back to Search
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default FindRidesPage;