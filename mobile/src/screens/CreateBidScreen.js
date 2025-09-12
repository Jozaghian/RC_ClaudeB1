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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import { formatDate, formatTime, formatCurrency } from '../utils/helpers';
import apiService from '../services/apiService';

export default function CreateBidScreen({ route, navigation }) {
  const { request } = route.params;
  const [bidData, setBidData] = useState({
    requestId: request.id,
    priceOffer: '',
    proposedDateTime: request.preferredDateTime ? new Date(request.preferredDateTime) : new Date(),
    message: ''
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [useOriginalTime, setUseOriginalTime] = useState(true);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    // Set default proposed time to request's preferred time
    if (request.preferredDateTime) {
      setBidData(prev => ({
        ...prev,
        proposedDateTime: new Date(request.preferredDateTime)
      }));
    }
  }, [request]);

  const validateBid = () => {
    const price = parseFloat(bidData.priceOffer);

    if (!bidData.priceOffer || isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price offer');
      return false;
    }

    if (request.maxBudget && price > request.maxBudget) {
      Alert.alert(
        'Price Too High', 
        `Your bid of ${formatCurrency(price)} exceeds the maximum budget of ${formatCurrency(request.maxBudget)}`
      );
      return false;
    }

    if (request.minBudget && price < request.minBudget) {
      Alert.alert(
        'Price Too Low', 
        `Your bid of ${formatCurrency(price)} is below the minimum budget of ${formatCurrency(request.minBudget)}`
      );
      return false;
    }

    // Validate proposed time is within flexibility window
    if (!useOriginalTime) {
      const requestTime = new Date(request.preferredDateTime);
      const proposedTime = new Date(bidData.proposedDateTime);
      const flexibilityMs = (request.timeFlexibility || 0) * 60 * 60 * 1000;
      
      const timeDiff = Math.abs(proposedTime.getTime() - requestTime.getTime());
      
      if (timeDiff > flexibilityMs) {
        Alert.alert(
          'Time Outside Flexibility Window',
          `Your proposed time must be within ${request.timeFlexibility} hours of the preferred time`
        );
        return false;
      }
    }

    if (new Date(bidData.proposedDateTime) <= new Date()) {
      Alert.alert('Invalid Time', 'Proposed departure time must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmitBid = async () => {
    if (!validateBid()) return;

    setLoading(true);
    setGlobalLoading(true);

    try {
      const submitData = {
        ...bidData,
        priceOffer: parseFloat(bidData.priceOffer),
        proposedDateTime: useOriginalTime 
          ? new Date(request.preferredDateTime).toISOString()
          : bidData.proposedDateTime.toISOString()
      };

      const response = await apiService.post('/bids', submitData);

      if (response.success) {
        Alert.alert(
          'Bid Submitted! 🎯',
          `Your bid of ${formatCurrency(submitData.priceOffer)} has been submitted. The passenger will be notified and can accept or reject your offer.`,
          [
            { text: 'View My Bids', onPress: () => navigation.navigate('MyBids') },
            { text: 'Browse More', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Submit bid error:', error);
      Alert.alert(
        'Bid Failed', 
        error.response?.data?.message || 'Failed to submit bid. Please try again.'
      );
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(bidData.proposedDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setBidData(prev => ({ ...prev, proposedDateTime: newDateTime }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(bidData.proposedDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setBidData(prev => ({ ...prev, proposedDateTime: newDateTime }));
    }
  };

  const calculateFlexibilityWindow = () => {
    if (!request.timeFlexibility) return null;
    
    const requestTime = new Date(request.preferredDateTime);
    const flexHours = request.timeFlexibility;
    const earliestTime = new Date(requestTime.getTime() - flexHours * 60 * 60 * 1000);
    const latestTime = new Date(requestTime.getTime() + flexHours * 60 * 60 * 1000);
    
    return { earliestTime, latestTime };
  };

  const flexibilityWindow = calculateFlexibilityWindow();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Request Summary */}
          <View style={styles.requestSummary}>
            <Text style={styles.sectionTitle}>Ride Request Details</Text>
            
            <View style={styles.routeContainer}>
              <View style={styles.routeInfo}>
                <Text style={styles.routeText}>
                  {request.originCity.name} → {request.destinationCity.name}
                </Text>
                <Text style={styles.routeSubtext}>
                  {request.originCity.province} → {request.destinationCity.province}
                </Text>
              </View>
            </View>

            <View style={styles.requestDetails}>
              <View style={styles.detailRow}>
                <Icon name="schedule" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>
                  {formatDate(request.preferredDateTime)} at {formatTime(request.preferredDateTime)}
                  {request.timeFlexibility > 0 && (
                    <Text style={styles.flexibilityText}> (±{request.timeFlexibility}h flexible)</Text>
                  )}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Icon name="group" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>
                  {request.passengerCount} passenger{request.passengerCount > 1 ? 's' : ''}
                </Text>
              </View>

              {(request.minBudget || request.maxBudget) && (
                <View style={styles.detailRow}>
                  <Icon name="attach-money" size={16} color={colors.text.secondary} />
                  <Text style={styles.detailText}>
                    Budget: {request.minBudget ? formatCurrency(request.minBudget) : '$0'} - {request.maxBudget ? formatCurrency(request.maxBudget) : 'Open'}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Icon name="person" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>
                  {request.passenger.firstName} • ⭐ {request.passenger.passengerRating?.toFixed(1) || 'New'}
                </Text>
              </View>
            </View>

            {request.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Passenger Notes:</Text>
                <Text style={styles.description}>"{request.description}"</Text>
              </View>
            )}
          </View>

          {/* Bid Form */}
          <View style={styles.bidForm}>
            <Text style={styles.sectionTitle}>Your Bid</Text>

            {/* Price Offer */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price Offer *</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={bidData.priceOffer}
                  onChangeText={(text) => setBidData(prev => ({ ...prev, priceOffer: text }))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
              </View>
              {(request.minBudget || request.maxBudget) && (
                <Text style={styles.budgetHint}>
                  Budget range: {request.minBudget ? formatCurrency(request.minBudget) : '$0'} - {request.maxBudget ? formatCurrency(request.maxBudget) : 'Open'}
                </Text>
              )}
            </View>

            {/* Proposed Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Proposed Departure Time</Text>
              
              <TouchableOpacity 
                style={[
                  styles.timeOption,
                  useOriginalTime && styles.selectedTimeOption
                ]}
                onPress={() => setUseOriginalTime(true)}
              >
                <View style={styles.radioButton}>
                  {useOriginalTime && <View style={styles.radioButtonSelected} />}
                </View>
                <View style={styles.timeOptionContent}>
                  <Text style={styles.timeOptionText}>Use passenger's preferred time</Text>
                  <Text style={styles.timeOptionSubtext}>
                    {formatDate(request.preferredDateTime)} at {formatTime(request.preferredDateTime)}
                  </Text>
                </View>
              </TouchableOpacity>

              {request.timeFlexibility > 0 && (
                <TouchableOpacity 
                  style={[
                    styles.timeOption,
                    !useOriginalTime && styles.selectedTimeOption
                  ]}
                  onPress={() => setUseOriginalTime(false)}
                >
                  <View style={styles.radioButton}>
                    {!useOriginalTime && <View style={styles.radioButtonSelected} />}
                  </View>
                  <View style={styles.timeOptionContent}>
                    <Text style={styles.timeOptionText}>Propose different time</Text>
                    <Text style={styles.timeOptionSubtext}>
                      Within ±{request.timeFlexibility} hours flexibility window
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {!useOriginalTime && (
                <View style={styles.customTimeContainer}>
                  <View style={styles.dateTimeRow}>
                    <TouchableOpacity 
                      style={styles.dateTimeButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Icon name="calendar-today" size={20} color={colors.text.secondary} />
                      <Text style={styles.dateTimeButtonText}>
                        {formatDate(bidData.proposedDateTime)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.dateTimeButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Icon name="access-time" size={20} color={colors.text.secondary} />
                      <Text style={styles.dateTimeButtonText}>
                        {formatTime(bidData.proposedDateTime)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {flexibilityWindow && (
                    <Text style={styles.flexibilityHint}>
                      Allowed window: {formatTime(flexibilityWindow.earliestTime)} - {formatTime(flexibilityWindow.latestTime)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Message to Passenger */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message to Passenger (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={bidData.message}
                onChangeText={(text) => setBidData(prev => ({ ...prev, message: text }))}
                placeholder="Introduce yourself, mention your experience, or share any relevant details..."
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {bidData.message.length}/500
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <DriverButton
            title={loading ? "Submitting Bid..." : "Submit Bid"}
            onPress={handleSubmitBid}
            disabled={loading}
            style={styles.submitButton}
          />

          {/* Date/Time Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={bidData.proposedDateTime}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={bidData.proposedDateTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  requestSummary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  routeContainer: {
    marginBottom: spacing.md,
  },
  routeInfo: {
    alignItems: 'center',
  },
  routeText: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  routeSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  requestDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailText: {
    ...typography.body2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  flexibilityText: {
    color: colors.text.secondary,
  },
  descriptionContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  descriptionLabel: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body2,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  bidForm: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  currencySymbol: {
    ...typography.h3,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    ...typography.h3,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  budgetHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  selectedTimeOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  timeOptionContent: {
    flex: 1,
  },
  timeOptionText: {
    ...typography.body1,
    color: colors.text.primary,
  },
  timeOptionSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  customTimeContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTimeButtonText: {
    ...typography.body2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  flexibilityHint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  messageInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body2,
    color: colors.text.primary,
    minHeight: 100,
  },
  characterCount: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  submitButton: {
    marginBottom: spacing.xl,
  },
});