import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Divider,
  ListItemButton,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  DirectionsCar as RidesIcon,
  AccountCircle as ProfileIcon,
  CreditCard as CreditsIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Support as SupportIcon,
  Notifications as NotificationsIcon,
  ContactMail as ContactIcon,
  Info as AboutIcon,
  Apple as AppleIcon,
  Android as AndroidIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);

  // Navigation items - different based on authentication status
  const publicNavigationItems: NavigationItem[] = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Find Rides', icon: <SearchIcon />, path: '/find-rides' },
    { text: 'About Us', icon: <AboutIcon />, path: '/about' },
    { text: 'Contact Us', icon: <ContactIcon />, path: '/contact' },
  ];

  const authenticatedNavigationItems: NavigationItem[] = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Find Rides', icon: <SearchIcon />, path: '/find-rides' },
    { text: 'My Rides', icon: <RidesIcon />, path: '/my-rides' },
    { text: 'Create Ride', icon: <AddIcon />, path: '/create-ride' },
    { text: 'Browse Requests', icon: <CalendarIcon />, path: '/browse-requests' },
    { text: 'About Us', icon: <AboutIcon />, path: '/about' },
    { text: 'Contact Us', icon: <ContactIcon />, path: '/contact' },
  ];

  const navigationItems = user ? authenticatedNavigationItems : publicNavigationItems;

  const profileItems: NavigationItem[] = [
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    { text: 'Credits', icon: <CreditsIcon />, path: '/credits', badge: user?.credits },
    { text: 'Vehicles', icon: <RidesIcon />, path: '/vehicles' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
    { text: 'Support', icon: <SupportIcon />, path: '/support' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const renderNavigationItem = (item: NavigationItem, index: number) => (
    <ListItemButton
      key={index}
      onClick={() => handleNavigate(item.path)}
      selected={isActivePath(item.path)}
      sx={{
        borderRadius: 1,
        mx: 1,
        mb: 0.5,
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.light + '20',
          '&:hover': {
            backgroundColor: theme.palette.primary.light + '30',
          },
        },
      }}
    >
      <ListItemIcon
        sx={{
          color: isActivePath(item.path) ? theme.palette.primary.main : 'inherit',
        }}
      >
        {item.badge ? (
          <Badge badgeContent={item.badge} color="primary">
            {item.icon}
          </Badge>
        ) : (
          item.icon
        )}
      </ListItemIcon>
      <ListItemText 
        primary={item.text}
        sx={{
          '& .MuiListItemText-primary': {
            fontWeight: isActivePath(item.path) ? 600 : 400,
            color: isActivePath(item.path) ? theme.palette.primary.main : 'inherit',
          },
        }}
      />
    </ListItemButton>
  );

  const drawerContent = (
    <Box sx={{ width: 280, pt: 2 }}>
      {user ? (
        /* Authenticated User Info */
        <>
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: getAvatarColor((user?.firstName || '') + (user?.lastName || '')),
                  width: 48,
                  height: 48,
                }}
                src={user?.profilePicture}
              >
                {getInitials(user?.firstName || '', user?.lastName || '')}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.preferredName || user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {user?.credits || 0} credits
                </Typography>
              </Box>
            </Box>
          </Box>
          <Divider />
        </>
      ) : (
        /* Non-authenticated User Info */
        <>
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Welcome to Ride Club
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Find rides across Canada or create your own!
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleNavigate('/login')}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleNavigate('/register')}
              >
                Sign Up
              </Button>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Main Navigation */}
      <List sx={{ px: 1, py: 1 }}>
        {navigationItems.map(renderNavigationItem)}
      </List>

      {user && (
        <>
          <Divider />
          {/* Profile Navigation - only for authenticated users */}
          <List sx={{ px: 1, py: 1 }}>
            {profileItems.map(renderNavigationItem)}
          </List>
        </>
      )}

      {/* App Download Section */}
      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
          Download Our App
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AppleIcon />}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: 'text.primary',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
              },
            }}
            href="#"
          >
            iOS App Store
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AndroidIcon />}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: 'text.primary',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
              },
            }}
            href="#"
          >
            Google Play
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
        }}
      >
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/Pic/Logo.png"
              alt="Ride Club"
              style={{ height: 32, marginRight: 12, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                cursor: 'pointer',
                display: isMobile ? 'none' : 'block',
              }}
              onClick={() => navigate('/')}
            >
              Ride Club
            </Typography>
          </Box>

          {/* Center Navigation */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {navigationItems.slice(0, 6).map((item, index) => (
                  <Tooltip key={index} title={item.text}>
                    <IconButton
                      color="inherit"
                      onClick={() => handleNavigate(item.path)}
                      sx={{
                        backgroundColor: isActivePath(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      {item.badge ? (
                        <Badge badgeContent={item.badge} color="secondary">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </IconButton>
                  </Tooltip>
                ))}
                
                {/* Download App Links */}
                <Tooltip title="Download for iOS">
                  <IconButton
                    color="inherit"
                    component="a"
                    href="https://apps.apple.com/app/ride-club"
                    target="_blank"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <AppleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download for Android">
                  <IconButton
                    color="inherit"
                    component="a"
                    href="https://play.google.com/store/apps/details?id=com.rideclub"
                    target="_blank"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <AndroidIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {user ? (
            /* Authenticated user header */
            <>
              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton color="inherit" sx={{ mr: 1 }}>
                  <Badge badgeContent={0} color="secondary">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Profile Menu */}
              <Tooltip title="Profile">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor((user?.firstName || '') + (user?.lastName || '')),
                      width: 32,
                      height: 32,
                    }}
                    src={user?.profilePicture}
                  >
                    {getInitials(user?.firstName || '', user?.lastName || '')}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </>
          ) : (
            /* Non-authenticated user header */
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => handleNavigate('/login')}
                sx={{ 
                  textTransform: 'none',
                  color: 'white',
                  border: '2px solid #4CAF50',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderColor: '#388E3C',
                  }
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => handleNavigate('/register')}
                sx={{ 
                  textTransform: 'none',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#388E3C',
                  }
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>


      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleNavigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon><ProfileIcon /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleNavigate('/credits'); handleProfileMenuClose(); }}>
          <ListItemIcon><CreditsIcon /></ListItemIcon>
          Credits {user?.credits && `(${user.credits})`}
        </MenuItem>
        <MenuItem onClick={() => { handleNavigate('/vehicles'); handleProfileMenuClose(); }}>
          <ListItemIcon><RidesIcon /></ListItemIcon>
          Vehicles
        </MenuItem>
        <MenuItem onClick={() => { handleNavigate('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleNavigate('/help'); handleProfileMenuClose(); }}>
          <ListItemIcon><HelpIcon /></ListItemIcon>
          Help
        </MenuItem>
        <MenuItem onClick={() => { handleNavigate('/support'); handleProfileMenuClose(); }}>
          <ListItemIcon><SupportIcon /></ListItemIcon>
          Support
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;