import { Router } from 'express';
import {
  createSleepLog,
  getSleepLogs,
  getSleepTrends,
  updateSleepLog,
  deleteSleepLog,
} from '../controllers/sleepController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { sleepSchemas, paginationSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/sleep:
 *   post:
 *     tags: [Sleep Tracking]
 *     summary: Create a sleep log
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *               - qualityRating
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               qualityRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Sleep log created successfully
 */
router.post('/', authenticate, validateBody(sleepSchemas.create), createSleepLog);

/**
 * @swagger
 * /api/v1/sleep:
 *   get:
 *     tags: [Sleep Tracking]
 *     summary: Get paginated sleep logs
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
 *         description: Sleep logs retrieved successfully
 */
router.get('/', authenticate, validateQuery(paginationSchema), getSleepLogs);

/**
 * @swagger
 * /api/v1/sleep/trends:
 *   get:
 *     tags: [Sleep Tracking]
 *     summary: Get sleep trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: Sleep trends retrieved successfully
 */
router.get('/trends', authenticate, getSleepTrends);

/**
 * @swagger
 * /api/v1/sleep/{id}:
 *   put:
 *     tags: [Sleep Tracking]
 *     summary: Update sleep log
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
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               qualityRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Sleep log updated successfully
 *       404:
 *         description: Sleep log not found
 */
router.put('/:id', authenticate, validateBody(sleepSchemas.create), updateSleepLog);

/**
 * @swagger
 * /api/v1/sleep/{id}:
 *   delete:
 *     tags: [Sleep Tracking]
 *     summary: Delete sleep log
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
 *         description: Sleep log deleted successfully
 *       404:
 *         description: Sleep log not found
 */
router.delete('/:id', authenticate, deleteSleepLog);

export default router;