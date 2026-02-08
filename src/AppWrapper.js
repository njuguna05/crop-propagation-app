import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import LandingPage from './components/LandingPage';
import LoadingScreen from './components/LoadingScreen';
import OfflineIndicator from './components/OfflineIndicator';
import SyncStatus from './components/SyncStatus';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const AppWrapper = () => {
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    isOnline,
    initializeApp
  } = useAppStore();

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize the app
    initializeApp().finally(() => {
      // Show splash screen for at least 1 second
      setTimeout(() => {
        setShowSplash(false);
      }, 1000);
    });

    // Listen for background sync events
    const handleBackgroundSync = () => {
      console.log('Background sync triggered');
      // The sync service will handle the actual syncing
    };

    window.addEventListener('background-sync', handleBackgroundSync);

    // Handle online/offline events
    const handleOnline = () => {
      useAppStore.getState().setOnlineStatus(true);
    };

    const handleOffline = () => {
      useAppStore.getState().setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('background-sync', handleBackgroundSync);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeApp]);

  // Show splash screen
  if (showSplash || isLoading) {
    return <LoadingScreen />;
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100">
        <LandingPage />
        {!isOnline && <OfflineIndicator />}
      </div>
    );
  }

  // Show main app
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <App />
        {!isOnline && <OfflineIndicator />}
        <SyncStatus />
      </div>
    </QueryClientProvider>
  );
};

export default AppWrapper;