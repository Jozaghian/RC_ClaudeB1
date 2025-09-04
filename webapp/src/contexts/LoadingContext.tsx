import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  setLoading: (loading: boolean, text?: string) => void;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const setLoading = (loading: boolean, text: string = 'Loading...') => {
    setIsLoading(loading);
    setLoadingText(text);
  };

  const showLoading = (text: string = 'Loading...') => {
    setLoading(true, text);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  const value: LoadingContextType = {
    isLoading,
    loadingText,
    setLoading,
    showLoading,
    hideLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      
      {/* Global Loading Backdrop */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
        open={isLoading}
      >
        <CircularProgress color="inherit" size={60} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" component="div">
            {loadingText}
          </Typography>
        </Box>
      </Backdrop>
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};