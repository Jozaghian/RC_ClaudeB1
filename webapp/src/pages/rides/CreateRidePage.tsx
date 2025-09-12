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
  Checkbox,
  FormGroup,
  FormLabel,
  RadioGroup,
  Radio,
  Divider,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  SwapVert as SwapIcon,
  DirectionsCar as CarIcon,
  Settings as SettingsIcon,
  Accessible as AccessibleIcon,
  SmokeFree as SmokingIcon,
  Pets as PetsIcon,
  Usb as UsbIcon,
  DirectionsBike as BikeIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../../contexts/LoadingContext';

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
];

// Mock vehicle data
const VEHICLE_MAKES = [
  { id: 1, name: 'Toyota' },
  { id: 2, name: 'Honda' },
  { id: 3, name: 'Ford' },
  { id: 4, name: 'Chevrolet' },
  { id: 5, name: 'Nissan' },
  { id: 6, name: 'Hyundai' },
  { id: 7, name: 'Volkswagen' },
  { id: 8, name: 'BMW' },
  { id: 9, name: 'Mercedes-Benz' },
  { id: 10, name: 'Audi' },
];

const VEHICLE_MODELS: Record<number, { id: number; name: string }[]> = {
  1: [{ id: 11, name: 'Camry' }, { id: 12, name: 'Corolla' }, { id: 13, name: 'RAV4' }, { id: 14, name: 'Highlander' }],
  2: [{ id: 21, name: 'Civic' }, { id: 22, name: 'Accord' }, { id: 23, name: 'CR-V' }, { id: 24, name: 'Pilot' }],
  3: [{ id: 31, name: 'F-150' }, { id: 32, name: 'Focus' }, { id: 33, name: 'Escape' }, { id: 34, name: 'Explorer' }],
  4: [{ id: 41, name: 'Silverado' }, { id: 42, name: 'Malibu' }, { id: 43, name: 'Equinox' }, { id: 44, name: 'Tahoe' }],
  5: [{ id: 51, name: 'Altima' }, { id: 52, name: 'Sentra' }, { id: 53, name: 'Rogue' }, { id: 54, name: 'Pathfinder' }],
  6: [{ id: 61, name: 'Elantra' }, { id: 62, name: 'Sonata' }, { id: 63, name: 'Tucson' }, { id: 64, name: 'Santa Fe' }],
  7: [{ id: 71, name: 'Jetta' }, { id: 72, name: 'Passat' }, { id: 73, name: 'Tiguan' }, { id: 74, name: 'Atlas' }],
  8: [{ id: 81, name: '3 Series' }, { id: 82, name: '5 Series' }, { id: 83, name: 'X3' }, { id: 84, name: 'X5' }],
  9: [{ id: 91, name: 'C-Class' }, { id: 92, name: 'E-Class' }, { id: 93, name: 'GLC' }, { id: 94, name: 'GLE' }],
  10: [{ id: 101, name: 'A4' }, { id: 102, name: 'A6' }, { id: 103, name: 'Q5' }, { id: 104, name: 'Q7' }],
};

const VEHICLE_TYPES = [
  'SEDAN',
  'SUV', 
  'VAN',
  'TRUCK',
  'COUPE',
  'HATCHBACK'
];

const VEHICLE_COLORS = [
  'White',
  'Black',
  'Silver',
  'Gray',
  'Red',
  'Blue',
  'Green',
  'Brown',
  'Gold',
  'Yellow',
  'Orange',
  'Purple',
  'Pink',
  'Beige',
  'Maroon',
  'Navy',
];

const LUGGAGE_OPTIONS = [
  { value: 'none', label: 'No luggage allowed', icon: '🚫' },
  { value: 'small', label: 'Small bags only', icon: '👜' },
  { value: 'medium', label: 'Medium suitcases', icon: '🎒' },
  { value: 'large', label: 'Large suitcases', icon: '🧳' },
  { value: 'backpack', label: 'Backpacks welcome', icon: '🎒' },
];

const CURRENT_YEAR = new Date().getFullYear();

interface City {
  id: number;
  name: string;
  province: string;
  type: string;
}

