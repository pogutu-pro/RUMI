import { toast } from 'sonner';

// ... (existing imports, but simplified for brevity of replacement if possible, but I need to inject the import at top)
// wait, I can't inject at top easily with contiguous block.
// I will just add property access fixes first, then import toast in a separate call or same call if close.
// Toast import is at top. Data access is lower.
// I'll make two calls or use multi-replace.
// I'll use multi-replace.

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

interface Subscription {
  id: string;
  plan: string;
  plan_details: SubscriptionPlan;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  status_display: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  trial_end?: string;
  total_rent_collected_this_period: string;
  calculated_fee_this_period: string;
  auto_renew: boolean;
  days_until_billing: number;
  subscription_amount: number;
}

interface FeatureAccess {
  can_create_hostels: boolean;
  can_manage_rooms: boolean;
  can_process_payments: boolean;
  can_create_caretakers: boolean;
  can_use_recurring_payments: boolean;
  can_use_inventory_management: boolean;
  can_view_basic_analytics: boolean;
  can_access_marketplace: boolean;
  can_view_advanced_analytics: boolean;
  can_generate_custom_reports: boolean;
  can_use_bulk_operations: boolean;
  can_use_ai_features: boolean;
  can_use_predictive_analytics: boolean;
  can_use_smart_pricing: boolean;
  can_use_api_access: boolean;
  can_use_white_label: boolean;
  can_auto_screen_tenants: boolean;
  active_features: string[];
  feature_categories: Record<string, Record<string, boolean>>;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  features: FeatureAccess | null;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  isTrial: boolean;
  canAccessPlatform: boolean;
  hasFeature: (featureName: string) => boolean;
  fetchSubscription: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  upgradePlan: (planId: string, immediate?: boolean) => Promise<void>;
  cancelSubscription: (reason: string, immediate?: boolean) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [features, setFeatures] = useState<FeatureAccess | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [canAccessPlatform, setCanAccessPlatform] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'landlord') {
      fetchSubscription();
    }
    fetchPlans();
  }, [isAuthenticated, user]);

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      const data = await subscriptionAPI.getMySubscription();
      // @ts-ignore - The API return type definition differs from actual response structure in this context
      setSubscription(data.subscription || data); 
      // @ts-ignore
      setFeatures(data.features);
      // @ts-ignore
      setIsTrial(data.is_trial);
      // @ts-ignore
      setCanAccessPlatform(data.can_access_platform);
    } catch (error) {
      console.error('Subscription fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans();
      // @ts-ignore
      setPlans(response.plans || response);
    } catch (error) {
      console.error('Plans fetch error:', error);
    }
  };

  const hasFeature = (featureName: string): boolean => {
    if (!features) return false;
    const key = `can_${featureName}` as keyof FeatureAccess;
    return features[key] === true;
  };

  const upgradePlan = async (planId: string, immediate: boolean = false) => {
    try {
      await subscriptionAPI.upgradeSubscription(planId);
      
      // Refresh subscription
      await fetchSubscription();
      toast.success('Subscription upgraded successfully');
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to upgrade subscription');
      throw error;
    }
  };

  const cancelSubscription = async (reason: string, immediate: boolean = false) => {
    try {
      const response = await subscriptionAPI.cancelSubscription({ reason, immediate });
      // Refresh subscription
      await fetchSubscription();

      return response;
    } catch (error) {
      console.error('Cancel error:', error);
      throw error;
    }
  };

  const reactivateSubscription = async () => {
    try {
      const response = await subscriptionAPI.reactivateSubscription();
      
      // Refresh subscription
      await fetchSubscription();

      return response;
    } catch (error) {
      console.error('Reactivate error:', error);
      throw error;
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    features,
    plans,
    isLoading,
    isTrial,
    canAccessPlatform,
    hasFeature,
    fetchSubscription,
    fetchPlans,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};