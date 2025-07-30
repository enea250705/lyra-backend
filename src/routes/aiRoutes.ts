import express from 'express';
import { authenticate } from '../middleware/auth';
import { 
  dailyCheckin, 
  generateInsight, 
  generateJournalPrompt, 
  chatWithLyra, 
  getAiStatus,
  startCoachingSession,
  handleCrisisSupport,
  updatePersonalityProfile,
  executeAction
} from '../controllers/aiController';

const router = express.Router();

/**
 * @swagger
 * /api/v1/ai/status:
 *   get:
 *     summary: Check AI service status and capabilities
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: AI service status with enhanced features
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configured:
 *                   type: boolean
 *                 provider:
 *                   type: string
 *                 status:
 *                   type: string
 *                 features:
 *                   type: object
 *                 availableFunctions:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/status', getAiStatus);

/**
 * @swagger
 * /api/v1/ai/checkin:
 *   post:
 *     summary: Daily check-in with enhanced AI support
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               mood:
 *                 type: string
 *               energy:
 *                 type: number
 *               sleep:
 *                 type: number
 *               stressLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               personalitySettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Check-in with context-aware AI response
 *       401:
 *         description: Unauthorized
 */
router.post('/checkin', authenticate, dailyCheckin);

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Enhanced chat with Lyra AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               conversationHistory:
 *                 type: array
 *                 items:
 *                   type: object
 *               functionType:
 *                 type: string
 *                 enum: [general, coaching, therapy, productivity, mindfulness, health, relationships, career]
 *               personalitySettings:
 *                 type: object
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: AI chat response with conversation memory
 *       401:
 *         description: Unauthorized
 */
router.post('/chat', authenticate, chatWithLyra);

/**
 * @swagger
 * /api/v1/ai/coaching/start:
 *   post:
 *     summary: Start a specialized coaching session
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal:
 *                 type: string
 *               initialMessage:
 *                 type: string
 *               personalitySettings:
 *                 type: object
 *             required:
 *               - goal
 *               - initialMessage
 *     responses:
 *       200:
 *         description: Coaching session started successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/coaching/start', authenticate, startCoachingSession);

/**
 * @swagger
 * /api/v1/ai/crisis-support:
 *   post:
 *     summary: Emergency crisis support with immediate response
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               stressLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               immediateNeeds:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - message
 *               - stressLevel
 *     responses:
 *       200:
 *         description: Crisis support response with emergency resources
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/crisis-support', authenticate, handleCrisisSupport);

/**
 * @swagger
 * /api/v1/ai/personality:
 *   put:
 *     summary: Update AI personality profile
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communicationStyle:
 *                 type: string
 *                 enum: [casual, formal, friendly, professional]
 *               supportLevel:
 *                 type: string
 *                 enum: [gentle, direct, motivational, therapeutic]
 *               insightDepth:
 *                 type: string
 *                 enum: [surface, moderate, deep, philosophical]
 *               responseLength:
 *                 type: string
 *                 enum: [brief, moderate, detailed, comprehensive]
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *               triggerWords:
 *                 type: array
 *                 items:
 *                   type: string
 *               avoidTopics:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Personality profile updated successfully
 *       400:
 *         description: Invalid personality settings
 *       401:
 *         description: Unauthorized
 */
router.put('/personality', authenticate, updatePersonalityProfile);

/**
 * @swagger
 * /api/v1/ai/insight:
 *   get:
 *     summary: Generate enhanced AI insights
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dataType
 *         schema:
 *           type: string
 *           enum: [mood, energy, sleep, journal, overall, patterns, predictions]
 *         description: Type of insight to generate
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Timeframe for insight
 *       - in: query
 *         name: insightDepth
 *         schema:
 *           type: string
 *           enum: [surface, moderate, deep, philosophical]
 *         description: Depth of insight analysis
 *       - in: query
 *         name: personalitySettings
 *         schema:
 *           type: string
 *         description: JSON string of personality settings
 *     responses:
 *       200:
 *         description: AI-generated insight with specified depth
 *       401:
 *         description: Unauthorized
 */
router.get('/insight', authenticate, generateInsight);

/**
 * @swagger
 * /api/v1/ai/journal-prompt:
 *   post:
 *     summary: Generate personalized journal prompts
 *     tags: [AI]
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
 *                 type: string
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               promptStyle:
 *                 type: string
 *                 enum: [creative, reflective, goal-oriented, therapeutic]
 *               personalitySettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Personalized journal prompt generated
 *       401:
 *         description: Unauthorized
 */
router.post('/journal-prompt', authenticate, generateJournalPrompt);

/**
 * @swagger
 * /api/v1/ai/execute-action:
 *   post:
 *     summary: Execute AI actions directly
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 description: The action to execute
 *               parameters:
 *                 type: object
 *                 description: Parameters for the action
 *               confirmed:
 *                 type: boolean
 *                 description: Whether user has confirmed the action
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Action executed successfully or requires confirmation
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/execute-action', authenticate, executeAction);

export default router;