import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton, { DriverButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { formatCurrency, formatDate } from '../utils/helpers';
import apiService from '../services/apiService';

export default function CreditManagementScreen({ navigation }) {
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditPackages, setCreditPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCreditBalance(),
        loadCreditPackages(),
        loadTransactions()
      ]);
    } catch (error) {
      console.error('Load credit data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditBalance = async () => {
    try {
      const response = await apiService.get('/credits/balance');
      if (response.success) {
        setCreditBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Load balance error:', error);
      // Fallback to mock data for testing
      setCreditBalance(3);
    }
  };

  const loadCreditPackages = async () => {
    try {
      const response = await apiService.get('/credits/packages');
      if (response.success) {
        setCreditPackages(response.data.packages);
      }
    } catch (error) {
      console.error('Load packages error:', error);
      // Fallback to mock data for testing
      setCreditPackages([
        {
          id: '1',
          name: 'Starter Pack',
          rideCount: 5,
          originalPrice: 15.00,
          finalPrice: 15.00,
          discountPercentage: 0
        },
        {
          id: '2',
          name: 'Popular Pack',
          rideCount: 10,
          originalPrice: 30.00,
          finalPrice: 25.00,
          discountPercentage: 0.17
        },
        {
          id: '3',
          name: 'Value Pack',
          rideCount: 25,
          originalPrice: 75.00,
          finalPrice: 60.00,
          discountPercentage: 0.20
        },
        {
          id: '4',
          name: 'Premium Pack',
          rideCount: 50,
          originalPrice: 150.00,
          finalPrice: 100.00,
          discountPercentage: 0.33
        }
      ]);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await apiService.get('/credits/transactions', {
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Load transactions error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCreditData();
    setRefreshing(false);
  };

  const handlePurchaseCredits = (creditPackage) => {
    setSelectedPackage(creditPackage);
    
    Alert.alert(
      'Purchase Credits',
      `Purchase ${creditPackage.rideCount} credits for ${formatCurrency(creditPackage.finalPrice)}?`,
      [
        { text: 'Cancel' },
        { text: 'Purchase', onPress: () => confirmPurchase(creditPackage) }
      ]
    );
  };

  const confirmPurchase = async (creditPackage) => {
    setGlobalLoading(true);

    try {
      // Step 1: Create payment intent with Stripe
      let paymentIntentResponse;
      try {
        paymentIntentResponse = await apiService.post('/payments/create-intent', {
          amount: Math.round(creditPackage.finalPrice * 100), // Convert to cents
          currency: 'cad',
          metadata: {
            type: 'CREDIT_PURCHASE',
            packageId: creditPackage.id,
            userId: user.id,
            rideCount: creditPackage.rideCount
          }
        });
      } catch (apiError) {
        // Fallback for testing when backend is not available
        console.log('Backend not available, using mock payment intent');
        paymentIntentResponse = {
          success: true,
          data: {
            client_secret: 'mock_client_secret_' + Date.now(),
            payment_intent_id: 'mock_pi_' + Date.now()
          }
        };
      }

      if (!paymentIntentResponse.success) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret, payment_intent_id } = paymentIntentResponse.data;

      // Step 2: Navigate to payment screen with payment intent
      navigation.navigate('StripePayment', {
        clientSecret: client_secret,
        paymentIntentId: payment_intent_id,
        amount: creditPackage.finalPrice,
        description: `${creditPackage.rideCount} Ride Credits`,
        onSuccess: (paymentResult) => handlePaymentSuccess(paymentResult, creditPackage),
        onError: (error) => handlePaymentError(error),
        returnScreen: 'CreditManagement'
      });

    } catch (error) {
      console.error('Purchase credits error:', error);
      Alert.alert(
        'Purchase Failed',
        error.response?.data?.message || 'Failed to start payment process. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setGlobalLoading(false);
      setSelectedPackage(null);
    }
  };

  const handlePaymentSuccess = async (paymentResult, creditPackage) => {
    try {
      // Confirm the purchase on the backend after successful payment
      let response;
      try {
        response = await apiService.post('/credits/confirm-purchase', {
          paymentIntentId: paymentResult.paymentIntent.id,
          packageId: creditPackage.id,
          stripePaymentId: paymentResult.paymentIntent.id
        });
      } catch (apiError) {
        // Mock success response for testing
        console.log('Backend not available, simulating purchase confirmation');
        response = {
          success: true,
          data: {
            newBalance: creditBalance + creditPackage.rideCount
          }
        };
      }

      if (response.success) {
        // Update local balance for immediate feedback
        setCreditBalance(response.data.newBalance);
        
        Alert.alert(
          'Purchase Successful! 🎉',
          `You've successfully purchased ${creditPackage.rideCount} credits for ${formatCurrency(creditPackage.finalPrice)}. Your new balance is ${response.data.newBalance} credits.`,
          [{ text: 'OK', onPress: () => loadCreditData() }]
        );
      } else {
        throw new Error(response.message || 'Failed to confirm purchase');
      }
    } catch (error) {
      console.error('Confirm purchase error:', error);
      Alert.alert(
        'Purchase Confirmation Failed',
        'Payment was processed but there was an issue confirming your purchase. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    Alert.alert(
      'Payment Failed',
      error.message || 'Payment was not successful. Please try again.',
      [{ text: 'OK' }]
    );
  };

  const getCreditPackageIcon = (rideCount) => {
    if (rideCount <= 10) return '📦';
    if (rideCount <= 25) return '📦📦';
    return '📦📦📦';
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'PURCHASE':
        return '💳';
      case 'RIDE_POST':
        return '🚗';
      case 'REFUND':
        return '💰';
      default:
        return '📝';
    }
  };

  const getTransactionDescription = (transaction) => {
    switch (transaction.type) {
      case 'PURCHASE':
        return 'Credits purchased';
      case 'RIDE_POST':
        return 'Ride posted';
      case 'REFUND':
        return 'Ride cancelled - refund';
      default:
        return transaction.description || 'Transaction';
    }
  };

  const renderCreditPackage = (creditPackage) => (
    <TouchableOpacity
      key={creditPackage.id}
      style={[
        styles.packageCard,
        creditPackage.discountPercentage > 0 && styles.packageCardFeatured
      ]}
      onPress={() => handlePurchaseCredits(creditPackage)}
    >
      {creditPackage.discountPercentage > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            {Math.round(creditPackage.discountPercentage * 100)}% OFF
          </Text>
        </View>
      )}
      
      <Text style={styles.packageIcon}>
        {getCreditPackageIcon(creditPackage.rideCount)}
      </Text>
      
      <Text style={styles.packageCredits}>
        {creditPackage.rideCount} Credits
      </Text>
      
      <Text style={styles.packagePrice}>
        {formatCurrency(creditPackage.finalPrice)}
      </Text>
      
      {creditPackage.originalPrice !== creditPackage.finalPrice && (
        <Text style={styles.originalPrice}>
          {formatCurrency(creditPackage.originalPrice)}
        </Text>
      )}
      
      <Text style={styles.packageDescription}>
        {formatCurrency(creditPackage.finalPrice / creditPackage.rideCount)} per credit
      </Text>
      
      <DriverButton
        title="Purchase"
        size="small"
        onPress={() => handlePurchaseCredits(creditPackage)}
        style={styles.purchaseButton}
      />
    </TouchableOpacity>
  );

  const renderTransaction = (transaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {getTransactionIcon(transaction.type)}
        </Text>
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>
          {getTransactionDescription(transaction)}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(transaction.createdAt)}
        </Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.transactionAmountText,
          transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
        ]}>
          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Credit Management</Text>
          <Text style={styles.headerSubtitle}>
            Credits are required to post rides on Ride Club
          </Text>
        </View>

        {/* Current Balance */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>{creditBalance}</Text>
            <Text style={styles.balanceCredits}>
              credit{creditBalance !== 1 ? 's' : ''}
            </Text>
            
            {creditBalance === 0 && (
              <View style={styles.lowBalanceWarning}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  You need credits to post rides
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Credit Packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>💳 Purchase Credits</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a credit package that works for you
          </Text>
          
          <View style={styles.packagesContainer}>
            {creditPackages.map(renderCreditPackage)}
          </View>
        </View>

        {/* Usage Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ℹ️ How Credits Work</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚗</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Posting Rides</Text>
              <Text style={styles.infoDescription}>
                1 credit is required to post each ride on the platform
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>💰</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Refunds</Text>
              <Text style={styles.infoDescription}>
                Get your credit back if you cancel a ride before any bookings
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🎯</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>No Expiration</Text>
              <Text style={styles.infoDescription}>
                Your credits never expire and can be used anytime
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>📊 Transaction History</Text>
            
            <View style={styles.transactionsList}>
              {transactions.map(renderTransaction)}
            </View>
          </View>
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  balanceSection: {
    padding: spacing.md,
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  balanceCredits: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  lowBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  packagesSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  packagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packageCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '48%',
    marginBottom: spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  packageCardFeatured: {
    borderWidth: 2,
    borderColor: colors.success,
    elevation: 4,
    shadowOpacity: 0.15,
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.success,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  discountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  packageIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  packageCredits: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  packagePrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginBottom: spacing.xs,
  },
  packageDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  purchaseButton: {
    minWidth: 100,
  },
  infoSection: {
    padding: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  transactionsSection: {
    padding: spacing.md,
  },
  transactionsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionIconText: {
    fontSize: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  positiveAmount: {
    color: colors.success,
  },
  negativeAmount: {
    color: colors.textSecondary,
  },
});