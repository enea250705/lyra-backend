import { QueryInterface, DataTypes } from 'sequelize';
import logger from '../../utils/logger';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Starting database migration...');

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      google_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      verification_token: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      refresh_token: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create subscriptions table
    await queryInterface.createTable('subscriptions', {
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
      plan: {
        type: DataTypes.ENUM('free', 'pro', 'premium'),
        allowNull: false,
        defaultValue: 'free',
      },
      status: {
        type: DataTypes.ENUM('active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'),
        allowNull: false,
        defaultValue: 'active',
      },
      adapty_customer_user_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      adapty_profile_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      adapty_product_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      adapty_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      adapty_original_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      original_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      latest_receipt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      environment: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      platform: {
        type: DataTypes.ENUM('ios', 'android'),
        allowNull: true,
      },
      current_period_start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      current_period_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancel_at_period_end: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      trial_start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trial_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      canceled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create mood_entries table
    await queryInterface.createTable('mood_entries', {
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
      mood_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      mood_category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create sleep_logs table
    await queryInterface.createTable('sleep_logs', {
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
      bedtime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      wake_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      sleep_duration: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
      },
      sleep_quality: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      sleep_stages: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create energy_entries table
    await queryInterface.createTable('energy_entries', {
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
      energy_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create focus_sessions table
    await queryInterface.createTable('focus_sessions', {
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
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      focus_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10,
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create journal_entries table
    await queryInterface.createTable('journal_entries', {
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
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      mood: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10,
        },
      },
      tags: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create daily_checkins table
    await queryInterface.createTable('daily_checkins', {
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
      mood: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      energy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      sleep_hours: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
      },
      goals: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      checkin_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create chat_messages table
    await queryInterface.createTable('chat_messages', {
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
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_user: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create notifications table
    await queryInterface.createTable('notifications', {
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
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create notification_settings table
    await queryInterface.createTable('notification_settings', {
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
      mood_reminder: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      mood_reminder_time: {
        type: DataTypes.TIME,
        defaultValue: '09:00',
        allowNull: false,
      },
      journal_reminder: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      journal_reminder_time: {
        type: DataTypes.TIME,
        defaultValue: '21:00',
        allowNull: false,
      },
      sleep_reminder: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      sleep_reminder_time: {
        type: DataTypes.TIME,
        defaultValue: '22:00',
        allowNull: false,
      },
      finance_reminder: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      finance_reminder_frequency: {
        type: DataTypes.STRING(20),
        defaultValue: 'daily',
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create push_devices table
    await queryInterface.createTable('push_devices', {
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
      expo_push_token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      platform: {
        type: DataTypes.ENUM('ios', 'android', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown',
      },
      device_model: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create user_settings table
    await queryInterface.createTable('user_settings', {
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
      language: {
        type: DataTypes.STRING(10),
        defaultValue: 'en',
        allowNull: false,
      },
      timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'UTC',
        allowNull: false,
      },
      units: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      preferences: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Create savings_records table
    await queryInterface.createTable('savings_records', {
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
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      reason: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM('food', 'shopping', 'entertainment', 'transport', 'subscription', 'other'),
        allowNull: false,
        defaultValue: 'other',
      },
      original_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      saved_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      trigger_type: {
        type: DataTypes.ENUM('mood_alert', 'location_alert', 'ai_suggestion', 'manual', 'time_based', 'weather_based'),
        allowNull: false,
        defaultValue: 'manual',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    logger.info('Database migration completed successfully');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Rolling back database migration...');

    // Drop tables in reverse order to handle foreign key constraints
    const tables = [
      'savings_records',
      'user_settings',
      'push_devices',
      'notification_settings',
      'notifications',
      'chat_messages',
      'daily_checkins',
      'journal_entries',
      'focus_sessions',
      'energy_entries',
      'sleep_logs',
      'mood_entries',
      'subscriptions',
      'users'
    ];

    for (const table of tables) {
      await queryInterface.dropTable(table, { cascade: true });
    }

    logger.info('Database migration rollback completed successfully');
  } catch (error) {
    logger.error('Database migration rollback failed:', error);
    throw error;
  }
};
