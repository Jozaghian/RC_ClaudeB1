import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Card,
  CardContent,
  Fab,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  SwapHoriz as SwapIcon,
  DirectionsCar as CarIcon,
  Add as AddIcon,
  RequestPage as RequestIcon,
  FindInPage as FindIcon,
  CreditCard as CreditIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import apiService from '../services/apiService';

// Mock Canadian cities data - in a real app this would come from the backend
const CANADIAN_CITIES = [
  { id: 1, name: 'Toronto', province: 'ON', type: 'city' },
  { id: 2, name: 'Vancouver', province: 'BC', type: 'city' },
  { id: 3, name: 'Montreal', province: 'QC', type: 'city' },
  { id: 4, name: 'Calgary', province: 'AB', type: 'city' },
  { id: 5, name: 'Edmonton', province: 'AB', type: 'city' },
  { id: 6, name: 'Ottawa', province: 'ON', type: 'city' },
  { id: 7, name: 'Winnipeg', province: 'MB', type: 'city' },
  { id: 8, name: 'Quebec City', province: 'QC', type: 'city' },
  { id: 9, name: 'Hamilton', province: 'ON', type: 'city' },
  { id: 10, name: 'Kitchener', province: 'ON', type: 'city' },
];

interface City {
  id: number;
  name: string;
  province: string;
  type: string;
}

