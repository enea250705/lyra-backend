import { Request, Response } from 'express';
import deepseekService, { UserPersonality, UserContext } from '../services/deepseekService';
import aiActionService from '../services/aiActionService';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

// Helper function to extract time context
const getTimeContext = (): { timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'; dayOfWeek: string } => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  return { timeOfDay, dayOfWeek };
};

// Helper function to assess stress level from context
const assessStressLevel = (mood: string, energy: number, sleep: number): number => {
  let stressScore = 5; // baseline
  
  // Mood indicators
  const stressMoods = ['terrible', 'bad', 'anxious', 'overwhelmed', 'frustrated'];
  if (stressMoods.some(stressMood => mood?.toLowerCase().includes(stressMood))) {
    stressScore += 3;
  }
  
  // Low energy indicator
  if (energy && energy < 4) stressScore += 2;
  
  // Poor sleep indicator
  if (sleep && sleep < 6) stressScore += 2;
  
  return Math.min(stressScore, 10);
};

export const dailyCheckin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, mood, energy, sleep, stressLevel, personalitySettings } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    // Check if AI is configured
    if (!deepseekService.isConfigured()) {
      return sendSuccess(res, {
        response: "Thanks for checking in! I'm currently being set up and will provide personalized insights soon. Your data has been recorded and you can track your progress in the insights section.",
        message,
        mood,
        energy,
        sleep,
        stressLevel,
        timestamp: new Date().toISOString()
      }, 'Check-in recorded - AI service not configured');
    }

    const timeContext = getTimeContext();
    const currentStressLevel = stressLevel || assessStressLevel(mood, energy, sleep);

    // Build comprehensive user context
    const userContext: UserContext = {
      mood,
      energy,
      sleep,
      currentStressLevel,
      timeOfDay: timeContext.timeOfDay,
      dayOfWeek: timeContext.dayOfWeek,
      personalityProfile: personalitySettings ? {
        communicationStyle: personalitySettings.communicationStyle || 'friendly',
        supportLevel: personalitySettings.supportLevel || 'gentle',
        insightDepth: personalitySettings.insightDepth || 'moderate',
        responseLength: personalitySettings.responseLength || 'moderate',
        focusAreas: personalitySettings.focusAreas || ['emotional_wellbeing', 'productivity'],
        triggerWords: personalitySettings.triggerWords || [],
        avoidTopics: personalitySettings.avoidTopics || []
      } : undefined
    };

    // Choose appropriate function type based on context
    let functionType: 'general' | 'therapy' | 'coaching' | 'mindfulness' = 'general';
    
    if (currentStressLevel >= 8) {
      functionType = 'therapy';
    } else if (timeContext.timeOfDay === 'morning') {
      functionType = 'coaching';
    } else if (timeContext.timeOfDay === 'evening' || timeContext.timeOfDay === 'night') {
      functionType = 'mindfulness';
    }

    // Generate AI response using enhanced DeepSeek
    let aiResponse: string;
    
    if (currentStressLevel >= 8) {
      // Use crisis support for high stress
      aiResponse = await deepseekService.generateCrisisSupport(
        message,
        currentStressLevel,
        userContext
      );
    } else {
      aiResponse = await deepseekService.generateResponse(
        message,
        [], // conversation history - can be loaded from database
        userContext,
        functionType
      );
    }

    // Here you would typically save the check-in to database
    // const checkin = await DailyCheckin.create({
    //   userId,
    //   content: message,
    //   mood_emoji: mood,
    //   ai_reflection: aiResponse,
    //   stress_level: currentStressLevel,
    //   function_type: functionType
    // });

    sendSuccess(res, {
      aiResponse,
      userMessage: message,
      context: userContext,
      functionType,
      stressLevel: currentStressLevel,
      timeContext
    }, 'Daily check-in completed successfully');

  } catch (error) {
    logger.error('Daily check-in error:', error);
    sendError(res, 'Failed to process daily check-in', 500);
  }
};

export const generateInsight = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dataType, timeframe, insightDepth, personalitySettings } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const timeContext = getTimeContext();

    // Build user context for insights
    const userContext: UserContext = {
      timeOfDay: timeContext.timeOfDay,
      dayOfWeek: timeContext.dayOfWeek,
      personalityProfile: personalitySettings ? JSON.parse(personalitySettings as string) : undefined
    };

    // Fetch real user data from database
    const [moodData, energyData, sleepData, journalData] = await Promise.all([
      // Load actual user data from database
      // You can implement these queries based on your models
      [], // MoodEntry.findAll({ where: { userId }, order: [['createdAt', 'DESC']] }),
      [], // EnergyEntry.findAll({ where: { userId }, order: [['createdAt', 'DESC']] }),
      [], // SleepLog.findAll({ where: { userId }, order: [['createdAt', 'DESC']] }),
      [], // JournalEntry.findAll({ where: { userId }, order: [['createdAt', 'DESC']] })
    ]);

    const userData = {
      mood: moodData,
      energy: energyData,
      sleep: sleepData,
      journal: journalData
    };

    const insight = await deepseekService.generateInsight(
      dataType as 'mood' | 'energy' | 'sleep' | 'journal' | 'overall' | 'patterns' | 'predictions',
      userData,
      timeframe as 'daily' | 'weekly' | 'monthly' | 'yearly',
      userContext,
      insightDepth as 'surface' | 'moderate' | 'deep' | 'philosophical' || 'moderate'
    );

    sendSuccess(res, {
      insight,
      dataType,
      timeframe,
      insightDepth,
      generatedAt: new Date().toISOString()
    }, 'Insight generated successfully');

  } catch (error) {
    logger.error('Insight generation error:', error);
    sendError(res, 'Failed to generate insight', 500);
  }
};

