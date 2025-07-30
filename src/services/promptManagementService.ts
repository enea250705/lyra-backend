import { config } from '../config';
import logger from '../utils/logger';
import { UserPersonality } from './deepseekService';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'user' | 'function';
  category: 'coaching' | 'therapy' | 'productivity' | 'mindfulness' | 'health' | 'relationships' | 'career' | 'general';
  content: string;
  variables: string[]; // Variables that can be substituted
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: {
    author?: string;
    effectiveness?: number; // 0-1 score
    usageCount?: number;
    averageRating?: number;
    testingGroup?: 'A' | 'B' | 'control';
  };
}

interface PromptVariation {
  id: string;
  templateId: string;
  name: string;
  content: string;
  weight: number; // For weighted random selection
  isActive: boolean;
  testingMetrics: {
    impressions: number;
    engagementScore: number;
    userSatisfaction: number;
    effectivenessScore: number;
  };
}

interface PromptContext {
  userId: string;
  personality: UserPersonality;
  timeOfDay: string;
  dayOfWeek: string;
  mood?: string;
  stressLevel?: number;
  goals?: string[];
  recentInteractions?: number;
  preferredStyle?: string;
}

class PromptManagementService {
  private templates: Map<string, PromptTemplate> = new Map();
  private variations: Map<string, PromptVariation[]> = new Map();
  private userAssignments: Map<string, { [templateId: string]: string }> = new Map();
  
