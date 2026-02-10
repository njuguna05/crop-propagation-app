import React from 'react';
import { Check, X, Zap, TrendingUp, Building2 } from 'lucide-react';

const PricingPlans = ({ onSelectPlan }) => {
  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      price: 0,
      period: 'Free Forever',
      description: 'Perfect for small nurseries and hobbyists',
      color: 'green',
      features: [
        { name: 'Up to 500 plants', included: true },
        { name: 'Basic crop tracking', included: true },
        { name: 'Task management', included: true },
        { name: '5 team members', included: true },
        { name: 'Email support', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Data export (CSV)', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Multi-location support', included: false },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false },
        { name: 'Custom integrations', included: false }
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      icon: TrendingUp,
      price: 49,
      period: '/month',
      description: 'For growing operations and commercial nurseries',
      color: 'blue',
      features: [
        { name: 'Up to 5,000 plants', included: true },
        { name: 'Advanced crop tracking', included: true },
        { name: 'Order management', included: true },
        { name: '20 team members', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Data export (CSV/Excel)', included: true },
        { name: 'Advanced analytics & reports', included: true },
        { name: 'Multi-location support (up to 3)', included: true },
        { name: 'API access', included: true },
        { name: 'Phone support', included: true },
        { name: 'Custom integrations', included: false }
      ],
      cta: 'Start 14-Day Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      icon: Building2,
      price: null,
      period: 'Custom',
      description: 'For large operations with complex requirements',
      color: 'purple',
      features: [
        { name: 'Unlimited plants', included: true },
        { name: 'Full-featured tracking', included: true },
        { name: 'Advanced order & supply chain', included: true },
        { name: 'Unlimited team members', included: true },
        { name: '24/7 dedicated support', included: true },
        { name: 'Mobile & tablet apps', included: true },
        { name: 'All export formats', included: true },
        { name: 'Enterprise analytics', included: true },
        { name: 'Unlimited locations', included: true },
        { name: 'Full API access', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom integrations & features', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const getColorClasses = (color, popular) => {
    const colors = {
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700',
        icon: 'bg-green-100 text-green-600'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
        icon: 'bg-blue-100 text-blue-600'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700',
        icon: 'bg-purple-100 text-purple-600'
      }
    };
    return colors[color];
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your operation. All plans include our core features with no hidden fees.
          </p>
          <div className="mt-6 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <Check className="w-5 h-5 mr-2" />
            <span className="font-medium">14-day free trial • No credit card required • Cancel anytime</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const colors = getColorClasses(plan.color, plan.popular);
            const Icon = plan.icon;

            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg ${plan.popular ? 'ring-4 ring-blue-500 scale-105 md:scale-110' : 'border-2 border-gray-200'} transition-all duration-300 hover:shadow-xl`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="flex items-center mb-4">
                    <div className={`${colors.icon} p-3 rounded-lg mr-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 min-h-[48px]">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === null ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">Custom</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600 ml-2">{plan.period}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => onSelectPlan(plan.name.toLowerCase())}
                    className={`w-full ${colors.button} text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-6`}
                  >
                    {plan.cta}
                  </button>

                  {/* Features List */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      What's included:
                    </p>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h4>
              <p className="text-gray-600 text-sm">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600 text-sm">We accept all major credit cards, debit cards, and ACH transfers for annual plans.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-gray-900 mb-2">Is there a setup fee?</h4>
              <p className="text-gray-600 text-sm">No setup fees, ever. You only pay the monthly or annual subscription price.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-600 text-sm">Yes, you can cancel your subscription at any time with no penalties or fees.</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Trusted by over 500+ nurseries worldwide</p>
          <div className="flex justify-center items-center space-x-6 text-gray-400">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
