import sequelize from '../config/database';
import logger from '../utils/logger';

const cleanupOrphanedRecords = async () => {
  try {
    logger.info('Starting cleanup of orphaned records...');

    // Check if usage_analytics table exists
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    const hasUsageAnalytics = tableExists.some(table => table === 'usage_analytics');

    if (hasUsageAnalytics) {
      // Delete orphaned records from usage_analytics table
      const result = await sequelize.query(`
        DELETE FROM usage_analytics 
        WHERE user_id NOT IN (SELECT id FROM users)
      `);
      
      logger.info(`Cleaned up ${result[1]} orphaned records from usage_analytics table`);
    }

    // Check for other tables that might have orphaned records
    const tablesWithUserReferences = [
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
      'savings_records'
    ];

    for (const table of tablesWithUserReferences) {
      const hasTable = tableExists.some(t => t === table);
      if (hasTable) {
        const result = await sequelize.query(`
          DELETE FROM ${table} 
          WHERE user_id NOT IN (SELECT id FROM users)
        `);
        logger.info(`Cleaned up ${result[1]} orphaned records from ${table} table`);
      }
    }

    logger.info('Cleanup completed successfully');
  } catch (error) {
    logger.error('Error during cleanup:', error);
    throw error;
  }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupOrphanedRecords()
    .then(() => {
      logger.info('Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

export default cleanupOrphanedRecords;

