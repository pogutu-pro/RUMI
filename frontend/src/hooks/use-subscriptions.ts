import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getPlans,
  getPlanDetails,
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  checkFeatureAccess,
} from '@/features/payments';
import { toast } from 'sonner';

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: queryKeys.subscriptions.plans(),
    queryFn: getPlans,
  });
};

export const usePlanDetails = (planId: string) => {
  return useQuery({
    queryKey: queryKeys.subscriptions.plan(planId),
    queryFn: () => getPlanDetails(planId),
    enabled: !!planId,
  });
};

export const useMySubscription = () => {
  return useQuery({
    queryKey: queryKeys.subscriptions.mySubscription(),
    queryFn: getMySubscription,
  });
};

export const useUpgradeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upgradeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.mySubscription() });
      toast.success('Subscription upgraded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upgrade subscription');
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.mySubscription() });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });
};

export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.mySubscription() });
      toast.success('Subscription reactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reactivate subscription');
    },
  });
};

export const useFeatureAccess = (featureName: string) => {
  return useQuery({
    queryKey: queryKeys.subscriptions.featureAccess(featureName),
    queryFn: () => checkFeatureAccess(featureName),
    enabled: !!featureName,
  });
};
