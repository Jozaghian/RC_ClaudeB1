import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete,
  ToggleButton,
  Slider,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  DirectionsCar as CarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AcUnit as AcIcon,
  Bluetooth as BluetoothIcon,
  Power as UsbIcon,
  Wifi as WifiIcon,
  EventSeat as ChairIcon,
  WbSunny as SunroofIcon,
  Navigation as GpsIcon,
  Videocam as CameraIcon,
  Whatshot as HeatedIcon,
  Pets as PetIcon,
  SmokeFree as NoSmokingIcon,
  Accessible as AccessibleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useLoading } from '../../contexts/LoadingContext';

// Vehicle data constants (same as mobile app)
const VEHICLE_COLORS = [
  'White', 'Black', 'Silver', 'Gray', 
  'Red', 'Blue', 'Green', 'Yellow', 
  'Orange', 'Brown', 'Beige', 'Purple'
];

const CAR_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 
  'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 
  'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Ram', 
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

const CAR_MODELS: { [key: string]: string[] } = {
  'Toyota': ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'Sienna', 'Tacoma', 'Tundra', 'Avalon', 'Yaris'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Passport', 'Ridgeline', 'Insight', 'Fit'],
  'Ford': ['F-150', 'Escape', 'Explorer', 'Focus', 'Fusion', 'Mustang', 'Edge', 'Expedition', 'Transit', 'Ranger'],
  'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe', 'Suburban', 'Camaro', 'Corvette', 'Impala', 'Cruze'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X1', 'X7', 'i3', 'i8', 'Z4'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA', 'GLB', 'G-Class'],
  'Audi': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8'],
  'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Murano', 'Armada', 'Maxima', 'Versa', 'Kicks', 'Titan'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Accent', 'Veloster', 'Genesis'],
  'Kia': ['Optima', 'Forte', 'Sportage', 'Sorento', 'Telluride', 'Soul', 'Rio', 'Stinger', 'Niro', 'Sedona'],
  'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'Beetle', 'Arteon', 'ID.4', 'Touareg', 'CC'],
  'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Legacy', 'Impreza', 'Ascent', 'WRX', 'BRZ', 'Tribeca', 'Baja'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck', 'Roadster'],
  'Lexus': ['ES', 'IS', 'LS', 'GS', 'RX', 'GX', 'LX', 'NX', 'UX', 'LC'],
  'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'MX-5 Miata', 'CX-3', 'Mazda2', 'RX-8', 'Tribute'],
  'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Patriot', 'Liberty', 'Commander', 'Grand Wagoneer'],
  'Dodge': ['Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Ram', 'Viper', 'Dart', 'Avenger', 'Caliber'],
  'Cadillac': ['Escalade', 'XT5', 'XT4', 'CT5', 'CT4', 'XT6', 'Eldorado', 'DeVille', 'CTS', 'SRX'],
  'Buick': ['Enclave', 'Envision', 'Encore', 'LaCrosse', 'Regal', 'Verano', 'Lucerne', 'LeSabre', 'Century', 'Rendezvous'],
  'GMC': ['Sierra', 'Terrain', 'Acadia', 'Yukon', 'Canyon', 'Savana', 'Envoy', 'Jimmy', 'Suburban', 'Denali'],
  'Lincoln': ['Navigator', 'Aviator', 'Corsair', 'Nautilus', 'Continental', 'MKZ', 'MKX', 'MKC', 'Town Car', 'LS'],
  'Acura': ['TLX', 'ILX', 'MDX', 'RDX', 'TSX', 'TL', 'RL', 'ZDX', 'RSX', 'Integra'],
  'Infiniti': ['Q50', 'Q60', 'QX50', 'QX60', 'QX80', 'G35', 'G37', 'M35', 'FX35', 'EX35'],
  'Mitsubishi': ['Outlander', 'Eclipse Cross', 'Mirage', 'ASX', 'Lancer', 'Galant', 'Montero', 'Pajero', '3000GT', 'Diamante'],
  'Volvo': ['XC90', 'XC60', 'XC40', 'S90', 'S60', 'V90', 'V60', 'C40', 'S40', 'V40'],
  'Genesis': ['G90', 'G80', 'GV70', 'GV80', 'Coupe', 'Sedan'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City']
};

const VEHICLE_TYPES = [
  'SEDAN', 'SUV', 'VAN', 'TRUCK', 'COUPE', 'HATCHBACK'
];

