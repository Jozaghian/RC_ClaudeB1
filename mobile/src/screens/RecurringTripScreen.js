import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../utils/theme';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton from '../components/CustomButton';
import apiService from '../services/apiService';

const RECURRENCE_PATTERNS = [
  { 
    id: 'WEEKLY', 
    label: 'Weekly', 
    description: 'Same day(s) each week',
    icon: '📅'
  },
  { 
    id: 'MONTHLY', 
    label: 'Monthly', 
    description: 'Same date each month',
    icon: '🗓️'
  },
];

const DAYS_OF_WEEK = [
  { id: 0, short: 'Sun', label: 'Sunday' },
  { id: 1, short: 'Mon', label: 'Monday' },
  { id: 2, short: 'Tue', label: 'Tuesday' },
  { id: 3, short: 'Wed', label: 'Wednesday' },
  { id: 4, short: 'Thu', label: 'Thursday' },
  { id: 5, short: 'Fri', label: 'Friday' },
  { id: 6, short: 'Sat', label: 'Saturday' },
];

export default function RecurringTripScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setLoading } = useLoading();
  
  // Get the trip data passed from CreateRideScreen
  const { tripData } = route.params || {};
  
  const [selectedPattern, setSelectedPattern] = useState('WEEKLY');
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedDates, setSelectedDates] = useState({});
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [scheduleName, setScheduleName] = useState('');

  useEffect(() => {
    // Generate a default schedule name
    if (tripData) {
      const originName = tripData.originCity?.name || 'Origin';
      const destName = tripData.destinationCity?.name || 'Destination';
      setScheduleName(`${originName} to ${destName}`);
    }
  }, [tripData]);

  const handlePatternChange = (pattern) => {
    setSelectedPattern(pattern);
    setSelectedDays([]);
    setSelectedDates({});
  };

  const toggleDay = (dayId) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(id => id !== dayId);
      } else {
        return [...prev, dayId].sort();
      }
    });
  };

  const onDayPress = (day) => {
    if (selectedPattern === 'MONTHLY') {
      // For monthly, allow selecting specific dates
      const dateString = day.dateString;
      setSelectedDates(prev => {
        const newDates = { ...prev };
        if (newDates[dateString]) {
          delete newDates[dateString];
        } else {
          newDates[dateString] = {
            selected: true,
            selectedColor: colors.primary,
          };
        }
        return newDates;
      });
    }
  };

  const generateRecurringTrips = () => {
    if (selectedPattern === 'WEEKLY' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the week');
      return;
    }

    if (selectedPattern === 'MONTHLY' && Object.keys(selectedDates).length === 0) {
      Alert.alert('Error', 'Please select at least one date for monthly recurrence');
      return;
    }

    const scheduleData = {
      ...tripData,
      tripType: 'RECURRING',
      scheduleName,
      recurrencePattern: selectedPattern,
      selectedDays: selectedPattern === 'WEEKLY' ? selectedDays : [],
      selectedDates: selectedPattern === 'MONTHLY' ? Object.keys(selectedDates) : [],
      startDate,
      endDate: endDate || null,
    };

    Alert.alert(
      'Create Recurring Trip',
      `This will create multiple rides based on your schedule. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create',
          onPress: () => createRecurringTrip(scheduleData)
        }
      ]
    );
  };

  const createRecurringTrip = async (scheduleData) => {
    try {
      setLoading(true);
      
      const response = await apiService.post('/rides/recurring', scheduleData);
      
      if (response.success) {
        Alert.alert(
          'Success!',
          `Created ${response.data.ridesCreated} recurring rides. You can manage them in "My Rides".`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MyRides')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Create recurring trip error:', error);
      
      const moderationError = apiService.handleModerationError(error);
      if (moderationError.isModerationError) {
        Alert.alert('Content Not Allowed', moderationError.message);
      } else {
        Alert.alert('Error', moderationError.message || 'Failed to create recurring trip');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCalendarMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCalendarMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // 1 year from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Recurring Trip</Text>
          <Text style={styles.subtitle}>
            Choose when you want to offer this trip regularly
          </Text>
        </View>

        {/* Trip Summary */}
        {tripData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Trip Summary</Text>
            <View style={styles.tripSummary}>
              <Text style={styles.routeText}>
                {tripData.originCity?.name} → {tripData.destinationCity?.name}
              </Text>
              <Text style={styles.priceText}>
                ${tripData.pricePerSeat} per seat • {tripData.seatsAvailable} seats
              </Text>
            </View>
          </View>
        )}

        {/* Recurrence Pattern */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Recurrence Pattern</Text>
          
          {RECURRENCE_PATTERNS.map((pattern) => (
            <TouchableOpacity
              key={pattern.id}
              style={[
                styles.patternOption,
                selectedPattern === pattern.id && styles.patternSelected
              ]}
              onPress={() => handlePatternChange(pattern.id)}
            >
              <Text style={styles.patternIcon}>{pattern.icon}</Text>
              <View style={styles.patternInfo}>
                <Text style={[
                  styles.patternLabel,
                  selectedPattern === pattern.id && styles.patternLabelSelected
                ]}>
                  {pattern.label}
                </Text>
                <Text style={styles.patternDescription}>
                  {pattern.description}
                </Text>
              </View>
              {selectedPattern === pattern.id && (
                <Text style={styles.patternCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Day Selection */}
        {selectedPattern === 'WEEKLY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Select Days</Text>
            <Text style={styles.subtitle}>Choose which days of the week</Text>
            
            <View style={styles.daysContainer}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayOption,
                    selectedDays.includes(day.id) && styles.daySelected
                  ]}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text style={[
                    styles.dayText,
                    selectedDays.includes(day.id) && styles.dayTextSelected
                  ]}>
                    {day.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Date Selection */}
        {selectedPattern === 'MONTHLY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗓️ Select Dates</Text>
            <Text style={styles.subtitle}>Tap dates to select them for monthly recurrence</Text>
            
            <Calendar
              minDate={getCalendarMinDate()}
              maxDate={getCalendarMaxDate()}
              onDayPress={onDayPress}
              markedDates={selectedDates}
              theme={{
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
              }}
            />
          </View>
        )}

        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📆 Schedule Period</Text>
          
          <Text style={styles.inputLabel}>Start Date</Text>
          <Text style={styles.dateText}>{startDate}</Text>
          
          <Text style={styles.inputLabel}>End Date (Optional)</Text>
          <Text style={styles.dateText}>
            {endDate || 'No end date - continues indefinitely'}
          </Text>
        </View>

        {/* Create Button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Create Recurring Trip"
            onPress={generateRecurringTrips}
            style={styles.createButton}
            disabled={
              (selectedPattern === 'WEEKLY' && selectedDays.length === 0) ||
              (selectedPattern === 'MONTHLY' && Object.keys(selectedDates).length === 0)
            }
          />
        </View>
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
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tripSummary: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  routeText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  priceText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  patternOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  patternSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  patternIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  patternInfo: {
    flex: 1,
  },
  patternLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 2,
  },
  patternLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  patternDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  patternCheck: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayOption: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.white,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
});