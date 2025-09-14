const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connect to your database
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users table...');
    
    // Check if users table exists
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Available tables:', tables);
    
    if (tables.includes('users')) {
      // Count users
      const userCount = await sequelize.query('SELECT COUNT(*) FROM users', { type: Sequelize.QueryTypes.SELECT });
      console.log('👥 Total users:', userCount[0].count);
      
      // Get sample users
      const users = await sequelize.query('SELECT id, email, first_name, last_name, created_at FROM users LIMIT 5', { type: Sequelize.QueryTypes.SELECT });
      console.log('📝 Sample users:', users);
      
      // Check recent activity
      const recentUsers = await sequelize.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 3', { type: Sequelize.QueryTypes.SELECT });
      console.log('🕒 Recent users:', recentUsers);
      
    } else {
      console.log('❌ Users table does not exist!');
    }
    
    // Check other tables for user references
    console.log('\n🔍 Checking other tables for user data...');
    const tablesWithUsers = ['subscriptions', 'mood_entries', 'sleep_logs', 'journal_entries'];
    
    for (const table of tablesWithUsers) {
      if (tables.includes(table)) {
        const count = await sequelize.query(`SELECT COUNT(*) FROM ${table}`, { type: Sequelize.QueryTypes.SELECT });
        console.log(`📊 ${table}: ${count[0].count} records`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();

