import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import EnhancedLandingPage from './components/EnhancedLandingPage';
import TenantCreation from './components/TenantCreation';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
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
    user,
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

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          {!isAuthenticated ? (
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/tenants/create" element={<TenantCreation />} />
              <Route path="*" element={<EnhancedLandingPage />} />
            </Routes>
          ) : user?.is_superuser ? (
            <Routes>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/*" element={<App />} />
            </Routes>
          )}
          {!isOnline && <OfflineIndicator />}
          {isAuthenticated && !user?.is_superuser && <SyncStatus />}
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default AppWrapper;