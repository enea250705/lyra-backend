import { Router } from 'express';

// Import all route modules
import authRoutes from './authRoutes';
import checkinRoutes from './checkinRoutes';
import moodRoutes from './moodRoutes';
import energyRoutes from './energyRoutes';
import sleepRoutes from './sleepRoutes';
import focusRoutes from './focusRoutes';
import journalRoutes from './journalRoutes';
import notificationRoutes from './notificationRoutes';
import settingsRoutes from './settingsRoutes';
import analyticsRoutes from './analyticsRoutes';
import insightsRoutes from './insightsRoutes';
import aiRoutes from './aiRoutes';
import weatherMoodRoutes from './weatherMoodRoutes';
import googleFitRoutes from './googleFitRoutes';
import calendarRoutes from './calendarRoutes';
import savingsRoutes from './savingsRoutes';
import plaidRoutes from './plaidRoutes';
import dataRoutes from './dataRoutes';
import onboardingRoutes from './onboardingRoutes';
import chatRoutes from './chatRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import interventionRoutes from './interventionRoutes';
import pushRoutes from './pushRoutes';
import webhookRoutes from './webhookRoutes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/checkins', checkinRoutes);
router.use('/mood', moodRoutes);
router.use('/energy', energyRoutes);
router.use('/sleep', sleepRoutes);
router.use('/focus', focusRoutes);
router.use('/journal', journalRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/insights', insightsRoutes);
router.use('/ai', aiRoutes);
router.use('/weather-mood', weatherMoodRoutes);
router.use('/google-fit', googleFitRoutes);
router.use('/calendar', calendarRoutes);
router.use('/savings', savingsRoutes);
router.use('/plaid', plaidRoutes);
router.use('/data', dataRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/chat', chatRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/intervention', interventionRoutes);
router.use('/push', pushRoutes);
router.use('/webhook', webhookRoutes);

export default router;