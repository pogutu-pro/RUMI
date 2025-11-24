import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Check, Zap, TrendingUp, Crown, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  plan_type: string;
  fixed_price: string;
  features: Record<string, any>;
  description: string;
  price_display: string;
  billing_display: string;
}

const PlanComparison = () => {
  const navigate = useNavigate();
  const { plans, subscription, upgradePlan } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string, immediate: boolean = false) => {
    if (subscription?.plan === planId) {
      return; // Already on this plan
    }

    setIsUpgrading(true);
    setSelectedPlanId(planId);

    try {
      await upgradePlan(planId, immediate);
      navigate('/landlord/subscription');
    } catch (error) {
      console.error('Plan upgrade error:', error);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setIsUpgrading(false);
      setSelectedPlanId(null);
    }
  };

  const getPlanIcon = (planType: string) => {
    const icons = {
      trial: <Zap className="w-8 h-8" />,
      basic: <Check className="w-8 h-8" />,
      medium: <TrendingUp className="w-8 h-8" />,
      advanced: <Crown className="w-8 h-8" />,
    };
    return icons[planType as keyof typeof icons] || <Check className="w-8 h-8" />;
  };

  const getPlanColor = (planType: string) => {
    const colors = {
      trial: 'from-purple-600 to-blue-600',
      basic: 'from-gray-700 to-gray-900',
      medium: 'from-blue-600 to-purple-600',
      advanced: 'from-yellow-500 to-orange-600',
    };
    return colors[planType as keyof typeof colors] || 'from-gray-700 to-gray-900';
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.plan === planId;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the subscription that best fits your business needs
          </p>
          {subscription?.status === 'trial' && (
            <div className="mt-4 inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
              🎁 You're currently on a free trial - Choose a plan before it expires!
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans
            .filter(plan => plan.plan_type !== 'trial')
            .map((plan) => {
              const currentPlan = isCurrentPlan(plan.id);
              const isPopular = plan.plan_type === 'medium';

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
                    isPopular ? 'ring-4 ring-blue-600 transform scale-105' : ''
                  } ${currentPlan ? 'opacity-75' : ''}`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="bg-blue-600 text-white text-center py-2 font-bold text-sm">
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {currentPlan && (
                    <div className="bg-green-600 text-white text-center py-2 font-bold text-sm">
                      ✓ CURRENT PLAN
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${getPlanColor(plan.plan_type)} rounded-2xl flex items-center justify-center text-white mb-4`}>
                      {getPlanIcon(plan.plan_type)}
                    </div>

                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6 min-h-[4rem]">{plan.description}</p>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price_display}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {plan.billing_display}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {Object.entries(plan.features)
                        .filter(([key, value]) => value === true)
                        .slice(0, 6)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      <div className="text-sm text-gray-500">
                        + {Object.values(plan.features).filter(v => v === true).length - 6} more features
                      </div>
                    </div>

                    {/* Action Button */}
                    {currentPlan ? (
                      <div className="w-full bg-gray-100 text-gray-600 text-center py-3 rounded-lg font-semibold cursor-not-allowed">
                        Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isUpgrading}
                        className={`w-full bg-gradient-to-r ${getPlanColor(plan.plan_type)} hover:opacity-90 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isUpgrading && selectedPlanId === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Upgrading...
                          </span>
                        ) : (
                          'Select Plan'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Detailed Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                  {plans
                    .filter(plan => plan.plan_type !== 'trial')
                    .sort((a, b) => {
                      const order = ['basic', 'medium', 'advanced'];
                      return order.indexOf(a.plan_type) - order.indexOf(b.plan_type);
                    })
                    .map((plan) => (
                      <th key={plan.id} className="px-6 py-4 text-center font-semibold text-gray-900">
                        {plan.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4 font-medium">Monthly Price</td>
                  {plans
                    .filter(plan => plan.plan_type !== 'trial')
                    .sort((a, b) => {
                      const order = ['basic', 'medium', 'advanced'];
                      return order.indexOf(a.plan_type) - order.indexOf(b.plan_type);
                    })
                    .map((plan) => (
                      <td key={plan.id} className="px-6 py-4 text-center font-semibold">
                        {plan.price_display}
                      </td>
                    ))}
                </tr>
                {[
                  'can_create_hostels',
                  'can_manage_rooms',
                  'can_process_payments',
                  'can_create_caretakers',
                  'can_use_recurring_payments',
                  'can_use_inventory_management',
                  'can_view_basic_analytics',
                  'can_access_marketplace',
                  'can_view_advanced_analytics',
                  'can_generate_custom_reports',
                  'can_use_bulk_operations',
                  'can_use_ai_features',
                  'can_use_predictive_analytics',
                  'can_use_smart_pricing',
                  'can_use_api_access',
                  'can_use_white_label',
                  'can_auto_screen_tenants'
                ].map((featureKey, index) => {
                  const featureName = featureKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <tr key={featureKey} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 font-medium">{featureName}</td>
                      {plans
                        .filter(plan => plan.plan_type !== 'trial')
                        .sort((a, b) => {
                          const order = ['basic', 'medium', 'advanced'];
                          return order.indexOf(a.plan_type) - order.indexOf(b.plan_type);
                        })
                        .map((plan) => (
                          <td key={plan.id} className="px-6 py-4 text-center">
                            {plan.features[featureKey] ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600">
                Yes! You can upgrade immediately or downgrade at your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
              <p className="text-gray-600">
                We offer prorated refunds if you cancel within the first 7 days of a new billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">
                We accept M-Pesa, bank cards, and bank transfers via Paystack.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a contract?</h4>
              <p className="text-gray-600">
                No long-term contracts. Pay monthly and cancel anytime without penalties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanComparison;