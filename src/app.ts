import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

import { config } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';
import sequelize from './config/database';

// Import routes
import authRoutes from './routes/authRoutes';
import aiRoutes from './routes/aiRoutes';
import checkinRoutes from './routes/checkinRoutes';
import moodRoutes from './routes/moodRoutes';
import energyRoutes from './routes/energyRoutes';
import sleepRoutes from './routes/sleepRoutes';
import focusRoutes from './routes/focusRoutes';
import journalRoutes from './routes/journalRoutes';
import notificationRoutes from './routes/notificationRoutes';
import settingsRoutes from './routes/settingsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import insightsRoutes from './routes/insightsRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import weatherMoodRoutes from './routes/weatherMoodRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import interventionRoutes from './routes/interventionRoutes';
import promptRoutes from './routes/promptRoutes';
import webhookRoutes from './routes/webhookRoutes';
import chatRoutes from './routes/chatRoutes';
import plaidRoutes from './routes/plaidRoutes';
import savingsRoutes from './routes/savingsRoutes';
import pushRoutes from './routes/pushRoutes';
import googleFitRoutes from './routes/googleFitRoutes';

const app = express();

// Trust proxy for rate limiting (fixes X-Forwarded-For header warning)
app.set('trust proxy', 1);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lyra AI Backend API',
      version: '1.0.0',
      description: 'Complete backend API for Lyra AI - Personal Life Operating System',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for now to debug the issue
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined'));

// Rate limiting
app.use(generalLimiter);

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'lyra-ai-backend',
    version: '1.0.0',
  });
});

// API routes
const apiRouter = express.Router();
// Versioned health endpoint matching /health
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'lyra-ai-backend',
    version: '1.0.0',
  });
});
apiRouter.use('/auth', authRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/prompts', promptRoutes);
apiRouter.use('/checkins', checkinRoutes);
apiRouter.use('/mood', moodRoutes);
apiRouter.use('/energy', energyRoutes);
apiRouter.use('/sleep', sleepRoutes);
apiRouter.use('/focus', focusRoutes);
apiRouter.use('/journal', journalRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/notifications', pushRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/insights', insightsRoutes);
apiRouter.use('/onboarding', onboardingRoutes);
apiRouter.use('/weather-mood', weatherMoodRoutes);
apiRouter.use('/subscription', subscriptionRoutes);
apiRouter.use('/intervention', interventionRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/plaid', plaidRoutes);
apiRouter.use('/savings', savingsRoutes);
apiRouter.use('/google-fit', googleFitRoutes);

app.use(`/api/${config.apiVersion}`, apiRouter);

// Webhook routes (outside API versioning)
app.use('/webhooks', webhookRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(config.env === 'development' && { stack: error.stack }),
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');
    
    // Use safe migration approach instead of force sync
    if (config.env === 'development') {
      // Clean up orphaned records first
      const { QueryTypes } = require('sequelize');
      
      // Get all tables and clean orphaned records from all user-referencing tables
      const tables = await sequelize.getQueryInterface().showAllTables();
      const userReferencingTables = [
        'usage_analytics', 'emotion_insights', 'subscriptions', 'mood_entries', 
        'sleep_logs', 'energy_entries', 'focus_sessions', 'journal_entries',
        'daily_checkins', 'chat_messages', 'notifications', 'notification_settings',
        'user_settings', 'savings_records', 'google_fit_connections', 'google_fit_steps',
        'google_fit_heart_rates', 'google_fit_activities', 'google_fit_sleep',
        'google_fit_weights', 'google_fit_sync_status', 'calendar_connections',
        'calendar_events', 'bank_connections', 'transactions', 'spending_limits',
        'blocked_merchants', 'spending_alerts', 'savings_tracking', 'savings_entries',
        'push_devices'
      ];
      
      let totalCleaned = 0;
      for (const table of userReferencingTables) {
        if (tables.includes(table)) {
          try {
            const result = await sequelize.query(`
              DELETE FROM ${table} 
              WHERE user_id NOT IN (SELECT id FROM users)
            `, { type: QueryTypes.DELETE });
            const cleaned = Array.isArray(result) && result.length > 1 ? result[1] : 0;
            const cleanedCount = typeof cleaned === 'number' ? cleaned : 0;
            totalCleaned += cleanedCount;
            if (cleanedCount > 0) {
              logger.info(`Cleaned up ${cleanedCount} orphaned records from ${table} table`);
            }
          } catch (error) {
            logger.warn(`Could not clean ${table}: ${error.message}`);
          }
        }
      }
      
      if (totalCleaned > 0) {
        logger.info(`Total orphaned records cleaned: ${totalCleaned}`);
      }
      
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized with safe migration');
    }

    // Optional safe schema sync in non-development environments for additive changes (e.g., new tables)
    if (config.env !== 'development' && process.env.DB_SYNC_ALTER === 'true') {
      // Clean up orphaned records in production too
      const { QueryTypes } = require('sequelize');
      
      const userReferencingTables = [
        'usage_analytics', 'emotion_insights', 'subscriptions', 'mood_entries', 
        'sleep_logs', 'energy_entries', 'focus_sessions', 'journal_entries',
        'daily_checkins', 'chat_messages', 'notifications', 'notification_settings',
        'user_settings', 'savings_records', 'google_fit_connections', 'google_fit_steps',
        'google_fit_heart_rates', 'google_fit_activities', 'google_fit_sleep',
        'google_fit_weights', 'google_fit_sync_status', 'calendar_connections',
        'calendar_events', 'bank_connections', 'transactions', 'spending_limits',
        'blocked_merchants', 'spending_alerts', 'savings_tracking', 'savings_entries',
        'push_devices'
      ];
      
      const tables = await sequelize.getQueryInterface().showAllTables();
      let totalCleaned = 0;
      
      for (const table of userReferencingTables) {
        if (tables.includes(table)) {
          try {
            const result = await sequelize.query(`
              DELETE FROM ${table} 
              WHERE user_id NOT IN (SELECT id FROM users)
            `, { type: QueryTypes.DELETE });
            const cleaned = Array.isArray(result) && result.length > 1 ? result[1] : 0;
            const cleanedCount = typeof cleaned === 'number' ? cleaned : 0;
            totalCleaned += cleanedCount;
            if (cleanedCount > 0) {
              logger.info(`Cleaned up ${cleanedCount} orphaned records from ${table} table`);
            }
          } catch (error) {
            logger.warn(`Could not clean ${table}: ${error.message}`);
          }
        }
      }
      
      if (totalCleaned > 0) {
        logger.info(`Total orphaned records cleaned: ${totalCleaned}`);
      }
      
      await sequelize.sync({ alter: true });
      logger.info('Database schema synchronized with alter=true');
    }
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`API documentation available at http://localhost:${config.port}/api/docs`);
      logger.info('Database schema fixed - refresh_token now TEXT type');
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;