import { Request, Response, NextFunction } from 'express';
import Subscription, { SubscriptionPlan, SubscriptionStatus } from '../models/Subscription';
import { sendError } from '../utils/response';
import logger from '../utils/logger';
import { AuthenticatedRequest, RequestWithSubscription as RequestWithSubscriptionType } from '../types';

export interface RequestWithSubscription extends AuthenticatedRequest, RequestWithSubscriptionType {
  subscription?: Subscription;
}

export const attachSubscription = async (
  req: RequestWithSubscription,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    const subscription = await Subscription.findOne({
      where: { userId },
    });

    if (!subscription) {
      // Create a default free subscription for the user
      const newSubscription = await Subscription.create({
        userId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
      });
      req.subscription = newSubscription;
    } else {
      req.subscription = subscription;
    }

    next();
  } catch (error) {
    logger.error('Error attaching subscription:', error);
    next();
  }
};

export const requirePlan = (requiredPlan: 'pro' | 'premium') => {
  return (req: RequestWithSubscription, res: Response, next: NextFunction) => {
    const subscription = req.subscription;

    if (!subscription) {
      return sendError(res, 'Subscription not found', 403);
    }

    const hasAccess = requiredPlan === 'pro' ? subscription.isPro() : subscription.isPremium();

    if (!hasAccess) {
      return sendError(res, `${requiredPlan.toUpperCase()} plan required for this feature`, 403, [{
        upgradeRequired: true,
        currentPlan: subscription.plan,
        requiredPlan,
      }]);
    }

    next();
  };
};

export const requireFeature = (featureId: string) => {
  return (req: RequestWithSubscription, res: Response, next: NextFunction) => {
    const subscription = req.subscription;

    if (!subscription) {
      return sendError(res, 'Subscription not found', 403);
    }

    if (!subscription.canAccessFeature(featureId)) {
      return sendError(res, `Feature '${featureId}' not available in your current plan`, 403, [{
        upgradeRequired: true,
        currentPlan: subscription.plan,
        featureId,
      }]);
    }

    next();
  };
};

export const checkDataRetention = (req: RequestWithSubscription, res: Response, next: NextFunction) => {
  const subscription = req.subscription;

  if (!subscription) {
    return next();
  }

  const retentionDays = subscription.getDataRetentionDays();
  
  if (retentionDays > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    req.dataRetentionDate = cutoffDate;
  }

  next();
};

export const checkLimits = (limitType: 'goals' | 'notifications' | 'interventions') => {
  return async (req: RequestWithSubscription, res: Response, next: NextFunction) => {
    const subscription = req.subscription;

    if (!subscription) {
      return next();
    }

    const limits = subscription.plan === 'free' ? {
      maxGoals: 3,
      maxNotifications: 5,
      maxInterventions: 0,
    } : subscription.plan === 'pro' ? {
      maxGoals: 10,
      maxNotifications: 50,
      maxInterventions: 100,
    } : {
      maxGoals: -1,
      maxNotifications: -1,
      maxInterventions: -1,
    };

    const maxLimit = limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}` as keyof typeof limits];

    if (maxLimit > 0) {
      // Check current count based on limit type
      let currentCount = 0;
      
      try {
        // This would need to be implemented based on your specific models
        // For now, just pass through
        currentCount = 0;
      } catch (error) {
        logger.error(`Error checking ${limitType} limits:`, error);
      }

      if (currentCount >= maxLimit) {
        return sendError(res, `You have reached your ${limitType} limit for your current plan`, 403, [{
          upgradeRequired: true,
          currentPlan: subscription.plan,
          limitType,
          currentCount,
          maxLimit,
        }]);
      }
    }

    next();
  };
};

// Helper function to check if user has access to a feature
export const hasFeatureAccess = (subscription: Subscription | null, featureId: string): boolean => {
  if (!subscription) {
    return false;
  }
  return subscription.canAccessFeature(featureId);
};

// Helper function to get user's plan info
export const getPlanInfo = (subscription: Subscription | null) => {
  if (!subscription) {
    return {
      plan: 'free',
      isActive: false,
      isPro: false,
      isPremium: false,
      dataRetentionDays: 30,
    };
  }

  return {
    plan: subscription.plan,
    isActive: subscription.isActive(),
    isPro: subscription.isPro(),
    isPremium: subscription.isPremium(),
    dataRetentionDays: subscription.getDataRetentionDays(),
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
};

declare global {
  namespace Express {
    interface Request {
      subscription?: Subscription;
      dataRetentionDate?: Date;
    }
  }
}