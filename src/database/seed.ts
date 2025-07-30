import sequelize from '../config/database';
import User from '../models/User';
import DailyCheckin from '../models/DailyCheckin';
import MoodEntry from '../models/MoodEntry';
import EnergyEntry from '../models/EnergyEntry';
import { hashPassword } from '../utils/encryption';
import logger from '../utils/logger';

const seedDatabase = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    logger.info('Database synchronized for seeding');

    logger.info('Database seeding completed successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();