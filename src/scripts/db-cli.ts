#!/usr/bin/env node

import { Command } from 'commander';
import MigrationRunner from '../database/migrationRunner';
import logger from '../utils/logger';

const program = new Command();

program
  .name('lyra-db')
  .description('Lyra AI Database Management CLI')
  .version('1.0.0');

// Migration commands
const migrationCmd = program
  .command('migrate')
  .description('Database migration commands');

migrationCmd
  .command('up')
  .description('Run all pending migrations')
  .action(async () => {
    try {
      const runner = new MigrationRunner();
      await runner.runMigrations();
      await runner.close();
      logger.info('Migrations completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Migration failed:', error);
      process.exit(1);
    }
  });

migrationCmd
  .command('down')
  .description('Rollback the last migration')
  .option('-c, --count <number>', 'Number of migrations to rollback', '1')
  .action(async (options) => {
    try {
      const runner = new MigrationRunner();
      await runner.rollbackMigrations(parseInt(options.count));
      await runner.close();
      logger.info('Migration rollback completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Migration rollback failed:', error);
      process.exit(1);
    }
  });

migrationCmd
  .command('status')
  .description('Show migration status')
  .action(async () => {
    try {
      const runner = new MigrationRunner();
      const runMigrations = await runner.getRunMigrations();
      console.log('Run migrations:', runMigrations);
      await runner.close();
      process.exit(0);
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      process.exit(1);
    }
  });

// Seed commands
const seedCmd = program
  .command('seed')
  .description('Database seeding commands');

seedCmd
  .command('run')
  .description('Run all pending seeds')
  .action(async () => {
    try {
      const runner = new MigrationRunner();
      await runner.runSeeds();
      await runner.close();
      logger.info('Seeds completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Seeding failed:', error);
      process.exit(1);
    }
  });

seedCmd
  .command('rollback')
  .description('Rollback the last seed')
  .option('-c, --count <number>', 'Number of seeds to rollback', '1')
  .action(async (options) => {
    try {
      const runner = new MigrationRunner();
      await runner.rollbackSeeds(parseInt(options.count));
      await runner.close();
      logger.info('Seed rollback completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Seed rollback failed:', error);
      process.exit(1);
    }
  });

seedCmd
  .command('status')
  .description('Show seed status')
  .action(async () => {
    try {
      const runner = new MigrationRunner();
      const runSeeds = await runner.getRunSeeds();
      console.log('Run seeds:', runSeeds);
      await runner.close();
      process.exit(0);
    } catch (error) {
      logger.error('Failed to get seed status:', error);
      process.exit(1);
    }
  });

// Database commands
const dbCmd = program
  .command('db')
  .description('Database management commands');

dbCmd
  .command('reset')
  .description('Reset database (rollback all migrations and seeds)')
  .action(async () => {
    try {
      const runner = new MigrationRunner();
      
      // Rollback all seeds first
      const runSeeds = await runner.getRunSeeds();
      if (runSeeds.length > 0) {
        await runner.rollbackSeeds(runSeeds.length);
      }
      
      // Rollback all migrations
      const runMigrations = await runner.getRunMigrations();
      if (runMigrations.length > 0) {
        await runner.rollbackMigrations(runMigrations.length);
      }
      
      await runner.close();
      logger.info('Database reset completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Database reset failed:', error);
      process.exit(1);
    }
  });

dbCmd
  .command('fresh')
  .description('Fresh database setup (reset + migrate + seed)')
  .action(async () => {
    try {
      const runner = new MigrationRunner();
      
      // Reset database
      const runSeeds = await runner.getRunSeeds();
      if (runSeeds.length > 0) {
        await runner.rollbackSeeds(runSeeds.length);
      }
      
      const runMigrations = await runner.getRunMigrations();
      if (runMigrations.length > 0) {
        await runner.rollbackMigrations(runMigrations.length);
      }
      
      // Run migrations
      await runner.runMigrations();
      
      // Run seeds
      await runner.runSeeds();
      
      await runner.close();
      logger.info('Fresh database setup completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Fresh database setup failed:', error);
      process.exit(1);
    }
  });

// Notification commands
const notificationCmd = program
  .command('notifications')
  .description('Notification management commands');

notificationCmd
  .command('test')
  .description('Test notification system')
  .option('-u, --user <userId>', 'User ID to send test notification to')
  .option('-t, --template <templateId>', 'Template ID to use', 'mood_reminder')
  .action(async (options) => {
    try {
      if (!options.user) {
        console.error('User ID is required');
        process.exit(1);
      }

      const enhancedPushService = await import('../services/enhancedPushNotificationService');
      const result = await enhancedPushService.default.sendToUser(
        options.user, 
        options.template, 
        { userName: 'Test User' }
      );
      
      console.log('Test notification result:', result);
      process.exit(0);
    } catch (error) {
      logger.error('Test notification failed:', error);
      process.exit(1);
    }
  });

notificationCmd
  .command('schedule')
  .description('Schedule a notification')
  .option('-u, --user <userId>', 'User ID')
  .option('-t, --template <templateId>', 'Template ID')
  .option('-d, --date <date>', 'Scheduled date (ISO string)')
  .action(async (options) => {
    try {
      if (!options.user || !options.template || !options.date) {
        console.error('User ID, template ID, and date are required');
        process.exit(1);
      }

      const enhancedPushService = await import('../services/enhancedPushNotificationService');
      const scheduledDate = new Date(options.date);
      
      const result = await enhancedPushService.default.scheduleNotification(
        options.user,
        options.template,
        scheduledDate,
        { userName: 'Scheduled User' }
      );
      
      console.log('Scheduled notification:', result);
      process.exit(0);
    } catch (error) {
      logger.error('Scheduling notification failed:', error);
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log(`
Lyra AI Database Management CLI

Available commands:
  migrate up          - Run all pending migrations
  migrate down        - Rollback the last migration
  migrate status      - Show migration status
  
  seed run            - Run all pending seeds
  seed rollback       - Rollback the last seed
  seed status         - Show seed status
  
  db reset            - Reset database (rollback all)
  db fresh            - Fresh setup (reset + migrate + seed)
  
  notifications test  - Test notification system
  notifications schedule - Schedule a notification

Examples:
  npm run db:migrate up
  npm run db:seed run
  npm run db:fresh
  npm run notifications test --user=123 --template=mood_reminder
    `);
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

