import { Request, Response } from 'express';
import promptManagementService, { PromptTemplate, PromptContext } from '../services/promptManagementService';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = promptManagementService.getAllTemplates();
    
    sendSuccess(res, {
      templates,
      count: templates.length
    }, 'Prompt templates retrieved successfully');

  } catch (error) {
    logger.error('Get all templates error:', error);
    sendError(res, 'Failed to retrieve templates', 500);
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templates = promptManagementService.getAllTemplates();
    const template = templates.find(t => t.id === id);

    if (!template) {
      return sendError(res, 'Template not found', 404);
    }

    sendSuccess(res, { template }, 'Template retrieved successfully');

  } catch (error) {
    logger.error('Get template by ID error:', error);
    sendError(res, 'Failed to retrieve template', 500);
  }
};

export const createTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      category,
      content,
      variables = [],
      version = '1.0.0',
      tags = [],
      metadata = {}
    } = req.body;

    if (!name || !content || !category) {
      return sendError(res, 'Name, content, and category are required', 400);
    }

    const templateData = {
      name,
      description: description || '',
      type: type || 'function',
      category,
      content,
      variables,
      version,
      isActive: true,
      tags,
      metadata: {
        author: req.user?.email || 'unknown',
        effectiveness: 0.5,
        usageCount: 0,
        averageRating: 0,
        testingGroup: 'control' as const,
        ...metadata
      }
    };

    const templateId = await promptManagementService.createTemplate(templateData);

    sendSuccess(res, {
      templateId,
      template: templateData
    }, 'Prompt template created successfully', 201);

  } catch (error) {
    logger.error('Create template error:', error);
    sendError(res, 'Failed to create template', 500);
  }
};

export const updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = await promptManagementService.updateTemplate(id, updates);

    if (!success) {
      return sendError(res, 'Template not found', 404);
    }

    sendSuccess(res, {
      templateId: id,
      updates
    }, 'Template updated successfully');

  } catch (error) {
    logger.error('Update template error:', error);
    sendError(res, 'Failed to update template', 500);
  }
};

export const deleteTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const success = await promptManagementService.deleteTemplate(id);

    if (!success) {
      return sendError(res, 'Template not found', 404);
    }

    sendSuccess(res, {
      templateId: id
    }, 'Template deleted successfully');

  } catch (error) {
    logger.error('Delete template error:', error);
    sendError(res, 'Failed to delete template', 500);
  }
};

export const getTemplateAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const analytics = promptManagementService.getTemplateAnalytics(id);

    if (!analytics) {
      return sendError(res, 'Template not found', 404);
    }

    sendSuccess(res, { analytics }, 'Template analytics retrieved successfully');

  } catch (error) {
    logger.error('Get template analytics error:', error);
    sendError(res, 'Failed to retrieve analytics', 500);
  }
};

export const testPrompt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { context, testMessage } = req.body;
    const userId = req.user?.id;

    if (!userId || !testMessage) {
      return sendError(res, 'User ID and test message are required', 400);
    }

    // Create prompt context
    const promptContext: PromptContext = {
      userId,
      personality: context?.personality || {
        communicationStyle: 'friendly',
        supportLevel: 'gentle',
        insightDepth: 'moderate',
        responseLength: 'moderate',
        focusAreas: ['emotional_wellbeing'],
        triggerWords: [],
        avoidTopics: []
      },
      timeOfDay: context?.timeOfDay || 'afternoon',
      dayOfWeek: context?.dayOfWeek || 'monday',
      mood: context?.mood,
      stressLevel: context?.stressLevel,
      goals: context?.goals || []
    };

    // Get category from template
    const templates = promptManagementService.getAllTemplates();
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return sendError(res, 'Template not found', 404);
    }

    const processedPrompt = await promptManagementService.getPromptForContext(
      template.category,
      promptContext,
      id
    );

    sendSuccess(res, {
      templateId: id,
      processedPrompt,
      context: promptContext,
      originalContent: template.description
    }, 'Prompt test completed successfully');

  } catch (error) {
    logger.error('Test prompt error:', error);
    sendError(res, 'Failed to test prompt', 500);
  }
};

