import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton, PassengerButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { formatDate, formatTime, formatCurrency, getTimeUntilDeparture } from '../utils/helpers';
import apiService from '../services/apiService';

export default function RideDetailsScreen({ route, navigation }) {
  const { ride: initialRide } = route.params;
  const [ride, setRide] = useState(initialRide);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  
  const { user, isDriver } = useAuth();
  const { setLoading } = useLoading();

  useEffect(() => {
    if (ride?.id) {
      loadRideDetails();
    }
  }, [ride?.id]);

  const loadRideDetails = async () => {
    try {
      const response = await apiService.get(`/rides/${ride.id}`);
      if (response.success) {
        setRide(response.data.ride);
        
        // Check if user has existing booking
        if (response.data.ride.bookings && user) {
          const userBooking = response.data.ride.bookings.find(
            booking => booking.passengerId === user.id
          );
          if (userBooking) {
            setBookingData(userBooking);
          }
        }
      }
    } catch (error) {
      console.error('Load ride details error:', error);
    }
  };

  const handleBookRide = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to book a ride.', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth') }
      ]);
      return;
    }

    if (isDriver()) {
      Alert.alert('Error', 'Drivers cannot book rides. Switch to passenger mode to book rides.');
      return;
    }

    Alert.alert(
      'Confirm Booking',
      `Book this ride for ${formatCurrency(ride.pricePerSeat)} per seat?`,
      [
        { text: 'Cancel' },
        { text: 'Book Now', onPress: confirmBooking }
      ]
    );
  };

  const confirmBooking = async () => {
    setIsBooking(true);
    setLoading(true);

    try {
      const response = await apiService.post('/bookings', {
        rideId: ride.id,
        seatsBooked: 1, // Default to 1 seat
        paymentMethod: 'CASH' // Default payment method
      });

      if (response.success) {
        setBookingData(response.data.booking);
        Alert.alert(
          'Booking Confirmed! 🎉',
          `Your ride is booked. Driver: ${ride.driver.firstName} ${ride.driver.lastName}`,
          [
            { text: 'OK' },
            { text: 'Contact Driver', onPress: () => contactDriver() }
          ]
        );
        await loadRideDetails(); // Refresh ride data
      }
    } catch (error) {
      console.error('Book ride error:', error);
      Alert.alert('Booking Failed', error.response?.data?.message || 'Failed to book ride. Please try again.');
    } finally {
      setIsBooking(false);
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingData) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel your booking?',
      [
        { text: 'Keep Booking' },
        { text: 'Cancel Booking', style: 'destructive', onPress: confirmCancelBooking }
      ]
    );
  };

  const confirmCancelBooking = async () => {
    setLoading(true);

    try {
      const response = await apiService.delete(`/bookings/${bookingData.id}`);
      
      if (response.success) {
        setBookingData(null);
        Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
        await loadRideDetails(); // Refresh ride data
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactDriver = () => {
    if (!ride.driver.phoneNumber) return;
    
    Alert.alert(
      'Contact Driver',
      `${ride.driver.firstName} ${ride.driver.lastName}`,
      [
        { text: 'Cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${ride.driver.phoneNumber}`)
        },
        { 
          text: 'SMS', 
          onPress: () => Linking.openURL(`sms:${ride.driver.phoneNumber}`)
        }
      ]
    );
  };

  const contactPassenger = (passenger) => {
    Alert.alert(
      'Contact Passenger',
      `${passenger.firstName} ${passenger.lastName}`,
      [
        { text: 'Cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${passenger.phoneNumber}`)
        },
        { 
          text: 'SMS', 
          onPress: () => Linking.openURL(`sms:${passenger.phoneNumber}`)
        }
      ]
    );
  };

  const getRideStatus = () => {
    const now = new Date();
    const departureTime = new Date(ride.departureDateTime);
    
    if (departureTime < now) {
      return { text: 'Departed', color: colors.textLight };
    }
    
    const availableSeats = ride.seatsAvailable - (ride.seatsBooked || 0);
    if (availableSeats === 0) {
      return { text: 'Full', color: colors.warning };
    }
    
    return { text: 'Available', color: colors.success };
  };

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const rideStatus = getRideStatus();
  const availableSeats = ride.seatsAvailable - (ride.seatsBooked || 0);
  const isOwnRide = user && ride.driver.id === user.id;
  const canBook = !isOwnRide && !bookingData && availableSeats > 0 && !isDriver();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.routeContainer}>
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{ride.originCity.name}</Text>
              <Text style={styles.provinceName}>{ride.originCity.province}</Text>
            </View>
            
            <View style={styles.routeArrow}>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
            
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{ride.destinationCity.name}</Text>
              <Text style={styles.provinceName}>{ride.destinationCity.province}</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: rideStatus.color + '20', borderColor: rideStatus.color }]}>
              <Text style={[styles.statusText, { color: rideStatus.color }]}>
                {rideStatus.text}
              </Text>
            </View>
            <Text style={styles.timeUntil}>
              {getTimeUntilDeparture(ride.departureDateTime)}
            </Text>
          </View>
        </View>

        {/* Booking Status */}
        {bookingData && (
          <View style={styles.bookingStatus}>
            <Text style={styles.bookingStatusTitle}>✅ You're booked!</Text>
            <Text style={styles.bookingStatusText}>
              Booking confirmed • {bookingData.seatsBooked} seat(s) • {bookingData.paymentMethod}
            </Text>
          </View>
        )}

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Trip Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDate(ride.departureDateTime)} at {formatTime(ride.departureDateTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price per Seat</Text>
            <Text style={[styles.detailValue, styles.priceText]}>
              {formatCurrency(ride.pricePerSeat)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Available Seats</Text>
            <Text style={styles.detailValue}>
              {availableSeats} of {ride.seatsAvailable}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Methods</Text>
            <Text style={styles.detailValue}>
              {ride.paymentMethods.join(', ')}
            </Text>
          </View>

          {ride.pickupDetails && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Details</Text>
              <Text style={styles.detailValue}>{ride.pickupDetails}</Text>
            </View>
          )}

          {ride.dropoffDetails && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Drop-off Details</Text>
              <Text style={styles.detailValue}>{ride.dropoffDetails}</Text>
            </View>
          )}

          {ride.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Additional Notes</Text>
              <Text style={styles.detailValue}>{ride.notes}</Text>
            </View>
          )}
        </View>

        {/* Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Driver</Text>
          
          <View style={styles.driverContainer}>
            <View style={styles.driverAvatar}>
              {ride.driver.profilePicture ? (
                <Image source={{ uri: ride.driver.profilePicture }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {ride.driver.firstName.charAt(0)}{ride.driver.lastName.charAt(0)}
                </Text>
              )}
            </View>
            
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {ride.driver.firstName} {ride.driver.lastName}
              </Text>
              <View style={styles.driverStats}>
                <Text style={styles.driverRating}>
                  ⭐ {ride.driver.driverRating?.toFixed(1) || 'New'}
                </Text>
                <Text style={styles.driverTrips}>
                  {ride.driver.totalTripsAsDriver || 0} trips
                </Text>
              </View>
              {ride.driver.bio && (
                <Text style={styles.driverBio}>{ride.driver.bio}</Text>
              )}
              {ride.driver.languages && ride.driver.languages.length > 0 && (
                <Text style={styles.driverLanguages}>
                  Languages: {ride.driver.languages.join(', ')}
                </Text>
              )}
            </View>
          </View>

          {(bookingData || isOwnRide) && ride.driver.phoneNumber && (
            <TouchableOpacity style={styles.contactButton} onPress={contactDriver}>
              <Text style={styles.contactButtonText}>Contact Driver</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vehicle Info */}
        {ride.vehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚙 Vehicle</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>
                {ride.vehicle.year} {ride.vehicle.make} {ride.vehicle.model}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{ride.vehicle.color}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>License Plate</Text>
              <Text style={styles.detailValue}>{ride.vehicle.licensePlate}</Text>
            </View>

            {ride.vehicle.features && ride.vehicle.features.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Features</Text>
                <Text style={styles.detailValue}>{ride.vehicle.features.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Passengers (for drivers) */}
        {isOwnRide && ride.bookings && ride.bookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Passengers ({ride.bookings.length})</Text>
            
            {ride.bookings.map((booking, index) => (
              <View key={booking.id} style={styles.passengerItem}>
                <View style={styles.passengerAvatar}>
                  <Text style={styles.avatarInitials}>
                    {booking.passenger.firstName.charAt(0)}{booking.passenger.lastName.charAt(0)}
                  </Text>
                </View>
                
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerName}>
                    {booking.passenger.firstName} {booking.passenger.lastName}
                  </Text>
                  <Text style={styles.passengerDetails}>
                    {booking.seatsBooked} seat(s) • {booking.paymentMethod}
                  </Text>
                  <Text style={styles.passengerRating}>
                    ⭐ {booking.passenger.passengerRating?.toFixed(1) || 'New'}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.contactPassengerButton}
                  onPress={() => contactPassenger(booking.passenger)}
                >
                  <Text style={styles.contactPassengerText}>Contact</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {canBook && (
            <PassengerButton
              title="Book This Ride"
              onPress={handleBookRide}
              fullWidth
              style={{ height: 55 }}
            />
          )}

          {bookingData && (
            <CustomButton
              title="Cancel Booking"
              variant="outline"
              onPress={handleCancelBooking}
              fullWidth
              style={[styles.cancelButton, { height: 55 }]}
            />
          )}

          {isOwnRide && (
            <DriverButton
              title="Manage Ride"
              onPress={() => navigation.navigate('ManageRide', { ride })}
              fullWidth
              style={[styles.driverButton, { height: 55 }]}
            />
          )}

          {!canBook && !bookingData && !isOwnRide && availableSeats === 0 && (
            <CustomButton
              title="Ride Full"
              fullWidth
              style={{ height: 55 }}
            />
          )}
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cityContainer: {
    flex: 1,
    alignItems: 'center',
  },
  cityName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  provinceName: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
  },
  routeArrow: {
    marginHorizontal: spacing.md,
  },
  arrowIcon: {
    fontSize: 24,
    color: colors.white,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  timeUntil: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  bookingStatus: {
    backgroundColor: colors.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  bookingStatusTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  bookingStatusText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    flex: 2,
    textAlign: 'right',
  },
  priceText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarInitials: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  driverStats: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  driverRating: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  driverTrips: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  driverBio: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  driverLanguages: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  contactButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  contactButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  passengerDetails: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  passengerRating: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  contactPassengerButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  contactPassengerText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  actionContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
  driverButton: {
    marginBottom: spacing.md,
    height: 55,
  },
});