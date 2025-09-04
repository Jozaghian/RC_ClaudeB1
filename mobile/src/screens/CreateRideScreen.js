import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import { formatDate, formatTime, debounce, formatCurrency } from '../utils/helpers';
import apiService from '../services/apiService';
import { searchLocations } from '../data/canadianLocations';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: '💵' },
  { id: 'E_TRANSFER', label: 'E-Transfer', icon: '💳' },
  { id: 'CREDIT_CARD', label: 'Credit Card', icon: '🏦' },
];

const TRIP_TYPES = [
  { id: 'SINGLE', label: 'Single Trip', description: 'One-time ride', icon: '🚗' },
  { id: 'RETURN', label: 'Return Trip', description: 'Round trip with return', icon: '🔄' },
  { id: 'RECURRING', label: 'Recurring Trip', description: 'Regular scheduled rides', icon: '📅' },
];

export default function CreateRideScreen({ route, navigation }) {
  const { isFirstRide = false } = route.params || {};
  const [formData, setFormData] = useState({
    originCityId: '',
    destinationCityId: '',
    departureDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    seatsAvailable: 3,
    pricePerSeat: '',
    paymentMethods: ['CASH'],
    vehicleId: '',
    pickupDetails: '',
    dropoffDetails: '',
    notes: '',
    allowInstantBooking: true,
    allowWaitlist: false,
    // Ride information
    smokingAllowed: false,
    luggage: 'none',
    luggageCharge: '',
    bikeAllowed: false,
    wheelchairAccessible: false,
    pets: 'none',
    // Trip type and scheduling
    tripType: 'SINGLE',
    returnDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    returnNotes: '',
    // Terms acceptance
    acceptTerms: false,
  });

  const [originCity, setOriginCity] = useState(null);
  const [destinationCity, setDestinationCity] = useState(null);
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [cities, setCities] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(null); // 'origin' or 'destination' or null
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadUserVehicles();
    loadUserCredits();
  }, []);

  const loadUserVehicles = async () => {
    try {
      const response = await apiService.get('/vehicles/my-vehicles');
      if (response.success) {
        setVehicles(response.data.vehicles);
        
        // Smart defaults logic
        if (response.data.vehicles.length === 1) {
          // Auto-select the only vehicle as default
          setSelectedVehicle(response.data.vehicles[0]);
          setFormData(prev => ({ ...prev, vehicleId: response.data.vehicles[0].id }));
          console.log('✅ Auto-selected single vehicle:', response.data.vehicles[0].make, response.data.vehicles[0].model);
        } else if (response.data.vehicles.length > 1) {
          // Multiple vehicles - user needs to select
          setSelectedVehicle(null);
          setFormData(prev => ({ ...prev, vehicleId: '' }));
          console.log('📋 Multiple vehicles found - user needs to select');
        } else if (isFirstRide) {
          // No vehicles found during first ride creation - redirect to add vehicle
          Alert.alert(
            'Add Your Vehicle First',
            'To create a ride, you need to add your vehicle information first. Let\'s set that up now.',
            [{ text: 'Add Vehicle', onPress: () => navigation.navigate('VehicleManagement', { isRegistration: true, returnToCreateRide: true }) }]
          );
        }
      }
    } catch (error) {
      console.error('Load vehicles error:', error);
    }
  };

  const loadUserCredits = async () => {
    try {
      const response = await apiService.get('/credits/balance');
      if (response.success) {
        setUserCredits(response.data.balance);
      }
    } catch (error) {
      console.error('Load credits error:', error);
    }
  };

  const searchCities = debounce((query) => {
    console.log('🔍 CREATE RIDE - Searching for:', query, 'in mode:', searchMode);
    if (!query || query.length < 1) {
      setCities([]);
      return;
    }

    const results = searchLocations(query);
    console.log('📍 CREATE RIDE - Found locations:', results.length, results.map(r => r.name));
    setCities(results);
  }, 300);

  const handleSearchChange = (text) => {
    console.log('🔍 CREATE RIDE - Search change:', text, 'mode:', searchMode);
    setSearchQuery(text);
    searchCities(text);
  };

  const selectCity = (city) => {
    console.log('🎯 CREATE RIDE - Selecting city:', city.name, 'for mode:', searchMode);
    if (searchMode === 'origin') {
      setOriginCity(city);
      setOriginText(`${city.name}, ${city.province}`);
      setFormData(prev => ({ ...prev, originCityId: city.id }));
    } else if (searchMode === 'destination') {
      setDestinationCity(city);
      setDestinationText(`${city.name}, ${city.province}`);
      setFormData(prev => ({ ...prev, destinationCityId: city.id }));
    }
    setSearchQuery('');
    setSearchMode(null);
    setCities([]);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(formData.departureDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setFormData(prev => ({ ...prev, departureDateTime: newDateTime }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.departureDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setFormData(prev => ({ ...prev, departureDateTime: newDateTime }));
    }
  };

  const handleReturnDateChange = (event, selectedDate) => {
    setShowReturnDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(formData.returnDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setFormData(prev => ({ ...prev, returnDateTime: newDateTime }));
    }
  };

  const handleReturnTimeChange = (event, selectedTime) => {
    setShowReturnTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.returnDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setFormData(prev => ({ ...prev, returnDateTime: newDateTime }));
    }
  };

  const togglePaymentMethod = (methodId) => {
    setFormData(prev => {
      const currentMethods = prev.paymentMethods;
      const isSelected = currentMethods.includes(methodId);
      
      if (isSelected) {
        // Don't allow removing the last payment method
        if (currentMethods.length === 1) {
          Alert.alert('Error', 'At least one payment method must be selected.');
          return prev;
        }
        return {
          ...prev,
          paymentMethods: currentMethods.filter(method => method !== methodId)
        };
      } else {
        return {
          ...prev,
          paymentMethods: [...currentMethods, methodId]
        };
      }
    });
  };

  const validateForm = () => {
    if (!originCity) {
      Alert.alert('Validation Error', 'Please select an origin city');
      return false;
    }

    if (!destinationCity) {
      Alert.alert('Validation Error', 'Please select a destination city');
      return false;
    }

    if (originCity.id === destinationCity.id) {
      Alert.alert('Validation Error', 'Origin and destination must be different cities');
      return false;
    }

    if (formData.departureDateTime <= new Date()) {
      Alert.alert('Validation Error', 'Departure time must be in the future');
      return false;
    }

    if (!formData.pricePerSeat || parseFloat(formData.pricePerSeat) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price per seat');
      return false;
    }

    if (formData.seatsAvailable < 1 || formData.seatsAvailable > 8) {
      Alert.alert('Validation Error', 'Available seats must be between 1 and 8');
      return false;
    }

    if (!formData.vehicleId) {
      Alert.alert('Validation Error', 'Please select a vehicle');
      return false;
    }

    if (userCredits < 1) {
      Alert.alert(
        'Insufficient Credits',
        'You need at least 1 credit to post a ride. Purchase credits to continue.',
        [
          { text: 'Cancel' },
          { text: 'Buy Credits', onPress: () => navigation.navigate('CreditManagement') }
        ]
      );
      return false;
    }

    if (!formData.acceptTerms) {
      Alert.alert('Terms Required', 'You must accept the Terms of Service and Privacy Policy to post a ride');
      return false;
    }

    return true;
  };

  const handleCreateRide = async () => {
    if (!validateForm()) return;

    // Handle recurring trips differently
    if (formData.tripType === 'RECURRING') {
      const tripData = {
        ...formData,
        pricePerSeat: parseFloat(formData.pricePerSeat),
        departureDateTime: formData.departureDateTime.toISOString(),
        originCity,
        destinationCity,
      };
      
      navigation.navigate('RecurringTrip', { tripData });
      return;
    }

    setLoading(true);
    setGlobalLoading(true);

    try {
      const rideData = {
        ...formData,
        pricePerSeat: parseFloat(formData.pricePerSeat),
        departureDateTime: formData.departureDateTime.toISOString(),
      };

      // Add return trip data if it's a return trip
      if (formData.tripType === 'RETURN') {
        rideData.returnDateTime = formData.returnDateTime.toISOString();
        rideData.returnNotes = formData.returnNotes;
      }

      const response = await apiService.post('/rides', rideData);

      if (response.success) {
        if (isFirstRide) {
          Alert.alert(
            'First Ride Posted! 🎉',
            `Congratulations! Your ride from ${originCity.name} to ${destinationCity.name} has been posted successfully. You're now officially a Ride Club driver!`,
            [
              { text: 'Start Driving', onPress: () => {
                // Reset navigation to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              }}
            ]
          );
        } else {
          Alert.alert(
            'Ride Posted! 🚗',
            `Your ride from ${originCity.name} to ${destinationCity.name} has been posted successfully.`,
            [
              { text: 'OK', onPress: () => navigation.navigate('MyRides') }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Create ride error:', error);
      
      const moderationError = apiService.handleModerationError(error);
      if (moderationError.isModerationError) {
        Alert.alert(
          'Content Not Allowed',
          moderationError.message,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', moderationError.message || 'Failed to create ride. Please try again.');
      }
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                {isFirstRide ? 'Create Your First Ride 🎉' : 'Post New Ride'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isFirstRide 
                  ? 'Let\'s get you started as a driver! Fill in your trip details below.'
                  : `Credits: ${userCredits} (1 credit will be used)`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Route</Text>
          
          <View style={styles.routeContainer}>
            {/* Origin */}
            <View style={styles.cityInputContainer}>
              <Text style={styles.inputLabel}>From *</Text>
              <TextInput
                style={[styles.cityInput, originCity && styles.cityInputSelected]}
                value={originText}
                onChangeText={(text) => {
                  setOriginText(text);
                  setSearchQuery(text);
                  setSearchMode('origin');
                  searchCities(text);
                  if (text === '') {
                    setOriginCity(null);
                    setFormData(prev => ({ ...prev, originCityId: '' }));
                  }
                }}
                placeholder="Enter origin city"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
                autoCorrect={false}
              />
              
              {/* Origin Suggestions */}
              {searchMode === 'origin' && cities.length > 0 && (
                <View style={[styles.suggestionsContainer, {backgroundColor: '#f0f0f0', padding: 10}]}>
                  {cities.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.citySuggestion, {backgroundColor: '#ffffff', marginBottom: 5, padding: 10, borderRadius: 5}]}
                      onPress={() => selectCity(item)}
                    >
                      <Text style={[styles.cityName, {fontSize: 16, fontWeight: 'bold'}]}>{item.name}</Text>
                      <Text style={[styles.provinceName, {fontSize: 14, color: '#666'}]}>{item.province} • {item.type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Pickup Details - moved under origin */}
              {!searchMode && originCity && (
                <View style={styles.detailsInputContainer}>
                  <Text style={styles.inputLabel}>Pickup Details</Text>
                  <TextInput
                    style={styles.detailsTextInput}
                    value={formData.pickupDetails}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, pickupDetails: text }))}
                    placeholder="Specific pickup location or instructions..."
                    placeholderTextColor={colors.textLight}
                    multiline
                  />
                </View>
              )}
            </View>

            {/* Swap Button */}
            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                const tempCity = originCity;
                const tempText = originText;
                setOriginCity(destinationCity);
                setOriginText(destinationText);
                setDestinationCity(tempCity);
                setDestinationText(tempText);
                // Update form data
                setFormData(prev => ({ 
                  ...prev, 
                  originCityId: destinationCity?.id || '',
                  destinationCityId: tempCity?.id || ''
                }));
              }}
              disabled={!originCity || !destinationCity}
            >
              <Text style={styles.swapIcon}>🔄</Text>
            </TouchableOpacity>

            {/* Destination */}
            <View style={[styles.cityInputContainer, {marginBottom: spacing.xs}]}>
              <Text style={styles.inputLabel}>To *</Text>
              <TextInput
                style={[styles.cityInput, destinationCity && styles.cityInputSelected]}
                value={destinationText}
                onChangeText={(text) => {
                  setDestinationText(text);
                  setSearchQuery(text);
                  setSearchMode('destination');
                  searchCities(text);
                  if (text === '') {
                    setDestinationCity(null);
                    setFormData(prev => ({ ...prev, destinationCityId: '' }));
                  }
                }}
                placeholder="Enter destination city"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
                autoCorrect={false}
              />
              
              {/* Destination Suggestions */}
              {searchMode === 'destination' && cities.length > 0 && (
                <View style={[styles.suggestionsContainer, {backgroundColor: '#f0f0f0', padding: 10}]}>
                  {cities.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.citySuggestion, {backgroundColor: '#ffffff', marginBottom: 5, padding: 10, borderRadius: 5}]}
                      onPress={() => selectCity(item)}
                    >
                      <Text style={[styles.cityName, {fontSize: 16, fontWeight: 'bold'}]}>{item.name}</Text>
                      <Text style={[styles.provinceName, {fontSize: 14, color: '#666'}]}>{item.province} • {item.type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Drop-off Details - moved under destination */}
              {!searchMode && destinationCity && (
                <View style={styles.detailsInputContainer}>
                  <Text style={styles.inputLabel}>Drop-off Details</Text>
                  <TextInput
                    style={styles.detailsTextInput}
                    value={formData.dropoffDetails}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, dropoffDetails: text }))}
                    placeholder="Specific drop-off location or instructions..."
                    placeholderTextColor={colors.textLight}
                    multiline
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Additional Details */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Additional Notes</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <TextInput
                style={styles.textInput}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Music preferences, stops, luggage space, etc..."
                placeholderTextColor={colors.textLight}
                multiline
              />
            </View>
          </View>
        )}

        {/* Trip Type Selection */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Trip Type</Text>
            
            {TRIP_TYPES.map((tripType) => (
              <TouchableOpacity
                key={tripType.id}
                style={[
                  styles.tripTypeOption,
                  formData.tripType === tripType.id && styles.tripTypeSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, tripType: tripType.id }))}
              >
                <View style={styles.tripTypeContent}>
                  <View style={styles.tripTypeMain}>
                    <Text style={styles.tripTypeIcon}>{tripType.icon}</Text>
                    <View style={styles.tripTypeInfo}>
                      <Text style={[
                        styles.tripTypeLabel,
                        formData.tripType === tripType.id && styles.tripTypeLabelSelected
                      ]}>
                        {tripType.label}
                      </Text>
                      <Text style={styles.tripTypeDescription}>
                        {tripType.description}
                      </Text>
                    </View>
                  </View>
                  {formData.tripType === tripType.id && (
                    <Text style={styles.tripTypeCheck}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Date & Time Section */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Departure</Text>
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TouchableOpacity
                  style={styles.dateTimeInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatDate(formData.departureDateTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeContainer}>
                <Text style={styles.inputLabel}>Time *</Text>
                <TouchableOpacity
                  style={styles.dateTimeInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatTime(formData.departureDateTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.departureDateTime}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={formData.departureDateTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        )}

        {/* Return Trip Section */}
        {!searchMode && formData.tripType === 'RETURN' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 Return Trip</Text>
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <Text style={styles.inputLabel}>Return Date *</Text>
                <TouchableOpacity
                  style={styles.dateTimeInput}
                  onPress={() => setShowReturnDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatDate(formData.returnDateTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeContainer}>
                <Text style={styles.inputLabel}>Return Time *</Text>
                <TouchableOpacity
                  style={styles.dateTimeInput}
                  onPress={() => setShowReturnTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatTime(formData.returnDateTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Return Trip Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.returnNotes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, returnNotes: text }))}
                placeholder="Any additional info for the return trip..."
                placeholderTextColor={colors.textLight}
                multiline
              />
            </View>

            {showReturnDatePicker && (
              <DateTimePicker
                value={formData.returnDateTime}
                mode="date"
                display="default"
                minimumDate={formData.departureDateTime}
                onChange={handleReturnDateChange}
              />
            )}

            {showReturnTimePicker && (
              <DateTimePicker
                value={formData.returnDateTime}
                mode="time"
                display="default"
                onChange={handleReturnTimeChange}
              />
            )}
          </View>
        )}

        {/* Trip Details Section */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Trip Details</Text>
            
            <View style={styles.tripDetailsContainer}>
              <View style={styles.seatsContainer}>
                <Text style={styles.inputLabel}>Available Seats *</Text>
                <View style={styles.seatsSelector}>
                  <TouchableOpacity
                    style={styles.seatButton}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      seatsAvailable: Math.max(1, prev.seatsAvailable - 1) 
                    }))}
                  >
                    <Text style={styles.seatButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.seatCount}>{formData.seatsAvailable}</Text>
                  <TouchableOpacity
                    style={styles.seatButton}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      seatsAvailable: Math.min(8, prev.seatsAvailable + 1) 
                    }))}
                  >
                    <Text style={styles.seatButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.inputLabel}>Price per Seat (CAD) *</Text>
                <TextInput
                  style={styles.priceInput}
                  value={formData.pricePerSeat}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerSeat: text }))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Payment Methods *</Text>
              <View style={styles.paymentMethodsContainer}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodButton,
                      formData.paymentMethods.includes(method.id) && styles.paymentMethodSelected
                    ]}
                    onPress={() => togglePaymentMethod(method.id)}
                  >
                    <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                    <Text style={[
                      styles.paymentMethodText,
                      formData.paymentMethods.includes(method.id) && styles.paymentMethodTextSelected
                    ]}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Vehicle Section */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚙 Vehicle *</Text>
            
            {vehicles.length > 0 ? (
              <View style={styles.vehicleSelectionContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Select your vehicle</Text>
                  <TouchableOpacity
                    style={[styles.vehicleDropdown, selectedVehicle && styles.vehicleDropdownSelected]}
                    onPress={() => {
                      Alert.alert(
                        'Select Vehicle',
                        'Choose a vehicle for this ride:',
                        [
                          ...vehicles.map(vehicle => ({
                            text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color})`,
                            onPress: () => {
                              setSelectedVehicle(vehicle);
                              setFormData(prev => ({ ...prev, vehicleId: vehicle.id }));
                            }
                          })),
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={[
                      styles.vehicleDropdownText,
                      selectedVehicle && styles.vehicleDropdownTextSelected
                    ]}>
                      {selectedVehicle 
                        ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.color})`
                        : 'Tap to select vehicle'
                      }
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                <CustomButton
                  title="+ Add New Vehicle"
                  variant="outline"
                  onPress={() => navigation.navigate('VehicleManagement', { 
                    returnToCreateRide: true 
                  })}
                  style={styles.addVehicleButtonSmall}
                />
              </View>
            ) : (
              <View style={styles.noVehiclesContainer}>
                <Text style={styles.noVehiclesText}>No vehicles registered yet</Text>
                <Text style={styles.noVehiclesSubtext}>You need to add a vehicle before posting a ride</Text>
                <CustomButton
                  title="Add Your First Vehicle"
                  variant="driver"
                  onPress={() => navigation.navigate('VehicleManagement', { 
                    isRegistration: true, 
                    returnToCreateRide: true 
                  })}
                  style={styles.addVehicleButton}
                />
              </View>
            )}
          </View>
        )}

        {/* Ride Information */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Ride Information</Text>
            
            {/* Smoking */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🚭 Smoking</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, !formData.smokingAllowed && styles.toggleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, smokingAllowed: false }))}
                >
                  <Text style={[styles.toggleText, !formData.smokingAllowed && styles.toggleTextSelected]}>
                    Not Allowed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, formData.smokingAllowed && styles.toggleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, smokingAllowed: true }))}
                >
                  <Text style={[styles.toggleText, formData.smokingAllowed && styles.toggleTextSelected]}>
                    Allowed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Luggage */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🧳 Luggage</Text>
              <View style={styles.luggageContainer}>
                {['none', 'small', 'medium', 'large'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.luggageOption, formData.luggage === size && styles.luggageOptionSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, luggage: size }))}
                  >
                    <Text style={[styles.luggageText, formData.luggage === size && styles.luggageTextSelected]}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {formData.luggage !== 'none' && (
                <View style={styles.luggageChargeContainer}>
                  <Text style={styles.inputLabel}>💰 Charge for {formData.luggage} luggage (CAD)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.luggageCharge}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, luggageCharge: text }))}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              )}
            </View>

            {/* Bike */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🚲 Bike</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, !formData.bikeAllowed && styles.toggleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, bikeAllowed: false }))}
                >
                  <Text style={[styles.toggleText, !formData.bikeAllowed && styles.toggleTextSelected]}>
                    Not Allowed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, formData.bikeAllowed && styles.toggleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, bikeAllowed: true }))}
                >
                  <Text style={[styles.toggleText, formData.bikeAllowed && styles.toggleTextSelected]}>
                    Allowed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Wheelchair */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>♿ Wheelchair Accessible</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, !formData.wheelchairAccessible && styles.toggleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, wheelchairAccessible: false }))}
                >
                  <Text style={[styles.toggleText, !formData.wheelchairAccessible && styles.toggleTextSelected]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, formData.wheelchairAccessible && styles.toggleOptionSelected]}
                  onPress={() => setFormData(prev => ({ ...prev, wheelchairAccessible: true }))}
                >
                  <Text style={[styles.toggleText, formData.wheelchairAccessible && styles.toggleTextSelected]}>
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pets */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🐕 Pets</Text>
              <View style={styles.petsContainer}>
                {[
                  { value: 'none', label: 'None' },
                  { value: 'small', label: 'Small Pet' },
                  { value: 'large', label: 'Large Pet' }
                ].map((pet) => (
                  <TouchableOpacity
                    key={pet.value}
                    style={[styles.petOption, formData.pets === pet.value && styles.petOptionSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, pets: pet.value }))}
                  >
                    <Text style={[styles.petText, formData.pets === pet.value && styles.petTextSelected]}>
                      {pet.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Terms Acceptance */}
        {!searchMode && (
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setFormData(prev => ({ ...prev, acceptTerms: !prev.acceptTerms }))}
            >
              <View style={[styles.checkbox, formData.acceptTerms && styles.checkboxChecked]}>
                {formData.acceptTerms && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.termsText}>
                I accept the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        {!searchMode && (
          <View style={styles.submitContainer}>
            <DriverButton
              title={`Post Ride (1 Credit)`}
              onPress={handleCreateRide}
              fullWidth
              style={[
                styles.driverButton,
                !formData.acceptTerms && styles.driverButtonDisabled
              ]}
              disabled={!formData.acceptTerms}
            />
            
            <Text style={styles.submitNote}>
              * Required fields. Your ride will be visible to passengers immediately after posting.
            </Text>
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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
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
  cityInput: {
    ...componentStyles.input.default,
    justifyContent: 'center',
  },
  cityInputSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cityInputText: {
    fontSize: typography.fontSize.base,
  },
  cityInputTextSelected: {
    color: colors.text,
  },
  cityInputPlaceholder: {
    color: colors.textLight,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...componentStyles.input.default,
    marginRight: spacing.sm,
  },
  cancelSearchButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelSearchText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  suggestionsContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  suggestionsList: {
    flex: 1,
  },
  citySuggestion: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  cityName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  provinceName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateContainer: {
    flex: 1,
  },
  timeContainer: {
    flex: 1,
  },
  dateTimeInput: {
    ...componentStyles.input.default,
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  tripDetailsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  seatsContainer: {
    flex: 1,
  },
  seatsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray400,
  },
  seatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  seatCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  priceContainer: {
    flex: 1,
  },
  priceInput: {
    ...componentStyles.input.default,
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    minWidth: 100,
  },
  paymentMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paymentMethodIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  paymentMethodText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  paymentMethodTextSelected: {
    color: colors.primary,
  },
  noVehiclesContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noVehiclesText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  addVehicleButton: {
    minWidth: 120,
    height: 55,
  },
  vehicleSelectionContainer: {
    gap: spacing.md,
  },
  vehicleDropdown: {
    ...componentStyles.input.default,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleDropdownSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  vehicleDropdownText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    flex: 1,
  },
  vehicleDropdownTextSelected: {
    color: colors.text,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  addVehicleButtonSmall: {
    height: 55,
  },
  noVehiclesSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  textInput: {
    ...componentStyles.input.default,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitContainer: {
    paddingHorizontal: spacing.md,
  },
  driverButton: {
    marginBottom: spacing.md,
    height: 55,
  },
  submitNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  backButton: {
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  routeContainer: {
    marginBottom: spacing.md,
  },
  cityInputContainer: {
    marginBottom: spacing.md,
  },
  swapButton: {
    alignSelf: 'center',
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  swapIcon: {
    fontSize: 20,
  },
  // Ride Information Styles
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  toggleOptionSelected: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  toggleTextSelected: {
    color: colors.white,
  },
  luggageContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  luggageOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    minWidth: 80,
    alignItems: 'center',
  },
  luggageOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  luggageText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  luggageTextSelected: {
    color: colors.primary,
  },
  luggageChargeContainer: {
    marginTop: spacing.md,
  },
  petsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  petOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    minWidth: 100,
    alignItems: 'center',
  },
  petOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  petText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  petTextSelected: {
    color: colors.primary,
  },
  // Terms Acceptance Styles
  termsContainer: {
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray400,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  driverButtonDisabled: {
    opacity: 0.5,
  },
  detailsInputContainer: {
    marginTop: spacing.sm,
  },
  detailsTextInput: {
    ...componentStyles.input.default,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Trip type styles
  tripTypeOption: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tripTypeSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tripTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripTypeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripTypeIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  tripTypeInfo: {
    flex: 1,
  },
  tripTypeLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 2,
  },
  tripTypeLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  tripTypeDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  tripTypeCheck: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});