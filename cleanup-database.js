#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const logger = {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
};

const cleanupDatabase = async () => {
  try {
    logger.info('Starting database cleanup...');

    // Get all tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    logger.info('Found tables:', tables);

    // Clean up orphaned records from all tables that reference users
    const tablesWithUserReferences = [
      'usage_analytics',
      'subscriptions',
      'mood_entries', 
      'sleep_logs',
      'energy_entries',
      'focus_sessions',
      'journal_entries',
      'daily_checkins',
      'chat_messages',
      'notifications',
      'notification_settings',
      'user_settings',
      'savings_records',
      'user_behaviors',
      'analytics_reports',
      'onboarding_steps',
      'permission_requests',
      'feature_tutorials'
    ];

    for (const table of tablesWithUserReferences) {
      if (tables.includes(table)) {
        try {
          const result = await sequelize.query(`
            DELETE FROM ${table} 
            WHERE user_id NOT IN (SELECT id FROM users)
          `);
          logger.info(`Cleaned up ${result[1]} orphaned records from ${table} table`);
        } catch (error) {
          logger.warn(`Could not clean ${table}: ${error.message}`);
        }
      }
    }

    logger.info('Database cleanup completed successfully');
  } catch (error) {
    logger.error('Error during database cleanup:', error);
    throw error;
  }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      logger.info('Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

export default cleanupDatabase;
