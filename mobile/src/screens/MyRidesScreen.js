import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton, PassengerButton } from '../components/CustomButton';
import RideCard from '../components/RideCard';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { formatDate, formatTime, formatCurrency, getTimeUntilDeparture } from '../utils/helpers';
import apiService from '../services/apiService';

const TABS = {
  DRIVER: 'driver',
  PASSENGER: 'passenger',
  MY_REQUESTS: 'my_requests', // For passengers to manage their requests
  MY_OFFERS: 'my_offers', // For drivers to see their bids (renamed from requests)
};

const DRIVER_FILTERS = [
  { id: 'all', label: 'All', icon: '🚗' },
  { id: 'upcoming', label: 'Upcoming', icon: '⏰' },
  { id: 'completed', label: 'Completed', icon: '✅' },
  { id: 'cancelled', label: 'Cancelled', icon: '❌' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this_week', label: 'This Week', icon: '📊' },
  { id: 'this_month', label: 'This Month', icon: '🗓️' },
];

const PASSENGER_FILTERS = [
  { id: 'all', label: 'All', icon: '🎒' },
  { id: 'upcoming', label: 'Upcoming', icon: '⏰' },
  { id: 'completed', label: 'Completed', icon: '✅' },
  { id: 'cancelled', label: 'Cancelled', icon: '❌' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this_week', label: 'This Week', icon: '📊' },
  { id: 'this_month', label: 'This Month', icon: '🗓️' },
];

const MY_REQUESTS_FILTERS = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'open', label: 'Open', icon: '🔓' },
  { id: 'closed', label: 'Closed', icon: '✅' },
  { id: 'expired', label: 'Expired', icon: '⏰' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this_week', label: 'This Week', icon: '📊' },
  { id: 'this_month', label: 'This Month', icon: '🗓️' },
];

const MY_OFFERS_FILTERS = [
  { id: 'all', label: 'All', icon: '🎯' },
  { id: 'pending', label: 'Pending', icon: '⏳' },
  { id: 'accepted', label: 'Accepted', icon: '✅' },
  { id: 'rejected', label: 'Rejected', icon: '❌' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this_week', label: 'This Week', icon: '📊' },
  { id: 'this_month', label: 'This Month', icon: '🗓️' },
];

export default function MyRidesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(TABS.DRIVER);
  const [activeFilter, setActiveFilter] = useState('all');
  const [driverRides, setDriverRides] = useState([]);
  const [passengerRides, setPassengerRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]); // Passenger's own requests
  const [myOffers, setMyOffers] = useState([]); // Driver's bids
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState({}); // Track which requests have bids expanded

  const { user, isDriver } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadRides();
  }, [activeTab, activeFilter]);

  const loadRides = async () => {
    try {
      setLoading(true);
      
      if (activeTab === TABS.DRIVER) {
        await loadDriverRides();
      } else if (activeTab === TABS.PASSENGER) {
        await loadPassengerRides();
        await loadPassengerRequests();
      } else if (activeTab === TABS.MY_REQUESTS) {
        await loadMyRequests();
      } else if (activeTab === TABS.MY_OFFERS) {
        await loadMyOffers();
      }
    } catch (error) {
      console.error('Load rides error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to apply date filters
  const applyDateFilter = (items, dateField, filter) => {
    if (filter === 'all') return items;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      
      switch (filter) {
        case 'today':
          return itemDate >= today && itemDate < tomorrow;
        case 'this_week':
          return itemDate >= startOfWeek && itemDate < endOfWeek;
        case 'this_month':
          return itemDate >= startOfMonth && itemDate <= endOfMonth;
        case 'upcoming':
          return itemDate > now && (item.status !== 'CANCELLED' && item.status !== 'REJECTED');
        case 'completed':
          return itemDate <= now && (item.status !== 'CANCELLED' && item.status !== 'REJECTED');
        case 'cancelled':
          return item.status === 'CANCELLED';
        default:
          return true;
      }
    });
  };

  // Helper function to sort rides by date (closest first)
  const sortRidesByDate = (rides, dateField = 'departureDateTime') => {
    return rides.sort((a, b) => {
      const dateA = new Date(a[dateField]);
      const dateB = new Date(b[dateField]);
      return dateA - dateB; // Closest date first
    });
  };

  const loadDriverRides = async () => {
    try {
      // Load both posted rides and accepted bids
      const [ridesResponse, bidsResponse] = await Promise.all([
        apiService.get('/rides/driver/my-rides'),
        apiService.get('/bids/driver/my-bids')
      ]);
      
      let rides = [];
      
      // Add regular posted rides
      if (ridesResponse.success) {
        rides = [...rides, ...ridesResponse.data.rides];
      }
      
      // Add accepted bids as "rides"
      if (bidsResponse.success) {
        const acceptedBids = bidsResponse.data.bids.filter(bid => bid.status === 'ACCEPTED');
        
        // Transform accepted bids to look like rides
        const acceptedRides = acceptedBids.map(bid => {
          const request = bid.request;
          return {
            id: `accepted-bid-${bid.id}`,
            type: 'accepted-bid',
            bidId: bid.id,
            originCity: request.originCity,
            destinationCity: request.destinationCity,
            originDetails: request.originDetails,
            destinationDetails: request.destinationDetails,
            departureDateTime: request.preferredDateTime,
            pricePerSeat: bid.priceOffer,
            seatsAvailable: request.passengerCount,
            status: 'CONFIRMED',
            createdAt: bid.updatedAt,
            // Add passenger info
            passenger: request.passenger,
            acceptedBid: bid,
            request: request,
            bookings: [{
              id: `booking-from-bid-${bid.id}`,
              passenger: request.passenger,
              seatsBooked: request.passengerCount,
              status: 'CONFIRMED'
            }]
          };
        });
        
        rides = [...rides, ...acceptedRides];
      }
        
      // Apply filters
      rides = applyDateFilter(rides, 'departureDateTime', activeFilter);
      
      // Sort rides: accepted bids first, then by departure time (closest first)
      rides = rides.sort((a, b) => {
        // Accepted bids go first
        if (a.type === 'accepted-bid' && b.type !== 'accepted-bid') return -1;
        if (b.type === 'accepted-bid' && a.type !== 'accepted-bid') return 1;
        
        // Then by departure time (closest first)
        return new Date(a.departureDateTime) - new Date(b.departureDateTime);
      });
      
      setDriverRides(rides);
    } catch (error) {
      console.error('Load driver rides error:', error);
    }
  };

  const loadPassengerRides = async () => {
    try {
      // Load both bookings and accepted requests
      const [bookingsResponse, requestsResponse] = await Promise.all([
        apiService.get('/bookings/my-bookings'),
        apiService.get('/requests/passenger/my-requests')
      ]);
      
      let rides = [];
      
      // Add regular bookings
      if (bookingsResponse.success) {
        rides = [...rides, ...bookingsResponse.data.bookings];
      }
      
      // Add accepted requests as "bookings"
      if (requestsResponse.success) {
        const acceptedRequests = requestsResponse.data.requests.filter(request => 
          request.bids?.some(bid => bid.status === 'ACCEPTED')
        );
        
        // Transform accepted requests to look like bookings
        const acceptedBookings = acceptedRequests.map(request => {
          const acceptedBid = request.bids.find(bid => bid.status === 'ACCEPTED');
          return {
            id: `request-${request.id}`,
            type: 'accepted-request',
            requestId: request.id,
            seatsBooked: request.passengerCount,
            paymentMethod: 'Credits',
            status: 'CONFIRMED',
            createdAt: acceptedBid.updatedAt,
            ride: {
              id: `ride-from-request-${request.id}`,
              originCity: request.originCity,
              destinationCity: request.destinationCity,
              originDetails: request.originDetails,
              destinationDetails: request.destinationDetails,
              departureDateTime: request.preferredDateTime,
              pricePerSeat: acceptedBid.priceOffer,
              driver: acceptedBid.driver,
              status: 'ACTIVE'
            },
            acceptedBid: acceptedBid
          };
        });
        
        rides = [...rides, ...acceptedBookings];
      }
        
      // Apply filters based on booking status and ride date
      rides = applyDateFilter(rides.map(booking => ({
        ...booking,
        departureDateTime: booking.ride.departureDateTime,
        status: booking.status
      })), 'departureDateTime', activeFilter).map(item => {
        const { departureDateTime, ...booking } = item;
        return booking;
      });
      
      // Sort rides: accepted requests first, then by departure time (closest first)
      rides = rides.sort((a, b) => {
        // Accepted requests go first
        if (a.type === 'accepted-request' && b.type !== 'accepted-request') return -1;
        if (b.type === 'accepted-request' && a.type !== 'accepted-request') return 1;
        
        // Then by departure time (closest first)
        return new Date(a.ride.departureDateTime) - new Date(b.ride.departureDateTime);
      });
      
      setPassengerRides(rides);
    } catch (error) {
      console.error('Load passenger rides error:', error);
    }
  };

  const loadPassengerRequests = async () => {
    try {
      const response = await apiService.get('/requests/passenger/my-requests');
      if (response.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Load requests error:', error);
    }
  };

  const loadMyRequests = async () => {
    try {
      const response = await apiService.get('/requests/passenger/my-requests');
      
      if (response.success) {
        let filteredRequests = response.data.requests;
        
        // Apply status-based filters first
        if (activeFilter === 'open') {
          filteredRequests = filteredRequests.filter(req => req.status === 'OPEN');
        } else if (activeFilter === 'closed') {
          filteredRequests = filteredRequests.filter(req => req.status === 'CLOSED');
        } else if (activeFilter === 'expired') {
          const now = new Date();
          filteredRequests = filteredRequests.filter(req => 
            new Date(req.expiresAt) < now && req.status === 'OPEN'
          );
        } else {
          // Apply date filters for non-status filters
          filteredRequests = applyDateFilter(filteredRequests, 'preferredDateTime', activeFilter);
        }
        
        // Sort requests: accepted bids first, then by preferred date (closest first)
        filteredRequests = filteredRequests.sort((a, b) => {
          const aHasAccepted = a.bids?.some(bid => bid.status === 'ACCEPTED');
          const bHasAccepted = b.bids?.some(bid => bid.status === 'ACCEPTED');
          
          // Accepted requests go to top
          if (aHasAccepted && !bHasAccepted) return -1;
          if (bHasAccepted && !aHasAccepted) return 1;
          
          // Then sort by preferred date (closest first)
          return new Date(a.preferredDateTime) - new Date(b.preferredDateTime);
        });
        
        setMyRequests(filteredRequests);
      }
    } catch (error) {
      console.error('Load my requests error:', error);
    }
  };

  const loadMyOffers = async () => {
    try {
      const response = await apiService.get('/bids/driver/my-bids');
      
      if (response.success) {
        let filteredBids = response.data.bids;
        
        // Apply status-based filters first
        if (activeFilter === 'pending') {
          filteredBids = filteredBids.filter(bid => bid.status === 'PENDING');
        } else if (activeFilter === 'accepted') {
          filteredBids = filteredBids.filter(bid => bid.status === 'ACCEPTED');
        } else if (activeFilter === 'rejected') {
          filteredBids = filteredBids.filter(bid => bid.status === 'REJECTED');
        } else {
          // Apply date filters for non-status filters
          filteredBids = applyDateFilter(filteredBids.map(bid => ({
            ...bid,
            departureDateTime: bid.request.preferredDateTime
          })), 'departureDateTime', activeFilter).map(item => {
            const { departureDateTime, ...bid } = item;
            return bid;
          });
        }
        
        // Sort: accepted bids first, then by request date (closest first)
        filteredBids = filteredBids.sort((a, b) => {
          if (a.status === 'ACCEPTED' && b.status !== 'ACCEPTED') return -1;
          if (b.status === 'ACCEPTED' && a.status !== 'ACCEPTED') return 1;
          // Then by request preferred date (closest first)
          return new Date(a.request.preferredDateTime) - new Date(b.request.preferredDateTime);
        });
        
        setMyOffers(filteredBids);
      }
    } catch (error) {
      console.error('Load my offers error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const handleRidePress = (ride) => {
    navigation.navigate('RideDetails', { ride: activeTab === TABS.DRIVER ? ride : ride.ride });
  };

  const handleRequestPress = (request) => {
    navigation.navigate('RequestDetails', { request });
  };

  const handleEditRequest = (request) => {
    // Check if request has any bids
    if (request.bids && request.bids.length > 0) {
      Alert.alert(
        'Cannot Edit Request',
        'This request already has bids and cannot be edited. You can cancel it and create a new one.'
      );
      return;
    }
    
    navigation.navigate('RideRequest', { 
      editMode: true, 
      requestToEdit: request 
    });
  };

  const handleOfferPress = (bid) => {
    navigation.navigate('RequestDetails', { request: bid.request });
  };

  const toggleRequestBids = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const handleAcceptBid = async (bid, request) => {
    Alert.alert(
      'Accept Bid',
      `Accept ${bid.driver.firstName}'s bid for ${formatCurrency(bid.priceOffer)}?`,
      [
        { text: 'Cancel' },
        { text: 'Accept', onPress: () => confirmAcceptBid(bid, request) }
      ]
    );
  };

  const confirmAcceptBid = async (bid, request) => {
    setGlobalLoading(true);

    try {
      const response = await apiService.patch(`/bids/${bid.id}/accept`);
      
      if (response.success) {
        Alert.alert(
          'Bid Accepted! 🎉',
          `You've accepted ${bid.driver.firstName}'s bid. You can now contact the driver to arrange pickup details.`,
          [
            { text: 'OK', onPress: () => {
              loadRides(); // Refresh the list
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

  const handleRejectBid = async (bid, request) => {
    Alert.alert(
      'Reject Bid',
      `Reject ${bid.driver.firstName}'s bid?`,
      [
        { text: 'Cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => confirmRejectBid(bid, request) }
      ]
    );
  };

  const confirmRejectBid = async (bid, request) => {
    setGlobalLoading(true);

    try {
      const response = await apiService.patch(`/bids/${bid.id}/reject`);
      
      if (response.success) {
        Alert.alert('Bid Rejected', 'The bid has been rejected.');
        loadRides(); // Refresh the list
      }
    } catch (error) {
      console.error('Reject bid error:', error);
      Alert.alert('Error', 'Failed to reject bid.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleCancelRide = async (rideId) => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? This action cannot be undone.',
      [
        { text: 'Keep Ride' },
        { text: 'Cancel Ride', style: 'destructive', onPress: () => confirmCancelRide(rideId) }
      ]
    );
  };

  const confirmCancelRide = async (rideId) => {
    try {
      setGlobalLoading(true);
      const response = await apiService.delete(`/rides/${rideId}`);
      
      if (response.success) {
        Alert.alert('Ride Cancelled', 'Your ride has been cancelled successfully.');
        await loadRides(); // Refresh the list
      }
    } catch (error) {
      console.error('Cancel ride error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel ride.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel your booking?',
      [
        { text: 'Keep Booking' },
        { text: 'Cancel Booking', style: 'destructive', onPress: () => confirmCancelBooking(bookingId) }
      ]
    );
  };

  const confirmCancelBooking = async (bookingId) => {
    try {
      setGlobalLoading(true);
      const response = await apiService.delete(`/bookings/${bookingId}`);
      
      if (response.success) {
        Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
        await loadRides(); // Refresh the list
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const renderDriverRide = ({ item }) => {
    const isAcceptedBid = item.type === 'accepted-bid';
    
    return (
      <View style={[styles.rideItemContainer, isAcceptedBid && styles.acceptedBidRideContainer]}>
        <RideCard
          ride={item}
          onPress={handleRidePress}
          variant="driver"
          userType="driver"
        />
        
        {isAcceptedBid && (
          <View style={styles.acceptedBidBanner}>
            <Text style={styles.acceptedBidBannerText}>🎯 From Accepted Bid Request</Text>
          </View>
        )}
        
        <View style={styles.rideActions}>
          <View style={styles.rideStats}>
            {isAcceptedBid ? (
              <>
                <Text style={styles.rideStatText}>
                  Passenger: {item.passenger.firstName} {item.passenger.lastName}
                </Text>
                <Text style={styles.rideStatText}>
                  ⭐ {item.passenger.passengerRating?.toFixed(1) || 'New'} • {item.seatsAvailable} seat{item.seatsAvailable > 1 ? 's' : ''}
                </Text>
                <Text style={styles.agreedPriceText}>
                  Agreed Price: {formatCurrency(item.pricePerSeat)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.rideStatText}>
                  {item.bookings?.length || 0}/{item.seatsAvailable} seats booked
                </Text>
                <Text style={styles.rideStatText}>
                  {formatCurrency((item.bookings?.length || 0) * item.pricePerSeat)} earned
                </Text>
              </>
            )}
          </View>
          
          <View style={styles.rideButtons}>
            {item.status !== 'CANCELLED' && new Date(item.departureDateTime) > new Date() && (
              <>
                {isAcceptedBid ? (
                  <CustomButton
                    title="Contact Passenger"
                    variant="primary"
                    size="small"
                    onPress={() => {
                      Alert.alert(
                        'Contact Passenger',
                        `Contact ${item.passenger.firstName}?`,
                        [
                          { text: 'Cancel' },
                          { 
                            text: 'Call', 
                            onPress: () => {
                              console.log('Call passenger:', item.passenger.phoneNumber);
                            }
                          },
                          { 
                            text: 'Message', 
                            onPress: () => {
                              navigation.navigate('Chat', { 
                                partnerId: item.passenger.id,
                                partnerName: item.passenger.firstName 
                              });
                            }
                          }
                        ]
                      );
                    }}
                    style={styles.contactPassengerButton}
                  />
                ) : (
                  <CustomButton
                    title="Manage"
                    variant="outline"
                    size="small"
                    onPress={() => navigation.navigate('ManageRide', { ride: item })}
                    style={styles.actionButton}
                  />
                )}
                
                <CustomButton
                  title={isAcceptedBid ? "View Request" : "Cancel"}
                  variant="outline"
                  size="small"
                  onPress={() => {
                    if (isAcceptedBid) {
                      navigation.navigate('RequestDetails', { request: item.request });
                    } else {
                      handleCancelRide(item.id);
                    }
                  }}
                  style={[styles.actionButton, !isAcceptedBid && styles.cancelButton]}
                />
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPassengerRide = ({ item }) => (
    <View style={styles.rideItemContainer}>
      <RideCard
        ride={item.ride}
        onPress={handleRidePress}
        variant="passenger"
        userType="passenger"
        booking={item}
      />
      
      <View style={styles.rideActions}>
        <View style={styles.rideStats}>
          <Text style={styles.rideStatText}>
            {item.seatsBooked} seat{item.seatsBooked > 1 ? 's' : ''} • {item.paymentMethod}
          </Text>
          <Text style={styles.rideStatText}>
            Total: {formatCurrency(item.seatsBooked * item.ride.pricePerSeat)}
          </Text>
        </View>
        
        <View style={styles.rideButtons}>
          {item.status !== 'CANCELLED' && new Date(item.ride.departureDateTime) > new Date() && (
            <CustomButton
              title="Cancel Booking"
              variant="outline"
              size="small"
              onPress={() => handleCancelBooking(item.id)}
              style={[styles.actionButton, styles.cancelButton]}
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderRequest = ({ item }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => handleRequestPress(item)}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestRoute}>
          <Text style={styles.requestCityName}>{item.originCity.name}</Text>
          <Text style={styles.requestArrow}>→</Text>
          <Text style={styles.requestCityName}>{item.destinationCity.name}</Text>
        </View>
        <View style={[
          styles.requestStatusBadge,
          { backgroundColor: getRequestStatusColor(item.status) + '20' }
        ]}>
          <Text style={[
            styles.requestStatusText,
            { color: getRequestStatusColor(item.status) }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.requestDateTime}>
          {formatDate(item.preferredDateTime)} at {formatTime(item.preferredDateTime)}
        </Text>
        <Text style={styles.requestPassengers}>
          {item.passengerCount} passenger{item.passengerCount > 1 ? 's' : ''}
        </Text>
      </View>
      
      <View style={styles.requestFooter}>
        <Text style={styles.requestBids}>
          {item.totalBids || 0} bid{item.totalBids !== 1 ? 's' : ''}
        </Text>
        {item.maxBudget && (
          <Text style={styles.requestBudget}>
            Budget: {formatCurrency(item.maxBudget)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMyRequest = ({ item }) => {
    const isExpired = new Date(item.expiresAt) < new Date() && item.status === 'OPEN';
    const hasUpdatedRecently = new Date() - new Date(item.updatedAt) < 24 * 60 * 60 * 1000; // Updated within 24 hours
    const canEdit = item.status === 'OPEN' && (!item.bids || item.bids.length === 0);
    const isExpanded = expandedRequests[item.id];
    const hasBids = item.bids && item.bids.length > 0;
    const acceptedBid = item.bids?.find(bid => bid.status === 'ACCEPTED');
    const pendingBids = item.bids?.filter(bid => bid.status === 'PENDING') || [];
    const hasAcceptedBid = !!acceptedBid;
    
    return (
      <View style={[styles.myRequestCard, hasUpdatedRecently && styles.updatedRequestCard, isExpired && styles.expiredRequestCard]}>
        {/* Main Request Card */}
        <TouchableOpacity onPress={() => handleRequestPress(item)}>
          <View style={styles.requestCardHeader}>
            <View style={styles.routeContainer}>
              <Text style={styles.routeText}>
                {item.originCity.name} → {item.destinationCity.name}
              </Text>
              <Text style={styles.routeSubtext}>
                {item.originCity.province} → {item.destinationCity.province}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getRequestStatusColor(item.status, isExpired) + '20' }]}>
              <Text style={[styles.statusText, { color: getRequestStatusColor(item.status, isExpired) }]}>
                {isExpired ? 'Expired' : item.status}
              </Text>
            </View>
          </View>

          <View style={styles.requestCardDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>
                {formatDate(item.preferredDateTime)} at {formatTime(item.preferredDateTime)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailText}>
                {item.passengerCount} passenger{item.passengerCount > 1 ? 's' : ''}
              </Text>
            </View>

            {(item.minBudget || item.maxBudget) && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💰</Text>
                <Text style={styles.detailText}>
                  {item.minBudget ? formatCurrency(item.minBudget) : '$0'} - {item.maxBudget ? formatCurrency(item.maxBudget) : 'Open'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Bids Button & Actions Row */}
        <View style={styles.requestActionsRow}>
          <View style={styles.requestStatusContainer}>
            <Text style={styles.requestStatus}>
              {item.status === 'OPEN' ? (isExpired ? 'Expired' : `${getTimeUntilDeparture(item.expiresAt)} to expire`) : item.status}
            </Text>
          </View>

          <View style={styles.requestButtons}>
            {hasAcceptedBid ? (
              <TouchableOpacity
                style={[styles.acceptedBidButton, isExpanded && styles.acceptedBidButtonExpanded]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleRequestBids(item.id);
                }}
              >
                <Text style={styles.acceptedBidButtonText}>
                  ✅ Driver Assigned
                </Text>
                <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
                  ▼
                </Text>
              </TouchableOpacity>
            ) : hasBids ? (
              <TouchableOpacity
                style={[styles.bidsButton, isExpanded && styles.bidsButtonExpanded]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleRequestBids(item.id);
                }}
              >
                <Text style={styles.bidsButtonText}>
                  {pendingBids.length} Pending Bid{pendingBids.length !== 1 ? 's' : ''}
                </Text>
                <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
                  ▼
                </Text>
              </TouchableOpacity>
            ) : null}

            {canEdit && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditRequest(item);
                }}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Expandable Content */}
        {isExpanded && hasBids && (
          <View style={styles.bidsContainer}>
            {hasAcceptedBid ? (
              // Show accepted driver details
              <View>
                <View style={styles.bidsHeader}>
                  <Text style={styles.bidsHeaderText}>🎉 Your Driver</Text>
                </View>
                <View style={[styles.bidItem, styles.acceptedDriverCard]}>
                  <View style={styles.bidHeader}>
                    <View style={styles.driverInfo}>
                      <View style={styles.driverDetails}>
                        <Text style={styles.driverName}>
                          {acceptedBid.driver.firstName} {acceptedBid.driver.lastName}
                        </Text>
                        <Text style={styles.driverRating}>
                          ⭐ {acceptedBid.driver.driverRating?.toFixed(1) || 'New'} • {acceptedBid.driver.totalTripsAsDriver || 0} trips
                        </Text>
                        <Text style={styles.driverPhone}>
                          📞 {acceptedBid.driver.phoneNumber || 'Contact via app'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bidPrice}>
                      <Text style={styles.agreedPrice}>{formatCurrency(acceptedBid.priceOffer)}</Text>
                      <Text style={styles.agreedPriceLabel}>Agreed Price</Text>
                    </View>
                  </View>

                  {/* Vehicle Information */}
                  {acceptedBid.driver.vehicles && acceptedBid.driver.vehicles.length > 0 && (
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleTitle}>🚗 Vehicle Details</Text>
                      <Text style={styles.vehicleDetails}>
                        {acceptedBid.driver.vehicles[0].year} {acceptedBid.driver.vehicles[0].make} {acceptedBid.driver.vehicles[0].model}
                      </Text>
                      <Text style={styles.vehicleColor}>
                        {acceptedBid.driver.vehicles[0].color} • {acceptedBid.driver.vehicles[0].licensePlate}
                      </Text>
                    </View>
                  )}

                  {acceptedBid.message && (
                    <Text style={styles.bidMessageText}>
                      "{acceptedBid.message}"
                    </Text>
                  )}

                  <View style={styles.driverActions}>
                    <TouchableOpacity
                      style={styles.contactDriverButton}
                      onPress={() => {
                        Alert.alert(
                          'Contact Driver',
                          `Contact ${acceptedBid.driver.firstName}?`,
                          [
                            { text: 'Cancel' },
                            { 
                              text: 'Call', 
                              onPress: () => {
                                // Implement call functionality
                                console.log('Call driver:', acceptedBid.driver.phoneNumber);
                              }
                            },
                            { 
                              text: 'Message', 
                              onPress: () => {
                                navigation.navigate('Chat', { 
                                  partnerId: acceptedBid.driver.id,
                                  partnerName: acceptedBid.driver.firstName 
                                });
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.contactDriverText}>Contact Driver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              // Show pending bids for selection
              <View>
                <View style={styles.bidsHeader}>
                  <Text style={styles.bidsHeaderText}>Pending Bids ({pendingBids.length})</Text>
                </View>
                {pendingBids.map((bid, index) => (
                  <View key={bid.id} style={[styles.bidItem, index === pendingBids.length - 1 && styles.lastBidItem]}>
                    <View style={styles.bidHeader}>
                      <View style={styles.driverInfo}>
                        <View style={styles.driverDetails}>
                          <Text style={styles.driverName}>
                            {bid.driver.firstName} {bid.driver.lastName}
                          </Text>
                          <Text style={styles.driverRating}>
                            ⭐ {bid.driver.driverRating?.toFixed(1) || 'New'} • {bid.driver.totalTripsAsDriver || 0} trips
                          </Text>
                        </View>
                      </View>
                      <View style={styles.bidPrice}>
                        <Text style={styles.bidPriceAmount}>{formatCurrency(bid.priceOffer)}</Text>
                        <View style={[styles.bidStatusBadge, { backgroundColor: getBidStatusColor(bid.status) + '20' }]}>
                          <Text style={[styles.bidStatusText, { color: getBidStatusColor(bid.status) }]}>
                            {bid.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {bid.message && (
                      <Text style={styles.bidMessageText} numberOfLines={2}>
                        "{bid.message}"
                      </Text>
                    )}

                    <View style={styles.bidFooter}>
                      <Text style={styles.bidTime}>
                        Submitted {getTimeUntilDeparture(bid.createdAt)}
                      </Text>

                      {bid.status === 'PENDING' && item.status === 'OPEN' && (
                        <View style={styles.bidActions}>
                          <TouchableOpacity
                            style={styles.rejectBidButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleRejectBid(bid, item);
                            }}
                          >
                            <Text style={styles.rejectBidText}>Reject</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.acceptBidButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAcceptBid(bid, item);
                            }}
                          >
                            <Text style={styles.acceptBidText}>Accept</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderMyOffer = ({ item: bid }) => {
    const isAccepted = bid.status === 'ACCEPTED';
    const isUpdated = new Date() - new Date(bid.request.updatedAt) < 24 * 60 * 60 * 1000; // Request updated within 24 hours
    
    return (
      <TouchableOpacity
        style={[styles.myOfferCard, isAccepted && styles.acceptedOfferCard, isUpdated && styles.updatedOfferCard]}
        onPress={() => handleOfferPress(bid)}
      >
        <View style={styles.offerCardHeader}>
          <View style={styles.routeContainer}>
            <Text style={styles.routeText}>
              {bid.request.originCity.name} → {bid.request.destinationCity.name}
            </Text>
            <Text style={styles.routeSubtext}>
              {bid.request.originCity.province} → {bid.request.destinationCity.province}
            </Text>
          </View>
          <View style={styles.offerAmount}>
            <Text style={styles.offerPrice}>{formatCurrency(bid.priceOffer)}</Text>
            <View style={[styles.bidStatusBadge, { backgroundColor: getBidStatusColor(bid.status) + '20' }]}>
              <Text style={[styles.bidStatusText, { color: getBidStatusColor(bid.status) }]}>
                {bid.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.offerCardDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              {formatDate(bid.request.preferredDateTime)} at {formatTime(bid.request.preferredDateTime)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>👤</Text>
            <Text style={styles.detailText}>
              {bid.request.passenger.firstName} • ⭐ {bid.request.passenger.passengerRating?.toFixed(1) || 'New'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🕐</Text>
            <Text style={styles.detailText}>
              Bid placed {getTimeUntilDeparture(bid.createdAt)}
            </Text>
          </View>
        </View>

        {bid.message && (
          <Text style={styles.bidMessage} numberOfLines={2}>
            "{bid.message}"
          </Text>
        )}

        <View style={styles.offerCardFooter}>
          <Text style={styles.offerStatus}>
            {isAccepted ? '🎉 Accepted - Contact passenger' : `${bid.status} • ${getTimeUntilDeparture(bid.request.preferredDateTime)}`}
          </Text>
          {isUpdated && (
            <View style={styles.updatedBadge}>
              <Text style={styles.updatedText}>Updated</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getRequestStatusColor = (status, isExpired = false) => {
    if (isExpired) return colors.textSecondary;
    switch (status) {
      case 'OPEN': return colors.success;
      case 'CLOSED': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'ACCEPTED': return colors.success;
      case 'REJECTED': return colors.danger;
      default: return colors.textSecondary;
    }
  };


  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterButton,
        activeFilter === filter.id && styles.filterButtonActive
      ]}
      onPress={() => setActiveFilter(filter.id)}
    >
      <Text style={styles.filterIcon}>{filter.icon}</Text>
      <Text style={[
        styles.filterText,
        activeFilter === filter.id && styles.filterTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>
        {activeTab === TABS.DRIVER ? '🚗' : '🎒'}
      </Text>
      <Text style={styles.emptyStateTitle}>
        {activeTab === TABS.DRIVER ? 'No rides posted' : 'No rides booked'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {activeTab === TABS.DRIVER 
          ? 'Start by posting your first ride to earn credits and help other travelers.'
          : 'Browse available rides or post a ride request to find your next trip.'
        }
      </Text>
      <CustomButton
        title={activeTab === TABS.DRIVER ? 'Post New Ride' : 'Find Rides'}
        onPress={() => {
          if (activeTab === TABS.DRIVER) {
            navigation.navigate('CreateRide');
          } else {
            navigation.navigate('Home');
          }
        }}
        style={styles.roleButton}
      />
    </View>
  );

  const currentRides = activeTab === TABS.DRIVER ? driverRides : passengerRides;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rides</Text>
        
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === TABS.DRIVER && styles.tabButtonActive
            ]}
            onPress={() => {
              setActiveTab(TABS.DRIVER);
              setActiveFilter('all');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === TABS.DRIVER && styles.tabTextActive
            ]}>
              Driver
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === TABS.PASSENGER && styles.tabButtonActive
            ]}
            onPress={() => {
              setActiveTab(TABS.PASSENGER);
              setActiveFilter('all');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === TABS.PASSENGER && styles.tabTextActive
            ]}>
              Passenger
            </Text>
          </TouchableOpacity>

          {/* My Requests tab for passengers */}
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === TABS.MY_REQUESTS && styles.tabButtonActive
            ]}
            onPress={() => {
              setActiveTab(TABS.MY_REQUESTS);
              setActiveFilter('all');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === TABS.MY_REQUESTS && styles.tabTextActive
            ]}>
              My Requests
            </Text>
          </TouchableOpacity>

          {/* My Offers tab for drivers */}
          {isDriver() && (
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === TABS.MY_OFFERS && styles.tabButtonActive
              ]}
              onPress={() => {
                setActiveTab(TABS.MY_OFFERS);
                setActiveFilter('all');
              }}
            >
              <Text style={[
                styles.tabText,
                activeTab === TABS.MY_OFFERS && styles.tabTextActive
              ]}>
                My Offers
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {(activeTab === TABS.DRIVER ? DRIVER_FILTERS : 
            activeTab === TABS.PASSENGER ? PASSENGER_FILTERS :
            activeTab === TABS.MY_REQUESTS ? MY_REQUESTS_FILTERS :
            MY_OFFERS_FILTERS).map(renderFilterButton)}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {activeTab === TABS.DRIVER ? (
            <>
              <DriverButton
                title="Post New Ride"
                onPress={() => navigation.navigate('CreateRide')}
                fullWidth
                style={styles.roleButton}
              />
              <View style={styles.driverBiddingActions}>
                <DriverButton
                  title="Browse Requests"
                  onPress={() => navigation.navigate('BrowseRequests')}
                  style={styles.actionButton}
                />
                <DriverButton
                  title="My Bids"
                  onPress={() => navigation.navigate('MyBids')}
                  style={styles.actionButton}
                />
              </View>
            </>
          ) : activeTab === TABS.PASSENGER ? (
            <View style={styles.passengerActions}>
              <PassengerButton
                title="Find Rides"
                onPress={() => navigation.navigate('Home')}
                style={styles.actionButton}
              />
              <CustomButton
                title="Request Ride"
                variant="outline"
                onPress={() => navigation.navigate('RideRequest')}
                style={styles.actionButton}
              />
            </View>
          ) : (
            // My Requests tab actions  
            activeTab === TABS.MY_REQUESTS ? (
              <View style={styles.requestsActions}>
                <CustomButton
                  title="Create New Request"
                  variant="passenger"
                  onPress={() => navigation.navigate('RideRequest')}
                  style={styles.actionButton}
                />
                <CustomButton
                  title="Browse Rides"
                  variant="outline"
                  onPress={() => navigation.navigate('Home')}
                  style={styles.actionButton}
                />
              </View>
            ) : (
              // My Offers tab actions
              <View style={styles.requestsActions}>
                <DriverButton
                  title="Browse Requests"
                  onPress={() => navigation.navigate('BrowseRequests')}
                  style={styles.actionButton}
                />
                <DriverButton
                  title="Post New Ride"
                  onPress={() => navigation.navigate('CreateRide')}
                  style={styles.actionButton}
                />
              </View>
            )
          )}
        </View>

        {/* Content Based on Active Tab */}
        {activeTab === TABS.MY_REQUESTS ? (
          // My Requests for Passengers
          myRequests.length > 0 ? (
            <View style={styles.requestsSection}>
              <Text style={styles.sectionTitle}>📋 My Ride Requests</Text>
              <FlatList
                data={myRequests}
                renderItem={renderMyRequest}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.ridesContainer}
              />
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading your requests...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateTitle}>No Requests Yet</Text>
              <Text style={styles.emptyStateMessage}>
                You haven't posted any ride requests yet. Create your first request to find drivers!
              </Text>
              <CustomButton
                title="Create Request"
                onPress={() => navigation.navigate('RideRequest')}
                style={styles.roleButton}
              />
            </View>
          )
        ) : activeTab === TABS.MY_OFFERS ? (
          // My Offers for Drivers
          myOffers.length > 0 ? (
            <View style={styles.requestsSection}>
              <Text style={styles.sectionTitle}>🎯 My Bids & Offers</Text>
              <FlatList
                data={myOffers}
                renderItem={renderMyOffer}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.ridesContainer}
              />
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading your bids...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateTitle}>No Bids Submitted</Text>
              <Text style={styles.emptyStateMessage}>
                You haven't submitted any bids yet. Browse ride requests to find opportunities!
              </Text>
              <CustomButton
                title="Browse Requests"
                onPress={() => navigation.navigate('BrowseRequests')}
                style={styles.roleButton}
              />
            </View>
          )
        ) : (
          // Driver/Passenger Rides List
          <>
            {currentRides.length > 0 ? (
              <FlatList
                data={currentRides}
                renderItem={activeTab === TABS.DRIVER ? renderDriverRide : renderPassengerRide}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.ridesContainer}
              />
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
              </View>
            ) : (
              renderEmptyState()
            )}

            {/* Passenger Requests Section */}
            {activeTab === TABS.PASSENGER && requests.length > 0 && (
              <View style={styles.requestsSection}>
                <Text style={styles.sectionTitle}>🎯 My Ride Requests</Text>
                <FlatList
                  data={requests}
                  renderItem={renderRequest}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </>
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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  tabTextActive: {
    color: colors.primary,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  filtersContent: {
    paddingHorizontal: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  filterTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  quickActionsContainer: {
    padding: spacing.md,
  },
  passengerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  driverBiddingActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 55,
  },
  driverButton: {
    marginBottom: spacing.md,
    height: 55,
  },
  roleButton: {
    marginBottom: spacing.md,
    height: 55,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  outlineButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  ridesContainer: {
    paddingHorizontal: spacing.md,
  },
  rideItemContainer: {
    marginBottom: spacing.md,
  },
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  rideStats: {
    flex: 1,
  },
  rideStatText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  rideButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    borderColor: colors.danger,
  },
  requestsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  requestItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestCityName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  requestArrow: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  requestStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  requestStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  requestDetails: {
    marginBottom: spacing.sm,
  },
  requestDateTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  requestPassengers: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestBids: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  requestBudget: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    minWidth: 150,
  },
  // New styles for requests tab and request/offer cards
  requestsActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  myRequestCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  updatedRequestCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  expiredRequestCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.textSecondary,
  },
  myOfferCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  acceptedOfferCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  updatedOfferCard: {
    borderRightWidth: 4,
    borderRightColor: colors.warning,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  editButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  offerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  offerAmount: {
    alignItems: 'flex-end',
  },
  offerPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  offerCardDetails: {
    marginBottom: spacing.md,
  },
  offerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  bidMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.3,
  },
  requestStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  updatedBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  updatedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  // Expandable bids styles
  requestActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  requestStatusContainer: {
    flex: 1,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bidsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  bidsButtonExpanded: {
    backgroundColor: colors.secondary,
  },
  bidsButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.white,
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  bidsContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  bidsHeader: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bidsHeaderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  bidItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  lastBidItem: {
    borderBottomWidth: 0,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  driverInfo: {
    flex: 1,
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
  driverRating: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bidPrice: {
    alignItems: 'flex-end',
  },
  bidPriceAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  bidMessageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray300,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  bidActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectBidButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rejectBidText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.danger,
  },
  acceptBidButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  acceptBidText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  // Accepted bid/driver styles
  acceptedBidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  acceptedBidButtonExpanded: {
    backgroundColor: colors.success + 'CC', // Slightly transparent
  },
  acceptedBidButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  acceptedDriverCard: {
    backgroundColor: colors.success + '05', // Very light green background
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  driverPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  agreedPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    textAlign: 'right',
  },
  agreedPriceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  vehicleInfo: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  vehicleTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  vehicleDetails: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vehicleColor: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  driverActions: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  contactDriverButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 150,
  },
  contactDriverText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textAlign: 'center',
  },
  // Accepted bid ride styles (for Driver tab)
  acceptedBidRideContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    backgroundColor: colors.success + '05', // Very light success background
  },
  acceptedBidBanner: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: -spacing.xs,
    borderRadius: borderRadius.sm,
  },
  acceptedBidBannerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textAlign: 'center',
  },
  agreedPriceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  contactPassengerButton: {
    backgroundColor: colors.primary,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  routeContainer: {
    flex: 1,
  },
  routeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  routeSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bidStatusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  bidStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  urgentBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  urgentText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  requestCardDetails: {
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    width: 20,
    textAlign: 'center',
  },
  detailText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    flex: 1,
  },
  requestDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.3,
  },
  requestCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  bidPrompt: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});