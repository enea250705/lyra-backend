import { Router } from 'express';
import {
  startFocusSession,
  endFocusSession,
  getFocusSessions,
  getActiveFocusSession,
  getFocusStats,
  deleteFocusSession,
} from '../controllers/focusController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { focusSchemas, paginationSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/focus/start:
 *   post:
 *     tags: [Focus Sessions]
 *     summary: Start a focus session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       201:
 *         description: Focus session started successfully
 *       409:
 *         description: Active session already exists
 */
router.post('/start', authenticate, validateBody(focusSchemas.start), startFocusSession);

/**
 * @swagger
 * /api/v1/focus/{id}/end:
 *   post:
 *     tags: [Focus Sessions]
 *     summary: End a focus session
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
 *               completed:
 *                 type: boolean
 *                 default: false
 *               distractionCount:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *     responses:
 *       200:
 *         description: Focus session ended successfully
 *       404:
 *         description: Active focus session not found
 */
router.post('/:id/end', authenticate, validateBody(focusSchemas.end), endFocusSession);

/**
 * @swagger
 * /api/v1/focus:
 *   get:
 *     tags: [Focus Sessions]
 *     summary: Get paginated focus sessions
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
 *         description: Focus sessions retrieved successfully
 */
router.get('/', authenticate, validateQuery(paginationSchema), getFocusSessions);

/**
 * @swagger
 * /api/v1/focus/active:
 *   get:
 *     tags: [Focus Sessions]
 *     summary: Get active focus session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active focus session retrieved successfully
 *       404:
 *         description: No active focus session found
 */
router.get('/active', authenticate, getActiveFocusSession);

/**
 * @swagger
 * /api/v1/focus/stats:
 *   get:
 *     tags: [Focus Sessions]
 *     summary: Get focus statistics
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
 *         description: Focus statistics retrieved successfully
 */
router.get('/stats', authenticate, getFocusStats);

/**
 * @swagger
 * /api/v1/focus/{id}:
 *   delete:
 *     tags: [Focus Sessions]
 *     summary: Delete focus session
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
 *         description: Focus session deleted successfully
 *       404:
 *         description: Focus session not found
 */
router.delete('/:id', authenticate, deleteFocusSession);

export default router;