interface Ride {
  id: string;
  driver: {
    firstName: string;
    lastName: string;
    rating: number;
  };
  origin: string;
  destination: string;
  departureDateTime: string;
  price: number;
  availableSeats: number;
  duration: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setLoading } = useLoading();

  // Search form state
  const [originCity, setOriginCity] = useState<City | null>(null);
  const [destinationCity, setDestinationCity] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [passengers, setPassengers] = useState<number>(1);

  // Data state
  const [rides, setRides] = useState<Ride[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const isDriver = user?.role === 'DRIVER';

  useEffect(() => {
    loadFeaturedRides();
  }, []);

  const loadFeaturedRides = async () => {
    try {
      // For demo purposes, we'll show empty rides initially
      // In production, this would load featured/recent rides from backend
      setRides([]);
    } catch (error) {
      console.error('Failed to load featured rides:', error);
    }
  };

  const handleSearchRides = async () => {
    setSearchError('');

    if (!originCity || !destinationCity) {
      setSearchError('Please select both origin and destination cities');
      return;
    }

    if (originCity.id === destinationCity.id) {
      setSearchError('Origin and destination must be different cities');
      return;
    }

    setIsSearching(true);
    setLoading(true, 'Searching for rides...');

    try {
      const response = await apiService.get('/rides/search', {
        originCityId: originCity.id,
        destinationCityId: destinationCity.id,
        departureDate: departureDate.toISOString().split('T')[0],
        passengers,
        sortBy: 'departureDateTime'
      });

      if (response.success) {
        setRides(response.data.rides);
        
        if (response.data.rides.length === 0) {
          // Navigate to find rides page with search parameters
          navigate('/find-rides', {
            state: {
              originCity,
              destinationCity,
              departureDate,
              passengers,
              noResults: true
            }
          });
        } else {
          // Navigate to find rides page with results
          navigate('/find-rides', {
            state: {
              originCity,
              destinationCity,
              departureDate,
              passengers,
              rides: response.data.rides
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Search rides error:', error);
      setSearchError('Failed to search rides. Please try again.');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleSwapCities = () => {
    const temp = originCity;
    setOriginCity(destinationCity);
    setDestinationCity(temp);
  };

  const getQuickActions = () => {
    if (isDriver) {
      return [
        {
          title: 'Post New Ride',
          icon: <AddIcon />,
          action: () => navigate('/create-ride'),
          variant: 'primary' as const,
          description: 'Create a new ride listing'
        },
        {
          title: 'Browse Requests',
          icon: <FindIcon />,
          action: () => navigate('/browse-requests'),
          variant: 'secondary' as const,
          description: 'Find passenger requests'
        },
        {
          title: 'My Rides',
          icon: <CarIcon />,
          action: () => navigate('/my-rides'),
          variant: 'outlined' as const,
          description: 'Manage your ride listings'
        },
        {
          title: 'Manage Credits',
          icon: <CreditIcon />,
          action: () => navigate('/credits'),
          variant: 'outlined' as const,
          description: 'View credit balance'
        }
      ];
    } else {
      return [
        {
          title: 'Request a Ride',
          icon: <RequestIcon />,
          action: () => navigate('/request-ride'),
          variant: 'primary' as const,
          description: 'Post a ride request'
        },
        {
          title: 'My Requests',
          icon: <FindIcon />,
          action: () => navigate('/my-rides'),
          variant: 'secondary' as const,
          description: 'View your ride requests'
        },
        {
          title: 'Browse Rides',
          icon: <SearchIcon />,
          action: () => navigate('/find-rides'),
          variant: 'outlined' as const,
          description: 'Find available rides'
        }
      ];
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.8) 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Welcome to Ride Club
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                mb: 3,
                opacity: 0.95,
                maxWidth: 700,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Canada's premier ridesharing platform connecting drivers and passengers 
              for safe, affordable, and eco-friendly travel across the country
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Chip
                label={`Welcome back, ${user?.firstName}! 👋`}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
            </Box>
          </Box>

          {/* Hero Action Buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 3, 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              mb: 2,
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<RequestIcon />}
              onClick={() => navigate('/request-ride')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                minWidth: { xs: '280px', sm: 'auto' },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Request a Ride
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-ride')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                minWidth: { xs: '280px', sm: 'auto' },
                borderWidth: '2px',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: '2px',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Offer a Ride
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">

          <Grid container spacing={4}>
            {/* Search Section */}
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  p: { xs: 4, md: 5 },
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary',
                      mb: 1,
                      background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    🔍 Find Your Perfect Ride
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Search for rides across Canada with just a few clicks
                  </Typography>
                </Box>

                {searchError && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: '1.5rem',
                      },
                    }}
                  >
                    {searchError}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Row 1: From - Swap - To */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center',
                    flexDirection: { xs: 'column', md: 'row' }
                  }}>
                    <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
                      <Autocomplete
                        options={CANADIAN_CITIES}
                        getOptionLabel={(option) => `${option.name}, ${option.province}`}
                        value={originCity}
                        onChange={(event, newValue) => setOriginCity(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="From"
                            placeholder="Select origin city"
                            fullWidth
                            variant="outlined"
                          />
                        )}
                      />
                    </Box>

                    <IconButton
                      onClick={handleSwapCities}
                      disabled={!originCity || !destinationCity}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        width: 56,
                        height: 56,
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        '&:hover': { 
                          bgcolor: 'primary.dark',
                          transform: 'scale(1.05)',
                        },
                        '&:disabled': { 
                          bgcolor: 'grey.300',
                          transform: 'none',
                          boxShadow: 'none',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <SwapIcon sx={{ fontSize: '1.5rem' }} />
                    </IconButton>

                    <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
                      <Autocomplete
                        options={CANADIAN_CITIES}
                        getOptionLabel={(option) => `${option.name}, ${option.province}`}
                        value={destinationCity}
                        onChange={(event, newValue) => setDestinationCity(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="To"
                            placeholder="Select destination city"
                            fullWidth
                            variant="outlined"
                          />
                        )}
                      />
                    </Box>
                  </Box>

                  {/* Row 2: Date - Passengers */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 3,
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <Box sx={{ flex: 1 }}>
                      <DatePicker
                        label="Departure Date"
                        value={departureDate}
                        onChange={(newValue) => newValue && setDepartureDate(newValue)}
                        minDate={new Date()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Passengers</InputLabel>
                        <Select
                          value={passengers}
                          label="Passengers"
                          onChange={(e) => setPassengers(e.target.value as number)}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <MenuItem key={num} value={num}>
                              {num} {num === 1 ? 'passenger' : 'passengers'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Search Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSearchRides}
                    disabled={isSearching}
                    startIcon={<SearchIcon />}
                    sx={{
                      py: 2.5,
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                        boxShadow: '0 12px 35px rgba(37, 99, 235, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
                        transform: 'none',
                      },
                    }}
                  >
                    {isSearching ? 'Searching for rides...' : 'Search Rides'}
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Featured Rides Section */}
            <Grid item xs={12}>
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                }}
              >
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  🚗 Featured Rides
                </Typography>

                {rides.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      No rides available at the moment
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Use the search above to find rides, or try these quick actions:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {isDriver ? (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/create-ride')}
                        >
                          Post a Ride
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          startIcon={<RequestIcon />}
                          onClick={() => navigate('/request-ride')}
                        >
                          Request a Ride
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => navigate('/find-rides')}
                      >
                        Browse All Rides
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {rides.map((ride) => (
                      <Grid item xs={12} md={6} key={ride.id}>
                        {/* Ride cards would be rendered here */}
                        <Card sx={{ cursor: 'pointer' }}>
                          <CardContent>
                            <Typography variant="h6">
                              {ride.origin} → {ride.destination}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(ride.departureDateTime).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Floating Action Button for Mobile */}
          {isDriver && (
            <Fab
              color="primary"
              aria-label="add ride"
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                display: { xs: 'flex', md: 'none' },
              }}
              onClick={() => navigate('/create-ride')}
            >
              <AddIcon />
            </Fab>
          )}
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default HomePage;