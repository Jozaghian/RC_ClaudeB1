import React, { createContext, useState, useContext } from 'react';

const LoadingContext = createContext({});

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const showLoading = (loadingMessage = 'Loading...') => {
    setMessage(loadingMessage);
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
    setMessage('Loading...');
  };

  const value = {
    loading,
    message,
    setLoading,
    setMessage,
    showLoading,
    hideLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};