const VEHICLE_FEATURES = [
  { id: 'air_conditioning', label: 'Air Conditioning', icon: <AcIcon /> },
  { id: 'bluetooth', label: 'Bluetooth', icon: <BluetoothIcon /> },
  { id: 'usb_charging', label: 'USB Charging', icon: <UsbIcon /> },
  { id: 'wifi', label: 'Wi-Fi', icon: <WifiIcon /> },
  { id: 'leather_seats', label: 'Leather Seats', icon: <ChairIcon /> },
  { id: 'sunroof', label: 'Sunroof', icon: <SunroofIcon /> },
  { id: 'gps', label: 'GPS Navigation', icon: <GpsIcon /> },
  { id: 'backup_camera', label: 'Backup Camera', icon: <CameraIcon /> },
  { id: 'heated_seats', label: 'Heated Seats', icon: <HeatedIcon /> },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: <PetIcon /> },
  { id: 'non_smoking', label: 'Non-Smoking', icon: <NoSmokingIcon /> },
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: <AccessibleIcon /> },
];

// Mock data for development
const MOCK_VEHICLES = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'White',
    licensePlate: 'ABC123',
    type: 'SEDAN',
    seats: 5,
    features: ['air_conditioning', 'bluetooth', 'usb_charging'],
    description: 'Reliable and comfortable sedan',
  },
  {
    id: '2',
    make: 'Honda',
    model: 'CR-V',
    year: 2019,
    color: 'Blue',
    licensePlate: 'XYZ789',
    type: 'SUV',
    seats: 7,
    features: ['air_conditioning', 'bluetooth', 'backup_camera', 'heated_seats'],
    description: 'Spacious SUV perfect for families',
  },
];

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: string;
  seats: number;
  features: string[];
  description?: string;
}

interface VehicleForm {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  type: string;
  seats: number;
  features: string[];
  description: string;
}

const VehicleManagementPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setLoading } = useLoading();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    type: 'SEDAN',
    seats: 5,
    features: [],
    description: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - in real app, this would be: await apiService.get('/vehicles/my-vehicles');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVehicles(MOCK_VEHICLES);
    } catch (error) {
      console.error('Load vehicles error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setVehicleForm({
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      type: 'SEDAN',
      seats: 5,
      features: [],
      description: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!vehicleForm.make.trim()) {
      newErrors.make = 'Vehicle make is required';
    }

    if (!vehicleForm.model.trim()) {
      newErrors.model = 'Vehicle model is required';
    }

    const year = parseInt(vehicleForm.year);
    if (!year || year < 1900 || year > new Date().getFullYear() + 1) {
      newErrors.year = 'Please enter a valid year';
    }

    if (!vehicleForm.color) {
      newErrors.color = 'Please select a color';
    }

    if (!vehicleForm.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    }

    if (vehicleForm.seats < 1 || vehicleForm.seats > 12) {
      newErrors.seats = 'Seating capacity must be between 1 and 12';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVehicle = () => {
    resetForm();
    setEditingVehicle(null);
    setDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setVehicleForm({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      type: vehicle.type,
      seats: vehicle.seats,
      features: vehicle.features || [],
      description: vehicle.description || '',
    });
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    setLoading(true, 'Deleting vehicle...');
    try {
      // Simulate API call - in real app: await apiService.delete(`/vehicles/${vehicleToDelete.id}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id));
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    } catch (error) {
      console.error('Delete vehicle error:', error);
      alert('Failed to delete vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!validateForm()) return;

    setLoading(true, editingVehicle ? 'Updating vehicle...' : 'Adding vehicle...');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const vehicleData: Vehicle = {
        id: editingVehicle?.id || Date.now().toString(),
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        year: parseInt(vehicleForm.year),
        color: vehicleForm.color,
        licensePlate: vehicleForm.licensePlate.trim().toUpperCase(),
        type: vehicleForm.type,
        seats: vehicleForm.seats,
        features: vehicleForm.features,
        description: vehicleForm.description.trim(),
      };

      if (editingVehicle) {
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? vehicleData : v));
      } else {
        setVehicles(prev => [...prev, vehicleData]);
      }

      setDialogOpen(false);
      resetForm();
      setEditingVehicle(null);
    } catch (error) {
      console.error('Save vehicle error:', error);
      alert('Failed to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof VehicleForm) => (event: any) => {
    const value = event.target ? event.target.value : event;
    setVehicleForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleFeature = (featureId: string) => {
    setVehicleForm(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const getAvailableModels = () => {
    return CAR_MODELS[vehicleForm.make] || [];
  };

  const getFeatureDisplay = (featureId: string) => {
    const feature = VEHICLE_FEATURES.find(f => f.id === featureId);
    return feature ? { icon: feature.icon, label: feature.label } : null;
  };

  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                mb: 1,
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              🚗 Vehicle Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your vehicles for ride posting
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddVehicle}
            sx={{ minWidth: { xs: 'auto', md: 140 } }}
          >
            {isMobile ? 'Add' : 'Add Vehicle'}
          </Button>
        </Box>

        {/* Vehicles List */}
        {vehicles.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              No vehicles added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first vehicle to start posting rides
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddVehicle}
            >
              Add Your First Vehicle
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} md={6} lg={4} key={vehicle.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {vehicle.color} • {vehicle.licensePlate} • {vehicle.seats} seats
                    </Typography>

                    <Chip 
                      label={vehicle.type}
                      size="small"
                      color="primary"
                      sx={{ mb: 2 }}
                    />

                    {vehicle.features && vehicle.features.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                          Features:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {vehicle.features.slice(0, 3).map((featureId) => {
                            const feature = getFeatureDisplay(featureId);
                            return feature ? (
                              <Chip
                                key={featureId}
                                icon={feature.icon}
                                label={feature.label}
                                size="small"
                                variant="outlined"
                              />
                            ) : null;
                          })}
                          {vehicle.features.length > 3 && (
                            <Chip
                              label={`+${vehicle.features.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {vehicle.description && (
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.description}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => handleEditVehicle(vehicle)}
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteVehicle(vehicle)}
                      color="error"
                      size="small"
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add/Edit Vehicle Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Vehicle Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CarIcon />
                  Vehicle Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  value={vehicleForm.make}
                  onChange={(_, value) => handleFormChange('make')(value || '')}
                  options={CAR_MAKES}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Make *"
                      error={!!errors.make}
                      helperText={errors.make}
                      placeholder="Toyota, Honda, Ford..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  value={vehicleForm.model}
                  onChange={(_, value) => handleFormChange('model')(value || '')}
                  options={getAvailableModels()}
                  disabled={!vehicleForm.make}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Model *"
                      error={!!errors.model}
                      helperText={errors.model}
                      placeholder="Camry, Civic, F-150..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year *"
                  value={vehicleForm.year}
                  onChange={handleFormChange('year')}
                  error={!!errors.year}
                  helperText={errors.year}
                  placeholder="2020"
                  type="number"
                  inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.color}>
                  <InputLabel>Color *</InputLabel>
                  <Select
                    value={vehicleForm.color}
                    onChange={handleFormChange('color')}
                    label="Color *"
                  >
                    {VEHICLE_COLORS.map((color) => (
                      <MenuItem key={color} value={color}>
                        {color}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Plate *"
                  value={vehicleForm.licensePlate}
                  onChange={handleFormChange('licensePlate')}
                  error={!!errors.licensePlate}
                  helperText={errors.licensePlate}
                  placeholder="ABC123"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={vehicleForm.type}
                    onChange={handleFormChange('type')}
                    label="Vehicle Type"
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  Seating Capacity: {vehicleForm.seats} seats
                </Typography>
                <Slider
                  value={vehicleForm.seats}
                  onChange={(_, value) => handleFormChange('seats')(value)}
                  min={1}
                  max={12}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>

              {/* Vehicle Features */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon />
                  Vehicle Features
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select the features available in your vehicle
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={1}>
                  {VEHICLE_FEATURES.map((feature) => (
                    <Grid item xs={6} sm={4} md={3} key={feature.id}>
                      <ToggleButton
                        value={feature.id}
                        selected={vehicleForm.features.includes(feature.id)}
                        onChange={() => toggleFeature(feature.id)}
                        fullWidth
                        sx={{ 
                          flexDirection: 'column',
                          gap: 1,
                          py: 2,
                          height: 80,
                          fontSize: '0.75rem'
                        }}
                      >
                        {feature.icon}
                        <Typography variant="caption" align="center">
                          {feature.label}
                        </Typography>
                      </ToggleButton>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={vehicleForm.description}
                  onChange={handleFormChange('description')}
                  placeholder="Additional details about your vehicle..."
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveVehicle}
              variant="contained"
              startIcon={<SaveIcon />}
            >
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Vehicle</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete your {vehicleToDelete?.year} {vehicleToDelete?.make} {vehicleToDelete?.model}?
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone. Any rides using this vehicle will need to be updated.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDeleteVehicle} color="error" variant="contained">
              Delete Vehicle
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default VehicleManagementPage;