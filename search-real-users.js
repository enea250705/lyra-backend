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

async function searchForRealUsers() {
  try {
    console.log('🔍 Searching for traces of your real users...');
    
    // Check if there are any references to your email in other tables
    const emailToFind = 'eneamuja87@gmail.com';
    
    // Search in all tables that might have user references
    const tablesToSearch = [
      'subscriptions', 'mood_entries', 'sleep_logs', 'energy_entries',
      'focus_sessions', 'journal_entries', 'daily_checkins', 'chat_messages',
      'notifications', 'notification_settings', 'user_settings', 'savings_records',
      'emotion_insights', 'usage_analytics'
    ];
    
    console.log(`🔎 Looking for references to: ${emailToFind}`);
    
    for (const table of tablesToSearch) {
      try {
        // Get table structure to see what columns exist
        const columns = await sequelize.getQueryInterface().describeTable(table);
        console.log(`\n📋 Table: ${table}`);
        console.log(`   Columns: ${Object.keys(columns).join(', ')}`);
        
        // Check if there are any records in this table
        const count = await sequelize.query(`SELECT COUNT(*) FROM ${table}`, { type: Sequelize.QueryTypes.SELECT });
        console.log(`   Records: ${count[0].count}`);
        
        // If there are records, show a sample
        if (count[0].count > 0) {
          const sample = await sequelize.query(`SELECT * FROM ${table} LIMIT 2`, { type: Sequelize.QueryTypes.SELECT });
          console.log(`   Sample:`, JSON.stringify(sample, null, 2));
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${table}: ${error.message}`);
      }
    }
    
    // Check if there are any user IDs that might be your real users
    console.log('\n🔍 Checking for any non-demo user IDs...');
    const allUsers = await sequelize.query('SELECT id, email, created_at FROM users ORDER BY created_at', { type: Sequelize.QueryTypes.SELECT });
    console.log('👥 All users in database:', allUsers);
    
    // Check if there are any orphaned records that might reference your real users
    console.log('\n🔍 Checking for orphaned records that might reference your real users...');
    const orphanedCheck = await sequelize.query(`
      SELECT 'usage_analytics' as table_name, user_id, COUNT(*) as count 
      FROM usage_analytics 
      WHERE user_id NOT IN (SELECT id FROM users)
      GROUP BY user_id
      UNION ALL
      SELECT 'emotion_insights' as table_name, user_id, COUNT(*) as count 
      FROM emotion_insights 
      WHERE user_id NOT IN (SELECT id FROM users)
      GROUP BY user_id
    `, { type: Sequelize.QueryTypes.SELECT });
    
    if (orphanedCheck.length > 0) {
      console.log('🚨 Found orphaned records that might be your real users:', orphanedCheck);
    } else {
      console.log('✅ No orphaned records found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

searchForRealUsers();
