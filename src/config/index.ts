import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiVersion: process.env.API_VERSION || 'v1',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/lyra_ai',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'lyra_ai',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '500'),
    topP: parseFloat(process.env.DEEPSEEK_TOP_P || '0.9'),
    frequencyPenalty: parseFloat(process.env.DEEPSEEK_FREQUENCY_PENALTY || '0.1'),
    presencePenalty: parseFloat(process.env.DEEPSEEK_PRESENCE_PENALTY || '0.1'),
    timeout: parseInt(process.env.DEEPSEEK_TIMEOUT || '30000'),
    conversationMemory: parseInt(process.env.DEEPSEEK_CONVERSATION_MEMORY || '20'),
    enableCustomPrompts: process.env.DEEPSEEK_ENABLE_CUSTOM_PROMPTS === 'true',
    enablePersonalityProfiles: process.env.DEEPSEEK_ENABLE_PERSONALITY_PROFILES === 'true',
    enableCrisisSupport: process.env.DEEPSEEK_ENABLE_CRISIS_SUPPORT === 'true',
    logLevel: process.env.DEEPSEEK_LOG_LEVEL || 'info',
  },
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  
  nordigen: {
    secretId: process.env.NORDIGEN_SECRET_ID || '',
    secretKey: process.env.NORDIGEN_SECRET_KEY || '',
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  notifications: {
    expoAccessToken: process.env.EXPO_ACCESS_TOKEN || '',
    fcmServerKey: process.env.FCM_SERVER_KEY || '',
  },
};