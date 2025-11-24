import { useState, useCallback } from 'react';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionData {
  subscription: any;
  features: any;
  is_trial: boolean;
  can_access_platform: boolean;
}

interface UseSubscriptionReturn {
  subscriptionData: SubscriptionData | null;
  plans: any[];
  loading: boolean;
  error: string | null;
  fetchSubscription: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  upgradePlan: (planId: string, immediate?: boolean) => Promise<void>;
  cancelSubscription: (reason: string, immediate?: boolean) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  clearError: () => void;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { isAuthenticated, user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setError('Please login to access subscription data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionAPI.getMySubscription();
      setSubscriptionData(response.data);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionAPI.getPlans();
      setPlans(response.data.plans);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const upgradePlan = useCallback(async (planId: string, immediate: boolean = false) => {
    if (!isAuthenticated || !user) {
      setError('Please login to upgrade your plan');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await subscriptionAPI.upgradePlan({ new_plan_id: planId, immediate });
      // Refresh subscription data after upgrade
      await fetchSubscription();
    } catch (err: any) {
      console.error('Error upgrading plan:', err);
      setError(err.message || 'Failed to upgrade plan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchSubscription]);

  const cancelSubscription = useCallback(async (reason: string, immediate: boolean = false) => {
    if (!isAuthenticated || !user) {
      setError('Please login to cancel your subscription');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await subscriptionAPI.cancelSubscription({ reason, immediate });
      // Refresh subscription data after cancellation
      await fetchSubscription();
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchSubscription]);

  const reactivateSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setError('Please login to reactivate your subscription');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await subscriptionAPI.reactivateSubscription();
      // Refresh subscription data after reactivation
      await fetchSubscription();
    } catch (err: any) {
      console.error('Error reactivating subscription:', err);
      setError(err.message || 'Failed to reactivate subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchSubscription]);

  return {
    subscriptionData,
    plans,
    loading,
    error,
    fetchSubscription,
    fetchPlans,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription,
    clearError,
  };
};

export type { SubscriptionData };