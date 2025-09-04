import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';

const RideCard = ({
  ride,
  onPress,
  showDistance = false,
  distance = null,
  variant = 'default', // 'default', 'compact', 'featured'
  userType = 'passenger', // 'driver', 'passenger'
}) => {
  const {
    id,
    originCity,
    destinationCity,
    originDetails,
    destinationDetails,
    departureDateTime,
    pricePerPerson,
    availableSeats,
    totalSeats,
    driver,
    vehicle,
    allowsLargeLuggage,
    allowsPets,
    allowsSmoking,
    additionalNotes,
  } = ride;

  const formatTime = (dateTime) => {
    return moment(dateTime).format('HH:mm');
  };

  const formatDate = (dateTime) => {
    return moment(dateTime).format('MMM DD');
  };

  const isToday = moment(departureDateTime).isSame(moment(), 'day');
  const isTomorrow = moment(departureDateTime).isSame(moment().add(1, 'day'), 'day');

  const getDateLabel = () => {
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return formatDate(departureDateTime);
  };

  const renderTripConditions = () => {
    const conditions = [];
    if (allowsLargeLuggage) conditions.push({ icon: '🧳', label: 'Luggage OK' });
    if (allowsPets) conditions.push({ icon: '🐕', label: 'Pets OK' });
    if (allowsSmoking) conditions.push({ icon: '🚬', label: 'Smoking OK' });

    return (
      <View style={styles.conditionsContainer}>
        {conditions.map((condition, index) => (
          <View key={index} style={styles.conditionTag}>
            <Text style={styles.conditionIcon}>{condition.icon}</Text>
            <Text style={styles.conditionText}>{condition.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDriverInfo = () => (
    <View style={styles.driverInfo}>
      <View style={styles.avatarContainer}>
        {driver.profilePicture ? (
          <Image source={{ uri: driver.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {driver.firstName[0]}{driver.lastName[0]}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.driverDetails}>
        <Text style={styles.driverName}>
          {driver.firstName} {driver.lastName[0]}.
        </Text>
        {driver.driverRating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.ratingText}>{driver.driverRating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderVehicleInfo = () => (
    <View style={styles.vehicleInfo}>
      <Text style={styles.vehicleIcon}>🚗</Text>
      <Text style={styles.vehicleText}>
        {vehicle.make.name} {vehicle.model.name} • {vehicle.color}
      </Text>
    </View>
  );

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={() => onPress?.(ride)}>
        <View style={styles.compactHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.compactRoute}>
              {originCity.name} → {destinationCity.name}
            </Text>
            <Text style={styles.compactTime}>
              {getDateLabel()} at {formatTime(departureDateTime)}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.compactPrice}>${pricePerPerson}</Text>
            <Text style={styles.priceLabel}>CAD</Text>
          </View>
        </View>
        <View style={styles.compactFooter}>
          <Text style={styles.seatsInfo}>
            {availableSeats} of {totalSeats} seats available
          </Text>
          {showDistance && distance && (
            <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity onPress={() => onPress?.(ride)}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.featuredCard}
        >
          <View style={styles.featuredHeader}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
            <Text style={styles.featuredPrice}>${pricePerPerson} CAD</Text>
          </View>
          
          <View style={styles.featuredContent}>
            <Text style={styles.featuredRoute}>
              {originCity.name} → {destinationCity.name}
            </Text>
            <Text style={styles.featuredTime}>
              {getDateLabel()} at {formatTime(departureDateTime)}
            </Text>
            
            <View style={styles.featuredFooter}>
              <Text style={styles.featuredSeats}>
                {availableSeats} seats • {driver.firstName}
              </Text>
              {driver.driverRating && (
                <View style={styles.featuredRating}>
                  <Text style={styles.featuredRatingIcon}>⭐</Text>
                  <Text style={styles.featuredRatingText}>
                    {driver.driverRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Default card
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(ride)}>
      <View style={styles.cardHeader}>
        <View style={styles.routeContainer}>
          <View style={styles.routePoints}>
            <View style={styles.startPoint} />
            <View style={styles.routeLine} />
            <View style={styles.endPoint} />
          </View>
          
          <View style={styles.routeDetails}>
            <Text style={styles.cityName}>{originCity.name}</Text>
            {originDetails && (
              <Text style={styles.locationDetails} numberOfLines={1}>
                {originDetails}
              </Text>
            )}
            
            <View style={styles.routeSeparator}>
              <Text style={styles.routeIcon}>✈️</Text>
            </View>
            
            <Text style={styles.cityName}>{destinationCity.name}</Text>
            {destinationDetails && (
              <Text style={styles.locationDetails} numberOfLines={1}>
                {destinationDetails}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.priceSection}>
          <Text style={styles.price}>${pricePerPerson}</Text>
          <Text style={styles.currency}>CAD</Text>
          {showDistance && distance && (
            <Text style={styles.distance}>{distance.toFixed(1)} km</Text>
          )}
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={styles.timeText}>
            {getDateLabel()} at {formatTime(departureDateTime)}
          </Text>
        </View>

        <View style={styles.seatsContainer}>
          <Text style={styles.seatsIcon}>💺</Text>
          <Text style={styles.seatsText}>
            {availableSeats} of {totalSeats} seats available
          </Text>
        </View>

        {renderTripConditions()}
      </View>

      <View style={styles.cardFooter}>
        {renderDriverInfo()}
        {renderVehicleInfo()}
      </View>

      {additionalNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesIcon}>💭</Text>
          <Text style={styles.notesText} numberOfLines={2}>
            {additionalNotes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  routeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePoints: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  startPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: colors.gray300,
    marginVertical: 2,
  },
  endPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  routeDetails: {
    flex: 1,
  },
  cityName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  locationDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  routeSeparator: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  routeIcon: {
    fontSize: 12,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  currency: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  distance: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  cardContent: {
    marginBottom: spacing.md,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seatsIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  seatsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  conditionIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  conditionText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.sm,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  vehicleText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  notesContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  notesIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  notesText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontStyle: 'italic',
  },

  // Compact card styles
  compactCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    ...shadows.small,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  routeInfo: {
    flex: 1,
  },
  compactRoute: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  compactTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  compactPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatsInfo: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },

  // Featured card styles
  featuredCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.large,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  featuredBadge: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featuredBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  featuredPrice: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  featuredContent: {
    marginBottom: spacing.sm,
  },
  featuredRoute: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  featuredTime: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredSeats: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    opacity: 0.9,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredRatingIcon: {
    fontSize: 14,
    marginRight: 2,
  },
  featuredRatingText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

export default RideCard;