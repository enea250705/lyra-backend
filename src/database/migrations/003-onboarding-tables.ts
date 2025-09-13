import { QueryInterface, DataTypes } from 'sequelize';
import logger from '../../utils/logger';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Creating onboarding tables...');

    // Create onboarding_steps table
    await queryInterface.createTable('onboarding_steps', {
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
      stepName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      stepType: {
        type: DataTypes.ENUM('welcome', 'profile_setup', 'permissions', 'feature_intro', 'goal_setting', 'preferences', 'completion'),
        allowNull: false,
      },
      stepOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stepData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create permission_requests table
    await queryInterface.createTable('permission_requests', {
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
      permissionType: {
        type: DataTypes.ENUM('notifications', 'location', 'camera', 'microphone', 'calendar', 'health', 'contacts', 'storage'),
        allowNull: false,
      },
      permissionName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isGranted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      grantedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deniedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      requestReason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create feature_tutorials table
    await queryInterface.createTable('feature_tutorials', {
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
      featureName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tutorialType: {
        type: DataTypes.ENUM('intro', 'walkthrough', 'tip', 'advanced'),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      skippedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex('onboarding_steps', ['userId', 'stepOrder']);
    await queryInterface.addIndex('onboarding_steps', ['userId', 'isCompleted']);
    await queryInterface.addIndex('onboarding_steps', ['stepType']);

    await queryInterface.addIndex('permission_requests', ['userId', 'permissionType']);
    await queryInterface.addIndex('permission_requests', ['isGranted']);
    await queryInterface.addIndex('permission_requests', ['permissionType']);

    await queryInterface.addIndex('feature_tutorials', ['userId', 'featureName']);
    await queryInterface.addIndex('feature_tutorials', ['userId', 'isCompleted']);
    await queryInterface.addIndex('feature_tutorials', ['featureName']);

    logger.info('Onboarding tables created successfully');
  } catch (error) {
    logger.error('Error creating onboarding tables:', error);
    throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Dropping onboarding tables...');

    await queryInterface.dropTable('feature_tutorials', { cascade: true });
    await queryInterface.dropTable('permission_requests', { cascade: true });
    await queryInterface.dropTable('onboarding_steps', { cascade: true });

    logger.info('Onboarding tables dropped successfully');
  } catch (error) {
    logger.error('Error dropping onboarding tables:', error);
    throw error;
  }
};

