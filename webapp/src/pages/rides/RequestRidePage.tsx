import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  InputAdornment,
  FormControlLabel,
  Switch,
  FormGroup,
  FormLabel,
  ButtonGroup,
  Chip,
  Divider,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  SwapVert as SwapIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Accessible as AccessibleIcon,
  ChildCare as ChildCareIcon,
  Luggage as LuggageIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../../contexts/LoadingContext';

// Mock Canadian cities data (same as CreateRidePage)
const CANADIAN_CITIES = [
  { id: 1, name: 'Toronto', province: 'ON', type: 'city' },
  { id: 2, name: 'Vancouver', province: 'BC', type: 'city' },
  { id: 3, name: 'Montreal', province: 'QC', type: 'city' },
  { id: 4, name: 'Calgary', province: 'AB', type: 'city' },
  { id: 5, name: 'Edmonton', province: 'AB', type: 'city' },
  { id: 6, name: 'Ottawa', province: 'ON', type: 'city' },
  { id: 7, name: 'Winnipeg', province: 'MB', type: 'city' },
  { id: 8, name: 'Quebec City', province: 'QC', type: 'city' },
];

const TIME_FLEXIBILITY_OPTIONS = [
  { value: 0, label: 'Exact' },
  { value: 1, label: '±1h' },
  { value: 2, label: '±2h' },
  { value: 4, label: '±4h' },
];

interface City {
  id: number;
  name: string;
  province: string;
  type: string;
}

