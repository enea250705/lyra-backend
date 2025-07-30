import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import Subscription, { SubscriptionPlan, SubscriptionStatus } from '../models/Subscription';
import User from '../models/User';
// import adaptyService from '../services/adaptyService'; // Commented out for now
import { sendSuccess, sendError } from '../utils/response';
import { PLANS, getPlanById } from '../types/plans';
import logger from '../utils/logger';
import nativeReceiptService from '../services/nativeReceiptService';

class SubscriptionController {
  /**
   * Get current user's subscription
   * @route GET /api/v1/subscription
   */
  getSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      let subscription = await Subscription.findOne({
        where: { userId },
      });

      if (!subscription) {
        // Create a default free subscription
        subscription = await Subscription.create({
          userId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          cancelAtPeriodEnd: false,
        });
      }

      const planInfo = getPlanById(subscription.plan);

      sendSuccess(res, {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          isActive: subscription.isActive(),
          isPro: subscription.isPro(),
          isPremium: subscription.isPremium(),
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          dataRetentionDays: subscription.getDataRetentionDays(),
        },
        planInfo,
      }, 'Subscription retrieved successfully');
    } catch (error) {
      logger.error('Error getting subscription:', error);
      sendError(res, 'Failed to retrieve subscription', 500);
    }
  };

  /**
   * Get all available plans
   * @route GET /api/v1/subscription/plans
   */
  getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      sendSuccess(res, { plans: PLANS }, 'Plans retrieved successfully');
    } catch (error) {
      logger.error('Error getting plans:', error);
      sendError(res, 'Failed to retrieve plans', 500);
    }
  };

  /**
   * Create a subscription
   * @route POST /api/v1/subscription/create
   */
  createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { planId } = req.body;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      if (!planId) {
        sendError(res, 'Plan ID is required', 400);
        return;
      }

      const plan = getPlanById(planId);
      if (!plan) {
        sendError(res, 'Invalid plan ID', 400);
        return;
      }

      if (plan.id === 'free') {
        sendError(res, 'Cannot create paid subscription for free plan', 400);
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      let subscription = await Subscription.findOne({
        where: { userId },
      });

      let customerUserId = subscription?.adaptyCustomerUserId;

      // Create Adapty profile if doesn't exist
      if (!customerUserId) {
        // Generate a mock customer ID for development
        customerUserId = `customer_${user.id}_${Date.now()}`;
        logger.info('Generated mock Adapty customer ID:', customerUserId);
      }

      // Note: RevenueCat subscriptions are typically created on the client side
      // This endpoint prepares the subscription record for client-side purchase
      
      // Update local subscription
      if (subscription) {
        await subscription.update({
          plan: plan.id as SubscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          adaptyCustomerUserId: customerUserId,
          adaptyProductId: plan.adaptyProductId,
          cancelAtPeriodEnd: false,
        });
      } else {
        subscription = await Subscription.create({
          userId,
          plan: plan.id as SubscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          adaptyCustomerUserId: customerUserId,
          adaptyProductId: plan.adaptyProductId,
          cancelAtPeriodEnd: false,
        });
      }

      sendSuccess(res, {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
        customerUserId: customerUserId,
        productId: plan.adaptyProductId,
      }, 'Subscription prepared successfully');
    } catch (error) {
      logger.error('Error creating subscription:', error);
      sendError(res, 'Failed to create subscription', 500);
    }
  };

  /**
   * Update subscription plan
   * @route PUT /api/v1/subscription/update
   */
  updateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { planId } = req.body;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      if (!planId) {
        sendError(res, 'Plan ID is required', 400);
        return;
      }

      const plan = getPlanById(planId);
      if (!plan) {
        sendError(res, 'Invalid plan ID', 400);
        return;
      }

      const subscription = await Subscription.findOne({
        where: { userId },
      });

      if (!subscription) {
        sendError(res, 'Subscription not found', 404);
        return;
      }

      if (plan.id === 'free') {
        // Downgrade to free
        await subscription.update({
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          adaptyProductId: undefined,
          adaptyTransactionId: undefined,
          currentPeriodStart: undefined,
          currentPeriodEnd: undefined,
          cancelAtPeriodEnd: false,
        });
      } else {
        // Update to paid plan
        // Note: Adapty subscription changes are typically handled on the client side
        // This endpoint updates the local subscription record
        
        await subscription.update({
          plan: plan.id as SubscriptionPlan,
          adaptyProductId: plan.adaptyProductId,
        });
      }

      sendSuccess(res, {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      }, 'Subscription updated successfully');
    } catch (error) {
      logger.error('Error updating subscription:', error);
      sendError(res, 'Failed to update subscription', 500);
    }
  };

  /**
   * Cancel subscription
   * @route DELETE /api/v1/subscription/cancel
   */
  cancelSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { immediate = false } = req.body;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const subscription = await Subscription.findOne({
        where: { userId },
      });

      if (!subscription) {
        sendError(res, 'Subscription not found', 404);
        return;
      }

      if (subscription.plan === SubscriptionPlan.FREE) {
        sendError(res, 'Cannot cancel free subscription', 400);
        return;
      }

      if (!subscription.adaptyCustomerUserId) {
        sendError(res, 'No active Adapty subscription found', 400);
        return;
      }

      // Note: Adapty subscription cancellation is typically handled on the client side
      // This endpoint updates the local subscription record
      
      await subscription.update({
        cancelAtPeriodEnd: !immediate,
        status: immediate ? SubscriptionStatus.CANCELED : SubscriptionStatus.ACTIVE,
        canceledAt: immediate ? new Date() : undefined,
      });

      sendSuccess(res, {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      }, immediate ? 'Subscription canceled immediately' : 'Subscription will be canceled at period end');
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      sendError(res, 'Failed to cancel subscription', 500);
    }
  };

  /**
   * Get customer portal URL for managing subscription
   * @route GET /api/v1/subscription/portal
   */
  getCustomerPortal = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const subscription = await Subscription.findOne({
        where: { userId },
      });

      if (!subscription || !subscription.adaptyCustomerUserId) {
        sendError(res, 'No Adapty customer found', 404);
        return;
      }

      // Generate a mock management URL for development
      const managementUrl = `https://adapty.io/manage/${subscription.adaptyCustomerUserId}`;
      logger.info('Generated mock management URL:', managementUrl);

      sendSuccess(res, { managementUrl }, 'Customer management URL generated');
    } catch (error) {
      logger.error('Error getting customer portal:', error);
      sendError(res, 'Failed to generate customer management URL', 500);
    }
  };

  /**
   * Sync subscription status from client
   * @route POST /api/v1/subscription/sync
   */
  syncFromClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { adaptyProfile } = req.body;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      if (!adaptyProfile) {
        sendError(res, 'Adapty profile data required', 400);
        return;
      }

      // Update subscription based on client Adapty profile
      let subscription = await Subscription.findOne({
        where: { userId },
      });

      const isPro = adaptyProfile.accessLevels?.pro?.isActive || false;
      const isPremium = adaptyProfile.accessLevels?.premium?.isActive || false;
      
      const plan = isPremium ? SubscriptionPlan.PREMIUM : isPro ? SubscriptionPlan.PRO : SubscriptionPlan.FREE;
      const status = (isPro || isPremium) ? SubscriptionStatus.ACTIVE : SubscriptionStatus.CANCELED;

      if (subscription) {
        await subscription.update({
          plan,
          status,
          adaptyCustomerUserId: adaptyProfile.profileId,
        });
      } else {
        subscription = await Subscription.create({
          userId,
          plan,
          status,
          adaptyCustomerUserId: adaptyProfile.profileId,
          cancelAtPeriodEnd: false,
        });
      }

      sendSuccess(res, {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
        },
      }, 'Subscription synced successfully');
    } catch (error) {
      logger.error('Error syncing subscription:', error);
      sendError(res, 'Sync failed', 500);
    }
  };

  /**
   * Check feature access
   * @route GET /api/v1/subscription/feature/:featureId
   */
  checkFeatureAccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { featureId } = req.params;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const subscription = await Subscription.findOne({
        where: { userId },
      });

      const hasAccess = subscription?.canAccessFeature(featureId) || false;

      sendSuccess(res, {
        featureId,
        hasAccess,
        currentPlan: subscription?.plan || 'free',
      }, 'Feature access checked');
    } catch (error) {
      logger.error('Error checking feature access:', error);
      sendError(res, 'Failed to check feature access', 500);
    }
  };

  /**
   * Handle Adapty webhook events
   * @route POST /api/v1/subscription/webhook
   */
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Received webhook from Adapty:', req.body);
      
      // Webhook handling is typically used for production
      // For development and testing, we can acknowledge and log
      const { event_type, event_data } = req.body;
      
      switch (event_type) {
        case 'subscription_updated':
          logger.info('Subscription updated event received:', event_data);
          break;
        case 'subscription_cancelled':
          logger.info('Subscription cancelled event received:', event_data);
          break;
        case 'subscription_renewed':
          logger.info('Subscription renewed event received:', event_data);
          break;
        default:
          logger.info('Unknown webhook event type:', event_type);
      }

      // Always respond with 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Webhook handling error:', error);
      // Still return 200 to prevent webhook retries
      res.status(200).json({ received: true, error: 'Internal processing error' });
    }
  };

  /**
   * Validate native IAP receipt
   * @route POST /api/v1/subscription/validate-receipt
   */
  validateReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const { receipt, productId, transactionId, platform, purchaseToken, packageName } = req.body;

      if (!receipt || !productId || !transactionId || !platform) {
        sendError(res, 'Missing required receipt data', 400);
        return;
      }

      // Prepare receipt data based on platform
      const receiptData = platform === 'ios' ? {
        receipt,
        productId,
        transactionId,
        platform: 'ios' as const,
      } : {
        receipt,
        productId,
        transactionId,
        purchaseToken,
        packageName,
        platform: 'android' as const,
      };

      // Validate receipt with Apple/Google (or use mock in development)
      const isProduction = process.env.NODE_ENV === 'production';
      const validationResult = isProduction 
        ? await nativeReceiptService.validateReceipt(receiptData)
        : await nativeReceiptService.mockValidateReceipt(receiptData);

      if (!validationResult.success) {
        sendError(res, validationResult.error || 'Receipt validation failed', 400);
        return;
      }

      const { subscription: receiptSubscription } = validationResult;
      if (!receiptSubscription) {
        sendError(res, 'No subscription data in receipt', 400);
        return;
      }

      // Determine subscription plan
      const plan = nativeReceiptService.getSubscriptionPlan(productId);
      if (!plan) {
        sendError(res, 'Invalid product ID', 400);
        return;
      }

      // Update or create subscription in database
      let subscription = await Subscription.findOne({
        where: { userId },
      });

      const subscriptionData = {
        userId,
        plan: plan === 'pro' ? SubscriptionPlan.PRO : SubscriptionPlan.PREMIUM,
        status: receiptSubscription.isActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.CANCELED,
        currentPeriodStart: new Date(receiptSubscription.purchaseDate),
        currentPeriodEnd: new Date(receiptSubscription.expirationDate),
        cancelAtPeriodEnd: !receiptSubscription.autoRenewing,
        originalTransactionId: receiptSubscription.originalTransactionId,
        latestReceipt: receipt,
        environment: receiptSubscription.environment || 'production',
      };

      if (subscription) {
        await subscription.update(subscriptionData);
      } else {
        subscription = await Subscription.create(subscriptionData);
      }

      logger.info('Receipt validated and subscription updated:', {
        userId,
        plan,
        transactionId,
        isActive: receiptSubscription.isActive,
      });

      sendSuccess(res, {
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          expirationDate: subscription.currentPeriodEnd,
          autoRenewing: !subscription.cancelAtPeriodEnd,
        },
      }, 'Receipt validated successfully');

    } catch (error) {
      logger.error('Receipt validation error:', error);
      const message = error instanceof Error ? error.message : 'Receipt validation failed';
      sendError(res, message, 500);
    }
  };
}

export default SubscriptionController;