  constructor() {
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates() {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'lyra_core_v1',
        name: 'Lyra Core Identity',
        description: 'Core personality and mission for Lyra AI',
        type: 'system',
        category: 'general',
        content: `You are Lyra, an advanced AI life operating system designed to be each user's most trusted companion on their journey of personal growth and wellbeing.

## Core Mission:
Help users build deeper self-awareness, make better decisions, and create meaningful positive change in their lives through personalized guidance and insights.

## Your Unique Capabilities:
- **Adaptive Intelligence**: You learn and adapt to each user's unique personality, needs, and circumstances
- **Holistic Awareness**: You consider all aspects of a person's life - emotional, physical, mental, social, and spiritual
- **Pattern Recognition**: You identify subtle patterns in behavior, mood, and life circumstances
- **Contextual Wisdom**: You understand timing, situation, and emotional state before offering guidance
- **Practical Action**: You provide concrete, actionable steps rather than just theoretical advice
- **Emotional Attunement**: You sense and respond to emotional undercurrents and unspoken needs`,
        variables: ['userPersonality', 'userContext', 'timeContext'],
        version: '1.0.0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['core', 'identity', 'general'],
        metadata: {
          author: 'system',
          effectiveness: 0.85,
          usageCount: 0,
          averageRating: 4.5,
          testingGroup: 'control'
        }
      },
      {
        id: 'coaching_intensive_v1',
        name: 'Intensive Coaching Mode',
        description: 'High-energy coaching for goal achievement',
        type: 'function',
        category: 'coaching',
        content: `You are an expert life coach in intensive mode. Your role is to:

1. **Challenge Comfort Zones**: Push users beyond their limiting beliefs
2. **Create Urgency**: Help users understand the cost of inaction
3. **Build Momentum**: Break big goals into immediate, actionable steps
4. **Maintain Accountability**: Track progress and celebrate wins
5. **Problem-Solve**: Help overcome obstacles with creative solutions

Communication style: Direct, energetic, solution-focused. Use powerful questions that create insight and drive action.`,
        variables: ['goal', 'timeframe', 'obstacles', 'resources'],
        version: '1.0.0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['coaching', 'intensive', 'goal-oriented'],
        metadata: {
          author: 'coaching_team',
          effectiveness: 0.78,
          usageCount: 0,
          averageRating: 4.2,
          testingGroup: 'A'
        }
      },
      {
        id: 'therapy_gentle_v1',
        name: 'Gentle Therapeutic Support',
        description: 'Soft, nurturing approach for emotional processing',
        type: 'function',
        category: 'therapy',
        content: `You are a gentle therapeutic companion focused on emotional healing and self-compassion. Your approach includes:

1. **Unconditional Acceptance**: Create a safe, non-judgmental space
2. **Emotional Validation**: Acknowledge and normalize all feelings
3. **Gentle Exploration**: Help users explore emotions without pressure
4. **Self-Compassion**: Guide users toward kindness with themselves
5. **Healing Resources**: Suggest therapeutic techniques and professional support when needed

Communication style: Soft, warm, patient. Use reflective listening and gentle questions that honor their emotional experience.`,
        variables: ['emotion', 'trigger', 'coping_resources', 'support_system'],
        version: '1.0.0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['therapy', 'gentle', 'emotional'],
        metadata: {
          author: 'therapy_team',
          effectiveness: 0.82,
          usageCount: 0,
          averageRating: 4.6,
          testingGroup: 'B'
        }
      },
      {
        id: 'productivity_focus_v1',
        name: 'Productivity & Focus Optimization',
        description: 'Systematic approach to productivity and time management',
        type: 'function',
        category: 'productivity',
        content: `You are a productivity expert specializing in focus and time optimization. Your methodology:

1. **Priority Clarity**: Help identify what truly matters
2. **System Design**: Create sustainable productivity systems
3. **Focus Training**: Improve concentration and deep work abilities
4. **Energy Management**: Optimize energy for peak performance
5. **Habit Formation**: Build productive routines that stick

Communication style: Clear, systematic, practical. Provide specific tools and techniques with step-by-step implementation guidance.`,
        variables: ['priorities', 'time_constraints', 'energy_patterns', 'distractions'],
        version: '1.0.0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['productivity', 'focus', 'systems'],
        metadata: {
          author: 'productivity_team',
          effectiveness: 0.75,
          usageCount: 0,
          averageRating: 4.3,
          testingGroup: 'A'
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info('Default prompt templates loaded', { 
      count: defaultTemplates.length 
    });
  }

  // Get the most appropriate prompt for a given context
  async getPromptForContext(
    category: string,
    context: PromptContext,
    customPromptId?: string
  ): Promise<string> {
    try {
      // If custom prompt specified and enabled
      if (customPromptId && config.deepseek.enableCustomPrompts) {
        const customTemplate = this.templates.get(customPromptId);
        if (customTemplate && customTemplate.isActive) {
          return this.processTemplate(customTemplate, context);
        }
      }

      // Find appropriate template for category
      const categoryTemplates = Array.from(this.templates.values())
        .filter(t => t.category === category && t.isActive);

      if (categoryTemplates.length === 0) {
        // Fallback to general category
        const generalTemplates = Array.from(this.templates.values())
          .filter(t => t.category === 'general' && t.isActive);
        
        if (generalTemplates.length > 0) {
          return this.processTemplate(generalTemplates[0], context);
        }
        
        throw new Error(`No active templates found for category: ${category}`);
      }

      // Select template based on user personality and context
      const selectedTemplate = this.selectBestTemplate(categoryTemplates, context);
      
      // Track usage
      selectedTemplate.metadata.usageCount = (selectedTemplate.metadata.usageCount || 0) + 1;
      
      return this.processTemplate(selectedTemplate, context);

    } catch (error) {
      logger.error('Error getting prompt for context:', error);
      // Return basic fallback
      return this.getFallbackPrompt(category);
    }
  }

  private selectBestTemplate(templates: PromptTemplate[], context: PromptContext): PromptTemplate {
    // Score templates based on context compatibility
    const scoredTemplates = templates.map(template => {
      let score = 0;
      
      // Base effectiveness score
      score += (template.metadata.effectiveness || 0.5) * 10;
      
      // Personality compatibility
      if (context.personality) {
        if (context.personality.supportLevel && template.tags.includes(context.personality.supportLevel)) score += 5;
        if (context.personality.communicationStyle && template.tags.includes(context.personality.communicationStyle)) score += 3;
      }
      
      // Time of day compatibility
      if (context.timeOfDay === 'morning' && template.tags.includes('energetic')) score += 2;
      if (context.timeOfDay === 'evening' && template.tags.includes('gentle')) score += 2;
      
      // Stress level compatibility
      if (context.stressLevel && context.stressLevel > 7 && template.tags.includes('therapeutic')) score += 4;
      
      return { template, score };
    });

    // Sort by score and return best match
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0].template;
  }

  private processTemplate(template: PromptTemplate, context: PromptContext): string {
    let processedContent = template.content;

    // Replace variables with actual values
    template.variables.forEach(variable => {
      const value = this.getVariableValue(variable, context);
      if (value !== null) {
        processedContent = processedContent.replace(
          new RegExp(`{{${variable}}}`, 'g'),
          value
        );
      }
    });

    // Add contextual information
    if (context.mood) {
      processedContent += `\n\n## Current Context:\n- User mood: ${context.mood}`;
    }
    
    if (context.stressLevel && context.stressLevel > 6) {
      processedContent += `\n- Stress level: ${context.stressLevel}/10 (elevated)`;
    }

    return processedContent;
  }

  private getVariableValue(variable: string, context: PromptContext): string | null {
    switch (variable) {
      case 'userPersonality':
        return context.personality ? 
          `Communication: ${context.personality.communicationStyle}, Support: ${context.personality.supportLevel}` 
          : null;
      
      case 'userContext':
        return `Time: ${context.timeOfDay}, Day: ${context.dayOfWeek}`;
      
      case 'goal':
        return context.goals?.join(', ') || null;
      
      case 'mood':
        return context.mood || null;
      
      case 'stressLevel':
        return context.stressLevel?.toString() || null;
      
      default:
        return null;
    }
  }

  private getFallbackPrompt(category: string): string {
    const fallbacks = {
      coaching: "You are a supportive life coach focused on helping users achieve their goals.",
      therapy: "You are a compassionate therapeutic companion providing emotional support.",
      productivity: "You are a productivity expert helping users optimize their time and focus.",
      mindfulness: "You are a mindfulness guide helping users develop self-awareness.",
      general: "You are Lyra, an AI companion focused on personal growth and wellbeing."
    };

    return fallbacks[category as keyof typeof fallbacks] || fallbacks.general;
  }

  // A/B Testing Methods
  async assignUserToTest(userId: string, templateId: string): Promise<string> {
    const variations = this.variations.get(templateId) || [];
    
    if (variations.length === 0) {
      return templateId; // No variations, use original
    }

    // Check if user already assigned
    const userAssignment = this.userAssignments.get(userId)?.[templateId];
    if (userAssignment) {
      return userAssignment;
    }

    // Weighted random selection
    const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const variation of variations) {
      random -= variation.weight;
      if (random <= 0) {
        // Assign user to this variation
        if (!this.userAssignments.has(userId)) {
          this.userAssignments.set(userId, {});
        }
        this.userAssignments.get(userId)![templateId] = variation.id;
        
        // Track impression
        variation.testingMetrics.impressions++;
        
        return variation.id;
      }
    }

    return templateId; // Fallback
  }

