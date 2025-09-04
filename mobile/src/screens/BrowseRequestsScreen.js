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
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { formatDate, formatTime, formatCurrency, getTimeUntilDeparture } from '../utils/helpers';
import apiService from '../services/apiService';
import { searchLocations } from '../data/canadianLocations';

export default function BrowseRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    originCityId: null,
    destinationCityId: null,
    maxDistance: 50,
    minBudget: '',
    maxBudget: '',
    sortBy: 'preferredDateTime'
  });
  
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [cities, setCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(null);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/requests', {
        status: 'OPEN',
        sortBy: 'preferredDateTime',
        sortOrder: 'asc'
      });
      
      if (response.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Load requests error:', error);
      Alert.alert('Error', 'Failed to load ride requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Filter by budget
    if (filters.minBudget || filters.maxBudget) {
      filtered = filtered.filter(request => {
        const minBudget = parseFloat(filters.minBudget) || 0;
        const maxBudget = parseFloat(filters.maxBudget) || 9999;
        return (!request.minBudget || request.minBudget <= maxBudget) &&
               (!request.maxBudget || request.maxBudget >= minBudget);
      });
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'budget':
          return (b.maxBudget || 0) - (a.maxBudget || 0);
        case 'distance':
          // This would need actual distance calculation
          return 0;
        case 'preferredDateTime':
        default:
          return new Date(a.preferredDateTime) - new Date(b.preferredDateTime);
      }
    });

    setFilteredRequests(filtered);
  };

  const searchCities = (query) => {
    if (!query || query.length < 2) {
      setCities([]);
      return;
    }
    const results = searchLocations(query);
    setCities(results);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    searchCities(text);
  };

  const selectCity = (city) => {
    if (searchMode === 'origin') {
      setOriginText(`${city.name}, ${city.province}`);
      setFilters(prev => ({ ...prev, originCityId: city.id }));
    } else if (searchMode === 'destination') {
      setDestinationText(`${city.name}, ${city.province}`);
      setFilters(prev => ({ ...prev, destinationCityId: city.id }));
    }
    setSearchQuery('');
    setSearchMode(null);
    setCities([]);
  };

  const clearFilters = () => {
    setFilters({
      originCityId: null,
      destinationCityId: null,
      maxDistance: 50,
      minBudget: '',
      maxBudget: '',
      sortBy: 'preferredDateTime'
    });
    setOriginText('');
    setDestinationText('');
  };

  const handleBidOnRequest = (request) => {
    navigation.navigate('CreateBid', { request });
  };

  const renderRequestCard = ({ item: request }) => {
    const timeUntil = getTimeUntilDeparture(request.preferredDateTime);
    const isExpiringSoon = new Date(request.expiresAt) - new Date() < 6 * 60 * 60 * 1000; // Less than 6 hours
    const hasMyBid = request.bids?.some(bid => bid.driver?.id === user.id);

    return (
      <View style={[styles.requestCard, isExpiringSoon && styles.expiringCard]}>
        <View style={styles.requestHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {request.originCity.name} → {request.destinationCity.name}
            </Text>
            <Text style={styles.provinceText}>
              {request.originCity.province} → {request.destinationCity.province}
            </Text>
          </View>
          {isExpiringSoon && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Expiring Soon</Text>
            </View>
          )}
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {formatDate(request.preferredDateTime)} at {formatTime(request.preferredDateTime)}
            </Text>
            {request.timeFlexibility > 0 && (
              <Text style={styles.flexibilityText}>
                (±{request.timeFlexibility}h flexible)
              </Text>
            )}
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

          {(request.needsLargeLuggage || request.needsChildSeat || request.needsWheelchairAccess) && (
            <View style={styles.detailRow}>
              <Icon name="info" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                Special: {[
                  request.needsLargeLuggage && 'Large Luggage',
                  request.needsChildSeat && 'Child Seat',
                  request.needsWheelchairAccess && 'Wheelchair Access'
                ].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {request.description && (
          <Text style={styles.description} numberOfLines={2}>
            "{request.description}"
          </Text>
        )}

        <View style={styles.requestFooter}>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>
              {request.passenger.firstName} • ⭐ {request.passenger.passengerRating?.toFixed(1) || 'New'}
            </Text>
            <Text style={styles.timeUntil}>{timeUntil}</Text>
          </View>

          <View style={styles.bidInfo}>
            {request.bids?.length > 0 && (
              <Text style={styles.bidCount}>
                {request.bids.length} bid{request.bids.length > 1 ? 's' : ''}
              </Text>
            )}
            
            {hasMyBid ? (
              <CustomButton
                title="View My Bid"
                onPress={() => navigation.navigate('MyBids')}
                style={styles.viewBidButton}
                textStyle={styles.viewBidButtonText}
              />
            ) : (
              <DriverButton
                title="Place Bid"
                onPress={() => handleBidOnRequest(request)}
                style={styles.bidButton}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Icon name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Requests</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Origin City Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Near Origin City</Text>
            <TouchableOpacity
              style={styles.cityInput}
              onPress={() => setSearchMode('origin')}
            >
              <Text style={[styles.cityInputText, !originText && styles.placeholderText]}>
                {originText || 'Select origin city...'}
              </Text>
              <Icon name="location-on" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Destination City Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Near Destination City</Text>
            <TouchableOpacity
              style={styles.cityInput}
              onPress={() => setSearchMode('destination')}
            >
              <Text style={[styles.cityInputText, !destinationText && styles.placeholderText]}>
                {destinationText || 'Select destination city...'}
              </Text>
              <Icon name="location-on" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Budget Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Budget Range</Text>
            <View style={styles.budgetRow}>
              <TextInput
                style={styles.budgetInput}
                placeholder="Min $"
                value={filters.minBudget}
                onChangeText={(text) => setFilters(prev => ({ ...prev, minBudget: text }))}
                keyboardType="numeric"
              />
              <Text style={styles.budgetSeparator}>to</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="Max $"
                value={filters.maxBudget}
                onChangeText={(text) => setFilters(prev => ({ ...prev, maxBudget: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Sort By Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'preferredDateTime', label: 'Departure Time' },
                { key: 'budget', label: 'Budget (High to Low)' },
                { key: 'createdAt', label: 'Recently Posted' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    filters.sortBy === option.key && styles.selectedSortOption
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, sortBy: option.key }))}
                >
                  <Text style={[
                    styles.sortOptionText,
                    filters.sortBy === option.key && styles.selectedSortOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <DriverButton
            title="Apply Filters"
            onPress={() => setShowFilters(false)}
            style={styles.applyButton}
          />
        </View>
      </SafeAreaView>

      {/* City Search Modal */}
      {searchMode && (
        <Modal visible={!!searchMode} animationType="slide">
          <SafeAreaView style={styles.searchModalContainer}>
            <View style={styles.searchHeader}>
              <TouchableOpacity onPress={() => setSearchMode(null)}>
                <Icon name="arrow-back" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.searchTitle}>
                Select {searchMode === 'origin' ? 'Origin' : 'Destination'} City
              </Text>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search Canadian cities..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
            />

            <FlatList
              data={cities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityOption}
                  onPress={() => selectCity(item)}
                >
                  <Icon name="location-on" size={20} color={colors.text.secondary} />
                  <View style={styles.cityInfo}>
                    <Text style={styles.cityName}>{item.name}</Text>
                    <Text style={styles.cityProvince}>{item.province}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length >= 2 && (
                  <Text style={styles.noResults}>No cities found</Text>
                )
              }
            />
          </SafeAreaView>
        </Modal>
      )}
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Ride Requests</Text>
        <TouchableOpacity 
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Icon name="filter-list" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {filteredRequests.length > 0 && (
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsText}>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      <FlatList
        data={filteredRequests}
        renderItem={renderRequestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>No Ride Requests</Text>
            <Text style={styles.emptySubtitle}>
              {loading ? 'Loading requests...' : 'There are no open ride requests at the moment. Check back later!'}
            </Text>
          </View>
        }
      />

      {renderFilterModal()}
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
  filterButton: {
    padding: spacing.sm,
  },
  resultsSummary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  resultsText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  listContent: {
    padding: spacing.lg,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  provinceText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  urgentText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  requestDetails: {
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
    flex: 1,
  },
  flexibilityText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  description: {
    ...typography.body2,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  timeUntil: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  bidInfo: {
    alignItems: 'flex-end',
  },
  bidCount: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  bidButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  viewBidButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  viewBidButtonText: {
    color: colors.primary,
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
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  clearFiltersText: {
    ...typography.body1,
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    ...typography.body1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  cityInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityInputText: {
    ...typography.body1,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.text.secondary,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  budgetInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body1,
  },
  budgetSeparator: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  sortOptions: {
    gap: spacing.sm,
  },
  sortOption: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedSortOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  sortOptionText: {
    ...typography.body1,
    color: colors.text.primary,
  },
  selectedSortOptionText: {
    color: colors.primary,
    fontWeight: '500',
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    width: '100%',
  },
  // Search modal styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body1,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityInfo: {
    marginLeft: spacing.md,
  },
  cityName: {
    ...typography.body1,
    color: colors.text.primary,
  },
  cityProvince: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  noResults: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});