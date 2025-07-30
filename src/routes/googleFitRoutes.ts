import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import googleFitController from '../controllers/googleFitController';
import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

const router = Router();

// Validation schemas
const connectGoogleFitSchema = [
  body('accessToken').isString().notEmpty().withMessage('Access token is required'),
  body('refreshToken').optional().isString(),
  body('expiresIn').optional().isInt({ min: 1 }),
  body('scope').optional().isString()
];

const syncDataSchema = [
  body('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
];

const paginationSchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
];

const dateSchema = [
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date')
];

// Express-validator middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     GoogleFitConnection:
 *       type: object
 *       properties:
 *         connected:
 *           type: boolean
 *         connectionId:
 *           type: string
 *         scope:
 *           type: string
 *         isActive:
 *           type: boolean
 *     
 *     GoogleFitSteps:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         steps:
 *           type: integer
 *         distance:
 *           type: number
 *         calories:
 *           type: integer
 *         activeMinutes:
 *           type: integer
 *     
 *     GoogleFitHeartRate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         bpm:
 *           type: integer
 *         accuracy:
 *           type: integer
 *     
 *     GoogleFitActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         activityType:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: integer
 *         calories:
 *           type: integer
 *         distance:
 *           type: number
 *         steps:
 *           type: integer
 *     
 *     GoogleFitSleep:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         bedtime:
 *           type: string
 *           format: date-time
 *         wakeTime:
 *           type: string
 *           format: date-time
 *         durationHours:
 *           type: number
 *         sleepStages:
 *           type: object
 *           properties:
 *             light:
 *               type: number
 *             deep:
 *               type: number
 *             rem:
 *               type: number
 *             awake:
 *               type: number
 *     
 *     GoogleFitWeight:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         weightKg:
 *           type: number
 *         bodyFatPercentage:
 *           type: number
 *         muscleMassKg:
 *           type: number
 */

/**
 * @swagger
 * /api/v1/google-fit/connect:
 *   post:
 *     tags: [Google Fit]
 *     summary: Connect Google Fit account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Google Fit access token
 *               refreshToken:
 *                 type: string
 *                 description: Google Fit refresh token
 *               expiresIn:
 *                 type: integer
 *                 description: Token expiration time in seconds
 *               scope:
 *                 type: string
 *                 description: Google Fit API scopes
 *     responses:
 *       200:
 *         description: Google Fit connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoogleFitConnection'
 *       400:
 *         description: Invalid access token or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/connect', authenticate, connectGoogleFitSchema, handleValidationErrors, googleFitController.connectGoogleFit);

/**
 * @swagger
 * /api/v1/google-fit/disconnect:
 *   post:
 *     tags: [Google Fit]
 *     summary: Disconnect Google Fit account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google Fit disconnected successfully
 *       404:
 *         description: No Google Fit connection found
 *       500:
 *         description: Server error
 */
router.post('/disconnect', authenticate, googleFitController.disconnectGoogleFit);

/**
 * @swagger
 * /api/v1/google-fit/status:
 *   get:
 *     tags: [Google Fit]
 *     summary: Get Google Fit connection status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 tokenExpired:
 *                   type: boolean
 *                 scope:
 *                   type: string
 *                 syncHealth:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, critical]
 *                     lastFullSync:
 *                       type: string
 *                       format: date-time
 *                     failedDataTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     staleDataTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     successRate:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/status', authenticate, googleFitController.getConnectionStatus);

/**
 * @swagger
 * /api/v1/google-fit/sync:
 *   post:
 *     tags: [Google Fit]
 *     summary: Sync all Google Fit data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 default: 30
 *                 description: Number of days to sync backwards from today
 *     responses:
 *       200:
 *         description: Data synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 syncCompleted:
 *                   type: boolean
 *                 syncResults:
 *                   type: object
 *                   properties:
 *                     steps:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         count:
 *                           type: integer
 *                         error:
 *                           type: string
 *                     heartRate:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         count:
 *                           type: integer
 *                         error:
 *                           type: string
 *                     activities:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         count:
 *                           type: integer
 *                         error:
 *                           type: string
 *                     sleep:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         count:
 *                           type: integer
 *                         error:
 *                           type: string
 *                     weight:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         count:
 *                           type: integer
 *                         error:
 *                           type: string
 *                 syncedPeriod:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *       401:
 *         description: Invalid or expired Google Fit connection
 *       500:
 *         description: Server error
 */
