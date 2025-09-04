import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.expoPushToken = null;
  }

  // Initialize notification service
  async initialize() {
    try {
      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Register for push notifications
      const token = await this.registerForPushNotifications();
      if (token) {
        this.expoPushToken = token;
        // Send token to backend
        await this.updatePushToken(token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Register for push notifications
  async registerForPushNotifications() {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the Expo push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', token);

      // Configure push notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C8102E',
        });

        // Create ride notifications channel
        await Notifications.setNotificationChannelAsync('ride-notifications', {
          name: 'Ride Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C8102E',
          description: 'Notifications for ride bookings, cancellations, and updates',
        });

        // Create message notifications channel
        await Notifications.setNotificationChannelAsync('message-notifications', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#C8102E',
          description: 'New messages from other users',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Set up notification event listeners
  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification received while app is in foreground
  handleNotificationReceived(notification) {
    const { data } = notification.request.content;
    
    // Update badge count
    this.updateBadgeCount();
    
    // Handle different notification types
    switch (data?.type) {
      case 'ride_booked':
        // Update ride bookings in app state
        break;
      case 'ride_cancelled':
        // Update ride status in app state
        break;
      case 'new_message':
        // Update message count in app state
        break;
      case 'new_bid':
        // Update bid notifications
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  }

  // Handle notification tap/response
  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'ride_booked':
      case 'ride_cancelled':
        if (data.rideId) {
          // Navigate to ride details
          this.navigateToRide(data.rideId);
        }
        break;
      case 'new_message':
        if (data.conversationId) {
          // Navigate to conversation
          this.navigateToConversation(data.conversationId);
        }
        break;
      case 'new_bid':
        if (data.requestId) {
          // Navigate to request details
          this.navigateToRequest(data.requestId);
        }
        break;
      default:
        // Navigate to home screen
        this.navigateToHome();
    }
  }

  // Send push token to backend
  async updatePushToken(token) {
    try {
      await apiService.post('/users/update-push-token', {
        pushToken: token,
        platform: Platform.OS
      });
      console.log('Push token updated on server');
    } catch (error) {
      console.error('Failed to update push token on server:', error);
    }
  }

  // Send local notification
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  // Update app badge count
  async updateBadgeCount() {
    try {
      // Get unread message count from API
      const response = await apiService.get('/messages/unread-count');
      const badgeCount = response.data.unreadCount || 0;
      
      await Notifications.setBadgeCountAsync(badgeCount);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  // Clear badge count
  async clearBadgeCount() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge count:', error);
    }
  }

  // Schedule ride reminder notification
  async scheduleRideReminder(ride, reminderMinutes = 60) {
    try {
      const rideDateTime = new Date(`${ride.departureDate}T${ride.departureTime}`);
      const reminderTime = new Date(rideDateTime.getTime() - (reminderMinutes * 60 * 1000));
      
      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚗 Ride Reminder',
          body: `Your ride from ${ride.origin} to ${ride.destination} is in ${reminderMinutes} minutes!`,
          data: {
            type: 'ride_reminder',
            rideId: ride.id
          },
          sound: 'default',
        },
        trigger: {
          date: reminderTime,
        },
      });

      console.log('Ride reminder scheduled for:', reminderTime);
    } catch (error) {
      console.error('Failed to schedule ride reminder:', error);
    }
  }

  // Cancel scheduled notification
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  // Navigation helpers (to be implemented with navigation service)
  navigateToRide(rideId) {
    // This would use your navigation service to navigate to ride details
    console.log('Navigate to ride:', rideId);
  }

  navigateToConversation(conversationId) {
    // This would use your navigation service to navigate to conversation
    console.log('Navigate to conversation:', conversationId);
  }

  navigateToRequest(requestId) {
    // This would use your navigation service to navigate to request details
    console.log('Navigate to request:', requestId);
  }

  navigateToHome() {
    // This would use your navigation service to navigate to home
    console.log('Navigate to home');
  }

  // Cleanup listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationService = new NotificationService();