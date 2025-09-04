import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  IconButton
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Help as HelpIcon,
  BugReport as BugReportIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  ContactSupport as ContactSupportIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';

const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const { actualMode: mode } = useThemeContext();
  
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const supportOptions = [
    {
      id: 'email',
      title: 'Email Support',
      icon: <EmailIcon fontSize="large" />,
      description: 'Send us an email and we\'ll respond within 24 hours',
      color: '#1976D2',
      action: () => handleEmailSupport(),
    },
    {
      id: 'faq',
      title: 'Browse FAQ',
      icon: <HelpIcon fontSize="large" />,
      description: 'Find quick answers to common questions',
      color: '#2E7D32',
      action: () => window.location.href = '/help',
    },
    {
      id: 'report',
      title: 'Report Issue',
      icon: <BugReportIcon fontSize="large" />,
      description: 'Report a bug or technical problem',
      color: '#ED6C02',
      action: () => handleReportIssue(),
    },
    {
      id: 'safety',
      title: 'Safety Concern',
      icon: <SecurityIcon fontSize="large" />,
      description: 'Report safety issues or inappropriate behavior',
      color: '#D32F2F',
      action: () => handleSafetyConcern(),
      priority: true,
    },
  ];

  const contactInfo = [
    {
      icon: <EmailIcon />,
      title: 'Email Support',
      value: 'support@rideclub.ca',
      description: 'Response within 24 hours',
      action: () => window.open('mailto:support@rideclub.ca', '_blank')
    },
    {
      icon: <SecurityIcon />,
      title: 'Safety Concerns',
      value: 'safety@rideclub.ca',
      description: 'Priority response for safety issues',
      action: () => window.open('mailto:safety@rideclub.ca', '_blank')
    },
    {
      icon: <ScheduleIcon />,
      title: 'Support Hours',
      value: 'Monday - Friday: 9 AM - 6 PM EST',
      description: 'Weekend support for urgent issues',
    }
  ];

  const handleEmailSupport = () => {
    const subject = 'Ride Club Support Request';
    const body = `
Hi Ride Club Support Team,

User Information:
- Name: ${user?.firstName} ${user?.lastName}
- Email: ${user?.email}
- Phone: ${user?.phoneNumber || 'Not provided'}
- User ID: ${user?.id || 'Unknown'}

Issue Description:
[Please describe your issue here]

Device Information:
- Platform: Web App
- Browser: ${navigator.userAgent}

Thank you for your assistance.

Best regards,
${user?.firstName || 'User'}
    `.trim();

    const emailUrl = `mailto:support@rideclub.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  };

  const handleReportIssue = () => {
    setSupportForm(prev => ({
      ...prev,
      subject: 'Technical Issue Report',
      priority: 'medium'
    }));
    setShowForm(true);
  };

  const handleSafetyConcern = () => {
    setSupportForm(prev => ({
      ...prev,
      subject: 'Safety Concern Report',
      priority: 'high'
    }));
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      // Send to real API endpoint
      const response = await apiService.createSupportTicket({
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        priority: supportForm.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      });
      
      console.log('Support ticket created:', response.data);
      
      setSubmitSuccess(true);
      setShowForm(false);
      setSupportForm({
        subject: '',
        message: '',
        priority: 'medium'
      });
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to submit support request:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#2E7D32', description: 'Minor issue, low impact' },
    { value: 'medium', label: 'Medium', color: '#ED6C02', description: 'Moderate issue, affects functionality' },
    { value: 'high', label: 'High', color: '#D32F2F', description: 'Major issue, significant impact' },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 4,
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, #4CAF50, #2E7D32)'
              : 'linear-gradient(135deg, #66BB6A, #4CAF50)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          🆘 Support Center
        </Typography>

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="medium">
              Support request submitted successfully!
            </Typography>
            <Typography variant="body2">
              We'll respond within 24 hours. For urgent matters, please email us directly.
            </Typography>
          </Alert>
        )}

        {/* Quick Actions */}
        <Paper sx={{ mb: 4, p: 3 }} elevation={2}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🚀 How can we help?
          </Typography>
          
          <Grid container spacing={3}>
            {supportOptions.map((option) => (
              <Grid item xs={12} md={6} key={option.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: option.priority ? 2 : 1,
                    borderColor: option.priority ? '#D32F2F' : 'divider',
                    backgroundColor: option.priority ? '#FFEBEE' : 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={option.action}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box 
                        sx={{ 
                          color: option.color,
                          backgroundColor: option.color + '10',
                          borderRadius: 2,
                          p: 1,
                          display: 'flex'
                        }}
                      >
                        {option.icon}
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ 
                          color: option.priority ? '#D32F2F' : 'text.primary',
                          mb: 1 
                        }}>
                          {option.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                        {option.priority && (
                          <Chip 
                            label="Priority" 
                            size="small" 
                            color="error" 
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Contact Information */}
        <Paper sx={{ mb: 4, p: 3 }} elevation={2}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            📞 Contact Information
          </Typography>
          
          <List>
            {contactInfo.map((contact, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    {contact.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {contact.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body1" 
                          color="primary.main" 
                          fontWeight="medium"
                          sx={{ 
                            cursor: contact.action ? 'pointer' : 'default',
                            '&:hover': contact.action ? { textDecoration: 'underline' } : {}
                          }}
                          onClick={contact.action}
                        >
                          {contact.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contact.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < contactInfo.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Support Form Button */}
        <Paper sx={{ mb: 4, p: 3, textAlign: 'center' }} elevation={2}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            ✍️ Send us a message
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Fill out our support form for detailed assistance with your issue
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            onClick={() => setShowForm(true)}
            sx={{
              background: 'linear-gradient(135deg, #66BB6A, #4CAF50)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
              }
            }}
          >
            Open Support Form
          </Button>
        </Paper>

        {/* Emergency Notice */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Need immediate assistance?
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            For urgent safety concerns, contact local emergency services first (911), then report to us.
          </Typography>
          <Typography variant="body2">
            For technical issues, try refreshing the page or checking our FAQ section first.
          </Typography>
        </Alert>

        {/* Support Form Dialog */}
        <Dialog 
          open={showForm} 
          onClose={() => !loading && setShowForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Support Request Form
            </Typography>
            {!loading && (
              <IconButton onClick={() => setShowForm(false)}>
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Message"
                    value={supportForm.message}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce the problem."
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={supportForm.priority}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      label="Priority"
                    >
                      {priorityOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: option.color
                              }}
                            />
                            <Box>
                              <Typography variant="body1">{option.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Your Information (Auto-filled)
                    </Typography>
                    <Typography variant="body2">
                      • Name: {user?.firstName} {user?.lastName}<br/>
                      • Email: {user?.email}<br/>
                      • Platform: Web Application
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setShowForm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitForm}
              disabled={loading || !supportForm.subject.trim() || !supportForm.message.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              sx={{
                background: 'linear-gradient(135deg, #66BB6A, #4CAF50)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                }
              }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SupportPage;