import React, { useState, useEffect } from "react";
import { Zap, Shield, Star, Users, Check, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

import toast from 'react-hot-toast';

interface Plan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonLink: string;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: '$49',
    description: 'Perfect for small businesses getting started with e-commerce',
    features: [
      'Up to 100 product listings',
      'Basic AI optimization',
      'Weekly competitor analysis',
      'Email support',
      'Basic analytics',
    ],
    buttonText: 'Start Free Trial',
    buttonLink: '/register'
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'For growing businesses that need more power and features',
    features: [
      'Up to 1,000 product listings',
      'Advanced AI optimization',
      'Daily competitor analysis',
      'Priority email & chat support',
      'Advanced analytics',
      'A/B testing',
      'Multi-platform support'
    ],
    highlighted: true,
    buttonText: 'Get Started',
    buttonLink: '/register'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large businesses with custom requirements',
    features: [
      'Unlimited product listings',
      'Custom AI models',
      'Real-time competitor analysis',
      '24/7 dedicated support',
      'Custom analytics',
      'Advanced A/B testing',
      'API access',
      'Custom integrations',
      'Dedicated account manager'
    ],
    buttonText: 'Contact Sales',
    buttonLink: '/contact'
  }
];

const features = [
  {
    icon: <Zap className="h-6 w-6 text-indigo-500" />,
    name: 'AI-Powered Optimization',
    description: 'Our advanced AI algorithms optimize your product listings for maximum visibility and conversion.'
  },
  {
    icon: <Shield className="h-6 w-6 text-indigo-500" />,
    name: 'Competitor Analysis',
    description: 'Stay ahead of the competition with real-time market analysis and insights.'
  },
  {
    icon: <Star className="h-6 w-6 text-indigo-500" />,
    name: 'Multi-Platform Support',
    description: 'Manage your listings across Amazon, Shopify, Walmart, and more from a single dashboard.'
  },
  {
    icon: <Users className="h-6 w-6 text-indigo-500" />,
    name: 'Dedicated Support',
    description: '24/7 support from our team of e-commerce experts to help you succeed.'
  }
];

const faqs = [
  {
    question: 'How does the free trial work?',
    answer: 'Our 14-day free trial gives you full access to all features in the Professional plan. No credit card required to start.'
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee if you\'re not satisfied with our service.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.'
  }
];

export default function Pricing() {
  useEffect(() => {
    // TODO: move initialization logic here
  }, []);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      sessionStorage.setItem('selectedPlan', JSON.stringify({
        name: plan.name,
        billingCycle
      }));
      navigate('/register');
      return;
    }

    if (plan.name === 'Enterprise') {
      navigate('/contact');
      return;
    }

    // Redirect to registration for now
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Choose the perfect plan for your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="relative">
              <div className="flex items-center space-x-4 rounded-full bg-white dark:bg-gray-800 p-1 shadow-sm">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`${
                    billingCycle === 'monthly'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  } px-4 py-2 text-sm font-medium rounded-full transition-colors`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`${
                    billingCycle === 'annual'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  } px-4 py-2 text-sm font-medium rounded-full transition-colors`}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>
          </div>

          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 ring-1 ring-gray-200 dark:ring-gray-700 ${
                  plan.highlighted
                    ? 'bg-gray-900 dark:bg-indigo-900 ring-gray-900 dark:ring-indigo-700'
                    : 'bg-white dark:bg-gray-800'
                } xl:p-10`}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h2
                    className={`text-lg font-semibold leading-8 ${
                      plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {plan.name}
                  </h2>
                </div>
                <p
                  className={`mt-4 text-sm leading-6 ${
                    plan.highlighted ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span
                    className={`text-4xl font-bold tracking-tight ${
                      plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {billingCycle === 'annual'
                      ? plan.price === 'Custom'
                        ? 'Custom'
                        : `${parseInt(plan.price.slice(1)) * 0.8 * 12}` 
                      : plan.price}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span
                      className={`text-sm font-semibold leading-6 ${
                        plan.highlighted ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {billingCycle === 'annual' ? '/year' : '/month'}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => handleSubscribe(plan)}
                  className={`mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    plan.highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
                  }`}
                >
                  {plan.buttonText}
                </button>
                <ul
                  className={`mt-8 space-y-3 text-sm leading-6 ${
                    plan.highlighted ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check
                        className={`h-6 w-5 flex-none ${
                          plan.highlighted ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Everything you need to succeed
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                Our platform provides all the tools and features you need to optimize your e-commerce listings
                and stay ahead of the competition.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-5xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                        {feature.icon}
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
            <div className="mx-auto max-w-4xl divide-y divide-gray-900/10 dark:divide-gray-700">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900 dark:text-white">
                Frequently asked questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10 dark:divide-gray-700">
                {faqs.map((faq, index) => (
                  <div
                    key={faq.question}
                    className="pt-6"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <dt>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between text-left text-gray-900 dark:text-white"
                      >
                        <span className="text-base font-semibold leading-7">{faq.question}</span>
                        <span className="ml-6 flex h-7 items-center">
                          {expandedFaq === index ? (
                            <X className="h-6 w-6" />
                          ) : (
                            <Plus className="h-6 w-6" />
                          )}
                        </span>
                      </button>
                    </dt>
                    {expandedFaq === index && (
                      <dd className="mt-2 pr-12">
                        <p className="text-base leading-7 text-gray-600 dark:text-gray-400">
                          {faq.answer}
                        </p>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mx-auto mt-32 max-w-7xl sm:mt-40 sm:px-6 lg:px-8">
            <div className="relative isolate overflow-hidden bg-gray-900 dark:bg-indigo-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Boost your e-commerce success today
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                Join thousands of successful businesses using our platform to optimize their listings
                and increase sales.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/register"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Get started
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-semibold leading-6 text-white"
                >
                  Contact sales <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}