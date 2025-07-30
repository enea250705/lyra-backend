import { Router } from 'express';
import {
  createEnergyEntry,
  getEnergyEntries,
  getEnergyEntry,
  updateEnergyEntry,
  deleteEnergyEntry,
  getEnergyTrends,
} from '../controllers/energyController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { energySchemas, paginationSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/energy:
 *   post:
 *     tags: [Energy Tracking]
 *     summary: Create an energy entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - energyLevel
 *             properties:
 *               energyLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               energyEmoji:
 *                 type: string
 *                 maxLength: 10
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Energy entry created successfully
 */
router.post('/', authenticate, validateBody(energySchemas.create), createEnergyEntry);

/**
 * @swagger
 * /api/v1/energy:
 *   get:
 *     tags: [Energy Tracking]
 *     summary: Get paginated energy entries
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
 *         description: Energy entries retrieved successfully
 */
router.get('/', authenticate, validateQuery(paginationSchema), getEnergyEntries);

/**
 * @swagger
 * /api/v1/energy/trends:
 *   get:
 *     tags: [Energy Tracking]
 *     summary: Get energy trends
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
 *         description: Energy trends retrieved successfully
 */
router.get('/trends', authenticate, getEnergyTrends);

/**
 * @swagger
 * /api/v1/energy/{id}:
 *   get:
 *     tags: [Energy Tracking]
 *     summary: Get energy entry by ID
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
 *         description: Energy entry retrieved successfully
 *       404:
 *         description: Energy entry not found
 */
router.get('/:id', authenticate, getEnergyEntry);

/**
 * @swagger
 * /api/v1/energy/{id}:
 *   put:
 *     tags: [Energy Tracking]
 *     summary: Update energy entry
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
 *               energyLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               energyEmoji:
 *                 type: string
 *                 maxLength: 10
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Energy entry updated successfully
 *       404:
 *         description: Energy entry not found
 */
router.put('/:id', authenticate, validateBody(energySchemas.create), updateEnergyEntry);

/**
 * @swagger
 * /api/v1/energy/{id}:
 *   delete:
 *     tags: [Energy Tracking]
 *     summary: Delete energy entry
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
 *         description: Energy entry deleted successfully
 *       404:
 *         description: Energy entry not found
 */
router.delete('/:id', authenticate, deleteEnergyEntry);

export default router;