import { Router } from 'express';
import {
  createCheckin,
  getCheckins,
  getTodayCheckin,
  getCheckinById,
  updateCheckin,
  deleteCheckin,
} from '../controllers/checkinController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { checkinSchemas, paginationSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/checkins:
 *   post:
 *     tags: [Daily Check-ins]
 *     summary: Create a daily check-in
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *               moodEmoji:
 *                 type: string
 *                 maxLength: 10
 *               voiceTranscriptionUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Check-in created successfully
 *       409:
 *         description: Already checked in today
 */
router.post('/', authenticate, validateBody(checkinSchemas.create), createCheckin);

/**
 * @swagger
 * /api/v1/checkins:
 *   get:
 *     tags: [Daily Check-ins]
 *     summary: Get paginated check-ins
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
 *     responses:
 *       200:
 *         description: Check-ins retrieved successfully
 */
router.get('/', authenticate, validateQuery(paginationSchema), getCheckins);

/**
 * @swagger
 * /api/v1/checkins/today:
 *   get:
 *     tags: [Daily Check-ins]
 *     summary: Get today's check-in
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's check-in retrieved successfully
 *       404:
 *         description: No check-in found for today
 */
router.get('/today', authenticate, getTodayCheckin);

/**
 * @swagger
 * /api/v1/checkins/{id}:
 *   get:
 *     tags: [Daily Check-ins]
 *     summary: Get check-in by ID
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
 *         description: Check-in retrieved successfully
 *       404:
 *         description: Check-in not found
 */
router.get('/:id', authenticate, getCheckinById);

/**
 * @swagger
 * /api/v1/checkins/{id}:
 *   put:
 *     tags: [Daily Check-ins]
 *     summary: Update check-in
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
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *               moodEmoji:
 *                 type: string
 *                 maxLength: 10
 *               voiceTranscriptionUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Check-in updated successfully
 *       404:
 *         description: Check-in not found
 */
router.put('/:id', authenticate, validateBody(checkinSchemas.create), updateCheckin);

/**
 * @swagger
 * /api/v1/checkins/{id}:
 *   delete:
 *     tags: [Daily Check-ins]
 *     summary: Delete check-in
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
 *         description: Check-in deleted successfully
 *       404:
 *         description: Check-in not found
 */
router.delete('/:id', authenticate, deleteCheckin);

export default router;