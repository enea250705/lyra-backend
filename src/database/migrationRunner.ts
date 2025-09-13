import { Sequelize } from 'sequelize';
import { config } from '../config';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

class MigrationRunner {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = new Sequelize(config.database.url, {
      dialect: 'postgres',
      logging: config.env === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
  }

  async runMigrations(): Promise<void> {
    try {
      logger.info('Starting database migrations...');

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get list of migration files
      const migrationsDir = path.join(__dirname, 'migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.ts') && file !== 'index.ts')
        .sort();

      // Get already run migrations
      const runMigrations = await this.getRunMigrations();

      // Run pending migrations
      for (const file of migrationFiles) {
        const migrationName = file.replace('.ts', '');
        
        if (!runMigrations.includes(migrationName)) {
          logger.info(`Running migration: ${migrationName}`);
          
          const migration = await import(path.join(migrationsDir, file));
          await migration.up(this.sequelize.getQueryInterface());
          
          // Record migration as run
          await this.recordMigration(migrationName);
          
          logger.info(`Migration ${migrationName} completed successfully`);
        } else {
          logger.info(`Migration ${migrationName} already run, skipping`);
        }
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  async rollbackMigrations(count: number = 1): Promise<void> {
    try {
      logger.info(`Rolling back ${count} migration(s)...`);

      // Get run migrations in reverse order
      const runMigrations = await this.getRunMigrations();
      const migrationsToRollback = runMigrations.slice(-count).reverse();

      for (const migrationName of migrationsToRollback) {
        logger.info(`Rolling back migration: ${migrationName}`);
        
        const migrationFile = `${migrationName}.ts`;
        const migration = await import(path.join(__dirname, 'migrations', migrationFile));
        await migration.down(this.sequelize.getQueryInterface());
        
        // Remove migration record
        await this.removeMigrationRecord(migrationName);
        
        logger.info(`Migration ${migrationName} rolled back successfully`);
      }

      logger.info('Migration rollback completed successfully');
    } catch (error) {
      logger.error('Migration rollback failed:', error);
      throw error;
    }
  }

  async runSeeds(): Promise<void> {
    try {
      logger.info('Starting database seeding...');

      // Create seeds table if it doesn't exist
      await this.createSeedsTable();

      // Get list of seed files
      const seedsDir = path.join(__dirname, 'seeds');
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.ts') && file !== 'index.ts')
        .sort();

      // Get already run seeds
      const runSeeds = await this.getRunSeeds();

      // Run pending seeds
      for (const file of seedFiles) {
        const seedName = file.replace('.ts', '');
        
        if (!runSeeds.includes(seedName)) {
          logger.info(`Running seed: ${seedName}`);
          
          const seed = await import(path.join(seedsDir, file));
          await seed.up(this.sequelize.getQueryInterface());
          
          // Record seed as run
          await this.recordSeed(seedName);
          
          logger.info(`Seed ${seedName} completed successfully`);
        } else {
          logger.info(`Seed ${seedName} already run, skipping`);
        }
      }

      logger.info('All seeds completed successfully');
    } catch (error) {
      logger.error('Seeding failed:', error);
      throw error;
    }
  }

  async rollbackSeeds(count: number = 1): Promise<void> {
    try {
      logger.info(`Rolling back ${count} seed(s)...`);

      // Get run seeds in reverse order
      const runSeeds = await this.getRunSeeds();
      const seedsToRollback = runSeeds.slice(-count).reverse();

      for (const seedName of seedsToRollback) {
        logger.info(`Rolling back seed: ${seedName}`);
        
        const seedFile = `${seedName}.ts`;
        const seed = await import(path.join(__dirname, 'seeds', seedFile));
        await seed.down(this.sequelize.getQueryInterface());
        
        // Remove seed record
        await this.removeSeedRecord(seedName);
        
        logger.info(`Seed ${seedName} rolled back successfully`);
      }

      logger.info('Seed rollback completed successfully');
    } catch (error) {
      logger.error('Seed rollback failed:', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    await this.sequelize.getQueryInterface().createTable('migrations', {
      id: {
        type: 'SERIAL',
        primaryKey: true,
      },
      name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        unique: true,
      },
      run_at: {
        type: 'TIMESTAMP',
        allowNull: false,
        defaultValue: 'NOW()',
      },
    });
  }

  private async createSeedsTable(): Promise<void> {
    await this.sequelize.getQueryInterface().createTable('seeds', {
      id: {
        type: 'SERIAL',
        primaryKey: true,
      },
      name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        unique: true,
      },
      run_at: {
        type: 'TIMESTAMP',
        allowNull: false,
        defaultValue: 'NOW()',
      },
    });
  }

  async getRunMigrations(): Promise<string[]> {
    try {
      const [results] = await this.sequelize.query('SELECT name FROM migrations ORDER BY run_at');
      return (results as any[]).map(row => row.name);
    } catch (error) {
      return [];
    }
  }

  async getRunSeeds(): Promise<string[]> {
    try {
      const [results] = await this.sequelize.query('SELECT name FROM seeds ORDER BY run_at');
      return (results as any[]).map(row => row.name);
    } catch (error) {
      return [];
    }
  }

  private async recordMigration(name: string): Promise<void> {
    await this.sequelize.query('INSERT INTO migrations (name) VALUES (?)', {
      replacements: [name],
    });
  }

  private async recordSeed(name: string): Promise<void> {
    await this.sequelize.query('INSERT INTO seeds (name) VALUES (?)', {
      replacements: [name],
    });
  }

  private async removeMigrationRecord(name: string): Promise<void> {
    await this.sequelize.query('DELETE FROM migrations WHERE name = ?', {
      replacements: [name],
    });
  }

  private async removeSeedRecord(name: string): Promise<void> {
    await this.sequelize.query('DELETE FROM seeds WHERE name = ?', {
      replacements: [name],
    });
  }

  async close(): Promise<void> {
    await this.sequelize.close();
  }
}

export default MigrationRunner;
