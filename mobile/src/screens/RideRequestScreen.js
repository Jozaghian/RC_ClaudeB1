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
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { PassengerButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import { formatDate, formatTime, debounce, formatCurrency } from '../utils/helpers';
import apiService from '../services/apiService';
import { searchLocations } from '../data/canadianLocations';

export default function RideRequestScreen({ route, navigation }) {
  const { originCity: initialOrigin, destinationCity: initialDestination, departureDate, passengers } = route.params || {};

  const [formData, setFormData] = useState({
    originCityId: initialOrigin?.id || '',
    destinationCityId: initialDestination?.id || '',
    originDetails: '',
    destinationDetails: '',
    preferredDateTime: departureDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
    timeFlexibility: 2, // hours
    passengerCount: passengers || 1,
    maxBudget: '',
    minBudget: '',
    luggage: {
      small: 0,
      medium: 0,
      large: 0
    },
    needsChildSeat: false,
    needsWheelchairAccess: false,
    specialRequirements: '',
    description: '',
  });

  const [originCity, setOriginCity] = useState(initialOrigin || null);
  const [destinationCity, setDestinationCity] = useState(initialDestination || null);
  const [originText, setOriginText] = useState(initialOrigin ? `${initialOrigin.name}, ${initialOrigin.province}` : '');
  const [destinationText, setDestinationText] = useState(initialDestination ? `${initialDestination.name}, ${initialDestination.province}` : '');
  const [cities, setCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(null); // 'origin' or 'destination' or null
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    if (initialOrigin) {
      setOriginCity(initialOrigin);
      setFormData(prev => ({ ...prev, originCityId: initialOrigin.id }));
    }
    if (initialDestination) {
      setDestinationCity(initialDestination);
      setFormData(prev => ({ ...prev, destinationCityId: initialDestination.id }));
    }
  }, []);

  const searchCities = debounce((query) => {
    console.log('🔍 RIDE REQUEST - Searching for:', query, 'in mode:', searchMode);
    if (!query || query.length < 1) {
      setCities([]);
      return;
    }

    const results = searchLocations(query);
    console.log('📍 RIDE REQUEST - Found locations:', results.length, results.map(r => r.name));
    setCities(results);
  }, 300);

  const handleSearchChange = (text) => {
    console.log('🔍 RIDE REQUEST - Search change:', text, 'mode:', searchMode);
    setSearchQuery(text);
    searchCities(text);
  };

  const selectCity = (city) => {
    console.log('🎯 RIDE REQUEST - Selecting city:', city.name, 'for mode:', searchMode);
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
      const newDateTime = new Date(formData.preferredDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setFormData(prev => ({ ...prev, preferredDateTime: newDateTime }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.preferredDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setFormData(prev => ({ ...prev, preferredDateTime: newDateTime }));
    }
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

    if (formData.preferredDateTime <= new Date()) {
      Alert.alert('Validation Error', 'Preferred departure time must be in the future');
      return false;
    }

    if (formData.passengerCount < 1 || formData.passengerCount > 8) {
      Alert.alert('Validation Error', 'Passenger count must be between 1 and 8');
      return false;
    }

    if (formData.minBudget && formData.maxBudget) {
      const minBudget = parseFloat(formData.minBudget);
      const maxBudget = parseFloat(formData.maxBudget);
      if (minBudget > maxBudget) {
        Alert.alert('Validation Error', 'Minimum budget cannot be higher than maximum budget');
        return false;
      }
    }

    return true;
  };

  const handleCreateRequest = async () => {
    if (!validateForm()) return;

    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to login to create a ride request. Would you like to login or create an account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login')
          },
          {
            text: 'Sign Up',
            onPress: () => navigation.navigate('Register')
          }
        ]
      );
      return;
    }

    setLoading(true);
    setGlobalLoading(true);

    try {
      const requestData = {
        ...formData,
        preferredDateTime: formData.preferredDateTime.toISOString(),
        maxBudget: formData.maxBudget ? parseFloat(formData.maxBudget) : null,
        minBudget: formData.minBudget ? parseFloat(formData.minBudget) : null,
      };

      const response = await apiService.post('/requests', requestData);

      if (response.success) {
        Alert.alert(
          'Request Posted! 🎯',
          `Your ride request from ${originCity.name} to ${destinationCity.name} has been posted. Drivers will be able to see and bid on your request.`,
          [
            { text: 'View My Requests', onPress: () => navigation.navigate('MyRequests') },
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Create request error:', error);
      
      const moderationError = apiService.handleModerationError(error);
      if (moderationError.isModerationError) {
        Alert.alert(
          'Content Not Allowed',
          moderationError.message,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', moderationError.message || 'Failed to create ride request. Please try again.');
      }
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Your Ride</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Route</Text>
          
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
          </View>

          {/* Location Details */}
          {!searchMode && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pickup Details</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.originDetails}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, originDetails: text }))}
                  placeholder="Specific pickup location (address, landmark, etc.)"
                  placeholderTextColor={colors.textLight}
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Drop-off Details</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.destinationDetails}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, destinationDetails: text }))}
                  placeholder="Specific drop-off location (address, landmark, etc.)"
                  placeholderTextColor={colors.textLight}
                  multiline
                />
              </View>
            </>
          )}
        </View>

        {/* Date & Time Section */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Travel Time</Text>
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <Text style={styles.inputLabel}>Preferred Date *</Text>
                <TouchableOpacity
                  style={styles.dateTimeInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatDate(formData.preferredDateTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeContainer}>
                <Text style={styles.inputLabel}>Preferred Time *</Text>
                <TouchableOpacity
                  style={styles.dateTimeInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {formatTime(formData.preferredDateTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Time Flexibility</Text>
              <View style={styles.flexibilityContainer}>
                <TouchableOpacity
                  style={[
                    styles.flexibilityButton,
                    formData.timeFlexibility === 0 && styles.flexibilityButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, timeFlexibility: 0 }))}
                >
                  <Text style={[
                    styles.flexibilityText,
                    formData.timeFlexibility === 0 && styles.flexibilityTextSelected
                  ]}>Exact</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.flexibilityButton,
                    formData.timeFlexibility === 1 && styles.flexibilityButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, timeFlexibility: 1 }))}
                >
                  <Text style={[
                    styles.flexibilityText,
                    formData.timeFlexibility === 1 && styles.flexibilityTextSelected
                  ]}>±1h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.flexibilityButton,
                    formData.timeFlexibility === 2 && styles.flexibilityButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, timeFlexibility: 2 }))}
                >
                  <Text style={[
                    styles.flexibilityText,
                    formData.timeFlexibility === 2 && styles.flexibilityTextSelected
                  ]}>±2h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.flexibilityButton,
                    formData.timeFlexibility === 4 && styles.flexibilityButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, timeFlexibility: 4 }))}
                >
                  <Text style={[
                    styles.flexibilityText,
                    formData.timeFlexibility === 4 && styles.flexibilityTextSelected
                  ]}>±4h</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.preferredDateTime}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={formData.preferredDateTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        )}

        {/* Trip Details */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Trip Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Number of Passengers *</Text>
              <View style={styles.passengersSelector}>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setFormData(prev => ({ 
                    ...prev, 
                    passengerCount: Math.max(1, prev.passengerCount - 1) 
                  }))}
                >
                  <Text style={styles.passengerButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.passengerCount}>{formData.passengerCount}</Text>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setFormData(prev => ({ 
                    ...prev, 
                    passengerCount: Math.min(8, prev.passengerCount + 1) 
                  }))}
                >
                  <Text style={styles.passengerButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.budgetContainer}>
              <View style={styles.budgetInputContainer}>
                <Text style={styles.inputLabel}>Min Budget (CAD)</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={formData.minBudget}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, minBudget: text }))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.budgetInputContainer}>
                <Text style={styles.inputLabel}>Max Budget (CAD)</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={formData.maxBudget}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, maxBudget: text }))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

            <Text style={styles.budgetNote}>
              💡 Setting a budget range helps drivers provide competitive bids
            </Text>
          </View>
        )}

        {/* Special Requirements */}
        {!searchMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎒 Special Requirements</Text>
            
            <View style={styles.luggageSection}>
              <Text style={styles.requirementTitle}>Luggage</Text>
              <Text style={styles.requirementSubtitle}>Specify quantity for each size</Text>

              {/* Small Luggage */}
              <View style={styles.luggageItem}>
                <View style={styles.luggageInfo}>
                  <Text style={styles.luggageLabel}>Small</Text>
                  <Text style={styles.luggageDescription}>Backpack, small bags</Text>
                </View>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      luggage: { ...prev.luggage, small: Math.max(0, prev.luggage.small - 1) }
                    }))}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{formData.luggage.small}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      luggage: { ...prev.luggage, small: Math.min(10, prev.luggage.small + 1) }
                    }))}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Medium Luggage */}
              <View style={styles.luggageItem}>
                <View style={styles.luggageInfo}>
                  <Text style={styles.luggageLabel}>Medium</Text>
                  <Text style={styles.luggageDescription}>Carry-on, duffle bags</Text>
                </View>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      luggage: { ...prev.luggage, medium: Math.max(0, prev.luggage.medium - 1) }
                    }))}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{formData.luggage.medium}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      luggage: { ...prev.luggage, medium: Math.min(10, prev.luggage.medium + 1) }
                    }))}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Large Luggage */}
              <View style={styles.luggageItem}>
                <View style={styles.luggageInfo}>
                  <Text style={styles.luggageLabel}>Large</Text>
                  <Text style={styles.luggageDescription}>Suitcases, sports equipment</Text>
                </View>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      luggage: { ...prev.luggage, large: Math.max(0, prev.luggage.large - 1) }
                    }))}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{formData.luggage.large}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      luggage: { ...prev.luggage, large: Math.min(10, prev.luggage.large + 1) }
                    }))}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.requirementItem}>
              <View style={styles.requirementInfo}>
                <Text style={styles.requirementTitle}>Child Seat</Text>
                <Text style={styles.requirementSubtitle}>Booster or car seat required</Text>
              </View>
              <Switch
                value={formData.needsChildSeat}
                onValueChange={(value) => setFormData(prev => ({ ...prev, needsChildSeat: value }))}
                trackColor={{ false: colors.gray400, true: colors.primary + '40' }}
                thumbColor={formData.needsChildSeat ? colors.primary : colors.gray300}
              />
            </View>

            <View style={styles.requirementItem}>
              <View style={styles.requirementInfo}>
                <Text style={styles.requirementTitle}>Wheelchair Access</Text>
                <Text style={styles.requirementSubtitle}>Wheelchair accessible vehicle</Text>
              </View>
              <Switch
                value={formData.needsWheelchairAccess}
                onValueChange={(value) => setFormData(prev => ({ ...prev, needsWheelchairAccess: value }))}
                trackColor={{ false: colors.gray400, true: colors.primary + '40' }}
                thumbColor={formData.needsWheelchairAccess ? colors.primary : colors.gray300}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Special Requirements</Text>
              <TextInput
                style={styles.textInput}
                value={formData.specialRequirements}
                onChangeText={(text) => setFormData(prev => ({ ...prev, specialRequirements: text }))}
                placeholder="Pet-friendly, non-smoking, etc."
                placeholderTextColor={colors.textLight}
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Additional Information</Text>
              <TextInput
                style={styles.textInput}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Tell drivers more about your trip, group, or preferences..."
                placeholderTextColor={colors.textLight}
                multiline
              />
            </View>
          </View>
        )}

        {/* Submit Button */}
        {!searchMode && (
          <View style={styles.submitContainer}>
            <CustomButton
              title="Post Request"
              variant="passenger"
              onPress={handleCreateRequest}
              fullWidth
              style={styles.submitButton}
            />
            
            <Text style={styles.submitNote}>
              Your request will be visible to drivers for 72 hours. You'll receive notifications when drivers bid on your trip.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  headerRight: {
    width: 40, // Same width as back button for centering
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
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
  cityInputContainer: {
    marginBottom: spacing.sm,
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
    borderColor: colors.secondary,
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
  swapButton: {
    alignSelf: 'center',
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  swapIcon: {
    fontSize: 20,
  },
  textInput: {
    ...componentStyles.input.default,
    minHeight: 80,
    textAlignVertical: 'top',
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
  flexibilityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexibilityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  flexibilityButtonSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
  },
  flexibilityText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  flexibilityTextSelected: {
    color: colors.secondary,
  },
  passengersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray400,
  },
  passengerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  passengerCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  budgetInputContainer: {
    flex: 1,
  },
  budgetInput: {
    ...componentStyles.input.default,
    textAlign: 'center',
  },
  budgetNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  requirementInfo: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  requirementSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  submitContainer: {
    paddingHorizontal: spacing.md,
  },
  submitButton: {
    minHeight: 58,
  },
  submitButtonText: {
    color: '#FFFFFF', // Explicit white text
    fontWeight: 'bold',
  },
  submitNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  luggageSection: {
    marginBottom: spacing.md,
  },
  luggageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  luggageInfo: {
    flex: 1,
  },
  luggageLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  luggageDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  quantityText: {
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
});