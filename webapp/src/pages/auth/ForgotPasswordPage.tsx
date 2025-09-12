import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useLoading } from '../../contexts/LoadingContext';
import apiService from '../../services/apiService';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setLoading(true, 'Sending reset link...');

    try {
      await apiService.resetPassword(email.toLowerCase().trim());
      
      setSuccess("We've sent you a password reset link. Please check your email.");
      
      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
    if (success) setSuccess(''); // Clear success when user starts typing
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 1,
          }}
        >
          Reset Password
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: '1.1rem', lineHeight: 1.5 }}
        >
          Enter your email address and we'll send you a reset link.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Reset Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={handleInputChange}
          autoComplete="email"
          autoFocus
          required
          variant="outlined"
          placeholder="Enter your email address"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 4 }}
        />

        {/* Send Reset Link Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isSubmitting || success !== ''}
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
            'Send Reset Link'
          )}
        </Button>
      </Box>

      {/* Back to Login Link */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Link
          component={RouterLink}
          to="/login"
          color="primary"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 'medium',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <BackIcon fontSize="small" />
          Back to Login
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;