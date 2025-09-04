import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout Components
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Main Pages
import HomePage from './pages/HomePage';
import FindRidesPage from './pages/rides/FindRidesPage';
import MyRidesPage from './pages/rides/MyRidesPage';
import CreateRidePage from './pages/rides/CreateRidePage';
import RideDetailsPage from './pages/rides/RideDetailsPage';
import RequestRidePage from './pages/rides/RequestRidePage';
import BrowseRequestsPage from './pages/rides/BrowseRequestsPage';

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/profile/SettingsPage';
import VehicleManagementPage from './pages/profile/VehicleManagementPage';

// Credits Pages
import CreditManagementPage from './pages/credits/CreditManagementPage';
import PaymentPage from './pages/credits/PaymentPage';

// Support Pages
import HelpPage from './pages/support/HelpPage';
import SupportPage from './pages/support/SupportPage';

// Info Pages - temporarily disabled due to Grid API issues
// import AboutPage from './pages/AboutPage';
// import ContactPage from './pages/ContactPage';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to home if authenticated)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return !user ? <>{children}</> : <Navigate to="/" replace />;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes (authentication pages) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <MainLayout>
              <Container maxWidth="sm" sx={{ py: 4 }}>
                <LoginPage />
              </Container>
            </MainLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <MainLayout>
              <Container maxWidth="sm" sx={{ py: 4 }}>
                <RegisterPage />
              </Container>
            </MainLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <MainLayout>
              <Container maxWidth="sm" sx={{ py: 4 }}>
                <ForgotPasswordPage />
              </Container>
            </MainLayout>
          </PublicRoute>
        }
      />

      {/* Public home page for ride search */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />
      
      {/* Public ride browsing */}
      <Route
        path="/find-rides"
        element={
          <MainLayout>
            <FindRidesPage />
          </MainLayout>
        }
      />
      <Route
        path="/my-rides"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyRidesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-ride"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CreateRidePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ride/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RideDetailsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/request-ride"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RequestRidePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/browse-requests"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BrowseRequestsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Profile Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VehicleManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Credits Routes */}
      <Route
        path="/credits"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CreditManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PaymentPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Support Routes */}
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HelpPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SupportPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Public Info Pages - temporarily disabled due to Grid API issues */}

      {/* Catch all route - redirect to home or login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <LoadingProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
};

export default App;
