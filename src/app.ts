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
import weatherMoodRoutes from './routes/weatherMoodRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import interventionRoutes from './routes/interventionRoutes';
import promptRoutes from './routes/promptRoutes';
import webhookRoutes from './routes/webhookRoutes';

const app = express();

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
  origin: config.env === 'development' ? '*' : process.env.FRONTEND_URL,
  credentials: true,
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
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/insights', insightsRoutes);
apiRouter.use('/weather-mood', weatherMoodRoutes);
apiRouter.use('/subscription', subscriptionRoutes);
apiRouter.use('/intervention', interventionRoutes);

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
    
    if (config.env === 'development') {
      await sequelize.sync({ force: true, alter: true });
      logger.info('Database synchronized (tables recreated)');
    }
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`API documentation available at http://localhost:${config.port}/api/docs`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;