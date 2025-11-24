import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  CreditCard, CheckCircle, Clock, AlertTriangle,
  TrendingUp, Calendar, DollarSign, Info, Loader2
} from 'lucide-react';

const SubscriptionManagement = () => {
  const { subscription, features, isLoading, isTrial, cancelSubscription } = useSubscription();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
          <p className="text-gray-700 mb-4">You need an active subscription to access the platform.</p>
          <Link
            to="/landlord/plans"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      trial: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      past_due: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your RUMI platform subscription</p>
      </div>

      {/* Trial Banner */}
      {isTrial && (
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎁</span>
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-bold mb-2">Free Trial Active!</h3>
              <p className="text-purple-100 mb-3">
                You have <strong>{subscription.days_until_billing} days</strong> remaining in your 30-day free trial with full access to all features.
              </p>
              <p className="text-sm text-purple-200 mb-4">
                Trial ends: {new Date(subscription.trial_end!).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </p>
              <Link
                to="/landlord/plans"
                className="inline-block bg-white hover:bg-gray-100 text-purple-600 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Choose Your Plan
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Current Plan</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(subscription.status)}`}>
                {subscription.status_display}
              </span>
            </div>

            <div className="border-b pb-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{subscription.plan_details.name}</h3>
                  <p className="text-gray-600 mt-1">{subscription.plan_details.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {subscription.plan_details.price_display}
                  </div>
                  <div className="text-sm text-gray-500">{subscription.plan_details.billing_display}</div>
                </div>
              </div>
            </div>

            {/* Billing Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Billing Period</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Next Billing Date</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {new Date(subscription.next_billing_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  in {subscription.days_until_billing} days
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                to="/landlord/plans"
                className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Change Plan
              </Link>
              {subscription.status === 'active' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Feature Access */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Active Features</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {features?.active_features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Usage Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold mb-4">This Month</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Subscription</span>
                  <span className="font-bold">KES {subscription.subscription_amount.toLocaleString()}</span>
                </div>
                {subscription.plan_details.plan_type !== 'trial' && (
                  <div className="text-xs text-gray-500">
                    Auto-renews on {new Date(subscription.next_billing_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/landlord/plans"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
              >
                View All Plans
              </Link>
              <Link
                to="/landlord/subscription/payment-history"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
              >
                Payment History
              </Link>
              <Link
                to="/landlord/subscription/invoices"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
              >
                View Invoices
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Need Help?</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Our support team is here to help with any subscription questions.
                </p>
                <a
                  href="mailto:support@rumi.co.ke"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-4">
              We're sorry to see you go. Please let us know why you're canceling:
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason...</option>
                <option value="too_expensive">Too expensive</option>
                <option value="not_using">Not using the features</option>
                <option value="technical_issues">Technical issues</option>
                <option value="found_alternative">Found an alternative</option>
                <option value="temporary_pause">Temporary pause</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
              <p className="text-sm text-red-800">
                <strong>Important:</strong> Canceling your subscription will immediately remove access to premium features. Your data will be retained for 30 days in case you change your mind.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={isCancelling}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 py-2 rounded-lg font-semibold"
              >
                Keep Subscription
              </button>
              <button
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await cancelSubscription(cancelReason || 'No reason provided');
                    setShowCancelModal(false);
                    setCancelReason('');
                  } catch (error) {
                    console.error('Cancel error:', error);
                    alert('Failed to cancel subscription. Please try again.');
                  } finally {
                    setIsCancelling(false);
                  }
                }}
                disabled={isCancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;