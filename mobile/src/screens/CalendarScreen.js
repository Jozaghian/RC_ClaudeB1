import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton, PassengerButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { formatDate, formatTime, formatCurrency, getTimeUntilDeparture } from '../utils/helpers';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - (spacing.lg * 2);
const DAY_CELL_SIZE = CALENDAR_WIDTH / 7;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen({ navigation }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarData, setCalendarData] = useState({});
  const [dayDetails, setDayDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user, isDriver } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Get start and end of month for API optimization
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Load all ride-related data
      const [driverRidesRes, passengerRidesRes, requestsRes, bidsRes] = await Promise.all([
        apiService.get('/rides/driver/my-rides'),
        apiService.get('/bookings/my-bookings'),
        apiService.get('/requests/passenger/my-requests'),
        apiService.get('/bids/driver/my-bids')
      ]);

      // Process and organize data by date
      const dataByDate = {};

      // Process driver rides
      if (driverRidesRes.success) {
        driverRidesRes.data.rides.forEach(ride => {
          const dateKey = new Date(ride.departureDateTime).toDateString();
          if (!dataByDate[dateKey]) dataByDate[dateKey] = [];
          dataByDate[dateKey].push({
            ...ride,
            type: 'driver-ride',
            color: colors.primary,
            icon: '🚗',
            title: `${ride.originCity.name} → ${ride.destinationCity.name}`,
            subtitle: `${formatTime(ride.departureDateTime)} • ${ride.seatsAvailable} seats`,
            time: ride.departureDateTime
          });
        });
      }

      // Process passenger bookings
      if (passengerRidesRes.success) {
        passengerRidesRes.data.bookings.forEach(booking => {
          const dateKey = new Date(booking.ride.departureDateTime).toDateString();
          if (!dataByDate[dateKey]) dataByDate[dateKey] = [];
          dataByDate[dateKey].push({
            ...booking,
            type: 'passenger-booking',
            color: colors.success,
            icon: '🎒',
            title: `${booking.ride.originCity.name} → ${booking.ride.destinationCity.name}`,
            subtitle: `${formatTime(booking.ride.departureDateTime)} • ${booking.seatsBooked} seats`,
            time: booking.ride.departureDateTime
          });
        });
      }

      // Process requests
      if (requestsRes.success) {
        requestsRes.data.requests.forEach(request => {
          const dateKey = new Date(request.preferredDateTime).toDateString();
          if (!dataByDate[dateKey]) dataByDate[dateKey] = [];
          
          const hasAcceptedBid = request.bids?.some(bid => bid.status === 'ACCEPTED');
          dataByDate[dateKey].push({
            ...request,
            type: 'request',
            color: hasAcceptedBid ? colors.success : colors.warning,
            icon: hasAcceptedBid ? '✅' : '📋',
            title: `Request: ${request.originCity.name} → ${request.destinationCity.name}`,
            subtitle: `${formatTime(request.preferredDateTime)} • ${request.passengerCount} passengers`,
            time: request.preferredDateTime,
            hasAcceptedBid
          });
        });
      }

      // Process bids
      if (bidsRes.success) {
        bidsRes.data.bids.forEach(bid => {
          const dateKey = new Date(bid.request.preferredDateTime).toDateString();
          if (!dataByDate[dateKey]) dataByDate[dateKey] = [];
          
          // Only add if not already shown as a request (to avoid duplicates)
          const hasRequest = dataByDate[dateKey].some(item => 
            item.type === 'request' && item.id === bid.request.id
          );
          
          if (!hasRequest) {
            dataByDate[dateKey].push({
              ...bid,
              type: 'bid',
              color: bid.status === 'ACCEPTED' ? colors.success : 
                     bid.status === 'REJECTED' ? colors.error : colors.warning,
              icon: bid.status === 'ACCEPTED' ? '🎯' : bid.status === 'REJECTED' ? '❌' : '⏳',
              title: `Bid: ${bid.request.originCity.name} → ${bid.request.destinationCity.name}`,
              subtitle: `${formatTime(bid.request.preferredDateTime)} • ${formatCurrency(bid.priceOffer)}`,
              time: bid.request.preferredDateTime
            });
          }
        });
      }

      // Sort items by time for each date
      Object.keys(dataByDate).forEach(dateKey => {
        dataByDate[dateKey].sort((a, b) => new Date(a.time) - new Date(b.time));
      });

      setCalendarData(dataByDate);
    } catch (error) {
      console.error('Load calendar data error:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalendarData();
    setRefreshing(false);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setDayDetails([]);
  };

  const selectDate = (date) => {
    const dateKey = date.toDateString();
    const dayData = calendarData[dateKey] || [];
    
    setSelectedDate(date);
    setDayDetails(dayData);
  };

  const handleQuickAction = (date) => {
    Alert.alert(
      'Quick Action',
      `Create ride for ${formatDate(date)}`,
      [
        { text: 'Cancel' },
        { 
          text: '🚗 Offer Ride', 
          onPress: () => navigation.navigate('CreateRide', { selectedDate: date })
        },
        { 
          text: '🎒 Request Ride', 
          onPress: () => navigation.navigate('RideRequest', { selectedDate: date })
        }
      ]
    );
  };

  const handleItemPress = (item) => {
    switch (item.type) {
      case 'driver-ride':
        navigation.navigate('RideDetails', { ride: item });
        break;
      case 'passenger-booking':
        navigation.navigate('RideDetails', { ride: item.ride, booking: item });
        break;
      case 'request':
        navigation.navigate('RequestDetails', { request: item });
        break;
      case 'bid':
        navigation.navigate('RequestDetails', { request: item.request });
        break;
    }
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigateMonth(-1)}
      >
        <Icon name="chevron-left" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.monthYear}>
        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
      </Text>
      
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigateMonth(1)}
      >
        <Icon name="chevron-right" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderDayHeaders = () => (
    <View style={styles.dayHeadersRow}>
      {DAYS_OF_WEEK.map((day) => (
        <View key={day} style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{day}</Text>
        </View>
      ))}
    </View>
  );

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const today = new Date();
    const todayDateString = today.toDateString();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell}>
          <View style={styles.emptyDay} />
        </View>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toDateString();
      const dayData = calendarData[dateKey] || [];
      const isToday = dateKey === todayDateString;
      const isSelected = selectedDate && dateKey === selectedDate.toDateString();
      const hasEvents = dayData.length > 0;
      
      days.push(
        <TouchableOpacity
          key={day}
          style={styles.dayCell}
          onPress={() => hasEvents ? selectDate(date) : handleQuickAction(date)}
        >
          <View style={[
            styles.dayContent,
            isToday && styles.todayContent,
            isSelected && styles.selectedContent
          ]}>
            <Text style={[
              styles.dayText,
              isToday && styles.todayText,
              isSelected && styles.selectedText
            ]}>
              {day}
            </Text>
            
            {/* Event indicators */}
            {hasEvents && (
              <View style={styles.eventIndicators}>
                {dayData.slice(0, 3).map((item, index) => (
                  <View
                    key={index}
                    style={[styles.eventDot, { backgroundColor: item.color }]}
                  />
                ))}
                {dayData.length > 3 && (
                  <Text style={styles.moreIndicator}>+{dayData.length - 3}</Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }
    
    // Render calendar grid
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(
        <View key={i} style={styles.weekRow}>
          {days.slice(i, i + 7)}
        </View>
      );
    }
    
    return weeks;
  };

  const renderDayDetails = () => {
    if (!selectedDate || dayDetails.length === 0) return null;

    return (
      <View style={styles.dayDetailsContainer}>
        <View style={styles.dayDetailsHeader}>
          <Text style={styles.dayDetailsTitle}>
            {formatDate(selectedDate)}
          </Text>
          <TouchableOpacity
            style={styles.closeDetailsButton}
            onPress={() => {
              setSelectedDate(null);
              setDayDetails([]);
            }}
          >
            <Icon name="close" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.dayDetailsContent}>
          {dayDetails.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dayDetailItem}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={[styles.itemIndicator, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.addEventButton}
          onPress={() => handleQuickAction(selectedDate)}
        >
          <Icon name="add" size={20} color={colors.white} />
          <Text style={styles.addEventText}>Add Ride</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Legend</Text>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>🚗 Driver</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>🎒 Passenger</Text>
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>📋 Request</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>⏳ Bid</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride Calendar</Text>
        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => {
            setCurrentDate(new Date());
            setSelectedDate(null);
            setDayDetails([]);
          }}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {renderCalendarHeader()}
          {renderDayHeaders()}
          <View style={styles.calendarGrid}>
            {renderCalendarDays()}
          </View>
        </View>

        {/* Legend */}
        {renderLegend()}

        {/* Day Details */}
        {renderDayDetails()}
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
  todayButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  todayButtonText: {
    ...typography.body2,
    color: colors.surface,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navButton: {
    padding: spacing.sm,
  },
  monthYear: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  dayHeadersRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayHeader: {
    width: DAY_CELL_SIZE,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dayHeaderText: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  calendarGrid: {
    paddingBottom: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    padding: 2,
  },
  emptyDay: {
    flex: 1,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  todayContent: {
    backgroundColor: colors.primary + '20',
  },
  selectedContent: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  todayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.surface,
    fontWeight: '600',
  },
  eventIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: DAY_CELL_SIZE - 8,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    margin: 1,
  },
  moreIndicator: {
    fontSize: 8,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  legendContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  dayDetailsContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    elevation: 3,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayDetailsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  closeDetailsButton: {
    padding: spacing.sm,
  },
  dayDetailsContent: {
    maxHeight: 200,
  },
  dayDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  itemIndicator: {
    width: 4,
    height: 30,
    borderRadius: 2,
    marginLeft: spacing.sm,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    margin: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  addEventText: {
    ...typography.body1,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});