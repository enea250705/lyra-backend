const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connect to your production database
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

async function runProductionMigration() {
  try {
    console.log('🔧 Running production migration to fix all token fields...');
    
    // Fix refresh_token column (should already be TEXT, but let's make sure)
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN refresh_token TYPE TEXT
    `);
    console.log('✅ Fixed refresh_token column');
    
    // Fix verification_token column to TEXT as well (just in case)
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN verification_token TYPE TEXT
    `);
    console.log('✅ Fixed verification_token column');
    
    // Check if there are any other VARCHAR fields that might cause issues
    const varcharFields = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND data_type = 'character varying'
      AND character_maximum_length < 1000
      ORDER BY column_name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('\n📋 VARCHAR fields that might need attention:');
    varcharFields.forEach(field => {
      console.log(`  ${field.column_name}: ${field.data_type}(${field.character_maximum_length})`);
    });
    
    // Test a simple query to make sure the database is working
    const userCount = await sequelize.query('SELECT COUNT(*) FROM users', { type: Sequelize.QueryTypes.SELECT });
    console.log(`\n✅ Database is working. Total users: ${userCount[0].count}`);
    
    // Test if we can find your user
    const yourUser = await sequelize.query(`
      SELECT id, email, first_name, last_name, is_verified 
      FROM users 
      WHERE email = 'eneamuja87@gmail.com'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    if (yourUser.length > 0) {
      console.log('✅ Your user account found:', yourUser[0]);
    } else {
      console.log('❌ Your user account not found');
    }
    
  } catch (error) {
    console.error('❌ Error running production migration:', error.message);
  } finally {
    await sequelize.close();
  }
}

runProductionMigration();

