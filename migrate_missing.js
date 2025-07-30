const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mcj0IaE2NlyS@ep-sweet-unit-a2akmhvu-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the missing tables SQL file
    const schemaPath = path.join(__dirname, 'add_missing_tables.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Adding missing tables...');
    await client.query(schema);
    
    console.log('✅ Missing tables added successfully!');
    
    // Verify all tables now exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 All tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if all expected tables now exist
    const expectedTables = [
      'users', 'subscriptions', 'mood_entries', 'daily_checkins',
      'energy_entries', 'sleep_logs', 'focus_sessions', 'journal_entries',
      'notifications', 'notification_settings', 'user_settings', 'usage_analytics',
      'emotion_insights', 'google_fit_connections', 'google_fit_steps',
      'google_fit_heart_rates', 'google_fit_activities', 'google_fit_sleep',
      'google_fit_weights', 'google_fit_sync_status'
    ];
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('\n🎉 All expected tables now exist!');
    } else {
      console.log('\n❌ Still missing tables:');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

runMigration();