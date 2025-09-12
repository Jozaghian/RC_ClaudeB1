import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, StyleSheet } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing } from '../utils/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import MyRidesScreen from '../screens/MyRidesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Ride Screens
import RideDetailsScreen from '../screens/RideDetailsScreen';
import CreateRideScreen from '../screens/CreateRideScreen';
import RideRequestScreen from '../screens/RideRequestScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';

// Bidding Screens
import BrowseRequestsScreen from '../screens/BrowseRequestsScreen';
import CreateBidScreen from '../screens/CreateBidScreen';
import MyBidsScreen from '../screens/MyBidsScreen';

// Management Screens
import CreditManagementScreen from '../screens/CreditManagementScreen';
import VehicleManagementScreen from '../screens/VehicleManagementScreen';
import StripePaymentScreen from '../screens/StripePaymentScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpScreen from '../screens/HelpScreen';
import SupportScreen from '../screens/SupportScreen';
import SafetyReportScreen from '../screens/SafetyReportScreen';
import BugReportScreen from '../screens/BugReportScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab icon component
const TabIcon = ({ icon, focused }) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    {icon}
  </Text>
);

// Tab label component
const TabLabel = ({ label, focused }) => (
  <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
    {label}
  </Text>
);

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RideDetails" 
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen 
        name="RideRequest" 
        component={RideRequestScreen}
        options={{ title: 'Request a Ride' }}
      />
      <Stack.Screen 
        name="RequestDetails" 
        component={RequestDetailsScreen}
        options={{ title: 'Request Details' }}
      />
      <Stack.Screen 
        name="BrowseRequests" 
        component={BrowseRequestsScreen}
        options={{ title: 'Browse Requests' }}
      />
      <Stack.Screen 
        name="CreateBid" 
        component={CreateBidScreen}
        options={{ title: 'Place Your Bid' }}
      />
    </Stack.Navigator>
  );
}

// My Rides Stack Navigator
function MyRidesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="MyRidesMain" 
        component={MyRidesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateRide" 
        component={CreateRideScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreditManagement" 
        component={CreditManagementScreen}
        options={{ title: 'Credit Management' }}
      />
      <Stack.Screen 
        name="StripePayment" 
        component={StripePaymentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VehicleManagement" 
        component={VehicleManagementScreen}
        options={{ title: 'My Vehicles' }}
      />
      <Stack.Screen 
        name="RideDetails" 
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen 
        name="RequestDetails" 
        component={RequestDetailsScreen}
        options={{ title: 'Request Details' }}
      />
      <Stack.Screen 
        name="MyBids" 
        component={MyBidsScreen}
        options={{ title: 'My Bids' }}
      />
      <Stack.Screen 
        name="BrowseRequests" 
        component={BrowseRequestsScreen}
        options={{ title: 'Browse Requests' }}
      />
      <Stack.Screen 
        name="CreateBid" 
        component={CreateBidScreen}
        options={{ title: 'Place Your Bid' }}
      />
    </Stack.Navigator>
  );
}

// Calendar Stack Navigator
function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="CalendarMain" 
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateRide" 
        component={CreateRideScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RideRequest" 
        component={RideRequestScreen}
        options={{ title: 'Request a Ride' }}
      />
      <Stack.Screen 
        name="RideDetails" 
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen 
        name="RequestDetails" 
        component={RequestDetailsScreen}
        options={{ title: 'Request Details' }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PhoneVerification" 
        component={PhoneVerificationScreen}
        options={{ title: 'Verify Phone Number' }}
      />
      <Stack.Screen 
        name="CreditManagement" 
        component={CreditManagementScreen}
        options={{ title: 'Credit Management' }}
      />
      <Stack.Screen 
        name="StripePayment" 
        component={StripePaymentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VehicleManagement" 
        component={VehicleManagementScreen}
        options={{ title: 'My Vehicles' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DeleteAccount" 
        component={DeleteAccountScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Support" 
        component={SupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SafetyReport" 
        component={SafetyReportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BugReport" 
        component={BugReportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MyBids" 
        component={MyBidsScreen}
        options={{ title: 'My Bids' }}
      />
      <Stack.Screen 
        name="BrowseRequests" 
        component={BrowseRequestsScreen}
        options={{ title: 'Browse Requests' }}
      />
      <Stack.Screen 
        name="CreateBid" 
        component={CreateBidScreen}
        options={{ title: 'Place Your Bid' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray200,
          borderTopWidth: 1,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
          height: 70,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Home" focused={focused} />
          ),
        }}
      />
      
      <Tab.Screen
        name="FindRides"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔍" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Find Rides" focused={focused} />
          ),
        }}
      />
      
      <Tab.Screen
        name="MyRides"
        component={MyRidesStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🚗" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="My Rides" focused={focused} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📅" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Calendar" focused={focused} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // You could show a loading screen here
    return null;
  }

  return user ? <MainTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textLight,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});