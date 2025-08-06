const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateChatMessages() {
  // Database connection from environment
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mcj0IaE2NlyS@ep-sweet-unit-a2akmhvu-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read the chat messages migration SQL file
    const migrationPath = path.join(__dirname, 'add_chat_messages_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running chat messages migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Chat messages migration completed successfully!');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'chat_messages' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Chat messages table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });
    
    // Check if indexes were created
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'chat_messages';
    `);
    
    console.log('\n🔍 Indexes created:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
    console.log('\n🎉 Chat messages table migration completed successfully!');
    console.log('💡 You can now use the chat persistence feature in your app.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the migration
migrateChatMessages(); 