import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import {
  CheckCircle,
  AlertCircle,
  Loader,
  Wifi,
  RefreshCw,
  Clock,
  X
} from 'lucide-react';

const SyncStatus = () => {
  const {
    syncStatus,
    lastSyncTime,
    syncError,
    isOnline
  } = useAppStore();

  const [showDetails, setShowDetails] = useState(false);
  const [autoHideTimeout, setAutoHideTimeout] = useState(null);

  useEffect(() => {
    // Auto-show sync status when syncing starts
    if (syncStatus === 'syncing') {
      setShowDetails(true);
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    }

    // Auto-hide successful sync after 3 seconds
    if (syncStatus === 'success') {
      const timeout = setTimeout(() => {
        setShowDetails(false);
      }, 3000);
      setAutoHideTimeout(timeout);
    }

    // Keep error visible until manually dismissed
    if (syncStatus === 'error') {
      setShowDetails(true);
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    }

    return () => {
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    };
  }, [syncStatus, autoHideTimeout]);

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return isOnline ?
          <Wifi className="w-4 h-4 text-gray-500" /> :
          <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSyncMessage = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing data...';
      case 'success':
        return 'Data synced successfully';
      case 'error':
        return `Sync failed: ${syncError}`;
      default:
        return isOnline ? 'Connected' : 'Working offline';
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return isOnline ?
          'bg-gray-50 border-gray-200 text-gray-700' :
          'bg-amber-50 border-amber-200 text-amber-700';
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';

    const now = new Date();
    const syncTime = new Date(lastSyncTime);
    const diffMs = now - syncTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return syncTime.toLocaleDateString();
  };

  const handleManualSync = async () => {
    if (isOnline && syncStatus !== 'syncing') {
      const { syncService } = await import('../services/syncService');
      syncService.startSync(true);
    }
  };

  // Don't show if idle and no recent activity
  if (syncStatus === 'idle' && !showDetails && lastSyncTime) {
    const timeSinceSync = new Date() - new Date(lastSyncTime);
    if (timeSinceSync > 5 * 60 * 1000) { // 5 minutes
      return null;
    }
  }

  return (
    <>
      {/* Compact sync indicator */}
      {!showDetails && (
        <button
          onClick={() => setShowDetails(true)}
          className="fixed bottom-4 right-4 flex items-center space-x-2 px-3 py-2 bg-white shadow-lg rounded-full border hover:shadow-xl transition-shadow z-40"
        >
          {getSyncIcon()}
          {syncStatus === 'syncing' && (
            <span className="text-xs text-gray-600">Syncing...</span>
          )}
        </button>
      )}

      {/* Detailed sync status */}
      {showDetails && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className={`p-4 rounded-lg border shadow-lg min-w-80 ${getSyncStatusColor()}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getSyncIcon()}
                <h3 className="font-medium text-sm">Sync Status</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status message */}
            <div className="mb-3">
              <p className="text-sm">{getSyncMessage()}</p>
            </div>

            {/* Last sync time */}
            <div className="flex items-center justify-between text-xs opacity-75 mb-3">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Last sync: {formatLastSyncTime()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={handleManualSync}
                disabled={!isOnline || syncStatus === 'syncing'}
                className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-50 rounded text-xs font-medium hover:bg-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>

              {syncStatus === 'error' && (
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-3 py-1 bg-white bg-opacity-50 rounded text-xs font-medium hover:bg-opacity-75 transition-all"
                >
                  Dismiss
                </button>
              )}
            </div>

            {/* Error details */}
            {syncStatus === 'error' && syncError && (
              <div className="mt-3 p-2 bg-white bg-opacity-30 rounded text-xs">
                <p className="font-medium">Error Details:</p>
                <p className="mt-1 opacity-90">{syncError}</p>
              </div>
            )}

            {/* Sync progress indicator */}
            {syncStatus === 'syncing' && (
              <div className="mt-3">
                <div className="h-1 bg-white bg-opacity-30 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse"></div>
                </div>
                <p className="text-xs mt-1 opacity-75">
                  Synchronizing with FloraERP...
                </p>
              </div>
            )}

            {/* Success animation */}
            {syncStatus === 'success' && (
              <div className="mt-2 flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>All changes synchronized</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SyncStatus;