import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { logger } from '@/services/logger';

type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'trialing' | 'past_due' | null;
type SubscriptionPlan = 'essentiel' | 'pro' | 'premium' | null;

interface UserLike {
  id: string;
  user_type?: string;
  email?: string;
}

export function useSubscription(user: UserLike | null) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(null);

  useEffect(() => {
    if (!user?.id || user.user_type !== 'doctor') return;

    const fetchSubscription = async (retryCount = 0) => {
      try {
        setSubscriptionLoading(true);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.access_token) {
          if (retryCount < 2) {
            setTimeout(() => fetchSubscription(retryCount + 1), 1000);
            return;
          }
          throw new Error('No valid session token');
        }

        const { data, error } = await supabase.functions.invoke('get-subscription-status');

        if (error) {
          if (error.message?.includes('401') && retryCount < 2) {
            setTimeout(() => fetchSubscription(retryCount + 1), 1000);
            return;
          }
          throw error;
        }

        if (data?.status) {
          setSubscriptionStatus(data.status);
          let plan = data.plan_type || data.plan || 'essentiel';
          if (data.plan_id && !plan) {
            if (data.plan_id.includes('pro')) plan = 'pro';
            else if (data.plan_id.includes('premium')) plan = 'premium';
            else plan = 'essentiel';
          }
          setSubscriptionPlan(plan);
          logger.info('[useSubscription] Subscription loaded', { status: data.status, plan });
        } else {
          setSubscriptionStatus('inactive');
          setSubscriptionPlan(null);
        }
      } catch (error) {
        logger.error('[useSubscription] Failed to fetch subscription', error as Error);
        const lastSuccessfulCheck = user?.id ? localStorage.getItem(`subscription_check_${user.id}`) : null;
        const now = Date.now();
        if (lastSuccessfulCheck && now - parseInt(lastSuccessfulCheck) < 5 * 60 * 1000) {
          return;
        }
        if (retryCount < 2) {
          setTimeout(() => fetchSubscription(retryCount + 1), 2000);
          return;
        }
        setSubscriptionStatus('inactive');
        setSubscriptionPlan(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    const markSuccessfulCheck = () => {
      if (user?.id && subscriptionStatus === 'active') {
        localStorage.setItem(`subscription_check_${user.id}`, Date.now().toString());
      }
    };

    fetchSubscription();
    markSuccessfulCheck();

    const intervalId = setInterval(() => {
      if (user?.id && user.user_type === 'doctor') {
        fetchSubscription();
      }
    }, 10 * 60 * 1000);

    const handleSubscriptionRefresh = () => {
      if (user?.id && user.user_type === 'doctor') {
        logger.info('[useSubscription] Manual subscription refresh triggered');
        fetchSubscription();
      }
    };

    window.addEventListener('subscription-refresh', handleSubscriptionRefresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('subscription-refresh', handleSubscriptionRefresh);
    };
  }, [user?.id, user?.user_type, subscriptionStatus]);

  const hasFeature = useCallback((feature: string) => {
    if (user?.user_type !== 'doctor') return true;
    if (subscriptionPlan === 'premium') return true;
    if (subscriptionPlan === 'pro') {
      const proFeatures = [
        'priorite', 'analytics', 'facturation', 'calendar', 'support-prioritaire',
        'invoices', 'premium_support', 'premium_api', 'premium_features'
      ];
      return proFeatures.includes(feature) || feature === 'essentiel';
    }
    return feature === 'essentiel';
  }, [user, subscriptionPlan]);

  const isSubscribed = useCallback(() => {
    if (user?.user_type !== 'doctor') return true;
    if (subscriptionLoading) return true;
    const validStatuses = ['active', 'trialing', 'past_due'];
    if (validStatuses.includes(subscriptionStatus || '')) return true;
    if (!subscriptionStatus && user?.id) {
      const lastSuccessfulCheck = localStorage.getItem(`subscription_check_${user.id}`);
      if (lastSuccessfulCheck) {
        const timeSince = Date.now() - parseInt(lastSuccessfulCheck);
        if (timeSince < 30 * 60 * 1000) {
          logger.info('[useSubscription] Using grace period for subscription check');
          return true;
        }
      }
    }
    return subscriptionStatus !== 'inactive' && subscriptionStatus !== 'canceled';
  }, [user, subscriptionStatus, subscriptionLoading]);

  const refreshSubscription = useCallback(() => {
    if (user?.id && user.user_type === 'doctor') {
      logger.info('[useSubscription] Manual subscription refresh requested');
      const event = new CustomEvent('subscription-refresh');
      window.dispatchEvent(event);
    }
  }, [user]);

  return {
    subscriptionStatus,
    subscriptionLoading,
    subscriptionPlan,
    hasFeature,
    isSubscribed,
    refreshSubscription,
  };
}