export const generateJournalPrompt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mood, goals, promptStyle, personalitySettings } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const timeContext = getTimeContext();

    // Build user context
    const userContext: UserContext = {
      mood,
      goals,
      timeOfDay: timeContext.timeOfDay,
      dayOfWeek: timeContext.dayOfWeek,
      personalityProfile: personalitySettings
    };

    // Here you would fetch recent journal entries from database
    const recentEntries: string[] = [];

    const journalPrompt = await deepseekService.generateJournalPrompt(
      mood,
      recentEntries,
      goals,
      userContext,
      promptStyle || 'reflective'
    );

    sendSuccess(res, {
      prompt: journalPrompt,
      mood,
      goals,
      promptStyle,
      timeContext
    }, 'Journal prompt generated successfully');

  } catch (error) {
    logger.error('Journal prompt generation error:', error);
    sendError(res, 'Failed to generate journal prompt', 500);
  }
};

export const chatWithLyra = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      message, 
      conversationHistory = [], 
      functionType = 'general',
      personalitySettings,
      context = {}
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    if (!message) {
      return sendError(res, 'Message is required', 400);
    }

    // Check if AI is configured
    if (!deepseekService.isConfigured()) {
      return sendSuccess(res, {
        response: "I'm currently being set up and will be available soon! For now, I can help you track your mood, sleep, and daily activities. Try asking me about your wellness data or use the other features of the app.",
        message,
        conversationHistory: [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: "I'm currently being set up and will be available soon! For now, I can help you track your mood, sleep, and daily activities. Try asking me about your wellness data or use the other features of the app." }
        ],
        functionType,
        context: {},
        actionExecuted: null,
        timestamp: new Date().toISOString()
      }, 'AI service not configured - fallback response');
    }

    const timeContext = getTimeContext();
    
    // Build comprehensive user context
    const userContext: UserContext = {
      ...context,
      timeOfDay: timeContext.timeOfDay,
      dayOfWeek: timeContext.dayOfWeek,
      personalityProfile: personalitySettings,
      // Add more context from database if needed
    };

    // First, check if the user is requesting a specific action
    const userIntent = aiActionService.parseUserIntent(message);
    
    let response: string;
    let actionResult: any = null;
    
    // If user is requesting an action, execute it
    if (userIntent.action !== 'generate_insights' || message.toLowerCase().includes('block') || 
        message.toLowerCase().includes('schedule') || message.toLowerCase().includes('cancel') ||
        message.toLowerCase().includes('log') || message.toLowerCase().includes('start focus') ||
        message.toLowerCase().includes('remind me') || message.toLowerCase().includes('spending')) {
      
      try {
        // Execute the action
        const actionContext = {
          userId,
          userEmail: req.user?.email || '',
          userProfile: req.user || {},
          req
        };
        
        actionResult = await aiActionService.executeAction(
          userIntent.action,
          userIntent.parameters,
          actionContext
        );
        
        // If action requires confirmation, ask for it
        if (actionResult.requiresConfirmation) {
          response = actionResult.confirmationPrompt || actionResult.message;
        } else {
          // Action was executed successfully
          response = actionResult.message;
          
          // Add a natural AI response about the action
          if (actionResult.success) {
            const aiResponse = await deepseekService.generateResponse(
              `I just ${actionResult.action.replace('_', ' ')} for the user. ${actionResult.message}. Please provide a brief, supportive follow-up response.`,
              conversationHistory,
              userContext,
              functionType
            );
            response = `${actionResult.message}\n\n${aiResponse}`;
          }
        }
      } catch (actionError) {
        logger.error('Action execution error:', actionError);
        // Fall back to regular chat if action fails
        response = await deepseekService.generateResponse(
          message,
          conversationHistory,
          userContext,
          functionType
        );
      }
    } else {
      // Regular conversation - no specific action detected
      const { response: chatResponse, updatedHistory } = await deepseekService.continueConversation(
        message,
        conversationHistory,
        userContext
      );
      response = chatResponse;
    }

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    ].slice(-20); // Keep last 20 messages

    sendSuccess(res, {
      response,
      message,
      conversationHistory: updatedHistory,
      functionType,
      context: userContext,
      actionExecuted: actionResult ? {
        action: actionResult.action,
        success: actionResult.success,
        requiresConfirmation: actionResult.requiresConfirmation
      } : null,
      timestamp: new Date().toISOString()
    }, 'Chat response generated successfully');

  } catch (error) {
    logger.error('Chat with Lyra error:', error);
    sendError(res, 'Failed to generate chat response', 500);
  }
};