export const hotSwapTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { oldId, newId } = req.body;

    if (!oldId || !newId) {
      return sendError(res, 'Both old and new template IDs are required', 400);
    }

    const success = await promptManagementService.hotSwapTemplate(oldId, newId);

    if (!success) {
      return sendError(res, 'Failed to swap templates - one or both not found', 404);
    }

    sendSuccess(res, {
      oldTemplateId: oldId,
      newTemplateId: newId,
      swappedAt: new Date().toISOString()
    }, 'Templates hot-swapped successfully');

  } catch (error) {
    logger.error('Hot swap template error:', error);
    sendError(res, 'Failed to hot-swap templates', 500);
  }
};

export const trackPromptPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { metrics } = req.body;

    if (!metrics) {
      return sendError(res, 'Performance metrics are required', 400);
    }

    promptManagementService.trackPromptPerformance(id, metrics);

    sendSuccess(res, {
      templateId: id,
      metricsTracked: Object.keys(metrics),
      trackedAt: new Date().toISOString()
    }, 'Prompt performance tracked successfully');

  } catch (error) {
    logger.error('Track prompt performance error:', error);
    sendError(res, 'Failed to track performance', 500);
  }
};

export const getPromptRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category } = req.query;
    const userId = req.user?.id;

    if (!userId || !category) {
      return sendError(res, 'User ID and category are required', 400);
    }

    // Get user's recent interactions and preferences
    // This would typically come from database queries
    const userHistory = {
      preferredStyles: ['friendly', 'supportive'],
      successfulTemplates: [],
      averageEngagement: 0.7,
      timePreferences: ['morning', 'evening']
    };

    const templates = promptManagementService.getAllTemplates()
      .filter(t => t.category === category && t.isActive)
      .sort((a, b) => (b.metadata.effectiveness || 0) - (a.metadata.effectiveness || 0))
      .slice(0, 5); // Top 5 recommendations

    sendSuccess(res, {
      category,
      recommendations: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        effectiveness: t.metadata.effectiveness,
        averageRating: t.metadata.averageRating,
        usageCount: t.metadata.usageCount,
        tags: t.tags,
        compatibilityScore: Math.random() * 0.3 + 0.7 // Mock compatibility score
      })),
      userHistory
    }, 'Prompt recommendations retrieved successfully');

  } catch (error) {
    logger.error('Get prompt recommendations error:', error);
    sendError(res, 'Failed to get recommendations', 500);
  }
};

export const exportTemplates = async (req: Request, res: Response) => {
  try {
    const { category, tags } = req.query;
    
    let templates = promptManagementService.getAllTemplates();

    // Filter by category if specified
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    // Filter by tags if specified
    if (tags) {
      const tagArray = (tags as string).split(',');
      templates = templates.filter(t => 
        tagArray.some(tag => t.tags.includes(tag.trim()))
      );
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      templates: templates.map(t => ({
        ...t,
        // Remove runtime metadata for clean export
        metadata: {
          author: t.metadata.author,
          effectiveness: t.metadata.effectiveness
        }
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=prompt-templates.json');
    
    sendSuccess(res, exportData, 'Templates exported successfully');

  } catch (error) {
    logger.error('Export templates error:', error);
    sendError(res, 'Failed to export templates', 500);
  }
};

export const importTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templates, overwrite = false } = req.body;

    if (!templates || !Array.isArray(templates)) {
      return sendError(res, 'Templates array is required', 400);
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const templateData of templates) {
      try {
        // Check if template already exists
        const existingTemplates = promptManagementService.getAllTemplates();
        const exists = existingTemplates.some(t => t.name === templateData.name);

        if (exists && !overwrite) {
          results.skipped++;
          continue;
        }

        await promptManagementService.createTemplate({
          ...templateData,
          metadata: {
            ...templateData.metadata,
            author: req.user?.email || 'imported'
          }
        });

        results.imported++;

      } catch (error) {
        results.errors.push(`Failed to import ${templateData.name}: ${error}`);
      }
    }

    sendSuccess(res, results, 'Template import completed');

  } catch (error) {
    logger.error('Import templates error:', error);
    sendError(res, 'Failed to import templates', 500);
  }
}; 