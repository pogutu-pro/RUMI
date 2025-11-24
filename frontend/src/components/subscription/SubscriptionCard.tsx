import React from 'react';
import { Check, Crown, Zap, TrendingUp } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  plan_type: 'trial' | 'basic' | 'medium' | 'advanced';
  billing_type: 'fixed' | 'revenue';
  fixed_price: string;
  revenue_percentage: string;
  features: Record<string, any>;
  description: string;
  billing_display: string;
  price_display: string;
}

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect?: (planId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  isLoading = false,
  className = ''
}) => {
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

  const getFeatureList = () => {
    return Object.entries(plan.features)
      .filter(([key, value]) => value === true)
      .slice(0, 5)
      .map(([key]) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
        isPopular ? 'ring-4 ring-blue-600 transform scale-105' : ''
      } ${isCurrentPlan ? 'opacity-75' : ''} ${className}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="bg-blue-600 text-white text-center py-2 font-bold text-sm">
          ⭐ MOST POPULAR
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
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
          {getFeatureList().map((feature) => (
            <div key={feature.key} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 text-sm">
                {feature.label}
              </span>
            </div>
          ))}
          {Object.values(plan.features).filter(v => v === true).length > 5 && (
            <div className="text-sm text-gray-500">
              + {Object.values(plan.features).filter(v => v === true).length - 5} more features
            </div>
          )}
        </div>

        {/* Action Button */}
        {isCurrentPlan ? (
          <div className="w-full bg-gray-100 text-gray-600 text-center py-3 rounded-lg font-semibold cursor-not-allowed">
            Current Plan
          </div>
        ) : (
          <button
            onClick={() => onSelect?.(plan.id)}
            disabled={isLoading}
            className={`w-full bg-gradient-to-r ${getPlanColor(plan.plan_type)} hover:opacity-90 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              'Select Plan'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;