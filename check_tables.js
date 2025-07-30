const { Client } = require('pg');

async function checkTables() {
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

    // Check existing tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Existing tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Expected tables from our schema
    const expectedTables = [
      'users', 'subscriptions', 'mood_entries', 'daily_checkins',
      'energy_entries', 'sleep_logs', 'focus_sessions', 'journal_entries',
      'notifications', 'notification_settings', 'user_settings', 'usage_analytics',
      'emotion_insights', 'google_fit_connections', 'google_fit_steps',
      'google_fit_heart_rates', 'google_fit_activities', 'google_fit_sleep',
      'google_fit_weights', 'google_fit_sync_status', 'calendar_connections',
      'calendar_events', 'bank_connections', 'transactions', 'blocked_merchants',
      'spending_alerts', 'savings_tracking'
    ];
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    } else {
      console.log('\n✅ All expected tables exist!');
    }

    // Check calendar tables specifically
    console.log('\n🗓️ Checking calendar tables...');
    
    if (existingTables.includes('calendar_connections')) {
      const calConnResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'calendar_connections' 
        ORDER BY ordinal_position;
      `);
      console.log('\n📋 calendar_connections columns:');
      calConnResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    if (existingTables.includes('calendar_events')) {
      const calEventsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        ORDER BY ordinal_position;
      `);
      console.log('\n📋 calendar_events columns:');
      calEventsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

checkTables();