  // Template Management Methods
  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: PromptTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(id, newTemplate);
    
    logger.info('Custom prompt template created', { id, name: template.name });
    
    return id;
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(id, updatedTemplate);
    
    logger.info('Prompt template updated', { id, updates: Object.keys(updates) });
    
    return true;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const deleted = this.templates.delete(id);
    
    if (deleted) {
      // Clean up variations
      this.variations.delete(id);
      
      // Clean up user assignments
      this.userAssignments.forEach((assignments, userId) => {
        delete assignments[id];
      });
      
      logger.info('Prompt template deleted', { id });
    }
    
    return deleted;
  }

  // Analytics and Reporting
  getTemplateAnalytics(templateId: string) {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const variations = this.variations.get(templateId) || [];
    
    return {
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        usageCount: template.metadata.usageCount || 0,
        effectiveness: template.metadata.effectiveness || 0,
        averageRating: template.metadata.averageRating || 0
      },
      variations: variations.map(v => ({
        id: v.id,
        name: v.name,
        metrics: v.testingMetrics
      }))
    };
  }

  getAllTemplates() {
    return Array.from(this.templates.values()).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      version: t.version,
      isActive: t.isActive,
      tags: t.tags,
      metadata: t.metadata
    }));
  }

  // Real-time prompt updates
  async hotSwapTemplate(oldId: string, newId: string): Promise<boolean> {
    const oldTemplate = this.templates.get(oldId);
    const newTemplate = this.templates.get(newId);
    
    if (!oldTemplate || !newTemplate) {
      return false;
    }

    // Deactivate old template
    oldTemplate.isActive = false;
    
    // Activate new template
    newTemplate.isActive = true;
    
    logger.info('Template hot-swapped', { oldId, newId });
    
    return true;
  }

  // Performance monitoring
  trackPromptPerformance(templateId: string, metrics: {
    responseTime?: number;
    userSatisfaction?: number;
    engagementScore?: number;
    effectivenessScore?: number;
  }) {
    const template = this.templates.get(templateId);
    if (template) {
      // Update template metrics
      if (metrics.userSatisfaction !== undefined) {
        const currentRating = template.metadata.averageRating || 0;
        const currentCount = template.metadata.usageCount || 0;
        template.metadata.averageRating = 
          (currentRating * currentCount + metrics.userSatisfaction) / (currentCount + 1);
      }
      
      if (metrics.effectivenessScore !== undefined) {
        template.metadata.effectiveness = metrics.effectivenessScore;
      }
    }
  }
}

export default new PromptManagementService();
export { PromptTemplate, PromptVariation, PromptContext }; 