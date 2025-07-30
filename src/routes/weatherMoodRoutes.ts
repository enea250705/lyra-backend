import express from 'express';
import WeatherMoodController from '../controllers/weatherMoodController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();
const weatherMoodController = new WeatherMoodController();

// Validation schemas
const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required()
});

const moodCorrelationSchema = Joi.object({
  mood: Joi.number().min(1).max(10).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required()
});

const sleepAdjustmentSchema = Joi.object({
  userId: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
  sleepData: Joi.object({
    bedtime: Joi.date().optional(),
    wakeTime: Joi.date().optional(),
    sleepQuality: Joi.number().min(1).max(10).optional()
  }).optional()
});

const comprehensiveDataSchema = Joi.object({
  userId: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
  currentMood: Joi.number().min(1).max(10).required()
});

/**
 * @swagger
 * /api/v1/weather-mood/weather:
 *   get:
 *     summary: Get weather data for a specific location
 *     tags: [Weather & Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Weather data retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/weather', authenticate, weatherMoodController.getWeatherData);

/**
 * @swagger
 * /api/v1/weather-mood/correlate:
 *   post:
 *     summary: Correlate mood with weather conditions
 *     tags: [Weather & Mood]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mood:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               lat:
 *                 type: number
 *               lon:
 *                 type: number
 *     responses:
 *       200:
 *         description: Mood-weather correlation calculated successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.post('/correlate', authenticate, validateRequest(moodCorrelationSchema), weatherMoodController.correlateMoodWithWeather);

/**
 * @swagger
 * /api/v1/weather-mood/nearby-stores:
 *   get:
 *     summary: Get nearby expensive stores
 *     tags: [Weather & Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Nearby expensive stores retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/nearby-stores', authenticate, weatherMoodController.getNearbyExpensiveStores);

/**
 * @swagger
 * /api/v1/weather-mood/adjust-sleep:
 *   post:
 *     summary: Adjust sleep tracking for current timezone
 *     tags: [Weather & Mood]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               lat:
 *                 type: number
 *               lon:
 *                 type: number
 *               sleepData:
 *                 type: object
 *                 properties:
 *                   bedtime:
 *                     type: string
 *                     format: date-time
 *                   wakeTime:
 *                     type: string
 *                     format: date-time
 *                   sleepQuality:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 10
 *     responses:
 *       200:
 *         description: Sleep tracking adjusted successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.post('/adjust-sleep', authenticate, validateRequest(sleepAdjustmentSchema), weatherMoodController.adjustSleepTracking);

/**
 * @swagger
 * /api/v1/weather-mood/comprehensive:
 *   post:
 *     summary: Get comprehensive location-based mood data
 *     tags: [Weather & Mood]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               lat:
 *                 type: number
 *               lon:
 *                 type: number
 *               currentMood:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Comprehensive data retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.post('/comprehensive', authenticate, validateRequest(comprehensiveDataSchema), weatherMoodController.getComprehensiveData);

/**
 * @swagger
 * /api/v1/weather-mood/timezone:
 *   get:
 *     summary: Get timezone information for a location
 *     tags: [Weather & Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Timezone information retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/timezone', authenticate, weatherMoodController.getTimezoneInfo);

export default router;