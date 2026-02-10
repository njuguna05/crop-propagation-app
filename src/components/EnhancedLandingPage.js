import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, CheckCircle, Users, BarChart3, Shield, Eye, EyeOff, Loader, Scissors, TreePine, Sprout, Home, Mail, Phone } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import FloraTrackLogo from './FloraTrackLogo';
import ContactUs from './ContactUs';
import PricingPlans from './PricingPlans';
import RequestDemo from './RequestDemo';

const EnhancedLandingPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, isOnline } = useAppStore();

  // View states
  const [currentView, setCurrentView] = useState('home'); // home, contact, pricing
  const [showLogin, setShowLogin] = useState(false);
  const [showRequestDemo, setShowRequestDemo] = useState(false);

  // Form states
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
    } else {
      // Login successful - close modal and let AppWrapper handle routing
      setShowLogin(false);
      setCredentials({ email: '', password: '' });
      setErrors({});
    }
  };

  const handleDemoLogin = async () => {
    if (!isOnline) {
      setErrors({ general: 'Internet connection required for demo' });
      return;
    }

    // Demo credentials
    const demoCredentials = {
      email: 'demo@floratrack.com',
      password: 'demo1234'
    };

    const result = await login(demoCredentials);

    if (!result.success) {
      setErrors({ general: 'Demo account not available. Please contact support.' });
    }
  };

  const handleRegisterTenant = () => {
    navigate('/tenants/create');
  };

  const handleSelectPlan = (planName) => {
    if (planName === 'enterprise') {
      setShowRequestDemo(true);
    } else {
      handleRegisterTenant();
    }
  };

  // Show different views
  if (currentView === 'contact') {
    return <ContactUs onBack={() => setCurrentView('home')} />;
  }

  const features = [
    {
      icon: Leaf,
      title: "Smart Crop Tracking",
      description: "Monitor your plants from seed to harvest with intelligent stage tracking and environmental monitoring."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Coordinate tasks, assign responsibilities, and track team performance across your entire operation."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards and detailed reports help you make data-driven decisions."
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Maintain comprehensive records for compliance, traceability, and quality control."
    }
  ];

  const benefits = [
    "Increase success rates by up to 30%",
    "Reduce labor costs through automation",
    "Complete regulatory compliance",
    "Real-time inventory tracking",
    "Mobile-friendly for field use",
    "Scalable from small to large operations"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
              <FloraTrackLogo width={140} height={35} />
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setCurrentView('home')}
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentView('home');
                  setTimeout(() => {
                    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => setCurrentView('contact')}
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Contact
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="hidden sm:block px-4 py-2 text-green-600 hover:text-green-700 font-semibold transition-colors disabled:opacity-50"
              >
                Try Demo
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleRegisterTenant}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Professional Crop Propagation{' '}
                <span className="text-green-600">Management</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Track every plant from cutting to customer with FloraTrack - the complete solution for modern nurseries and propagation operations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={handleRegisterTenant}
                  className="flex-1 sm:flex-none bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowRequestDemo(true)}
                  className="flex-1 sm:flex-none bg-white text-green-600 px-8 py-4 rounded-lg border-2 border-green-600 hover:bg-green-50 transition-colors font-semibold text-lg"
                >
                  Request Demo
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Leaf className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">500+ Nurseries</h3>
                    <p className="text-gray-600 text-sm">Trust FloraTrack worldwide</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">30% Increase</h3>
                    <p className="text-gray-600 text-sm">In propagation success rates</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">10,000+ Users</h3>
                    <p className="text-gray-600 text-sm">Growing plants smarter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for plant propagation professionals with features that matter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-gradient-to-b from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Propagation Workflow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track every stage from budwood collection to final shipment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Workflow Steps */}
            {[
              { icon: Scissors, title: 'Budwood Collection', color: 'purple', step: 1 },
              { icon: TreePine, title: 'Grafting Operations', color: 'blue', step: 2 },
              { icon: Sprout, title: 'Seedling Development', color: 'green', step: 3 },
              { icon: Home, title: 'Nursery Beds', color: 'orange', step: 4 }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow relative">
                  <div className={`bg-${item.color}-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative`}>
                    <Icon className={`w-10 h-10 text-${item.color}-600`} />
                    <div className={`absolute -top-2 -right-2 bg-${item.color}-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold`}>
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-4">{item.title}</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Track source and quality
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Monitor success rates
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Generate reports
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="scroll-mt-16">
        <PricingPlans onSelectPlan={handleSelectPlan} />
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to transform your nursery operations?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Join hundreds of successful growers who trust FloraTrack for their propagation management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRegisterTenant}
                className="bg-white text-green-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setCurrentView('contact')}
                className="bg-green-700 text-white px-8 py-4 rounded-lg hover:bg-green-800 transition-colors font-semibold text-lg border-2 border-white"
              >
                Contact Sales
              </button>
            </div>
            <p className="mt-6 text-green-100">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <FloraTrackLogo width={160} height={40} variant="dark" />
              <p className="text-gray-400 mt-4">
                Professional crop propagation management for modern growers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button onClick={() => setCurrentView('home')} className="hover:text-white transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('contact')} className="hover:text-white transition-colors">
                    Contact Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowRequestDemo(true)} className="hover:text-white transition-colors">
                    Request Demo
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  support@floratrack.com
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  +1 (555) 123-4567
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FloraTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">Or try our demo</p>
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
              >
                Login with Demo Account
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setShowLogin(false);
                    handleRegisterTenant();
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Create Organization
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Platform Administrator?{' '}
                <button
                  onClick={() => {
                    setShowLogin(false);
                    navigate('/admin/login');
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Admin Sign In
                </button>
              </p>
            </div>

            <button
              onClick={() => setShowLogin(false)}
              className="mt-4 w-full text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Request Demo Modal */}
      {showRequestDemo && <RequestDemo onClose={() => setShowRequestDemo(false)} />}
    </div>
  );
};

export default EnhancedLandingPage;