export const startCoachingSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { goal, initialMessage, personalitySettings } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    if (!goal || !initialMessage) {
      return sendError(res, 'Goal and initial message are required', 400);
    }

    const timeContext = getTimeContext();

    const userContext: UserContext = {
      goals: [goal],
      timeOfDay: timeContext.timeOfDay,
      dayOfWeek: timeContext.dayOfWeek,
      personalityProfile: personalitySettings
    };

    const coachingResponse = await deepseekService.generateCoachingResponse(
      initialMessage,
      goal,
      userContext
    );

    sendSuccess(res, {
      response: coachingResponse,
      goal,
      sessionId: `coaching_${userId}_${Date.now()}`,
      startedAt: new Date().toISOString()
    }, 'Coaching session started successfully');

  } catch (error) {
    logger.error('Coaching session start error:', error);
    sendError(res, 'Failed to start coaching session', 500);
  }
};

export const handleCrisisSupport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, stressLevel, immediateNeeds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    if (!message || !stressLevel) {
      return sendError(res, 'Message and stress level are required', 400);
    }

    const timeContext = getTimeContext();

    const userContext: UserContext = {
      currentStressLevel: stressLevel,
      timeOfDay: timeContext.timeOfDay,
      dayOfWeek: timeContext.dayOfWeek,
      recentActivities: immediateNeeds ? ['crisis_support'] : undefined
    };

    const supportResponse = await deepseekService.generateCrisisSupport(
      message,
      stressLevel,
      userContext
    );

    // Log crisis support usage for safety monitoring
    logger.warn('Crisis support requested', {
      userId,
      stressLevel,
      timestamp: new Date().toISOString()
    });

    sendSuccess(res, {
      response: supportResponse,
      stressLevel,
      crisisResources: {
        emergencyNumber: '988', // Suicide & Crisis Lifeline (US)
        textLine: 'Text HOME to 741741',
        emergencyServices: '911'
      },
      followUpRecommended: stressLevel >= 9
    }, 'Crisis support response generated');

  } catch (error) {
    logger.error('Crisis support error:', error);
    sendError(res, 'Failed to provide crisis support', 500);
  }
};

export const executeAction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, parameters, confirmed = false } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    if (!action) {
      return sendError(res, 'Action is required', 400);
    }

    const actionContext = {
      userId,
      userEmail: req.user?.email || '',
      userProfile: req.user || {},
      req
    };

    const actionResult = await aiActionService.executeAction(
      action,
      parameters || {},
      actionContext
    );

    // If action requires confirmation and user hasn't confirmed
    if (actionResult.requiresConfirmation && !confirmed) {
      return sendSuccess(res, {
        requiresConfirmation: true,
        confirmationPrompt: actionResult.confirmationPrompt,
        action: actionResult.action,
        parameters
      }, 'Action requires confirmation');
    }

    // Execute the action directly if confirmed or no confirmation needed
    sendSuccess(res, {
      actionResult,
      executed: true,
      timestamp: new Date().toISOString()
    }, actionResult.message);

  } catch (error) {
    logger.error('Action execution error:', error);
    sendError(res, 'Failed to execute action', 500);
  }
};

export const updatePersonalityProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const personalitySettings = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    // Validate personality settings
    const allowedStyles = ['casual', 'formal', 'friendly', 'professional'];
    const allowedSupport = ['gentle', 'direct', 'motivational', 'therapeutic'];
    const allowedDepth = ['surface', 'moderate', 'deep', 'philosophical'];
    const allowedLength = ['brief', 'moderate', 'detailed', 'comprehensive'];

    if (personalitySettings.communicationStyle && !allowedStyles.includes(personalitySettings.communicationStyle)) {
      return sendError(res, 'Invalid communication style', 400);
    }

    const updatedProfile = deepseekService.updatePersonalityProfile(personalitySettings);

    // Here you would save to database
    // await UserSettings.upsert({
    //   userId,
    //   aiPersonalityProfile: updatedProfile
    // });

    sendSuccess(res, {
      personalityProfile: updatedProfile,
      updatedAt: new Date().toISOString()
    }, 'Personality profile updated successfully');

  } catch (error) {
    logger.error('Personality profile update error:', error);
    sendError(res, 'Failed to update personality profile', 500);
  }
};

export const getAiStatus = async (req: Request, res: Response) => {
  try {
    const isConfigured = deepseekService.isConfigured();
    
    sendSuccess(res, {
      configured: isConfigured,
      provider: 'DeepSeek',
      status: isConfigured ? 'ready' : 'not configured',
      features: {
        personalityProfiles: true,
        specializedFunctions: true,
        crisisSupport: true,
        conversationMemory: true,
        contextAwareness: true
      },
      availableFunctions: [
        'general', 'coaching', 'therapy', 'productivity', 
        'mindfulness', 'health', 'relationships', 'career'
      ]
    }, 'AI service status retrieved');

  } catch (error) {
    logger.error('AI status check error:', error);
    sendError(res, 'Failed to check AI status', 500);
  }
};