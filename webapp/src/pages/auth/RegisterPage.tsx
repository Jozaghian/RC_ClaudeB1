import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Divider,
  CircularProgress,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormHelperText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  DriveEta as DriverIcon,
  Person as PassengerIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { setLoading } = useLoading();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'PASSENGER' as 'PASSENGER' | 'DRIVER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    // Name validation
    if (!formData.firstName.trim()) {
      setError('Please enter your first name');
      return false;
    }

    if (!formData.lastName.trim()) {
      setError('Please enter your last name');
      return false;
    }

    if (formData.firstName.trim().length < 2) {
      setError('First name must be at least 2 characters long');
      return false;
    }

    if (formData.lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters long');
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    // Phone validation
    if (!formData.phoneNumber.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit Canadian phone number');
      return false;
    }

    // Password validation
    if (!formData.password) {
      setError('Please enter a password');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Terms acceptance
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoading(true, 'Creating your account...');

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        phoneNumber: formatPhoneNumber(formData.phoneNumber),
        password: formData.password,
        role: formData.role,
      };

      await register(userData);
      
      // Navigate to phone verification or home based on registration flow
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Special handling for phone number formatting
    if (field === 'phoneNumber') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length >= 6) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      } else if (cleaned.length >= 3) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      }
      value = formatted;
    }

    setFormData({ ...formData, [field]: value });
    if (error) setError(''); // Clear error when user starts typing
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ fontSize: '3rem', mb: 1 }}>
          {formData.role === 'DRIVER' ? '🚗' : '🎒'}
        </Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 1,
          }}
        >
          {formData.role === 'DRIVER' ? 'Join as Driver' : 'Join as Passenger'}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: '1rem', lineHeight: 1.5 }}
        >
          {formData.role === 'DRIVER'
            ? 'Create your driver account and start earning by sharing rides across Canada'
            : 'Create your account and start booking rides across Canada'
          }
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Registration Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* User Role Selection */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
            Join as
          </FormLabel>
          <RadioGroup
            row
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'PASSENGER' | 'DRIVER' })}
          >
            <FormControlLabel
              value="PASSENGER"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PassengerIcon />
                  Passenger
                </Box>
              }
            />
            <FormControlLabel
              value="DRIVER"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DriverIcon />
                  Driver
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {/* Name Fields */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            id="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleInputChange('firstName')}
            required
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            id="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleInputChange('lastName')}
            required
            variant="outlined"
          />
        </Box>

        {/* Email */}
        <TextField
          fullWidth
          id="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          autoComplete="email"
          required
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Phone Number */}
        <TextField
          fullWidth
          id="phoneNumber"
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={handleInputChange('phoneNumber')}
          required
          variant="outlined"
          placeholder="(123) 456-7890"
          inputProps={{ maxLength: 14 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        <FormHelperText sx={{ mb: 3, ml: 1 }}>
          Canadian phone number required for verification
        </FormHelperText>

        {/* Password */}
        <TextField
          fullWidth
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleInputChange('password')}
          autoComplete="new-password"
          required
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        <FormHelperText sx={{ mb: 3, ml: 1 }}>
          At least 8 characters with uppercase, lowercase, and numbers
        </FormHelperText>

        {/* Confirm Password */}
        <TextField
          fullWidth
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          autoComplete="new-password"
          required
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Terms and Privacy Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I agree to the{' '}
              <Link component={RouterLink} to="/terms" color="primary">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link component={RouterLink} to="/privacy" color="primary">
                Privacy Policy
              </Link>
            </Typography>
          }
          sx={{ mb: 3, alignItems: 'flex-start' }}
        />

        {/* Create Account Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: 2,
            mb: 3,
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Create Account'
          )}
        </Button>
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          or
        </Typography>
      </Divider>

      {/* Sign In Link */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
            color="primary"
            sx={{
              fontWeight: 'semibold',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;