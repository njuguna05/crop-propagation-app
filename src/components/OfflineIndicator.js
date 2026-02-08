import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

const OfflineIndicator = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white shadow-lg">
      <div className="flex items-center justify-center space-x-2 py-2 px-4">
        <WifiOff className="w-4 h-4" />
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          You're offline. Changes will sync when connection is restored.
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;