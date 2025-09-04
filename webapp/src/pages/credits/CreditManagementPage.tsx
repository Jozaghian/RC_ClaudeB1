import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  ShoppingCart as ShopIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CreditCard as CreditCardIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { useLoading } from '../../contexts/LoadingContext';
import { useNavigate } from 'react-router-dom';

// Mock data based on mobile app
const MOCK_CREDIT_PACKAGES = [
  {
    id: '1',
    name: 'Starter Pack',
    rideCount: 5,
    originalPrice: 5.00,
    finalPrice: 5.00,
    discountPercentage: 0,
    popular: false,
  },
  {
    id: '2',
    name: 'Popular Pack',
    rideCount: 10,
    originalPrice: 10.00,
    finalPrice: 9.00,
    discountPercentage: 10,
    popular: true,
  },
  {
    id: '3',
    name: 'Value Pack',
    rideCount: 25,
    originalPrice: 25.00,
    finalPrice: 21.25,
    discountPercentage: 15,
    popular: false,
  },
  {
    id: '4',
    name: 'Premium Pack',
    rideCount: 50,
    originalPrice: 62.50,
    finalPrice: 50.00,
    discountPercentage: 20,
    popular: false,
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'PURCHASE',
    amount: 10,
    description: 'Credits purchased',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'RIDE_POST',
    amount: -1,
    description: 'Ride posted',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'REFUND',
    amount: 1,
    description: 'Ride cancelled - refund',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

interface CreditPackage {
  id: string;
  name: string;
  rideCount: number;
  originalPrice: number;
  finalPrice: number;
  discountPercentage: number;
  popular: boolean;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RIDE_POST' | 'REFUND';
  amount: number;
  description: string;
  createdAt: Date;
}

const CreditManagementPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setLoading } = useLoading();
  const navigate = useNavigate();

  const [creditBalance, setCreditBalance] = useState(3);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCreditPackages(MOCK_CREDIT_PACKAGES);
      setTransactions(MOCK_TRANSACTIONS);
    } catch (error) {
      console.error('Load credit data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseCredits = (creditPackage: CreditPackage) => {
    navigate('/payment', { state: { package: creditPackage } });
  };

  const confirmPurchase = async () => {
    if (!selectedPackage) return;

    setLoading(true, 'Processing payment...');
    setPurchaseDialogOpen(false);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update balance
      setCreditBalance(prev => prev + selectedPackage.rideCount);
      
      // Add transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'PURCHASE',
        amount: selectedPackage.rideCount,
        description: `Credits purchased - ${selectedPackage.name}`,
        createdAt: new Date(),
      };
      setTransactions(prev => [newTransaction, ...prev]);

      // Show success message
      alert(`Purchase successful! You've received ${selectedPackage.rideCount} credits for $${selectedPackage.finalPrice.toFixed(2)} CAD.`);
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  const getCreditPackageIcon = (rideCount: number) => {
    if (rideCount <= 10) return '📦';
    if (rideCount <= 25) return '📦📦';
    return '📦📦📦';
  };

  const getTransactionIcon = (type: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            mb: { xs: 2, md: 4 },
            fontSize: { xs: '1.5rem', md: '2rem' },
            textAlign: { xs: 'center', md: 'left' }
          }}
        >
          💳 Credit Management
        </Typography>

        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}
        >
          Credits are required to post rides on Ride Club
        </Typography>

        <Grid container spacing={3}>
          {/* Current Balance */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={3}
              sx={{ 
                background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                color: 'white',
                textAlign: 'center',
                p: 2
              }}
            >
              <CardContent>
                <BalanceIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Current Balance
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {creditBalance}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  credit{creditBalance !== 1 ? 's' : ''}
                </Typography>
                
                {creditBalance === 0 && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      backgroundColor: 'rgba(255, 193, 7, 0.2)',
                      color: 'white',
                      '& .MuiAlert-icon': { color: 'white' }
                    }}
                  >
                    You need credits to post rides
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Credit Packages */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShopIcon />
                Purchase Credits
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose a credit package that works for you
              </Typography>

              <Grid container spacing={2}>
                {creditPackages.map((pkg) => (
                  <Grid item xs={12} sm={6} lg={3} key={pkg.id}>
                    <Card 
                      elevation={pkg.popular ? 4 : 2}
                      sx={{ 
                        position: 'relative',
                        height: '100%',
                        border: pkg.popular ? '2px solid' : 'none',
                        borderColor: 'success.main',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          transition: 'transform 0.2s ease-in-out',
                          boxShadow: theme.shadows[8],
                        }
                      }}
                    >
                      {pkg.popular && (
                        <Chip
                          label="POPULAR"
                          color="success"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            fontWeight: 'bold',
                          }}
                        />
                      )}
                      
                      {pkg.discountPercentage > 0 && (
                        <Chip
                          label={`${pkg.discountPercentage}% OFF`}
                          color="error"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            fontWeight: 'bold',
                          }}
                        />
                      )}

                      <CardContent sx={{ textAlign: 'center', pt: pkg.popular || pkg.discountPercentage > 0 ? 4 : 2, pb: 2 }}>
                        <Typography variant="h4" sx={{ mb: 1, mt: pkg.popular || pkg.discountPercentage > 0 ? 1 : 0 }}>
                          {getCreditPackageIcon(pkg.rideCount)}
                        </Typography>
                        
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {pkg.rideCount} Credits
                        </Typography>
                        
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                          {formatCurrency(pkg.finalPrice)}
                        </Typography>
                        
                        {pkg.originalPrice !== pkg.finalPrice && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: 'line-through',
                              color: 'text.secondary',
                              mb: 1
                            }}
                          >
                            {formatCurrency(pkg.originalPrice)}
                          </Typography>
                        )}
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {formatCurrency(pkg.finalPrice / pkg.rideCount)} per credit
                        </Typography>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button
                          variant="contained"
                          color={pkg.popular ? 'success' : 'primary'}
                          onClick={() => handlePurchaseCredits(pkg)}
                          startIcon={<CreditCardIcon />}
                          fullWidth
                          sx={{ mx: 2 }}
                        >
                          Purchase
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* How Credits Work */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon />
                How Credits Work
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Posting Rides"
                    secondary="1 credit is required to post each ride on the platform"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Refunds"
                    secondary="Get your credit back if you cancel a ride before any bookings"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="No Expiration"
                    secondary="Your credits never expire and can be used anytime"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Transaction History */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                Transaction History
              </Typography>

              {transactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No transactions yet
                </Typography>
              ) : (
                <List>
                  {transactions.slice(0, 10).map((transaction, index) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Box 
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem'
                            }}
                          >
                            {getTransactionIcon(transaction.type)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={transaction.description}
                          secondary={formatDate(transaction.createdAt)}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: transaction.amount > 0 ? 'success.main' : 'text.secondary'
                          }}
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </Typography>
                      </ListItem>
                      {index < transactions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Purchase Confirmation Dialog */}
        <Dialog 
          open={purchaseDialogOpen} 
          onClose={() => setPurchaseDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Confirm Purchase
          </DialogTitle>
          <DialogContent>
            {selectedPackage && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {selectedPackage.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Credits: {selectedPackage.rideCount}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Price: {formatCurrency(selectedPackage.finalPrice)}
                </Typography>
                
                {selectedPackage.discountPercentage > 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    You're saving {selectedPackage.discountPercentage}% with this package!
                  </Alert>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  You will be redirected to a secure payment page to complete your purchase.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmPurchase} 
              variant="contained"
              startIcon={<CreditCardIcon />}
            >
              Proceed to Payment
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CreditManagementPage;