const CreateRidePage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const [formData, setFormData] = useState({
    // Route
    originCity: null as City | null,
    destinationCity: null as City | null,
    pickupInstructions: '',
    dropoffInstructions: '',
    
    // Schedule
    departureDateTime: new Date(),
    availableSeats: 1,
    pricePerSeat: '',
    
    // Vehicle Information
    vehicleMake: null as any,
    vehicleModel: null as any,
    vehicleYear: CURRENT_YEAR,
    vehicleType: '',
    vehicleColor: '',
    licensePlate: '',
    vehicleFeatures: [] as string[],
    
    // Trip Conditions
    allowsSmoking: false,
    allowsPets: false,
    allowsWheelchair: false,
    allowsBikes: false,
    luggagePolicy: 'medium' as string,
    
    // Additional Features
    hasUSBCharger: false,
    hasWiFi: false,
    hasAC: false,
    hasHeating: false,
    
    // Notes
    description: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSwapCities = () => {
    setFormData(prev => ({
      ...prev,
      originCity: prev.destinationCity,
      destinationCity: prev.originCity,
      pickupInstructions: prev.dropoffInstructions,
      dropoffInstructions: prev.pickupInstructions,
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

    if (!formData.pricePerSeat || parseFloat(formData.pricePerSeat) <= 0) {
      setError('Please enter a valid price per seat');
      return;
    }

    if (formData.departureDateTime <= new Date()) {
      setError('Departure time must be in the future');
      return;
    }

    // Vehicle validation
    if (!formData.vehicleMake) {
      setError('Please select vehicle make');
      return;
    }

    if (!formData.vehicleModel) {
      setError('Please select vehicle model');
      return;
    }

    if (!formData.vehicleType) {
      setError('Please select vehicle type');
      return;
    }

    if (!formData.vehicleColor.trim()) {
      setError('Please enter vehicle color');
      return;
    }

    setIsSubmitting(true);
    setLoading(true, 'Creating your ride...');

    try {
      // In a real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Navigate to my rides page
      navigate('/my-rides', { 
        state: { 
          message: 'Ride created successfully!',
          type: 'success'
        } 
      });
    } catch (error: any) {
      console.error('Create ride error:', error);
      setError('Failed to create ride. Please try again.');
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
            🚗 Create New Ride
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
                    label="Pickup Instructions"
                    value={formData.pickupInstructions}
                    onChange={(e) => 
                      setFormData({ ...formData, pickupInstructions: e.target.value })
                    }
                    placeholder="Specific pickup location, meeting point, etc."
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
                    label="Drop-off Instructions"
                    value={formData.dropoffInstructions}
                    onChange={(e) => 
                      setFormData({ ...formData, dropoffInstructions: e.target.value })
                    }
                    placeholder="Specific drop-off location, meeting point, etc."
                    multiline
                    rows={2}
                    sx={{ mt: 2 }}
                  />
                </Grid>

                {/* Date and Time */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon />
                    Departure Details
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DateTimePicker
                    label="Departure Date & Time"
                    value={formData.departureDateTime}
                    onChange={(newValue) => 
                      newValue && setFormData({ ...formData, departureDateTime: newValue })
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
                  <FormControl fullWidth required>
                    <InputLabel>Available Seats</InputLabel>
                    <Select
                      value={formData.availableSeats}
                      label="Available Seats"
                      onChange={(e) => 
                        setFormData({ ...formData, availableSeats: e.target.value as number })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <MenuItem key={num} value={num}>
                          {num} seat{num > 1 ? 's' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Pricing */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon />
                    Pricing
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Price per Seat"
                    value={formData.pricePerSeat}
                    onChange={(e) => 
                      setFormData({ ...formData, pricePerSeat: e.target.value })
                    }
                    required
                    type="number"
                    inputProps={{ min: 1, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>

                {/* Vehicle Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CarIcon />
                    Vehicle Information
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={VEHICLE_MAKES}
                    getOptionLabel={(option) => option.name}
                    value={formData.vehicleMake}
                    onChange={(event, newValue) => 
                      setFormData({ ...formData, vehicleMake: newValue, vehicleModel: null })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Vehicle Make"
                        placeholder="Select make"
                        required
                        fullWidth
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={formData.vehicleMake ? VEHICLE_MODELS[formData.vehicleMake.id] || [] : []}
                    getOptionLabel={(option) => option.name}
                    value={formData.vehicleModel}
                    onChange={(event, newValue) => 
                      setFormData({ ...formData, vehicleModel: newValue })
                    }
                    disabled={!formData.vehicleMake}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Vehicle Model"
                        placeholder="Select model"
                        required
                        fullWidth
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={formData.vehicleYear}
                    onChange={(e) => 
                      setFormData({ ...formData, vehicleYear: parseInt(e.target.value) })
                    }
                    inputProps={{ min: 1990, max: CURRENT_YEAR + 1 }}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={formData.vehicleType}
                      label="Vehicle Type"
                      onChange={(e) => 
                        setFormData({ ...formData, vehicleType: e.target.value })
                      }
                    >
                      {VEHICLE_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Color</InputLabel>
                    <Select
                      value={formData.vehicleColor}
                      label="Color"
                      onChange={(e) => 
                        setFormData({ ...formData, vehicleColor: e.target.value })
                      }
                    >
                      {VEHICLE_COLORS.map((color) => (
                        <MenuItem key={color} value={color}>
                          {color}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="License Plate (Optional)"
                    value={formData.licensePlate}
                    onChange={(e) => 
                      setFormData({ ...formData, licensePlate: e.target.value })
                    }
                    placeholder="e.g., ABC-123"
                  />
                </Grid>

                {/* Vehicle Features */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Vehicle Features
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormGroup>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.hasUSBCharger}
                            onChange={(e) => 
                              setFormData({ ...formData, hasUSBCharger: e.target.checked })
                            }
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <UsbIcon fontSize="small" />
                            USB Charger
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.hasWiFi}
                            onChange={(e) => 
                              setFormData({ ...formData, hasWiFi: e.target.checked })
                            }
                          />
                        }
                        label="WiFi"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.hasAC}
                            onChange={(e) => 
                              setFormData({ ...formData, hasAC: e.target.checked })
                            }
                          />
                        }
                        label="Air Conditioning"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.hasHeating}
                            onChange={(e) => 
                              setFormData({ ...formData, hasHeating: e.target.checked })
                            }
                          />
                        }
                        label="Heating"
                      />
                    </Box>
                  </FormGroup>
                </Grid>

                {/* Ride Preferences */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Ride Preferences
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Luggage Policy</FormLabel>
                    <RadioGroup
                      value={formData.luggagePolicy}
                      onChange={(e) => 
                        setFormData({ ...formData, luggagePolicy: e.target.value })
                      }
                    >
                      {LUGGAGE_OPTIONS.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          value={option.value}
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{option.icon}</span>
                              {option.label}
                            </Box>
                          }
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormGroup>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Allowed in Vehicle</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.allowsSmoking}
                          onChange={(e) => 
                            setFormData({ ...formData, allowsSmoking: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SmokingIcon fontSize="small" />
                          Smoking
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.allowsPets}
                          onChange={(e) => 
                            setFormData({ ...formData, allowsPets: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PetsIcon fontSize="small" />
                          Pets
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.allowsWheelchair}
                          onChange={(e) => 
                            setFormData({ ...formData, allowsWheelchair: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessibleIcon fontSize="small" />
                          Wheelchair Accessible
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.allowsBikes}
                          onChange={(e) => 
                            setFormData({ ...formData, allowsBikes: e.target.checked })
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BikeIcon fontSize="small" />
                          Bikes Allowed
                        </Box>
                      }
                    />
                  </FormGroup>
                </Grid>

                {/* Additional Notes */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  <TextField
                    fullWidth
                    label="Additional Notes"
                    value={formData.description}
                    onChange={(e) => 
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Any additional information for passengers..."
                    multiline
                    rows={3}
                  />
                </Grid>

                {/* Submit Buttons */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/my-rides')}
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
                      {isSubmitting ? 'Creating...' : 'Create Ride'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateRidePage;