import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  context?: string;
}

interface ConversationContext {
  topic?: string;
  intent?: string;
  keyPoints?: string[];
  lastCompleteResponse?: string;
  questionType?: 'factual' | 'advice' | 'analysis' | 'creative' | 'problem-solving';
}

interface UserPersonality {
  communicationStyle?: 'direct' | 'gentle' | 'encouraging' | 'analytical' | 'friendly';
  responseDepth?: 'brief' | 'detailed' | 'comprehensive';
  supportLevel?: 'direct' | 'gentle' | 'encouraging';
  insightDepth?: 'surface' | 'moderate' | 'deep' | 'philosophical';
  responseLength?: 'brief' | 'moderate' | 'detailed';
  focusAreas?: string[];
  triggerWords?: string[];
  avoidTopics?: string[];
  preferences?: {
    timezone?: string;
    language?: string;
    formality?: 'formal' | 'casual' | 'friendly';
  };
}

interface UserContext {
  mood?: string;
  energy?: number;
  sleep?: number;
  recentActivities?: string[];
  goals?: string[];
  preferences?: any;
  hasRealData?: boolean;
  stressLevel?: number;
  currentStressLevel?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek?: string;
  personalityProfile?: UserPersonality;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  weather?: {
    temperature?: number;
    condition?: string;
    humidity?: number;
  };
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Comprehensive system prompt for Lyra AI
const LYRA_SYSTEM_PROMPT = `You are *Lyra*, the world's most advanced personal life operating system. You are not an assistant, chatbot, or therapist — you are a deeply intelligent companion who understands the full spectrum of human experience and can take direct action to improve your user's life.

## YOUR CORE IDENTITY
You are emotionally intelligent, contextually aware, and action-oriented. You exist to provide immediate, practical support while maintaining deep emotional understanding. You respond quickly and decisively, drawing from complete context of the user's life patterns, data, and current state.

## YOUR COMPLETE CAPABILITIES
You have full access to and can directly manage:

**WELLBEING & TRACKING:**
- Mood patterns, energy levels, sleep quality over time
- Daily check-ins, journal entries, and emotional trends
- Focus sessions, productivity patterns, and mental clarity
- Weather correlations, location-based mood insights
- Comprehensive health and wellness analytics

**FINANCIAL INTELLIGENCE & SAVINGS TRACKING:**
- Real-time spending analysis and transaction patterns
- Proactive savings tracking and celebration of smart financial decisions
- Subscription cancellation suggestions and savings recording
- Cheaper alternative recommendations with savings potential
- Impulse purchase prevention and avoided spending tracking
- Merchant blocking and financial protection
- Budget awareness and spending behavior insights
- Banking integration with Nordigen for transaction control

**CALENDAR & PRODUCTIVITY:**
- Google Calendar integration for scheduling
- Appointment management, rescheduling, and reminders
- Time blocking for focus sessions and deep work
- Meeting optimization and schedule breathing room
- Task prioritization and energy-based scheduling

**COMMUNICATION & REMINDERS:**
- Smart, contextual notifications and reminders
- Voice and text interaction with natural language understanding
- Personalized communication style adaptation
- Crisis support and emotional emergency responses
- Multi-modal input processing (voice, text, images)

**INSIGHTS & ANALYTICS:**
- Cross-domain pattern recognition (mood, sleep, spending, productivity)
- Predictive insights and trend analysis
- Personalized recommendations based on historical data
- Weather-mood correlations and environmental factors
- Long-term life trajectory analysis and optimization

## YOUR RESPONSE STYLE
- **IMMEDIATE**: Respond instantly with relevant context
- **ACTIONABLE**: Always provide next steps or direct actions
- **CONTEXTUAL**: Reference user's history, patterns, and current state
- **CONCISE**: Get to the point quickly, expand only when asked
- **EMPATHETIC**: Acknowledge emotions while staying solution-focused

## KEY BEHAVIORAL PRINCIPLES
1. **SPEED**: Respond within 2-3 sentences unless depth is requested
2. **CONTEXT**: Always reference relevant user data and patterns
3. **ACTION**: Offer to perform tasks directly when possible
4. **PRIVACY**: User data stays secure, actions require confirmation for sensitive operations
5. **ADAPTABILITY**: Match user's communication style and emotional state
6. **WISDOM**: Provide insights that connect different aspects of their life

## EXAMPLE INTERACTIONS
- "Your mood dipped after that $180 dinner expense. Want me to block that restaurant?"
- "You're most productive at 10 AM. Should I reschedule your 2 PM meeting?"
- "Haven't journaled in 3 days and energy is low. Quick voice check-in?"
- "Weather's changing tomorrow - historically drops your mood 15%. Coffee with Sarah?"
- "Great job canceling Netflix! That's €12/month saved (€144/year). I've tracked this savings."
- "Instead of that €80 shirt, try the similar one at H&M for €25. Save €55!"
- "You avoided that impulse buy yesterday - want me to record the €45 you saved?"
- "You've saved €234 this month through smart choices! Your total is now €1,847."

## FINANCIAL & SAVINGS ACTIONS YOU CAN TAKE
- Track and celebrate real savings when users avoid purchases
- Record subscription cancellations and calculate yearly savings
- Suggest cheaper alternatives and track when users choose them
- Block merchants that correlate with mood drops
- Set spending alerts for categories affecting wellbeing
- Analyze spending patterns against emotional data
- Provide real-time transaction insights and savings opportunities
- Congratulate users on smart financial decisions and track cumulative savings

## PRODUCTIVITY ACTIONS YOU CAN TAKE
- Schedule focus sessions based on energy patterns
- Reschedule meetings when mood/energy is low
- Block distracting apps during deep work
- Set contextual reminders based on location/time
- Optimize calendar for peak performance times

## EMOTIONAL SUPPORT ACTIONS YOU CAN TAKE
- Detect emotional patterns and provide interventions
- Suggest activities based on mood and weather
- Connect mood changes to life events and decisions
- Provide crisis support with professional resources
- Create personalized coping strategies

You are the ultimate life optimization system - intelligent, caring, and powerfully effective. You understand that small actions create big changes, and you're here to make those actions happen seamlessly in your user's life.

Respond with the wisdom of a counselor, the efficiency of a personal assistant, and the insight of a data scientist. Be the AI companion that truly understands and improves human life.`;

class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private conversationContext: Map<string, ConversationContext> = new Map();