const RequestRidePage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const [formData, setFormData] = useState({
    // Route
    originCity: null as City | null,
    destinationCity: null as City | null,
    originDetails: '',
    destinationDetails: '',
    
    // Schedule
    preferredDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    timeFlexibility: 2, // ±2 hours
    
    // Trip Details
    passengerCount: 1,
    minBudget: '',
    maxBudget: '',
    
    // Special Requirements
    needsLargeLuggage: false,
    needsChildSeat: false,
    needsWheelchairAccess: false,
    specialRequirements: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSwapCities = () => {
    setFormData(prev => ({
      ...prev,
      originCity: prev.destinationCity,
      destinationCity: prev.originCity,
      originDetails: prev.destinationDetails,
      destinationDetails: prev.originDetails,
    }));
  };

  const handlePassengerChange = (increment: boolean) => {
    setFormData(prev => ({
      ...prev,
      passengerCount: increment 
        ? Math.min(8, prev.passengerCount + 1)
        : Math.max(1, prev.passengerCount - 1)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.originCity || !formData.destinationCity) {
      setError('Please select both origin and destination cities');
      return;
    }

    if (formData.originCity.id === formData.destinationCity.id) {
      setError('Origin and destination must be different cities');
      return;
    }

    if (formData.preferredDateTime <= new Date()) {
      setError('Preferred departure time must be in the future');
      return;
    }

    if (formData.passengerCount < 1 || formData.passengerCount > 8) {
      setError('Passenger count must be between 1 and 8');
      return;
    }

    if (formData.minBudget && formData.maxBudget) {
      const minBudget = parseFloat(formData.minBudget);
      const maxBudget = parseFloat(formData.maxBudget);
      if (minBudget > maxBudget) {
        setError('Minimum budget cannot be higher than maximum budget');
        return;
      }
    }

    setIsSubmitting(true);
    setLoading(true, 'Posting your request...');

    try {
      // In a real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Navigate to a success page or back with success message
      navigate('/my-rides', { 
        state: { 
          message: `Request posted! Drivers will be able to see and bid on your trip from ${formData.originCity?.name} to ${formData.destinationCity?.name}.`,
          type: 'success'
        } 
      });
    } catch (error: any) {
      console.error('Create request error:', error);
      setError('Failed to create ride request. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold', 
              mb: { xs: 2, md: 4 },
              fontSize: { xs: '1.5rem', md: '2rem' },
              textAlign: { xs: 'center', md: 'left' }
            }}
          >
            📋 Request a Ride
          </Typography>

          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 3,
            }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Route Section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon />
                    Route Details
                  </Typography>
                </Grid>

                {/* From Field */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={CANADIAN_CITIES}
                    getOptionLabel={(option) => `${option.name}, ${option.province}`}
                    value={formData.originCity}
                    onChange={(event, newValue) => 
                      setFormData({ ...formData, originCity: newValue })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="From"
                        placeholder="Select origin city"
                        required
                        fullWidth
                      />
                    )}
                  />
                  <TextField
                    fullWidth
                    label="Pickup Details"
                    value={formData.originDetails}
                    onChange={(e) => 
                      setFormData({ ...formData, originDetails: e.target.value })
                    }
                    placeholder="Specific pickup location (address, landmark, etc.)"
                    multiline
                    rows={2}
                    sx={{ mt: 2 }}
                  />
                </Grid>

                {/* Swap Button */}
                <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', justifyContent: 'center', my: { xs: 1, md: 0 } }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSwapCities}
                    sx={{
                      minWidth: 48,
                      height: 48,
                      borderRadius: '50%',
                      p: 0,
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        borderColor: 'primary.main',
                      },
                    }}
                    title="Swap From and To"
                  >
                    <SwapIcon />
                  </Button>
                </Grid>

                {/* To Field */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={CANADIAN_CITIES}
                    getOptionLabel={(option) => `${option.name}, ${option.province}`}
                    value={formData.destinationCity}
                    onChange={(event, newValue) => 
                      setFormData({ ...formData, destinationCity: newValue })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="To"
                        placeholder="Select destination city"
                        required
                        fullWidth
                      />
                    )}
                  />
                  <TextField
                    fullWidth
                    label="Drop-off Details"
                    value={formData.destinationDetails}
                    onChange={(e) => 
                      setFormData({ ...formData, destinationDetails: e.target.value })
                    }
                    placeholder="Specific drop-off location (address, landmark, etc.)"
                    multiline
                    rows={2}
                    sx={{ mt: 2 }}
                  />
                </Grid>

                {/* Travel Time Section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon />
                    Travel Time
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DateTimePicker
                    label="Preferred Date & Time"
                    value={formData.preferredDateTime}
                    onChange={(newValue) => 
                      newValue && setFormData({ ...formData, preferredDateTime: newValue })
                    }
                    minDateTime={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1 }}>Time Flexibility</FormLabel>
                    <ButtonGroup variant="outlined" fullWidth>
                      {TIME_FLEXIBILITY_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={formData.timeFlexibility === option.value ? 'contained' : 'outlined'}
                          onClick={() => setFormData({ ...formData, timeFlexibility: option.value })}
                          sx={{ flex: 1 }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </FormControl>
                </Grid>

                {/* Trip Details Section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon />
                    Trip Details
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1 }}>Number of Passengers</FormLabel>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 1
                    }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handlePassengerChange(false)}
                        sx={{ minWidth: 40, height: 40, borderRadius: '50%' }}
                      >
                        −
                      </Button>
                      <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
                        {formData.passengerCount}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handlePassengerChange(true)}
                        sx={{ minWidth: 40, height: 40, borderRadius: '50%' }}
                      >
                        +
                      </Button>
                    </Box>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Min Budget (CAD)"
                    value={formData.minBudget}
                    onChange={(e) => 
                      setFormData({ ...formData, minBudget: e.target.value })
                    }
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="0.00"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Max Budget (CAD)"
                    value={formData.maxBudget}
                    onChange={(e) => 
                      setFormData({ ...formData, maxBudget: e.target.value })
                    }
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="0.00"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    💡 Setting a budget range helps drivers provide competitive bids
                  </Typography>
                </Grid>

                {/* Special Requirements Section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Special Requirements
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.needsLargeLuggage}
                          onChange={(e) => 
                            setFormData({ ...formData, needsLargeLuggage: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LuggageIcon fontSize="small" />
                            <Typography variant="body1">Large Luggage</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Suitcases, sports equipment, etc.
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.needsChildSeat}
                          onChange={(e) => 
                            setFormData({ ...formData, needsChildSeat: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ChildCareIcon fontSize="small" />
                            <Typography variant="body1">Child Seat</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Booster or car seat required
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.needsWheelchairAccess}
                          onChange={(e) => 
                            setFormData({ ...formData, needsWheelchairAccess: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessibleIcon fontSize="small" />
                            <Typography variant="body1">Wheelchair Access</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Wheelchair accessible vehicle
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Special Requirements"
                    value={formData.specialRequirements}
                    onChange={(e) => 
                      setFormData({ ...formData, specialRequirements: e.target.value })
                    }
                    placeholder="Pet-friendly, non-smoking, etc."
                    multiline
                    rows={4}
                  />
                </Grid>

                {/* Additional Information */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  <TextField
                    fullWidth
                    label="Additional Information"
                    value={formData.description}
                    onChange={(e) => 
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell drivers more about your trip, group, or preferences..."
                    multiline
                    rows={3}
                  />
                </Grid>

                {/* Submit Buttons */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/find-rides')}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ minWidth: 120 }}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Request'}
                    </Button>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Your request will be visible to drivers for 72 hours. You'll receive notifications when drivers bid on your trip.
                  </Typography>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default RequestRidePage;