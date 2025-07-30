import { Router } from 'express';
import {
  getUserSettings,
  updateUserSettings,
  toggleFeature,
  resetSettings,
} from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { settingsSchemas } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get user settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 */
router.get('/', authenticate, getUserSettings);

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     tags: [Settings]
 *     summary: Update user settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *               aiTone:
 *                 type: string
 *                 maxLength: 50
 *               timezone:
 *                 type: string
 *                 maxLength: 50
 *               language:
 *                 type: string
 *                 maxLength: 10
 *               featuresEnabled:
 *                 type: object
 *                 properties:
 *                   mood:
 *                     type: boolean
 *                   energy:
 *                     type: boolean
 *                   sleep:
 *                     type: boolean
 *                   focus:
 *                     type: boolean
 *                   journal:
 *                     type: boolean
 *                   calendar:
 *                     type: boolean
 *                   finance:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: User settings updated successfully
 */
router.put('/', authenticate, validateBody(settingsSchemas.update), updateUserSettings);

/**
 * @swagger
 * /api/v1/settings/features/{feature}:
 *   put:
 *     tags: [Settings]
 *     summary: Toggle a feature
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feature
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mood, energy, sleep, focus, journal, calendar, finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature toggled successfully
 *       400:
 *         description: Invalid feature name
 */
router.put('/features/:feature', authenticate, toggleFeature);

/**
 * @swagger
 * /api/v1/settings/reset:
 *   post:
 *     tags: [Settings]
 *     summary: Reset settings to defaults
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       404:
 *         description: Settings not found
 */
router.post('/reset', authenticate, resetSettings);

export default router;