router.post('/sync', authenticate, syncDataSchema, handleValidationErrors, googleFitController.syncAllData);

/**
 * @swagger
 * /api/v1/google-fit/steps:
 *   get:
 *     tags: [Google Fit]
 *     summary: Get Google Fit steps data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 30
 *     responses:
 *       200:
 *         description: Steps data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 steps:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GoogleFitSteps'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     weeklyAverage:
 *                       type: integer
 *                     monthlyTotal:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/steps', authenticate, paginationSchema, handleValidationErrors, googleFitController.getStepsData);

/**
 * @swagger
 * /api/v1/google-fit/heart-rate:
 *   get:
 *     tags: [Google Fit]
 *     summary: Get Google Fit heart rate data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for heart rate data (defaults to today)
 *     responses:
 *       200:
 *         description: Heart rate data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 heartRateData:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GoogleFitHeartRate'
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     averageHeartRate:
 *                       type: integer
 *                     restingHeartRate:
 *                       type: integer
 *                     dataPoints:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/heart-rate', authenticate, dateSchema, handleValidationErrors, googleFitController.getHeartRateData);

/**
 * @swagger
 * /api/v1/google-fit/activities:
 *   get:
 *     tags: [Google Fit]
 *     summary: Get Google Fit activities data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Activities data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GoogleFitActivity'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     weeklyStats:
 *                       type: object
 *                     workoutConsistency:
 *                       type: object
 *       500:
 *         description: Server error
 */
router.get('/activities', authenticate, paginationSchema, handleValidationErrors, googleFitController.getActivitiesData);

/**
 * @swagger
 * /api/v1/google-fit/sleep:
 *   get:
 *     tags: [Google Fit]
 *     summary: Get Google Fit sleep data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 30
 *     responses:
 *       200:
 *         description: Sleep data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sleepData:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GoogleFitSleep'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     weeklyAverage:
 *                       type: object
 *                     sleepTrends:
 *                       type: object
 *       500:
 *         description: Server error
 */
router.get('/sleep', authenticate, paginationSchema, handleValidationErrors, googleFitController.getSleepData);

/**
 * @swagger
 * /api/v1/google-fit/weight:
 *   get:
 *     tags: [Google Fit]
 *     summary: Get Google Fit weight data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for data range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for data range
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 30
 *     responses:
 *       200:
 *         description: Weight data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weightData:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GoogleFitWeight'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     weightTrend:
 *                       type: object
 *                     bodyCompositionTrend:
 *                       type: object
 *                     latestWeight:
 *                       $ref: '#/components/schemas/GoogleFitWeight'
 *       500:
 *         description: Server error
 */
router.get('/weight', authenticate, paginationSchema, handleValidationErrors, googleFitController.getWeightData);

/**
 * @swagger
 * /api/v1/google-fit/dashboard:
 *   get:
 *     tags: [Google Fit]
 *     summary: Get comprehensive Google Fit dashboard data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 today:
 *                   type: object
 *                   properties:
 *                     steps:
 *                       type: integer
 *                     stepsGoalProgress:
 *                       type: integer
 *                     averageHeartRate:
 *                       type: integer
 *                     distance:
 *                       type: number
 *                     calories:
 *                       type: integer
 *                 weekly:
 *                   type: object
 *                   properties:
 *                     averageSteps:
 *                       type: integer
 *                     activityStats:
 *                       type: object
 *                 latest:
 *                   type: object
 *                   properties:
 *                     weight:
 *                       $ref: '#/components/schemas/GoogleFitWeight'
 *                     activities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GoogleFitActivity'
 *                 syncHealth:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, critical]
 *                     lastFullSync:
 *                       type: string
 *                       format: date-time
 *                     failedDataTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     staleDataTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     successRate:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authenticate, googleFitController.getDashboardData);

export default router; 