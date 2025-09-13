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

async function checkAllTokenFields() {
  try {
    console.log('🔍 Checking all token-related fields in users table...');
    
    // Check all columns that might store tokens
    const columns = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND (column_name LIKE '%token%' OR column_name LIKE '%hash%')
      ORDER BY column_name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('Token-related columns:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });
    
    // Test generating a JWT to see its length
    const jwt = require('jsonwebtoken');
    const testPayload = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'demo@lyra.ai',
      firstName: 'Demo',
      lastName: 'User'
    };
    
    const testToken = jwt.sign(testPayload, 'test-secret', { expiresIn: '7d' });
    const testRefreshToken = jwt.sign(testPayload, 'test-refresh-secret', { expiresIn: '30d' });
    
    console.log(`\nTest JWT length: ${testToken.length} characters`);
    console.log(`Test Refresh JWT length: ${testRefreshToken.length} characters`);
    
    // Check if verification_token also needs fixing
    const verificationTokenCol = columns.find(col => col.column_name === 'verification_token');
    if (verificationTokenCol && verificationTokenCol.character_maximum_length && verificationTokenCol.character_maximum_length < 500) {
      console.log(`\n⚠️  verification_token column might also need fixing (${verificationTokenCol.character_maximum_length} chars)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking token fields:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkAllTokenFields();
