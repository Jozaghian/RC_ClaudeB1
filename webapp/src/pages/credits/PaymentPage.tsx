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
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as PayPalIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoading } from '../../contexts/LoadingContext';

interface CreditPackage {
  id: string;
  name: string;
  rideCount: number;
  originalPrice: number;
  finalPrice: number;
  discountPercentage: number;
  popular: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'bank_transfer';
  name: string;
  icon: React.ReactNode;
  description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'credit_card',
    type: 'credit_card',
    name: 'Credit/Debit Card',
    icon: <CreditCardIcon />,
    description: 'Visa, Mastercard, American Express',
  },
  {
    id: 'paypal',
    type: 'paypal',
    name: 'PayPal',
    icon: <PayPalIcon />,
    description: 'Pay with your PayPal account',
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    icon: <BankIcon />,
    description: 'Direct bank transfer (Interac)',
  },
];

const STEPS = ['Payment Method', 'Payment Details', 'Confirmation'];

const PaymentPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { setLoading } = useLoading();

  // Get package from navigation state
  const selectedPackage = location.state?.package as CreditPackage;

  const [activeStep, setActiveStep] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    billingAddress: '',
    city: '',
    province: '',
    postalCode: '',
  });

  useEffect(() => {
    if (!selectedPackage) {
      navigate('/credits');
    }
  }, [selectedPackage, navigate]);

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/credits');
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleNext = () => {
    if (activeStep === STEPS.length - 1) {
      handlePayment();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPaymentMethod(event.target.value);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setLoading(true, 'Processing payment...');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Navigate to success page or back to credits with success message
      navigate('/credits', { 
        state: { 
          purchaseSuccess: true, 
          package: selectedPackage 
        } 
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const match = numbers.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
    if (match) {
      return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
    }
    return numbers;
  };

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
    }
    return numbers;
  };

  if (!selectedPackage) {
    return null;
  }

  const renderPaymentMethodStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Choose your payment method
      </Typography>
      
      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          value={selectedPaymentMethod}
          onChange={handlePaymentMethodChange}
        >
          {PAYMENT_METHODS.map((method) => (
            <Card 
              key={method.id}
              variant="outlined"
              sx={{ 
                mb: 2,
                border: selectedPaymentMethod === method.id ? '2px solid' : '1px solid',
                borderColor: selectedPaymentMethod === method.id ? 'primary.main' : 'divider',
                '&:hover': { borderColor: 'primary.main' }
              }}
            >
              <CardContent>
                <FormControlLabel
                  value={method.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Box sx={{ color: 'primary.main' }}>
                        {method.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          {method.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ margin: 0, width: '100%' }}
                />
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );

  const renderPaymentDetailsStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Payment Details
      </Typography>

      {selectedPaymentMethod === 'credit_card' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Card Number"
              value={formatCardNumber(paymentForm.cardNumber)}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value.replace(/\s/g, '') }))}
              placeholder="1234 5678 9012 3456"
              inputProps={{ maxLength: 19 }}
              InputProps={{
                startAdornment: <CreditCardIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expiry Date"
              value={formatExpiryDate(paymentForm.expiryDate)}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryDate: e.target.value.replace(/\D/g, '') }))}
              placeholder="MM/YY"
              inputProps={{ maxLength: 5 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CVV"
              value={paymentForm.cvv}
              onChange={handleFormChange('cvv')}
              placeholder="123"
              inputProps={{ maxLength: 4 }}
              type="password"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Cardholder Name"
              value={paymentForm.cardholderName}
              onChange={handleFormChange('cardholderName')}
              placeholder="John Doe"
            />
          </Grid>
        </Grid>
      )}

      {selectedPaymentMethod === 'paypal' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <PayPalIcon sx={{ fontSize: 48, color: '#0070ba', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            PayPal Payment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You will be redirected to PayPal to complete your payment securely.
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            value={paymentForm.email}
            onChange={handleFormChange('email')}
            placeholder="your.email@example.com"
            type="email"
          />
        </Box>
      )}

      {selectedPaymentMethod === 'bank_transfer' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <BankIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Bank Transfer (Interac)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You will receive bank transfer instructions after confirming your order.
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            value={paymentForm.email}
            onChange={handleFormChange('email')}
            placeholder="your.email@example.com"
            type="email"
            sx={{ mb: 2 }}
          />
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Billing Information
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            value={paymentForm.city}
            onChange={handleFormChange('city')}
            placeholder="Toronto"
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Province"
            value={paymentForm.province}
            onChange={handleFormChange('province')}
            placeholder="ON"
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Postal Code"
            value={paymentForm.postalCode}
            onChange={handleFormChange('postalCode')}
            placeholder="M5V 3A8"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderConfirmationStep = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Confirm Your Purchase
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Please review your order details before completing the payment.
        </Typography>
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Order Summary
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Package:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {selectedPackage.name}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Credits:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {selectedPackage.rideCount}
            </Typography>
          </Box>
          
          {selectedPackage.discountPercentage > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Original Price:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                >
                  {formatCurrency(selectedPackage.originalPrice)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="success.main">
                  Discount ({selectedPackage.discountPercentage}%):
                </Typography>
                <Typography variant="body2" color="success.main">
                  -{formatCurrency(selectedPackage.originalPrice - selectedPackage.finalPrice)}
                </Typography>
              </Box>
            </>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(selectedPackage.finalPrice)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SecurityIcon color="success" />
        <Typography variant="body2" color="text.secondary">
          Your payment is secured with 256-bit SSL encryption
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            💳 Secure Payment
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Main Content */}
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
          {activeStep === 0 && renderPaymentMethodStep()}
          {activeStep === 1 && renderPaymentDetailsStep()}
          {activeStep === 2 && renderConfirmationStep()}

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              variant="outlined"
              disabled={isProcessing}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={isProcessing}
              startIcon={
                activeStep === STEPS.length - 1 
                  ? (isProcessing ? <CircularProgress size={20} /> : <LockIcon />) 
                  : null
              }
            >
              {activeStep === STEPS.length - 1 
                ? (isProcessing ? 'Processing...' : 'Complete Payment')
                : 'Continue'
              }
            </Button>
          </Box>
        </Paper>

        {/* Package Summary (Sticky on larger screens) */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mt: 3,
            position: { md: 'sticky' },
            top: { md: 20 }
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            {selectedPackage.name}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Credits:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {selectedPackage.rideCount}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              Total:
            </Typography>
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(selectedPackage.finalPrice)}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PaymentPage;