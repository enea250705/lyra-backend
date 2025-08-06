import express from 'express';
import { authenticate } from '../middleware/auth';
import { getChatMessages, createChatMessage, deleteChatMessages } from '../controllers/chatController';

const router = express.Router();

/**
 * @swagger
 * /api/v1/chat/messages:
 *   get:
 *     summary: Get chat messages for the authenticated user
 *     tags: [Chat]
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
 *           default: 50
 *     responses:
 *       200:
 *         description: Chat messages retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/messages', authenticate, getChatMessages);

/**
 * @swagger
 * /api/v1/chat/messages:
 *   post:
 *     summary: Create a new chat message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - sender
 *             properties:
 *               text:
 *                 type: string
 *               sender:
 *                 type: string
 *                 enum: [user, lyra]
 *               isVoice:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Chat message created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/messages', authenticate, createChatMessage);

/**
 * @swagger
 * /api/v1/chat/messages:
 *   delete:
 *     summary: Delete all chat messages for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All chat messages deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/messages', authenticate, deleteChatMessages);

export default router; 