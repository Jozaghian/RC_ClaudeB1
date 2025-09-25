import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import { capitalizeWords } from '../utils/helpers';
import apiService from '../services/apiService';

const VEHICLE_COLORS = [
  'White', 'Black', 'Silver', 'Gray',
  'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Brown', 'Beige', 'Purple',
  'Other'
];

// Popular car makes and models for autocomplete
const CAR_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 
  'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 
  'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Ram', 
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

const CAR_MODELS = {
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

const VEHICLE_FEATURES = [
  { id: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
  { id: 'bluetooth', label: 'Bluetooth', icon: '📱' },
  { id: 'usb_charging', label: 'USB Charging', icon: '🔌' },
  { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { id: 'leather_seats', label: 'Leather Seats', icon: '🛋️' },
  { id: 'sunroof', label: 'Sunroof', icon: '☀️' },
  { id: 'gps', label: 'GPS Navigation', icon: '🗺️' },
  { id: 'backup_camera', label: 'Backup Camera', icon: '📹' },
  { id: 'heated_seats', label: 'Heated Seats', icon: '🔥' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
  { id: 'non_smoking', label: 'Non-Smoking', icon: '🚭' },
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
];

export default function VehicleManagementScreen({ route, navigation }) {
  const { isRegistration = false, returnToCreateRide = false } = route.params || {};
  const [vehicles, setVehicles] = useState([]);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    seatingCapacity: 4,
    features: [],
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Autocomplete states
  const [makeSuggestions, setMakeSuggestions] = useState([]);
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [customColor, setCustomColor] = useState('');

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    // If this is part of registration flow, automatically show add vehicle form
    if (isRegistration && vehicles.length === 0 && !loading) {
      setIsAddingVehicle(true);
    }
  }, [isRegistration, vehicles.length, loading]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/vehicles/my-vehicles');
      if (response.success) {
        setVehicles(response.data.vehicles);
      }
    } catch (error) {
      console.error('Load vehicles error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const resetForm = () => {
    setVehicleForm({
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      seatingCapacity: 4,
      features: [],
      description: '',
    });
    // Reset autocomplete states
    setMakeSuggestions([]);
    setModelSuggestions([]);
    setShowMakeSuggestions(false);
    setShowModelSuggestions(false);
    // Reset custom color
    setCustomColor('');
  };

  // Autocomplete functions
  const searchMakes = (query) => {
    if (!query || query.length < 1) {
      setMakeSuggestions([]);
      setShowMakeSuggestions(false);
      return;
    }

    const filteredMakes = CAR_MAKES.filter(make =>
      make.toLowerCase().includes(query.toLowerCase())
    );
    setMakeSuggestions(filteredMakes.slice(0, 5)); // Limit to 5 suggestions
    setShowMakeSuggestions(filteredMakes.length > 0);
  };

  const searchModels = (query, selectedMake) => {
    if (!query || query.length < 1 || !selectedMake) {
      setModelSuggestions([]);
      setShowModelSuggestions(false);
      return;
    }

    const makeModels = CAR_MODELS[selectedMake] || [];
    const filteredModels = makeModels.filter(model =>
      model.toLowerCase().includes(query.toLowerCase())
    );
    setModelSuggestions(filteredModels.slice(0, 5)); // Limit to 5 suggestions
    setShowModelSuggestions(filteredModels.length > 0);
  };

  const handleMakeChange = (text) => {
    setVehicleForm(prev => ({ ...prev, make: text, model: '' })); // Clear model when make changes
    searchMakes(text);
    setShowModelSuggestions(false); // Hide model suggestions when make changes
  };

  const handleModelChange = (text) => {
    setVehicleForm(prev => ({ ...prev, model: text }));
    searchModels(text, vehicleForm.make);
  };

  const selectMake = (make) => {
    setVehicleForm(prev => ({ ...prev, make, model: '' })); // Clear model when make is selected
    setShowMakeSuggestions(false);
    setMakeSuggestions([]);
    setShowModelSuggestions(false);
  };

  const selectModel = (model) => {
    setVehicleForm(prev => ({ ...prev, model }));
    setShowModelSuggestions(false);
    setModelSuggestions([]);
  };

  const handleAddVehicle = () => {
    resetForm();
    setEditingVehicle(null);
    setIsAddingVehicle(true);
  };

  const handleEditVehicle = (vehicle) => {
    // Check if color is a standard color or custom
    const isStandardColor = VEHICLE_COLORS.includes(vehicle.color);

    setVehicleForm({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      color: isStandardColor ? vehicle.color : 'Other',
      licensePlate: vehicle.licensePlate,
      seatingCapacity: vehicle.seatingCapacity,
      features: vehicle.features || [],
      description: vehicle.description || '',
    });

    // Set custom color if it's not a standard color
    if (!isStandardColor) {
      setCustomColor(vehicle.color);
    } else {
      setCustomColor('');
    }

    setEditingVehicle(vehicle);
    setIsAddingVehicle(true);
  };

  const handleDeleteVehicle = (vehicle) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete your ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
      [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteVehicle(vehicle.id) }
      ]
    );
  };

  const confirmDeleteVehicle = async (vehicleId) => {
    setGlobalLoading(true);

    try {
      const response = await apiService.delete(`/vehicles/${vehicleId}`);
      
      if (response.success) {
        Alert.alert('Vehicle Deleted', 'Your vehicle has been deleted successfully.');
        await loadVehicles();
      }
    } catch (error) {
      console.error('Delete vehicle error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete vehicle.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const validateForm = () => {
    if (!vehicleForm.make.trim()) {
      Alert.alert('Validation Error', 'Please enter the vehicle make');
      return false;
    }

    if (!vehicleForm.model.trim()) {
      Alert.alert('Validation Error', 'Please enter the vehicle model');
      return false;
    }

    const year = parseInt(vehicleForm.year);
    if (!year || year < 1900 || year > new Date().getFullYear() + 1) {
      Alert.alert('Validation Error', 'Please enter a valid year');
      return false;
    }

    if (!vehicleForm.color) {
      Alert.alert('Validation Error', 'Please select a color');
      return false;
    }

    if (vehicleForm.color === 'Other' && !customColor.trim()) {
      Alert.alert('Validation Error', 'Please enter a custom color');
      return false;
    }

    if (!vehicleForm.licensePlate.trim()) {
      Alert.alert('Validation Error', 'Please enter the license plate');
      return false;
    }

    if (vehicleForm.seatingCapacity < 1 || vehicleForm.seatingCapacity > 12) {
      Alert.alert('Validation Error', 'Seating capacity must be between 1 and 12');
      return false;
    }

    return true;
  };

  const handleSaveVehicle = async () => {
    if (!validateForm()) return;

    setGlobalLoading(true);

    try {
      const vehicleData = {
        ...vehicleForm,
        year: parseInt(vehicleForm.year),
        make: capitalizeWords(vehicleForm.make.trim()),
        model: capitalizeWords(vehicleForm.model.trim()),
        licensePlate: vehicleForm.licensePlate.trim().toUpperCase(),
        color: vehicleForm.color === 'Other' ? capitalizeWords(customColor.trim()) : vehicleForm.color,
      };

      let response;
      if (editingVehicle) {
        response = await apiService.put(`/vehicles/${editingVehicle.id}`, vehicleData);
      } else {
        response = await apiService.post('/vehicles', vehicleData);
      }

      if (response.success) {
        if (returnToCreateRide && !editingVehicle) {
          // Vehicle added during create ride flow - return to create ride
          Alert.alert(
            'Vehicle Added! 🚗',
            'Your vehicle has been added successfully. Now you can continue creating your first ride.',
            [{ text: 'Continue', onPress: () => navigation.navigate('CreateRide', { isFirstRide: true }) }]
          );
        } else if (isRegistration && !editingVehicle) {
          // First vehicle added during registration (direct signup)
          Alert.alert(
            'Driver Setup Complete! 🎉',
            'Your vehicle has been added successfully. You\'re now ready to start posting rides and earning money.',
            [{ text: 'Start Driving', onPress: () => {
              // Navigate to main app - we'll reset the navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            }}]
          );
        } else {
          Alert.alert(
            'Success!',
            `Vehicle ${editingVehicle ? 'updated' : 'added'} successfully.`,
            [{ text: 'OK', onPress: () => {
              setIsAddingVehicle(false);
              setEditingVehicle(null);
              resetForm();
              loadVehicles();
            }}]
          );
        }
      }
    } catch (error) {
      console.error('Save vehicle error:', error);

      // Better error handling based on error type
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again to save your vehicle.');
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Invalid vehicle information. Please check your entries.';
        Alert.alert('Validation Error', message);
      } else if (error.response?.status === 409) {
        Alert.alert('Duplicate Vehicle', 'A vehicle with this license plate already exists.');
      } else if (error.response?.status >= 500) {
        Alert.alert('Server Error', 'Our servers are temporarily unavailable. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      } else {
        const message = error.response?.data?.message || 'Unable to save vehicle right now. Please try again.';
        Alert.alert('Error', message);
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleCancelForm = () => {
    setIsAddingVehicle(false);
    setEditingVehicle(null);
    resetForm();
  };

  const toggleFeature = (featureId) => {
    const currentFeatures = vehicleForm.features;
    const isSelected = currentFeatures.includes(featureId);
    
    if (isSelected) {
      setVehicleForm({
        ...vehicleForm,
        features: currentFeatures.filter(f => f !== featureId)
      });
    } else {
      setVehicleForm({
        ...vehicleForm,
        features: [...currentFeatures, featureId]
      });
    }
  };

  const renderVehicle = ({ item: vehicle }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.vehicleDetails}>
            {vehicle.color} • {vehicle.licensePlate} • {vehicle.seatingCapacity} seats
          </Text>
        </View>
        
        <View style={styles.vehicleActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditVehicle(vehicle)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteVehicle(vehicle)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {vehicle.features && vehicle.features.length > 0 && (
        <View style={styles.vehicleFeatures}>
          {vehicle.features.slice(0, 3).map((featureId) => {
            const feature = VEHICLE_FEATURES.find(f => f.id === featureId);
            return feature ? (
              <View key={featureId} style={styles.featureTag}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.label}</Text>
              </View>
            ) : null;
          })}
          {vehicle.features.length > 3 && (
            <Text style={styles.moreFeatures}>+{vehicle.features.length - 3} more</Text>
          )}
        </View>
      )}

      {vehicle.description && (
        <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
      )}
    </View>
  );

  const renderColorOption = (color) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        vehicleForm.color === color && styles.colorOptionSelected
      ]}
      onPress={() => {
        setVehicleForm({ ...vehicleForm, color });
        if (color !== 'Other') {
          setCustomColor('');
        }
      }}
    >
      <Text style={[
        styles.colorOptionText,
        vehicleForm.color === color && styles.colorOptionTextSelected
      ]}>
        {color}
      </Text>
    </TouchableOpacity>
  );

  const renderFeatureOption = (feature) => (
    <TouchableOpacity
      key={feature.id}
      style={[
        styles.featureOption,
        vehicleForm.features.includes(feature.id) && styles.featureOptionSelected
      ]}
      onPress={() => toggleFeature(feature.id)}
    >
      <Text style={styles.featureOptionIcon}>{feature.icon}</Text>
      <Text style={[
        styles.featureOptionText,
        vehicleForm.features.includes(feature.id) && styles.featureOptionTextSelected
      ]}>
        {feature.label}
      </Text>
    </TouchableOpacity>
  );

  if (isAddingVehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {editingVehicle ? 'Update your vehicle information' : 'Register your vehicle for ride posting'}
            </Text>
          </View>

          {/* Vehicle Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Vehicle Information</Text>
            
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.inputLabel}>Make *</Text>
                <TextInput
                  style={styles.textInput}
                  value={vehicleForm.make}
                  onChangeText={handleMakeChange}
                  placeholder="Toyota, Honda, Ford..."
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="words"
                />
                
                {/* Make Suggestions */}
                {showMakeSuggestions && makeSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {makeSuggestions.map((make, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => selectMake(make)}
                      >
                        <Text style={styles.suggestionText}>{make}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.inputLabel}>Model *</Text>
                <TextInput
                  style={styles.textInput}
                  value={vehicleForm.model}
                  onChangeText={handleModelChange}
                  placeholder="Corolla, Civic, F-150..."
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="words"
                  editable={vehicleForm.make.length > 0} // Only allow model input if make is selected
                />
                
                {/* Model Suggestions */}
                {showModelSuggestions && modelSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {modelSuggestions.map((model, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => selectModel(model)}
                      >
                        <Text style={styles.suggestionText}>{model}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.inputLabel}>Year *</Text>
                <TextInput
                  style={styles.textInput}
                  value={vehicleForm.year}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, year: text })}
                  placeholder="2020"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.inputLabel}>License Plate *</Text>
                <TextInput
                  style={styles.textInput}
                  value={vehicleForm.licensePlate}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, licensePlate: text })}
                  placeholder="ABC 123"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Color *</Text>
              <View style={styles.colorGrid}>
                {VEHICLE_COLORS.map(renderColorOption)}
              </View>
              {vehicleForm.color === 'Other' && (
                <TextInput
                  style={[styles.input, { marginTop: spacing.sm }]}
                  placeholder="Enter custom color"
                  value={customColor}
                  onChangeText={setCustomColor}
                  placeholderTextColor={colors.textLight}
                  maxLength={20}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Seating Capacity *</Text>
              <View style={styles.seatingSelector}>
                <TouchableOpacity
                  style={styles.seatingButton}
                  onPress={() => setVehicleForm({ 
                    ...vehicleForm, 
                    seatingCapacity: Math.max(1, vehicleForm.seatingCapacity - 1) 
                  })}
                >
                  <Text style={styles.seatingButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.seatingCount}>{vehicleForm.seatingCapacity} seats</Text>
                <TouchableOpacity
                  style={styles.seatingButton}
                  onPress={() => setVehicleForm({ 
                    ...vehicleForm, 
                    seatingCapacity: Math.min(12, vehicleForm.seatingCapacity + 1) 
                  })}
                >
                  <Text style={styles.seatingButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                value={vehicleForm.description}
                onChangeText={(text) => setVehicleForm({ ...vehicleForm, description: text })}
                placeholder="Additional details about your vehicle..."
                placeholderTextColor={colors.textLight}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Vehicle Features</Text>
            <Text style={styles.sectionSubtitle}>
              Select features that apply to your vehicle
            </Text>
            
            <View style={styles.featuresGrid}>
              {VEHICLE_FEATURES.map(renderFeatureOption)}
            </View>
          </View>


          {/* Action Buttons */}
          <View style={styles.formActions}>
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={handleCancelForm}
              style={styles.formActionButton}
            />
            <DriverButton
              title={editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              onPress={handleSaveVehicle}
              style={styles.formActionButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
        </View>

        {/* Add Vehicle Button */}
        <View style={styles.addVehicleSection}>
          <DriverButton
            title="Add New Vehicle"
            onPress={handleAddVehicle}
            fullWidth
            style={styles.driverButton}
          />
        </View>

        {/* Vehicles List */}
        {vehicles.length > 0 ? (
          <View style={styles.vehiclesSection}>
            <FlatList
              data={vehicles}
              renderItem={renderVehicle}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🚗</Text>
            <Text style={styles.emptyStateTitle}>No vehicles registered</Text>
            <Text style={styles.emptyStateMessage}>
              Add your first vehicle to start posting rides and earning credits.
            </Text>
            <DriverButton
              title="Add Your First Vehicle"
              onPress={handleAddVehicle}
              style={styles.roleButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  addVehicleSection: {
    padding: spacing.md,
  },
  vehiclesSection: {
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vehicleDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  deleteButtonText: {
    color: colors.white,
  },
  vehicleFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  featureIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  moreFeatures: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
  vehicleDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    ...componentStyles.input.default,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formField: {
    flex: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    minWidth: 80,
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  colorOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  colorOptionTextSelected: {
    color: colors.primary,
  },
  seatingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray400,
  },
  seatingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatingButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  seatingCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    width: '48%',
  },
  featureOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  featureOptionIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  featureOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  featureOptionTextSelected: {
    color: colors.primary,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  formActionButton: {
    flex: 1,
    height: 55,
  },
  driverButton: {
    marginBottom: spacing.md,
    height: 55,
  },
  roleButton: {
    marginBottom: spacing.md,
    height: 55,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyStateMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  // Autocomplete styles
  suggestionsContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginTop: spacing.xs,
    maxHeight: 200,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
});