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
} from '@mui/material';
import {
  Search as SearchIcon,
  SwapHoriz as SwapIcon,
  Add as AddIcon,
  RequestPage as RequestIcon,
  FindInPage as FindIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import apiService from '../services/apiService';

// Mock Canadian cities data
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

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setLoading } = useLoading();

  // Search form state
  const [originCity, setOriginCity] = useState<any>(null);
  const [destinationCity, setDestinationCity] = useState<any>(null);
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [passengers, setPassengers] = useState<number>(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

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
        navigate('/find-rides', {
          state: {
            originCity,
            destinationCity,
            departureDate,
            passengers,
            rides: response.data.rides || []
          }
        });
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Single Page Landing */}
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        
        {/* Hero Section with Search */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
            color: 'white',
            py: { xs: 6, md: 8 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  fontWeight: 800,
                  mb: 2,
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.8) 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Find Your Perfect Ride
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  mb: 4,
                  opacity: 0.95,
                  maxWidth: 600,
                  mx: 'auto',
                  fontWeight: 400,
                }}
              >
                Search for rides across Canada with just a few clicks
              </Typography>
            </Box>

            {/* Search Form */}
            <Paper
              elevation={4}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                maxWidth: 800,
                mx: 'auto',
              }}
            >
              {searchError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {searchError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* From - Swap - To */}
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
                      width: 48,
                      height: 48,
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&:disabled': { bgcolor: 'grey.300' },
                    }}
                  >
                    <SwapIcon />
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

                {/* Date - Passengers */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Departure Date"
                      value={departureDate}
                      onChange={(newValue) => newValue && setDepartureDate(newValue)}
                      minDate={new Date()}
                      slotProps={{
                        textField: { fullWidth: true, variant: 'outlined' },
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
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                    },
                  }}
                >
                  {isSearching ? 'Searching...' : '🔍 Search Rides'}
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>

        {/* Mission Statement Section */}
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 3,
                background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🇨🇦 Canada's Premier Ridesharing Platform
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: 800,
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
              }}
            >
              Connecting drivers and passengers for safe, affordable, and eco-friendly travel across the country. 
              Join thousands of Canadians who choose sustainable transportation.
            </Typography>
          </Paper>
        </Container>

        {/* Featured Rides Section - Compact */}
        <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 6 } }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Card
                elevation={1}
                sx={{
                  p: 3,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🚗 Featured Rides
                  </Typography>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  No rides available at the moment
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Use the search above to find rides, or try these quick actions:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-ride')}
                    sx={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      },
                    }}
                  >
                    + Offer a Ride
                  </Button>
                  <Button
                    variant="outlined"
                    size="medium"
                    startIcon={<RequestIcon />}
                    onClick={() => navigate('/request-ride')}
                  >
                    Request a Ride
                  </Button>
                  <Button
                    variant="text"
                    size="medium"
                    startIcon={<FindIcon />}
                    onClick={() => navigate('/find-rides')}
                  >
                    Browse All Rides
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Quick Stats - Side Panel */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={1}
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                  color: 'white',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  🚀 Why Choose Ride Club?
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>🌍</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Eco-friendly travel</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>💰</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Save money on trips</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>🛡️</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Verified safe drivers</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default HomePage;