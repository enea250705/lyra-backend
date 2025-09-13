import { QueryInterface, DataTypes } from 'sequelize';
import logger from '../../utils/logger';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Creating analytics tables...');

    // Create user_behaviors table
    await queryInterface.createTable('user_behaviors', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sessionId: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      eventType: {
        type: DataTypes.ENUM('page_view', 'click', 'scroll', 'focus', 'blur', 'form_submit', 'api_call'),
        allowNull: false,
      },
      eventName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      pageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      elementId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      elementType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      elementText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      scrollDepth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      timeOnPage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create analytics_reports table
    await queryInterface.createTable('analytics_reports', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      reportType: {
        type: DataTypes.ENUM('user_summary', 'feature_usage', 'behavior_analysis', 'retention', 'conversion', 'engagement'),
        allowNull: false,
      },
      reportName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      reportData: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      dateRange: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      filters: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      generatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex('user_behaviors', ['userId', 'createdAt']);
    await queryInterface.addIndex('user_behaviors', ['sessionId']);
    await queryInterface.addIndex('user_behaviors', ['eventType']);
    await queryInterface.addIndex('user_behaviors', ['eventName']);

    await queryInterface.addIndex('analytics_reports', ['userId', 'reportType']);
    await queryInterface.addIndex('analytics_reports', ['generatedAt']);
    await queryInterface.addIndex('analytics_reports', ['reportType']);

    logger.info('Analytics tables created successfully');
  } catch (error) {
    logger.error('Error creating analytics tables:', error);
    throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Dropping analytics tables...');

    await queryInterface.dropTable('analytics_reports', { cascade: true });
    await queryInterface.dropTable('user_behaviors', { cascade: true });

    logger.info('Analytics tables dropped successfully');
  } catch (error) {
    logger.error('Error dropping analytics tables:', error);
    throw error;
  }
};

