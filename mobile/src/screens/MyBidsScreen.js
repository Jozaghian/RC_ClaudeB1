import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { formatDate, formatTime, formatCurrency, getTimeUntilDeparture } from '../utils/helpers';
import apiService from '../services/apiService';

const BID_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED', 
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All Bids', count: 0 },
  { key: 'PENDING', label: 'Pending', count: 0 },
  { key: 'ACCEPTED', label: 'Accepted', count: 0 },
  { key: 'REJECTED', label: 'Rejected', count: 0 },
];

export default function MyBidsScreen({ navigation }) {
  const [bids, setBids] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filters, setFilters] = useState(STATUS_FILTERS);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadMyBids();
  }, []);

  useEffect(() => {
    applyFilters();
    updateFilterCounts();
  }, [bids, activeFilter]);

  const loadMyBids = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/bids/driver/my-bids');
      
      if (response.success) {
        setBids(response.data.bids);
      }
    } catch (error) {
      console.error('Load my bids error:', error);
      Alert.alert('Error', 'Failed to load your bids');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyBids();
    setRefreshing(false);
  };

  const applyFilters = () => {
    if (activeFilter === 'all') {
      setFilteredBids(bids);
    } else {
      setFilteredBids(bids.filter(bid => bid.status === activeFilter));
    }
  };

  const updateFilterCounts = () => {
    const updatedFilters = filters.map(filter => ({
      ...filter,
      count: filter.key === 'all' ? bids.length : bids.filter(bid => bid.status === filter.key).length
    }));
    setFilters(updatedFilters);
  };

  const handleWithdrawBid = (bid) => {
    if (bid.status !== 'PENDING') {
      Alert.alert('Cannot Withdraw', 'Only pending bids can be withdrawn');
      return;
    }

    Alert.alert(
      'Withdraw Bid',
      `Are you sure you want to withdraw your bid of ${formatCurrency(bid.priceOffer)} for the ride from ${bid.request.originCity.name} to ${bid.request.destinationCity.name}?`,
      [
        { text: 'Cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: () => confirmWithdrawBid(bid.id) }
      ]
    );
  };

  const confirmWithdrawBid = async (bidId) => {
    setGlobalLoading(true);
    
    try {
      const response = await apiService.delete(`/bids/${bidId}`);
      
      if (response.success) {
        Alert.alert('Bid Withdrawn', 'Your bid has been withdrawn successfully');
        await loadMyBids();
      }
    } catch (error) {
      console.error('Withdraw bid error:', error);
      Alert.alert('Error', 'Failed to withdraw bid');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleUpdateBid = (bid) => {
    if (bid.status !== 'PENDING') {
      Alert.alert('Cannot Update', 'Only pending bids can be updated');
      return;
    }

    navigation.navigate('UpdateBid', { bid });
  };

  const handleContactPassenger = async (passenger) => {
    Alert.alert(
      'Contact Passenger',
      `Contact ${passenger.firstName}?`,
      [
        { text: 'Cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${passenger.phoneNumber}`);
          }
        },
        { 
          text: 'Message', 
          onPress: () => {
            navigation.navigate('Chat', { 
              partnerId: passenger.id,
              partnerName: passenger.firstName 
            });
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'ACCEPTED': return colors.success;
      case 'REJECTED': return colors.error;
      case 'EXPIRED': return colors.text.secondary;
      default: return colors.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return 'schedule';
      case 'ACCEPTED': return 'check-circle';
      case 'REJECTED': return 'cancel';
      case 'EXPIRED': return 'access-time';
      default: return 'help';
    }
  };

  const isExpiringSoon = (bid) => {
    if (bid.status !== 'PENDING') return false;
    const timeUntilExpiry = new Date(bid.expiresAt) - new Date();
    return timeUntilExpiry < 2 * 60 * 60 * 1000; // Less than 2 hours
  };

  const renderFilterTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.filterTabs}
      contentContainerStyle={styles.filterTabsContent}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterTab,
            activeFilter === filter.key && styles.activeFilterTab
          ]}
          onPress={() => setActiveFilter(filter.key)}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === filter.key && styles.activeFilterTabText
          ]}>
            {filter.label}
          </Text>
          {filter.count > 0 && (
            <View style={[
              styles.filterBadge,
              activeFilter === filter.key && styles.activeFilterBadge
            ]}>
              <Text style={[
                styles.filterBadgeText,
                activeFilter === filter.key && styles.activeFilterBadgeText
              ]}>
                {filter.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderBidCard = ({ item: bid }) => {
    const request = bid.request;
    const passenger = request.passenger;
    const timeUntil = getTimeUntilDeparture(request.preferredDateTime);
    const isExpiring = isExpiringSoon(bid);
    const statusColor = getStatusColor(bid.status);
    const statusIcon = getStatusIcon(bid.status);

    return (
      <View style={[styles.bidCard, isExpiring && styles.expiringCard]}>
        {/* Status Header */}
        <View style={styles.bidHeader}>
          <View style={styles.statusContainer}>
            <Icon name={statusIcon} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {bid.status.charAt(0) + bid.status.slice(1).toLowerCase()}
            </Text>
            {isExpiring && (
              <View style={styles.expiringBadge}>
                <Text style={styles.expiringText}>Expiring Soon</Text>
              </View>
            )}
          </View>
          <Text style={styles.bidPrice}>{formatCurrency(bid.priceOffer)}</Text>
        </View>

        {/* Route Information */}
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            {request.originCity.name} → {request.destinationCity.name}
          </Text>
          <Text style={styles.routeSubtext}>
            {request.originCity.province} → {request.destinationCity.province}
          </Text>
        </View>

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={14} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {formatDate(request.preferredDateTime)} at {formatTime(request.preferredDateTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="group" size={14} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {request.passengerCount} passenger{request.passengerCount > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="person" size={14} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {passenger.firstName} • ⭐ {passenger.passengerRating?.toFixed(1) || 'New'}
            </Text>
          </View>
        </View>

        {/* Bid Message */}
        {bid.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Your message:</Text>
            <Text style={styles.messageText} numberOfLines={2}>
              "{bid.message}"
            </Text>
          </View>
        )}

        {/* Time Information */}
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>Trip: {timeUntil}</Text>
          {bid.status === 'PENDING' && (
            <Text style={styles.expiryText}>
              Bid expires: {getTimeUntilDeparture(bid.expiresAt)}
            </Text>
          )}
          <Text style={styles.submittedText}>
            Submitted: {getTimeUntilDeparture(bid.createdAt)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {bid.status === 'PENDING' && (
            <>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => handleUpdateBid(bid)}
              >
                <Icon name="edit" size={16} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Update</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => handleWithdrawBid(bid)}
              >
                <Icon name="cancel" size={16} color={colors.error} />
                <Text style={[styles.secondaryButtonText, { color: colors.error }]}>
                  Withdraw
                </Text>
              </TouchableOpacity>
            </>
          )}

          {bid.status === 'ACCEPTED' && (
            <>
              <DriverButton
                title="Contact Passenger"
                onPress={() => handleContactPassenger(passenger)}
                style={styles.contactButton}
              />
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Chat', { 
                  partnerId: passenger.id,
                  partnerName: passenger.firstName 
                })}
              >
                <Icon name="message" size={16} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Message</Text>
              </TouchableOpacity>
            </>
          )}

          {bid.status === 'REJECTED' && (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('BrowseRequests')}
            >
              <Icon name="search" size={16} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Browse More</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bids</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('BrowseRequests')}
          style={styles.browseButton}
        >
          <Icon name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {renderFilterTabs()}

      <FlatList
        data={filteredBids}
        renderItem={renderBidCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon 
              name={activeFilter === 'all' ? 'gavel' : 'filter-list'} 
              size={64} 
              color={colors.text.secondary} 
            />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No Bids Yet' : `No ${activeFilter.toLowerCase()} Bids`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {loading 
                ? 'Loading your bids...' 
                : activeFilter === 'all' 
                  ? 'You haven\'t submitted any bids yet. Browse ride requests to get started!'
                  : `You don't have any ${activeFilter.toLowerCase()} bids at the moment.`
              }
            </Text>
            {!loading && activeFilter === 'all' && (
              <DriverButton
                title="Browse Requests"
                onPress={() => navigation.navigate('BrowseRequests')}
                style={styles.browseRequestsButton}
              />
            )}
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  browseButton: {
    padding: spacing.sm,
  },
  filterTabs: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTabsContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  activeFilterTabText: {
    color: colors.surface,
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: colors.text.secondary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  activeFilterBadge: {
    backgroundColor: colors.surface,
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterBadgeText: {
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
  },
  bidCard: {
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
  expiringCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...typography.body2,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  expiringBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  expiringText: {
    ...typography.caption,
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  bidPrice: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '600',
  },
  routeInfo: {
    marginBottom: spacing.md,
  },
  routeText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  routeSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  tripDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    ...typography.body2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  messageContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  messageLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.body2,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  timeInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  timeText: {
    ...typography.body2,
    color: colors.text.primary,
    marginBottom: 2,
  },
  expiryText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: 2,
  },
  submittedText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  secondaryButtonText: {
    ...typography.body2,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  contactButton: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  browseRequestsButton: {
    paddingHorizontal: spacing.xl,
  },
});