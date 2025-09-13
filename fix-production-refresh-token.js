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

async function fixProductionRefreshToken() {
  try {
    console.log('🔧 Fixing refresh_token column on production database...');
    
    // Check current column definition
    const currentColumn = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'refresh_token'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('Current refresh_token column:', currentColumn[0]);
    
    // Fix the column to use TEXT instead of VARCHAR
    await sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN refresh_token TYPE TEXT
    `);
    
    console.log('✅ Successfully updated refresh_token column to TEXT on production');
    
    // Verify the change
    const updatedColumn = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'refresh_token'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('Updated refresh_token column:', updatedColumn[0]);
    
    // Test login with demo user
    console.log('\n🧪 Testing login with demo user...');
    const testLogin = await sequelize.query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = 'demo@lyra.ai'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('Demo user found:', testLogin[0]);
    
  } catch (error) {
    console.error('❌ Error fixing production refresh_token column:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixProductionRefreshToken();