  constructor() {
    this.apiKey = config.deepseek.apiKey;
    this.baseUrl = config.deepseek.baseUrl;
    this.model = 'deepseek-chat';
  }

  private analyzeQuestionType(message: string): 'factual' | 'advice' | 'analysis' | 'creative' | 'problem-solving' {
    const adviceKeywords = ['should', 'how to', 'what to do', 'recommend', 'suggest', 'advice', 'help me'];
    const analysisKeywords = ['analyze', 'pattern', 'trend', 'insight', 'understand', 'explain', 'why'];
    const creativeKeywords = ['create', 'design', 'generate', 'imagine', 'brainstorm'];
    const problemSolvingKeywords = ['fix', 'solve', 'problem', 'issue', 'stuck', 'difficult'];
    
    const lowerMessage = message.toLowerCase();
    
    if (adviceKeywords.some(keyword => lowerMessage.includes(keyword))) return 'advice';
    if (analysisKeywords.some(keyword => lowerMessage.includes(keyword))) return 'analysis';
    if (creativeKeywords.some(keyword => lowerMessage.includes(keyword))) return 'creative';
    if (problemSolvingKeywords.some(keyword => lowerMessage.includes(keyword))) return 'problem-solving';
    
    return 'factual';
  }

  private extractContextFromHistory(history: DeepSeekMessage[]): ConversationContext {
    const recentMessages = history.slice(-5);
    const keyPoints: string[] = [];
    let topic = '';
    let intent = '';
    
    for (const message of recentMessages) {
      if (message.role === 'user') {
        const words = message.content.split(' ');
        if (words.length > 3) {
          keyPoints.push(message.content.substring(0, 100));
        }
      }
    }
    
    if (recentMessages.length > 0) {
      const lastUserMessage = recentMessages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        const words = lastUserMessage.content.split(' ');
        topic = words.slice(0, 5).join(' ');
        intent = this.extractIntent(lastUserMessage.content);
      }
    }
    
    return { topic, intent, keyPoints };
  }

  private extractIntent(message: string): string {
    const intentPatterns = [
      { pattern: /want to know|tell me|explain/, intent: 'information seeking' },
      { pattern: /how do I|how can I|help me/, intent: 'assistance seeking' },
      { pattern: /what should|recommend|suggest/, intent: 'advice seeking' },
      { pattern: /analyze|understand|insights/, intent: 'analysis request' },
      { pattern: /create|generate|make/, intent: 'creation request' }
    ];
    
    for (const { pattern, intent } of intentPatterns) {
      if (pattern.test(message.toLowerCase())) {
        return intent;
      }
    }
    
    return 'general inquiry';
  }

  private getMaxTokensForQuestionType(questionType: string): number {
    switch (questionType) {
      case 'analysis':
        return 1000; // More tokens for detailed analysis
      case 'advice':
        return 800; // Sufficient for comprehensive advice
      case 'problem-solving':
        return 900; // More space for step-by-step solutions
      case 'creative':
        return 750; // Good balance for creative responses
      default:
        return 600; // Standard length for factual responses
    }
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: DeepSeekMessage[] = [],
    userContext?: {
      mood?: string;
      energy?: number;
      sleep?: number;
      recentActivities?: string[];
      goals?: string[];
      preferences?: any;
      hasRealData?: boolean;
    },
    sessionId: string = 'default'
  ): Promise<string> {
    // Extract question type outside try block for use in catch
    const questionType = this.analyzeQuestionType(userMessage);
    
    try {
      // Extract and update conversation context
      const conversationContext = this.extractContextFromHistory(conversationHistory);
      
      conversationContext.questionType = questionType;
      this.conversationContext.set(sessionId, conversationContext);
      
      // Build enhanced context-aware system prompt
      let contextualPrompt = LYRA_SYSTEM_PROMPT;
      
      // Add conversation context
      contextualPrompt += `\n\n## CONVERSATION CONTEXT:`;
      contextualPrompt += `\n- Question Type: ${questionType}`;
      contextualPrompt += `\n- Intent: ${conversationContext.intent}`;
      if (conversationContext.topic) {
        contextualPrompt += `\n- Current Topic: ${conversationContext.topic}`;
      }
      if (conversationContext.keyPoints && conversationContext.keyPoints.length > 0) {
        contextualPrompt += `\n- Key Discussion Points: ${conversationContext.keyPoints.join('; ')}`;
      }
      
      // Add response structure guidelines based on question type
      contextualPrompt += `\n\n## RESPONSE STRUCTURE REQUIREMENTS:`;
      switch (questionType) {
        case 'advice':
          contextualPrompt += `\n- Provide clear, actionable advice with specific steps\n- Include rationale for each recommendation\n- Address potential concerns or obstacles\n- End with a concrete next action`;
          break;
        case 'analysis':
          contextualPrompt += `\n- Start with key insights and patterns\n- Provide detailed analysis with supporting evidence\n- Include implications and what this means for the user\n- Conclude with actionable recommendations`;
          break;
        case 'creative':
          contextualPrompt += `\n- Be innovative and think outside the box\n- Provide multiple creative options or approaches\n- Include practical implementation details\n- Maintain creativity while being actionable`;
          break;
        case 'problem-solving':
          contextualPrompt += `\n- Identify the root cause clearly\n- Provide step-by-step solution approach\n- Include troubleshooting tips\n- Offer alternative solutions if main approach doesn't work`;
          break;
        default:
          contextualPrompt += `\n- Provide comprehensive, well-structured information\n- Include relevant examples and context\n- Ensure completeness and accuracy\n- End with helpful next steps or related insights`;
      }
      
      contextualPrompt += `\n\n## CRITICAL RESPONSE RULES:`;
      contextualPrompt += `\n- NEVER leave responses incomplete or cut off mid-sentence`;
      contextualPrompt += `\n- ALWAYS provide a complete, well-structured answer`;
      contextualPrompt += `\n- If the topic is complex, break it into clear sections`;
      contextualPrompt += `\n- Maintain context throughout the entire response`;
      contextualPrompt += `\n- Reference previous conversation points when relevant`;
      contextualPrompt += `\n- End with a clear conclusion or next steps`;
      
      // Add user context
      if (userContext) {
        contextualPrompt += `\n\n## CURRENT USER STATE:`;
        if (userContext.mood) contextualPrompt += `\n- Current mood: ${userContext.mood}`;
        if (userContext.energy) contextualPrompt += `\n- Energy level: ${userContext.energy}/10`;
        if (userContext.sleep) contextualPrompt += `\n- Last night's sleep: ${userContext.sleep} hours`;
        if (userContext.recentActivities?.length) {
          contextualPrompt += `\n- Recent activities: ${userContext.recentActivities.join(', ')}`;
        }
        if (userContext.goals?.length) {
          contextualPrompt += `\n- Current goals: ${userContext.goals.join(', ')}`;
        }
        if (userContext.hasRealData) {
          contextualPrompt += `\n- User has real tracking data available`;
        }
      }

      // Prepare messages for API with enhanced context
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: contextualPrompt },
        ...conversationHistory.slice(-15), // Keep more history for better context
        { role: 'user', content: userMessage, timestamp: new Date(), context: conversationContext.topic }
      ];

      // Adjust parameters based on question type for better completion
      const apiParams = {
        model: this.model,
        messages: messages,
        temperature: questionType === 'creative' ? 0.8 : 0.7,
        max_tokens: this.getMaxTokensForQuestionType(questionType),
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stop: null, // Allow full completion
      };

      const response = await axios.post<DeepSeekResponse>(
        `${this.baseUrl}/chat/completions`,
        apiParams,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 45000 // Increased timeout for complete responses
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from DeepSeek API');
      }

      // Validate response completeness
      const validatedResponse = this.validateAndEnhanceResponse(aiResponse, questionType, userMessage);
      
      // Store the complete response for context
      const currentContext = this.conversationContext.get(sessionId);
      if (currentContext) {
        currentContext.lastCompleteResponse = validatedResponse;
        this.conversationContext.set(sessionId, currentContext);
      }

      logger.info('DeepSeek API response generated successfully', {
        tokens: response.data.usage?.total_tokens || 0,
        model: this.model,
        questionType,
        responseLength: validatedResponse.length,
        isComplete: this.isResponseComplete(validatedResponse)
      });

      return validatedResponse;

    } catch (error) {
      logger.error('DeepSeek API error:', error);
      
      // Enhanced fallback response based on question type
      const fallbackResponse = this.generateContextualFallback(questionType, userMessage, userContext);
      return fallbackResponse;
    }
  }

  private validateAndEnhanceResponse(response: string, questionType: string, userMessage: string): string {
    // Check if response appears incomplete
    if (!this.isResponseComplete(response)) {
      // Add completion note
      const enhancement = this.getCompletionEnhancement(questionType, response);
      return response + enhancement;
    }
    
    return response.trim();
  }

  private isResponseComplete(response: string): boolean {
    const trimmedResponse = response.trim();
    
    // Check for abrupt endings
    const incompleteEndings = [
      /\.\.\.$/, // Ends with ellipsis
      /[,;:]$/, // Ends with comma, semicolon, or colon
      /\band\s*$/, // Ends with "and"
      /\bbut\s*$/, // Ends with "but"
      /\bto\s*$/, // Ends with "to"
      /\bwith\s*$/, // Ends with "with"
      /\bfor\s*$/, // Ends with "for"
    ];
    
    // Check for minimum length based on question complexity
    if (trimmedResponse.length < 50) return false;
    
    // Check for incomplete patterns
    for (const pattern of incompleteEndings) {
      if (pattern.test(trimmedResponse)) return false;
    }
    
    // Check for proper sentence structure (should end with punctuation)
    const lastChar = trimmedResponse.slice(-1);
    if (!['.', '!', '?'].includes(lastChar)) return false;
    
    return true;
  }

  private getCompletionEnhancement(questionType: string, response: string): string {
    switch (questionType) {
      case 'advice':
        return "\n\nWould you like me to elaborate on any specific aspect of this advice or discuss potential next steps?";
      case 'analysis':
        return "\n\nI can provide more detailed analysis on any specific aspect that interests you most.";
      case 'problem-solving':
        return "\n\nLet me know if you'd like me to walk through any of these solutions in more detail or help you implement them.";
      case 'creative':
        return "\n\nI can expand on any of these ideas or explore additional creative approaches if you'd like.";
      default:
        return "\n\nFeel free to ask for clarification or more details on any part of this information.";
    }
  }

  private generateContextualFallback(questionType: string, userMessage: string, userContext?: any): string {
    const baseMessage = "I'm having trouble connecting right now, but I'm still here for you.";
    
    switch (questionType) {
      case 'advice':
        return `${baseMessage} While I reconnect, consider breaking down your situation into smaller, manageable pieces. What's the most immediate step you could take? I'll be back soon with more comprehensive guidance.`;
      case 'analysis':
        return `${baseMessage} In the meantime, you might want to jot down any patterns or observations you've noticed. This will help me provide better insights once I'm fully connected again.`;
      case 'problem-solving':
        return `${baseMessage} While I'm reconnecting, try identifying the specific symptoms versus the root cause of the issue. This distinction often reveals the solution path.`;
      case 'creative':
        return `${baseMessage} Your creative question is intriguing! Sometimes stepping away briefly can spark new ideas. I'll be back shortly to explore this together.`;
      default:
        return `${baseMessage} Your question about "${userMessage.substring(0, 50)}..." is important to me. I'll provide a complete answer as soon as I'm back online.`;
    }
  }

  async generateInsight(
    dataType: 'mood' | 'energy' | 'sleep' | 'journal' | 'overall' | 'patterns' | 'predictions',
    data: any,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly',
    userContext?: UserContext,
    insightDepth: 'surface' | 'moderate' | 'deep' | 'philosophical' = 'moderate'
  ): Promise<string> {
    try {
      const insightPrompt = this.buildInsightPrompt(dataType, data, timeframe, userContext, insightDepth);
      return await this.generateResponse(insightPrompt, [], userContext);
    } catch (error) {
      logger.error('DeepSeek insight generation error:', error);
      return "I'm analyzing your patterns and will have insights ready soon. Keep tracking your daily activities - every data point helps me understand you better!";
    }
  }

  private buildInsightPrompt(
    dataType: string, 
    data: any, 
    timeframe: string, 
    userContext?: UserContext, 
    insightDepth: string = 'moderate'
  ): string {
    const depthModifiers = {
      surface: 'Provide quick, actionable insights.',
      moderate: 'Give balanced insights with specific recommendations.',
      deep: 'Provide comprehensive analysis with detailed patterns and long-term strategies.',
      philosophical: 'Explore deeper meaning and connection to life purpose and values.'
    };

    const contextInfo = userContext ? `\nUser context: ${JSON.stringify(userContext)}` : '';
    const depthInstruction = depthModifiers[insightDepth as keyof typeof depthModifiers] || depthModifiers.moderate;

    const prompts = {
      mood: `Analyze my ${timeframe} mood patterns: ${JSON.stringify(data)}. ${depthInstruction}${contextInfo}`,
      energy: `Review my ${timeframe} energy levels: ${JSON.stringify(data)}. What patterns do you notice and how can I optimize my energy? ${depthInstruction}${contextInfo}`,
      sleep: `Examine my ${timeframe} sleep data: ${JSON.stringify(data)}. What insights about my sleep quality and patterns, with actionable improvements? ${depthInstruction}${contextInfo}`,
      journal: `Reflect on my recent journal entries: ${JSON.stringify(data)}. What themes and growth opportunities do you see? ${depthInstruction}${contextInfo}`,
      overall: `Provide a holistic ${timeframe} wellness insight based on all my data: ${JSON.stringify(data)}. What's working well and what actions can I take to improve? ${depthInstruction}${contextInfo}`,
      patterns: `Identify meaningful patterns across all my ${timeframe} data: ${JSON.stringify(data)}. What correlations and trends emerge? ${depthInstruction}${contextInfo}`,
      predictions: `Based on my ${timeframe} patterns: ${JSON.stringify(data)}, what predictions and preventive actions would you suggest? ${depthInstruction}${contextInfo}`
    };

    return prompts[dataType as keyof typeof prompts] || prompts.overall;
  }

  async generateJournalPrompt(
    mood?: string,
    recentEntries?: string[],
    goals?: string[],
    userContext?: UserContext,
    promptStyle: 'reflective' | 'goal-oriented' | 'creative' | 'analytical' = 'reflective'
  ): Promise<string> {
    try {
      const styleModifiers = {
        reflective: 'Generate a deep, introspective journal prompt that encourages self-awareness.',
        'goal-oriented': 'Create an action-focused prompt that drives progress toward specific objectives.',
        creative: 'Design an imaginative, open-ended prompt that sparks creativity and exploration.',
        analytical: 'Provide a structured prompt that encourages logical analysis and pattern recognition.'
      };

      const styleInstruction = styleModifiers[promptStyle];
      const contextInfo = userContext ? `\nUser context: ${JSON.stringify(userContext)}` : '';
      
      let prompt = `${styleInstruction}`;
      
      if (mood) prompt += ` I'm feeling ${mood} today.`;
      if (recentEntries?.length) {
        prompt += ` My recent journal themes have been: ${recentEntries.join(', ')}.`;
      }
      if (goals?.length) {
        prompt += ` I'm working on: ${goals.join(', ')}.`;
      }
      
      prompt += contextInfo;

      return await this.generateResponse(prompt, [], userContext);
    } catch (error) {
      logger.error('Journal prompt generation error:', error);
      return "What's one specific action you took today that moved you closer to who you want to become?";
    }
  }

  async generateCrisisSupport(
    message: string,
    stressLevel: number,
    userContext?: UserContext
  ): Promise<string> {
    try {
      const crisisPrompt = `
CRISIS SUPPORT MODE - High stress level detected (${stressLevel}/10)

User message: "${message}"
Context: ${userContext ? JSON.stringify(userContext) : 'Limited context available'}

Provide immediate, compassionate crisis support. Focus on:
1. Validation and safety
2. Grounding techniques 
3. Immediate actionable steps
4. Professional resource suggestions if needed
5. Gentle follow-up questions

Be warm, professional, and action-oriented. Prioritize safety and immediate wellbeing.
`;
      
      return await this.generateResponse(crisisPrompt, [], userContext);
    } catch (error) {
      logger.error('Crisis support generation error:', error);
      return "I hear you're going through a difficult time. Take a deep breath with me. Can you tell me one thing that makes you feel safe right now? I'm here to help you through this step by step.";
    }
  }

  async generateCoachingResponse(
    message: string,
    goal: string,
    userContext?: UserContext
  ): Promise<string> {
    try {
      const coachingPrompt = `
COACHING MODE - Goal-focused guidance

User goal: "${goal}"
User message: "${message}"
Context: ${userContext ? JSON.stringify(userContext) : 'Limited context available'}

Provide specialized coaching focused on:
1. Breaking down the goal into actionable steps
2. Identifying obstacles and solutions
3. Motivation and accountability
4. Specific daily actions
5. Progress tracking suggestions

Be encouraging, specific, and results-oriented. Focus on building momentum.
`;

      return await this.generateResponse(coachingPrompt, [], userContext);
    } catch (error) {
      logger.error('Coaching response generation error:', error);
      return "Great goal! Let's break this down into specific actions. What's one small step you could take today to move closer to achieving this?";
    }
  }

  async continueConversation(
    message: string,
    conversationHistory: DeepSeekMessage[],
    userContext?: UserContext
  ): Promise<{ response: string; updatedHistory: DeepSeekMessage[] }> {
    try {
      // Update conversation context based on history
      const contextKey = userContext?.personalityProfile?.focusAreas?.[0] || 'default';
      const currentContext = this.conversationContext.get(contextKey) || {};
      
      // Analyze conversation patterns
      if (conversationHistory.length > 0) {
        const recentMessages = conversationHistory.slice(-3);
        const topics = recentMessages.map(msg => this.extractTopicFromMessage(msg.content));
        currentContext.keyPoints = [...(currentContext.keyPoints || []), ...topics].slice(-5);
      }
      
      this.conversationContext.set(contextKey, currentContext);

      const contextualPrompt = `
CONVERSATION CONTINUATION

Previous conversation context: ${JSON.stringify(currentContext)}
User message: "${message}"
User context: ${userContext ? JSON.stringify(userContext) : 'Limited context available'}

Continue the conversation naturally while:
1. Referencing relevant previous topics when appropriate
2. Maintaining conversation flow and continuity
3. Being contextually aware of user's current state
4. Providing personalized responses based on their data
5. Taking actions when requested

Be conversational, helpful, and maintain context awareness.
`;

      const response = await this.generateResponse(contextualPrompt, conversationHistory, userContext);
      
      // Update conversation history
      const updatedHistory = [
        ...conversationHistory,
        {
          role: 'user' as const,
          content: message,
          timestamp: new Date()
        },
        {
          role: 'assistant' as const,
          content: response,
          timestamp: new Date()
        }
      ].slice(-10); // Keep last 10 messages

      return { response, updatedHistory };
    } catch (error) {
      logger.error('Conversation continuation error:', error);
      return {
        response: "I understand what you're saying. Let me help you with that based on what we've discussed.",
        updatedHistory: conversationHistory
      };
    }
  }

  updatePersonalityProfile(settings: UserPersonality): UserPersonality {
    // This would typically update a database record
    // For now, return the updated profile with validation
    const validatedProfile: UserPersonality = {
      communicationStyle: settings.communicationStyle || 'friendly',
      responseDepth: settings.responseDepth || 'detailed',
      focusAreas: settings.focusAreas || [],
      preferences: {
        timezone: settings.preferences?.timezone || 'UTC',
        language: settings.preferences?.language || 'en',
        formality: settings.preferences?.formality || 'casual'
      }
    };

    logger.info('Personality profile updated:', validatedProfile);
    return validatedProfile;
  }

  private extractTopicFromMessage(content: string): string {
    // Simple topic extraction - in production, this could be more sophisticated
    const words = content.toLowerCase().split(' ');
    const topics = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)
    );
    return topics[0] || 'general';
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.baseUrl);
  }
}

export default new DeepSeekService();
export { UserPersonality, UserContext, DeepSeekMessage };