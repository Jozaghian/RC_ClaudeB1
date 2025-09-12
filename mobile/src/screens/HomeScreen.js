import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton, PassengerButton } from '../components/CustomButton';
import RideCard from '../components/RideCard';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import { formatDate, getRelativeDate, debounce } from '../utils/helpers';
import apiService from '../services/apiService';
import { searchLocations } from '../data/canadianLocations';

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [originCity, setOriginCity] = useState(null);
  const [destinationCity, setDestinationCity] = useState(null);
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date());
  const [passengers, setPassengers] = useState(1);
  const [rides, setRides] = useState([]);
  const [cities, setCities] = useState([]);
  const [searchMode, setSearchMode] = useState(null); // 'origin' or 'destination' or null
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user, isDriver, logout } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadRecentRides();
  }, []);

  const loadRecentRides = async () => {
    // For demo purposes, show empty rides initially
    // In production, this would load from backend
    setRides([]);
    setLoading(false);
  };

  const searchCities = debounce((query) => {
    console.log('🔍 Searching for:', query, 'in mode:', searchMode);
    if (!query || query.length < 1) {
      setCities([]);
      return;
    }

    const results = searchLocations(query);
    console.log('📍 Found locations:', results.length, results.map(r => r.name));
    setCities(results);
  }, 300);

  const handleSearchChange = (text) => {
    console.log('🔍 Search change:', text, 'mode:', searchMode);
    setSearchQuery(text);
    searchCities(text);
  };

  const selectCity = (city) => {
    console.log('🎯 Selecting city:', city.name, 'for mode:', searchMode);
    if (searchMode === 'origin') {
      setOriginCity(city);
      setOriginText(`${city.name}, ${city.province}`);
    } else if (searchMode === 'destination') {
      setDestinationCity(city);
      setDestinationText(`${city.name}, ${city.province}`);
    }
    setSearchQuery('');
    setSearchMode(null);
    setCities([]);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const handleSearchRides = async () => {
    if (!originCity || !destinationCity) {
      Alert.alert('Search Error', 'Please select both origin and destination cities');
      return;
    }

    if (originCity.id === destinationCity.id) {
      Alert.alert('Search Error', 'Origin and destination must be different cities');
      return;
    }

    setGlobalLoading(true);
    setLoading(true);

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
          Alert.alert(
            'No Rides Found',
            'No rides match your search criteria. Try adjusting your dates or route.',
            [
              { text: 'OK' },
              { 
                text: 'Request a Ride', 
                onPress: () => navigation.navigate('RideRequest', {
                  originCity,
                  destinationCity,
                  departureDate,
                  passengers
                })
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Search rides error:', error);
      Alert.alert('Search Error', 'Failed to search rides. Please try again.');
    } finally {
      setGlobalLoading(false);
      setLoading(false);
    }
  };

  const handleRidePress = (ride) => {
    navigation.navigate('RideDetails', { ride });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentRides();
    setRefreshing(false);
  };


  const renderRideItem = ({ item }) => (
    <RideCard
      ride={item}
      onPress={handleRidePress}
      variant="default"
      userType={isDriver() ? 'driver' : 'passenger'}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.welcomeText}>
              Find your ride... 🚗
            </Text>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { text: 'Cancel' },
                    { text: 'Logout', onPress: logout }
                  ]
                );
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            {user && isDriver() ? 'Manage your rides or find new passengers' : 'Search available rides across Canada'}
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          
          {/* Route Selection */}
          <View style={styles.routeContainer}>
            {/* Origin */}
            <View style={styles.cityInputContainer}>
              <Text style={styles.inputLabel}>From</Text>
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
                  {cities.map((item, index) => (
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
              }}
              disabled={!originCity || !destinationCity}
            >
              <Text style={styles.swapIcon}>🔄</Text>
            </TouchableOpacity>

            {/* Destination */}
            <View style={[styles.cityInputContainer, {marginBottom: spacing.xs}]}>
              <Text style={styles.inputLabel}>To</Text>
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
                  {cities.map((item, index) => (
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
          </View>



          {/* Date and Passengers */}
          <View style={styles.filterContainer}>
              <View style={styles.filterRow}>
                <View style={styles.dateContainer}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {getRelativeDate(departureDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.passengersContainer}>
                  <Text style={styles.inputLabel}>Passengers</Text>
                  <View style={styles.passengersSelector}>
                    <TouchableOpacity
                      style={styles.passengerButton}
                      onPress={() => setPassengers(Math.max(1, passengers - 1))}
                    >
                      <Text style={styles.passengerButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.passengerCount}>{passengers}</Text>
                    <TouchableOpacity
                      style={styles.passengerButton}
                      onPress={() => setPassengers(Math.min(8, passengers + 1))}
                    >
                      <Text style={styles.passengerButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Search Button */}
              <CustomButton
                title="Search Rides"
                variant="driver"
                onPress={handleSearchRides}
                fullWidth
                style={styles.searchButton}
              />

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={departureDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {isDriver() ? (
              <>
                <CustomButton
                  title="Post New Ride"
                  variant="driver"
                  onPress={() => navigation.navigate('MyRides', { 
                    screen: 'CreateRide' 
                  })}
                  fullWidth
                  style={styles.quickActionButton}
                />
                <CustomButton
                  title="Browse Ride Requests"
                  variant="primary"
                  onPress={() => navigation.navigate('BrowseRequests')}
                  fullWidth
                  style={styles.quickActionButton}
                />
                <CustomButton
                  title="My Bids"
                  variant="secondary"
                  onPress={() => navigation.navigate('MyRides', { 
                    screen: 'MyBids' 
                  })}
                  fullWidth
                  style={styles.quickActionButton}
                />
                <CustomButton
                  title="Manage Credits"
                  variant="secondary"
                  onPress={() => navigation.navigate('MyRides', { 
                    screen: 'CreditManagement' 
                  })}
                  fullWidth
                  style={styles.quickActionButton}
                />
              </>
            ) : (
              <>
                <CustomButton
                  title="Request a Ride"
                  variant="passenger"
                  onPress={() => navigation.navigate('RequestRide')}
                  fullWidth
                  style={styles.quickActionButton}
                />
                <CustomButton
                  title="My Requests"
                  variant="secondary"
                  onPress={() => navigation.navigate('MyRides')}
                  fullWidth
                  style={styles.quickActionButton}
                />
              </>
            )}
          </View>
        </View>

        {/* Recent Rides */}
        {!searchMode && rides.length > 0 && (
          <View style={styles.ridesSection}>
            <Text style={styles.sectionTitle}>
              {originCity && destinationCity ? '🎯 Search Results' : '🚗 Available Rides'}
            </Text>
            
            <View>
              {rides.map((item) => (
                <View key={item.id}>
                  {renderRideItem({ item })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!loading && rides.length === 0 && !searchMode && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🚗</Text>
            <Text style={styles.emptyStateTitle}>No rides available</Text>
            <Text style={styles.emptyStateMessage}>
              Try searching for specific routes or check back later for new rides.
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
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  backButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
  searchSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
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
  routeContainer: {
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
  swapButton: {
    alignSelf: 'center',
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  swapIcon: {
    fontSize: 20,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    maxHeight: 200,
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  filterContainer: {
    marginTop: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dateContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  dateInput: {
    ...componentStyles.input.default,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  passengersContainer: {
    flex: 1,
  },
  passengersSelector: {
    ...componentStyles.input.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
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
  searchButton: {
    marginTop: spacing.sm,
    minHeight: 58,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
  },
  quickActionsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionsContainer: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  quickActionButton: {
    minHeight: 58,
  },
  ridesSection: {
    paddingHorizontal: spacing.md,
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
  },
  logoutButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.sm,
  },
  logoutText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

