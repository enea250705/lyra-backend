import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateAnalytics,
  testPrompt,
  hotSwapTemplate,
  trackPromptPerformance,
  getPromptRecommendations,
  exportTemplates,
  importTemplates
} from '../controllers/promptController';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PromptTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [system, user, function]
 *         category:
 *           type: string
 *           enum: [coaching, therapy, productivity, mindfulness, health, relationships, career, general]
 *         content:
 *           type: string
 *         variables:
 *           type: array
 *           items:
 *             type: string
 *         version:
 *           type: string
 *         isActive:
 *           type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         metadata:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/prompts:
 *   get:
 *     summary: Get all prompt templates
 *     tags: [Prompt Management]
 *     responses:
 *       200:
 *         description: List of all prompt templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromptTemplate'
 *                 count:
 *                   type: number
 *   post:
 *     summary: Create a new prompt template
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [system, user, function]
 *               category:
 *                 type: string
 *                 enum: [coaching, therapy, productivity, mindfulness, health, relationships, career, general]
 *               content:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - name
 *               - content
 *               - category
 *     responses:
 *       201:
 *         description: Prompt template created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.get('/', getAllTemplates);
router.post('/', authenticate, createTemplate);

/**
 * @swagger
 * /api/v1/prompts/{id}:
 *   get:
 *     summary: Get prompt template by ID
 *     tags: [Prompt Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Prompt template details
 *       404:
 *         description: Template not found
 *   put:
 *     summary: Update prompt template
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete prompt template
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', getTemplateById);
router.put('/:id', authenticate, updateTemplate);
router.delete('/:id', authenticate, deleteTemplate);

/**
 * @swagger
 * /api/v1/prompts/{id}/analytics:
 *   get:
 *     summary: Get prompt template analytics
 *     tags: [Prompt Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template analytics data
 *       404:
 *         description: Template not found
 */
router.get('/:id/analytics', getTemplateAnalytics);

/**
 * @swagger
 * /api/v1/prompts/{id}/test:
 *   post:
 *     summary: Test a prompt template
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               context:
 *                 type: object
 *               testMessage:
 *                 type: string
 *             required:
 *               - testMessage
 *     responses:
 *       200:
 *         description: Prompt test results
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/test', authenticate, testPrompt);

/**
 * @swagger
 * /api/v1/prompts/{id}/performance:
 *   post:
 *     summary: Track prompt performance metrics
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metrics:
 *                 type: object
 *                 properties:
 *                   responseTime:
 *                     type: number
 *                   userSatisfaction:
 *                     type: number
 *                   engagementScore:
 *                     type: number
 *                   effectivenessScore:
 *                     type: number
 *             required:
 *               - metrics
 *     responses:
 *       200:
 *         description: Performance metrics tracked successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/performance', authenticate, trackPromptPerformance);

/**
 * @swagger
 * /api/v1/prompts/recommendations:
 *   get:
 *     summary: Get personalized prompt recommendations
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [coaching, therapy, productivity, mindfulness, health, relationships, career, general]
 *         description: Prompt category
 *     responses:
 *       200:
 *         description: Personalized prompt recommendations
 *       400:
 *         description: Missing category parameter
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations', authenticate, getPromptRecommendations);

/**
 * @swagger
 * /api/v1/prompts/hot-swap:
 *   post:
 *     summary: Hot-swap active prompt templates
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldId:
 *                 type: string
 *               newId:
 *                 type: string
 *             required:
 *               - oldId
 *               - newId
 *     responses:
 *       200:
 *         description: Templates hot-swapped successfully
 *       400:
 *         description: Missing required template IDs
 *       404:
 *         description: One or both templates not found
 *       401:
 *         description: Unauthorized
 */
router.post('/hot-swap', authenticate, hotSwapTemplate);

/**
 * @swagger
 * /api/v1/prompts/export:
 *   get:
 *     summary: Export prompt templates
 *     tags: [Prompt Management]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *     responses:
 *       200:
 *         description: Templates exported as JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/export', exportTemplates);

/**
 * @swagger
 * /api/v1/prompts/import:
 *   post:
 *     summary: Import prompt templates
 *     tags: [Prompt Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/PromptTemplate'
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *             required:
 *               - templates
 *     responses:
 *       200:
 *         description: Import results
 *       400:
 *         description: Invalid templates data
 *       401:
 *         description: Unauthorized
 */
router.post('/import', authenticate, importTemplates);

export default router; 