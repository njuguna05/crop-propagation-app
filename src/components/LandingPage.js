import React, { useState } from 'react';
import { Leaf, ArrowRight, CheckCircle, Users, BarChart3, Shield, Eye, EyeOff, Loader, Scissors, TreePine, Sprout, Home } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import FloraTrackLogo, { FloraTrackIcon } from './FloraTrackLogo';

const LandingPage = () => {
  const { login, isLoading, isOnline } = useAppStore();
  const [showLogin, setShowLogin] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      setErrors({ general: 'Internet connection required for login' });
      return;
    }

    const result = await login(credentials);

    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  const handleDemoLogin = async () => {
    if (!isOnline) {
      setErrors({ general: 'Internet connection required for demo' });
      return;
    }

    const demoCredentials = {
      email: 'demo@cropprop.com',
      password: 'demo1234'
    };

    const result = await login(demoCredentials);

    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  const features = [
    {
      icon: Leaf,
      title: "Smart Crop Tracking",
      description: "Monitor your plants from seed to harvest with intelligent stage tracking and environmental monitoring."
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Get detailed analytics on success rates, growth patterns, and operational efficiency."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Coordinate with your team through shared tasks, orders, and real-time updates."
    },
    {
      icon: Shield,
      title: "Offline-First Design",
      description: "Work seamlessly offline with automatic sync when connection is restored."
    }
  ];

  const benefits = [
    "Track propagation success rates",
    "Manage orders and workflows",
    "Monitor environmental conditions",
    "Generate detailed reports",
    "Collaborate with team members",
    "Access from any device"
  ];

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <FloraTrackLogo width={200} height={50} variant="default" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700">Welcome Back</h2>
              <p className="text-gray-500 mt-2">Sign in to access your propagation dashboard</p>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Connection Status */}
            {!isOnline && (
              <div className="flex items-center justify-center space-x-2 mb-6 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <span className="text-sm font-medium">Offline - Connect to login</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !isOnline}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading || !isOnline}
                  className="w-full border-2 border-green-600 text-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  Try Demo Account
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowLogin(false)}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                ← Back to overview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FloraTrackLogo width={180} height={48} variant="default" />
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Crop
            <span className="text-green-600 block">Propagation Management</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your agricultural operations with comprehensive tracking, analytics, and team collaboration tools designed for modern propagation facilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowLogin(true)}
              className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg hover:bg-green-50 transition-colors text-lg font-semibold">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to scale your operation
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From small nurseries to large commercial facilities, FloraTrack adapts to your workflow and grows with your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Demonstration Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Propagation Workflow
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From budwood collection to mature nursery plants, FloraTrack guides you through every step of the propagation process with precision tracking and quality control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1: Budwood Collection */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="text-center">
                  <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Scissors className="w-10 h-10 text-purple-600" />
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Budwood Collection</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Harvest quality budwood from mother trees with proper documentation and traceability.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Variety tracking</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quality assessment</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage management</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Arrow connector */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* Step 2: Grafting Operations */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="text-center">
                  <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <TreePine className="w-10 h-10 text-blue-600" />
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Grafting Operations</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Perform precise grafting techniques with success rate tracking and operator performance monitoring.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Success rate tracking</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Technique documentation</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Operator assignment</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Arrow connector */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* Step 3: Seedling Development */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="text-center">
                  <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Sprout className="w-10 h-10 text-green-600" />
                    <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Seedling Development</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Monitor early growth stages with environmental controls and health assessments.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Growth monitoring</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Health assessments</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Environmental data</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Arrow connector */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* Step 4: Nursery Beds */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className="text-center">
                  <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Home className="w-10 h-10 text-orange-600" />
                    <div className="absolute -top-2 -right-2 bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Nursery Beds</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage mature plants in nursery beds with transfer tracking and shipping preparation.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Transfer management</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping preparation</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quality control</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Summary */}
          <div className="mt-16 bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">
                Complete Traceability Throughout Your Operation
              </h4>
              <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
                Every plant, from budwood source to final shipment, is tracked with detailed records, environmental data, and quality assessments. Generate comprehensive reports and maintain compliance with industry standards.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-gray-900">Real-time Analytics</span>
                </div>
                <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-gray-900">Quality Assurance</span>
                </div>
                <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                  <span className="font-medium text-gray-900">Team Coordination</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-6">
                Why choose FloraTrack?
              </h3>
              <p className="text-lg mb-8 opacity-90">
                Built specifically for plant propagation professionals, FloraTrack combines industry expertise with modern technology to deliver results.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-200" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h4 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Ready to get started?
              </h4>
              <p className="text-gray-600 mb-6 text-center">
                Join thousands of growers who trust FloraTrack to manage their propagation operations.
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-sm text-gray-500 text-center mt-4">
                No credit card required • 30-day free trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FloraTrackLogo width={160} height={40} variant="dark" />
            </div>
            <p className="text-gray-400">
              Professional crop propagation management for the modern grower.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;