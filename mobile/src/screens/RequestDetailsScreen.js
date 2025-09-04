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
  Image,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { PassengerButton, DriverButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { formatDate, formatTime, formatCurrency, getTimeUntilDeparture } from '../utils/helpers';
import apiService from '../services/apiService';

export default function RequestDetailsScreen({ route, navigation }) {
  const { request: initialRequest } = route.params;
  const [request, setRequest] = useState(initialRequest);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  const { user, isDriver } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    if (request?.id) {
      loadRequestDetails();
      loadBids();
    }
  }, [request?.id]);

  const loadRequestDetails = async () => {
    try {
      const response = await apiService.get(`/requests/${request.id}`);
      if (response.success) {
        setRequest(response.data);
      }
    } catch (error) {
      console.error('Load request details error:', error);
    }
  };

  const loadBids = async () => {
    try {
      const response = await apiService.get(`/bids/request/${request.id}`);
      if (response.success) {
        setBids(response.data.bids);
      }
    } catch (error) {
      console.error('Load bids error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRequestDetails(), loadBids()]);
    setRefreshing(false);
  };

  const handleAcceptBid = (bid) => {
    Alert.alert(
      'Accept Bid',
      `Accept ${bid.driver.firstName}'s bid for ${formatCurrency(bid.priceOffer)}?`,
      [
        { text: 'Cancel' },
        { text: 'Accept', onPress: () => confirmAcceptBid(bid) }
      ]
    );
  };

  const confirmAcceptBid = async (bid) => {
    setGlobalLoading(true);

    try {
      const response = await apiService.patch(`/bids/${bid.id}/accept`);
      
      if (response.success) {
        Alert.alert(
          'Bid Accepted! 🎉',
          `You've accepted ${bid.driver.firstName}'s bid. You can now contact the driver to arrange pickup details.`,
          [
            { text: 'OK', onPress: () => {
              navigation.navigate('MyRides');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Accept bid error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept bid.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRejectBid = (bid) => {
    Alert.alert(
      'Reject Bid',
      `Reject ${bid.driver.firstName}'s bid?`,
      [
        { text: 'Cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => confirmRejectBid(bid) }
      ]
    );
  };

  const confirmRejectBid = async (bid) => {
    setGlobalLoading(true);

    try {
      const response = await apiService.patch(`/bids/${bid.id}/reject`);
      
      if (response.success) {
        Alert.alert('Bid Rejected', 'The bid has been rejected.');
        await loadBids(); // Refresh bids list
      }
    } catch (error) {
      console.error('Reject bid error:', error);
      Alert.alert('Error', 'Failed to reject bid.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this ride request? All pending bids will be rejected.',
      [
        { text: 'Keep Request' },
        { text: 'Cancel Request', style: 'destructive', onPress: confirmCancelRequest }
      ]
    );
  };

  const confirmCancelRequest = async () => {
    setGlobalLoading(true);

    try {
      const response = await apiService.delete(`/requests/${request.id}`);
      
      if (response.success) {
        Alert.alert(
          'Request Cancelled',
          'Your ride request has been cancelled successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Cancel request error:', error);
      Alert.alert('Error', 'Failed to cancel request.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!bidPrice || !bidPrice.trim()) {
      Alert.alert('Missing Information', 'Please enter your bid price.');
      return;
    }

    const price = parseFloat(bidPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    if (request.minBudget && price < request.minBudget) {
      Alert.alert('Price Too Low', `Your bid must be at least ${formatCurrency(request.minBudget)} (minimum budget).`);
      return;
    }

    if (request.maxBudget && price > request.maxBudget) {
      Alert.alert('Price Too High', `Your bid cannot exceed ${formatCurrency(request.maxBudget)} (maximum budget).`);
      return;
    }

    setSubmittingBid(true);
    setGlobalLoading(true);

    try {
      const bidData = {
        requestId: request.id,
        priceOffer: price,
        proposedDateTime: request.preferredDateTime,
        message: bidMessage.trim() || undefined
      };

      const response = await apiService.post('/bids', bidData);
      
      if (response.success) {
        Alert.alert(
          'Bid Submitted! 🎉',
          'Your bid has been submitted successfully. The passenger will review all bids and contact you if yours is accepted.',
          [
            { text: 'OK', onPress: () => {
              setBidPrice('');
              setBidMessage('');
              loadBids(); // Refresh bids list
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Submit bid error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit bid. Please try again.');
    } finally {
      setSubmittingBid(false);
      setGlobalLoading(false);
    }
  };

  const hasExistingBid = () => {
    return bids.some(bid => bid.driver && bid.driver.id === user.id);
  };

  const getRequestStatus = () => {
    const now = new Date();
    const expiresAt = new Date(request.expiresAt);
    
    if (request.status === 'CLOSED') {
      return { text: 'Closed', color: colors.primary };
    }
    
    if (expiresAt < now) {
      return { text: 'Expired', color: colors.textLight };
    }
    
    return { text: 'Open for Bids', color: colors.success };
  };

  const getTimeUntilExpiry = () => {
    const now = new Date();
    const expiresAt = new Date(request.expiresAt);
    const diffMs = expiresAt - now;
    
    if (diffMs < 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours}h left`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m left`;
    }
  };

  const renderBid = ({ item: bid }) => (
    <View style={styles.bidCard}>
      <View style={styles.bidHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            {bid.driver.profilePicture ? (
              <Image source={{ uri: bid.driver.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>
                {bid.driver.firstName.charAt(0)}{bid.driver.lastName.charAt(0)}
              </Text>
            )}
          </View>
          
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>
              {bid.driver.firstName} {bid.driver.lastName}
            </Text>
            <View style={styles.driverStats}>
              <Text style={styles.driverRating}>
                ⭐ {bid.driver.driverRating?.toFixed(1) || 'New'}
              </Text>
              <Text style={styles.driverTrips}>
                {bid.driver.totalTripsAsDriver || 0} trips
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.bidStatus}>
          <Text style={[
            styles.bidStatusText,
            { color: getBidStatusColor(bid.status) }
          ]}>
            {bid.status}
          </Text>
        </View>
      </View>

      <View style={styles.bidDetails}>
        <View style={styles.bidPrice}>
          <Text style={styles.bidPriceLabel}>Offered Price</Text>
          <Text style={styles.bidPriceAmount}>
            {formatCurrency(bid.priceOffer)}
          </Text>
        </View>

        {bid.proposedDateTime && (
          <View style={styles.bidTime}>
            <Text style={styles.bidTimeLabel}>Proposed Time</Text>
            <Text style={styles.bidTimeValue}>
              {formatDate(bid.proposedDateTime)} at {formatTime(bid.proposedDateTime)}
            </Text>
          </View>
        )}

        {bid.message && (
          <View style={styles.bidMessage}>
            <Text style={styles.bidMessageLabel}>Message</Text>
            <Text style={styles.bidMessageText}>{bid.message}</Text>
          </View>
        )}
      </View>

      {bid.status === 'PENDING' && request.status === 'OPEN' && (
        <View style={styles.bidActions}>
          <CustomButton
            title="Reject"
            variant="outline"
            size="small"
            onPress={() => handleRejectBid(bid)}
            style={[styles.bidActionButton, styles.rejectButton]}
          />
          <PassengerButton
            title="Accept"
            size="small"
            onPress={() => handleAcceptBid(bid)}
            style={styles.bidActionButton}
          />
        </View>
      )}

      {bid.status === 'ACCEPTED' && (
        <View style={styles.acceptedBidNotice}>
          <Text style={styles.acceptedBidText}>✅ Accepted</Text>
        </View>
      )}
    </View>
  );

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return colors.warning;
      case 'ACCEPTED':
        return colors.success;
      case 'REJECTED':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const requestStatus = getRequestStatus();
  const isOwner = user && request.passenger && request.passenger.id === user.id;
  const canManage = isOwner && request.status === 'OPEN';
  const acceptedBid = bids.find(bid => bid.status === 'ACCEPTED');
  const canBid = isDriver() && !isOwner && request.status === 'OPEN' && !hasExistingBid();
  const existingBid = bids.find(bid => bid.driver && bid.driver.id === user.id);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.routeContainer}>
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{request.originCity.name}</Text>
              <Text style={styles.provinceName}>{request.originCity.province}</Text>
            </View>
            
            <View style={styles.routeArrow}>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
            
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{request.destinationCity.name}</Text>
              <Text style={styles.provinceName}>{request.destinationCity.province}</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: requestStatus.color + '20', borderColor: requestStatus.color }
            ]}>
              <Text style={[styles.statusText, { color: requestStatus.color }]}>
                {requestStatus.text}
              </Text>
            </View>
            <Text style={styles.timeUntil}>
              {getTimeUntilExpiry()}
            </Text>
          </View>
        </View>

        {/* Request Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Request Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDate(request.preferredDateTime)} at {formatTime(request.preferredDateTime)}
            </Text>
          </View>

          {request.timeFlexibility > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time Flexibility</Text>
              <Text style={styles.detailValue}>±{request.timeFlexibility} hours</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers</Text>
            <Text style={styles.detailValue}>{request.passengerCount}</Text>
          </View>

          {(request.minBudget || request.maxBudget) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Budget Range</Text>
              <Text style={styles.detailValue}>
                {request.minBudget && formatCurrency(request.minBudget)}
                {request.minBudget && request.maxBudget && ' - '}
                {request.maxBudget && formatCurrency(request.maxBudget)}
              </Text>
            </View>
          )}

          {request.originDetails && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Details</Text>
              <Text style={styles.detailValue}>{request.originDetails}</Text>
            </View>
          )}

          {request.destinationDetails && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Drop-off Details</Text>
              <Text style={styles.detailValue}>{request.destinationDetails}</Text>
            </View>
          )}

          {request.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{request.description}</Text>
            </View>
          )}
        </View>

        {/* Special Requirements */}
        {(request.needsLargeLuggage || request.needsChildSeat || request.needsWheelchairAccess || request.specialRequirements) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎒 Special Requirements</Text>
            
            {request.needsLargeLuggage && (
              <View style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>🧳</Text>
                <Text style={styles.requirementText}>Large Luggage Space</Text>
              </View>
            )}

            {request.needsChildSeat && (
              <View style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>👶</Text>
                <Text style={styles.requirementText}>Child Seat Required</Text>
              </View>
            )}

            {request.needsWheelchairAccess && (
              <View style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>♿</Text>
                <Text style={styles.requirementText}>Wheelchair Accessible</Text>
              </View>
            )}

            {request.specialRequirements && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Additional Requirements</Text>
                <Text style={styles.detailValue}>{request.specialRequirements}</Text>
              </View>
            )}
          </View>
        )}

        {/* Bids Section */}
        <View style={styles.section}>
          <View style={styles.bidsHeader}>
            <Text style={styles.sectionTitle}>
              🏷️ Bids ({bids.length})
            </Text>
            {bids.length > 0 && (
              <View style={styles.bidStats}>
                <Text style={styles.bidStat}>
                  Lowest: {formatCurrency(Math.min(...bids.map(b => b.priceOffer)))}
                </Text>
                <Text style={styles.bidStat}>
                  Avg: {formatCurrency(bids.reduce((sum, b) => sum + b.priceOffer, 0) / bids.length)}
                </Text>
              </View>
            )}
          </View>
          
          {bids.length > 0 ? (
            <FlatList
              data={bids}
              renderItem={renderBid}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noBidsContainer}>
              <Text style={styles.noBidsIcon}>⏳</Text>
              <Text style={styles.noBidsTitle}>No bids yet</Text>
              <Text style={styles.noBidsMessage}>
                Drivers will see your request and submit bids. Check back soon!
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {canManage && (
          <View style={styles.actionContainer}>
            <CustomButton
              title="Cancel Request"
              variant="outline"
              onPress={handleCancelRequest}
              fullWidth
              style={styles.cancelButton}
            />
          </View>
        )}
      </ScrollView>

      {/* Bid Submission Form for Drivers */}
      {canBid && (
        <View style={styles.bidFormContainer}>
          <View style={styles.bidFormHeader}>
            <Text style={styles.bidFormTitle}>🎯 Place Your Bid</Text>
            <Text style={styles.bidFormSubtitle}>
              Budget: {request.minBudget ? formatCurrency(request.minBudget) : '$0'} - {request.maxBudget ? formatCurrency(request.maxBudget) : 'Open'}
            </Text>
          </View>
          
          <View style={styles.bidFormFields}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.inputLabel}>Your Offer</Text>
              <TextInput
                style={styles.priceInput}
                value={bidPrice}
                onChangeText={setBidPrice}
                placeholder="Enter amount (e.g., 120)"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.messageInputContainer}>
              <Text style={styles.inputLabel}>Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={bidMessage}
                onChangeText={setBidMessage}
                placeholder="Introduce yourself, mention your experience, vehicle details..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            <DriverButton
              title={submittingBid ? 'Submitting...' : 'Submit Bid'}
              onPress={handleSubmitBid}
              disabled={submittingBid}
              fullWidth
              style={styles.submitBidButton}
            />
          </View>
        </View>
      )}

      {/* Existing Bid Notice for Drivers */}
      {isDriver() && !isOwner && existingBid && (
        <View style={styles.existingBidContainer}>
          <Text style={styles.existingBidTitle}>✅ Your Bid Submitted</Text>
          <Text style={styles.existingBidAmount}>{formatCurrency(existingBid.priceOffer)}</Text>
          <Text style={styles.existingBidStatus}>Status: {existingBid.status}</Text>
          <TouchableOpacity
            style={styles.viewMyBidsButton}
            onPress={() => navigation.navigate('MyBids')}
          >
            <Text style={styles.viewMyBidsText}>View My Bids</Text>
          </TouchableOpacity>
        </View>
      )}

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
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.secondary,
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
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requirementIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  requirementText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  bidsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  bidStats: {
    alignItems: 'flex-end',
  },
  bidStat: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  bidCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarInitials: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  driverDetails: {
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
  bidStatus: {
    alignItems: 'flex-end',
  },
  bidStatusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  bidDetails: {
    marginBottom: spacing.md,
  },
  bidPrice: {
    marginBottom: spacing.sm,
  },
  bidPriceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  bidPriceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  bidTime: {
    marginBottom: spacing.sm,
  },
  bidTimeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  bidTimeValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  bidMessage: {},
  bidMessageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  bidMessageText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  bidActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bidActionButton: {
    flex: 1,
  },
  rejectButton: {
    borderColor: colors.danger,
  },
  acceptedBidNotice: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  acceptedBidText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
  },
  noBidsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noBidsIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noBidsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noBidsMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
  },
  actionContainer: {
    paddingHorizontal: spacing.md,
  },
  cancelButton: {
    borderColor: colors.danger,
  },
  keyboardContainer: {
    flex: 1,
  },
  bidFormContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    padding: spacing.lg,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bidFormHeader: {
    marginBottom: spacing.md,
  },
  bidFormTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bidFormSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bidFormFields: {
    gap: spacing.md,
  },
  priceInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    backgroundColor: colors.white,
    textAlign: 'center',
  },
  messageInputContainer: {
    flex: 1,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text,
    backgroundColor: colors.white,
    minHeight: 80,
  },
  submitBidButton: {
    marginTop: spacing.sm,
  },
  existingBidContainer: {
    backgroundColor: colors.success + '10',
    borderTopWidth: 1,
    borderTopColor: colors.success + '30',
    padding: spacing.lg,
    alignItems: 'center',
  },
  existingBidTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  existingBidAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  existingBidStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  viewMyBidsButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
  },
  viewMyBidsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
});