import sequelize from '../config/database';
import logger from '../utils/logger';
import cleanupOrphanedRecords from './cleanup-orphaned-records';

const runMigrations = async () => {
  try {
    logger.info('Starting database migration process...');

    // Step 1: Clean up orphaned records
    await cleanupOrphanedRecords();

    // Step 2: Run migrations
    logger.info('Running database migrations...');
    await sequelize.sync({ alter: true });

    logger.info('Database migration process completed successfully');
  } catch (error) {
    logger.error('Database migration process failed:', error);
    throw error;
  }
};

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default runMigrations;

