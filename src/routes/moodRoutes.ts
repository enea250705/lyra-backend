import { Router } from 'express';
import {
  createMoodEntry,
  getMoodEntries,
  getMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
  getMoodTrends,
} from '../controllers/moodController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { moodSchemas, paginationSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/mood:
 *   post:
 *     tags: [Mood Tracking]
 *     summary: Create a mood entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - moodValue
 *             properties:
 *               moodValue:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               moodCategory:
 *                 type: string
 *                 maxLength: 50
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Mood entry created successfully
 */
router.post('/', authenticate, validateBody(moodSchemas.create), createMoodEntry);

/**
 * @swagger
 * /api/v1/mood:
 *   get:
 *     tags: [Mood Tracking]
 *     summary: Get paginated mood entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Mood entries retrieved successfully
 */
router.get('/', authenticate, validateQuery(paginationSchema), getMoodEntries);

/**
 * @swagger
 * /api/v1/mood/trends:
 *   get:
 *     tags: [Mood Tracking]
 *     summary: Get mood trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: Mood trends retrieved successfully
 */
router.get('/trends', authenticate, getMoodTrends);

/**
 * @swagger
 * /api/v1/mood/{id}:
 *   get:
 *     tags: [Mood Tracking]
 *     summary: Get mood entry by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Mood entry retrieved successfully
 *       404:
 *         description: Mood entry not found
 */
router.get('/:id', authenticate, getMoodEntry);

/**
 * @swagger
 * /api/v1/mood/{id}:
 *   put:
 *     tags: [Mood Tracking]
 *     summary: Update mood entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moodValue:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               moodCategory:
 *                 type: string
 *                 maxLength: 50
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Mood entry updated successfully
 *       404:
 *         description: Mood entry not found
 */
router.put('/:id', authenticate, validateBody(moodSchemas.create), updateMoodEntry);

/**
 * @swagger
 * /api/v1/mood/{id}:
 *   delete:
 *     tags: [Mood Tracking]
 *     summary: Delete mood entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Mood entry deleted successfully
 *       404:
 *         description: Mood entry not found
 */
router.delete('/:id', authenticate, deleteMoodEntry);

export default router;