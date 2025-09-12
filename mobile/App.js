import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoadingProvider } from './src/contexts/LoadingContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import SplashScreen from './src/screens/SplashScreen';
import { theme } from './src/utils/theme';

function AppContent() {
  const { user, loading, checkAuthState } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={theme.navigation}>
      <StatusBar style="auto" />
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme.paper}>
      <AuthProvider>
        <LoadingProvider>
          <View style={styles.container}>
            <AppContent />
          </View>
        </LoadingProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});