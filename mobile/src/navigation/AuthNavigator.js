import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import RideDetailsScreen from '../screens/RideDetailsScreen';
import RideRequestScreen from '../screens/RideRequestScreen';
import CreateRideScreen from '../screens/CreateRideScreen';
import MyRidesScreen from '../screens/MyRidesScreen';
import VehicleManagementScreen from '../screens/VehicleManagementScreen';
import { colors } from '../utils/theme';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BrowseRides" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RideDetails" 
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
      <Stack.Screen 
        name="RequestRide" 
        component={RideRequestScreen}
        options={{ title: 'Request a Ride' }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Join Ride Club' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ title: 'Reset Password' }}
      />
      <Stack.Screen 
        name="PhoneVerification" 
        component={PhoneVerificationScreen}
        options={{ title: 'Verify Phone Number' }}
      />
      <Stack.Screen 
        name="CreateRide" 
        component={CreateRideScreen}
        options={{ title: 'Create Your First Ride' }}
      />
      <Stack.Screen 
        name="VehicleManagement" 
        component={VehicleManagementScreen}
        options={{ title: 'Add Your Vehicle' }}
      />
      <Stack.Screen 
        name="MyRides" 
        component={MyRidesScreen}
        options={{ title: 'My Rides' }}
      />
    </Stack.Navigator>
  );
}