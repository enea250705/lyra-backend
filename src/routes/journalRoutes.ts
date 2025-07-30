import { Router } from 'express';
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../controllers/journalController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { journalSchemas, paginationSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/journal:
 *   post:
 *     tags: [Journal]
 *     summary: Create a journal entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *               voiceUrl:
 *                 type: string
 *                 format: uri
 *               pinProtected:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Journal entry created successfully
 */
router.post('/', authenticate, validateBody(journalSchemas.create), createJournalEntry);

/**
 * @swagger
 * /api/v1/journal:
 *   get:
 *     tags: [Journal]
 *     summary: Get paginated journal entries
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
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Journal entries retrieved successfully
 */
router.get('/', authenticate, validateQuery(paginationSchema), getJournalEntries);

/**
 * @swagger
 * /api/v1/journal/{id}:
 *   get:
 *     tags: [Journal]
 *     summary: Get journal entry by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: pin
 *         schema:
 *           type: string
 *         description: PIN for encrypted entries
 *     responses:
 *       200:
 *         description: Journal entry retrieved successfully
 *       403:
 *         description: PIN required for encrypted entry
 *       404:
 *         description: Journal entry not found
 */
router.get('/:id', authenticate, getJournalEntry);

/**
 * @swagger
 * /api/v1/journal/{id}:
 *   put:
 *     tags: [Journal]
 *     summary: Update journal entry
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
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *               voiceUrl:
 *                 type: string
 *                 format: uri
 *               pinProtected:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Journal entry updated successfully
 *       404:
 *         description: Journal entry not found
 */
router.put('/:id', authenticate, validateBody(journalSchemas.update), updateJournalEntry);

/**
 * @swagger
 * /api/v1/journal/{id}:
 *   delete:
 *     tags: [Journal]
 *     summary: Delete journal entry
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
 *         description: Journal entry deleted successfully
 *       404:
 *         description: Journal entry not found
 */
router.delete('/:id', authenticate, deleteJournalEntry);

export default router;