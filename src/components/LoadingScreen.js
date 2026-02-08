import React from 'react';
import { Sprout, Loader } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4">
            <Sprout className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crop Propagation Manager</h1>
          <p className="text-gray-600 mt-2">Professional agriculture management</p>
        </div>

        {/* Loading animation */}
        <div className="flex items-center justify-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-700">Loading your workspace...</span>
        </div>

        {/* Loading steps */}
        <div className="mt-8 space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Initializing database</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Syncing data</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>Preparing workspace</span>
          </div>
        </div>

        {/* Offline mode notice */}
        <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            </div>
            <div className="text-sm text-left">
              <p className="text-blue-800 font-medium">Offline-First Design</p>
              <p className="text-blue-600 mt-1">
                Your data is stored locally and synced automatically when online.
                You can work seamlessly even without internet connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;