import { QueryInterface, DataTypes } from 'sequelize';
import logger from '../../utils/logger';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Creating usage_analytics table...');

    // Create usage_analytics table
    await queryInterface.createTable('usage_analytics', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      event_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      event_data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create indexes for better performance
    await queryInterface.addIndex('usage_analytics', ['user_id']);
    await queryInterface.addIndex('usage_analytics', ['event_type']);
    await queryInterface.addIndex('usage_analytics', ['created_at']);
    await queryInterface.addIndex('usage_analytics', ['session_id']);

    logger.info('usage_analytics table created successfully');
  } catch (error) {
    logger.error('Error creating usage_analytics table:', error);
    throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Dropping usage_analytics table...');

    await queryInterface.dropTable('usage_analytics', { cascade: true });

    logger.info('usage_analytics table dropped successfully');
  } catch (error) {
    logger.error('Error dropping usage_analytics table:', error);
    throw error;
  }
};

