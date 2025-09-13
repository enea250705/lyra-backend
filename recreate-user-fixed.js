const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
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

async function recreateUser() {
  try {
    console.log('🔄 Recreating your user account...');
    
    // Check if user already exists
    const existingUser = await sequelize.query(`
      SELECT id, email FROM users WHERE email = 'eneamuja87@gmail.com'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    if (existingUser.length > 0) {
      console.log('⚠️  User already exists:', existingUser[0]);
      console.log('🔄 Updating existing user...');
      
      const userId = existingUser[0].id;
      const hashedPassword = await bcrypt.hash('your_password_here', 10);
      
      await sequelize.query(`
        UPDATE users 
        SET password_hash = $1, first_name = $2, last_name = $3, is_verified = $4, updated_at = NOW()
        WHERE id = $5
      `, {
        bind: [hashedPassword, 'Enea', 'Muja', true, userId],
        type: Sequelize.QueryTypes.UPDATE
      });
      
      console.log('✅ User updated successfully');
      console.log('📧 Email: eneamuja87@gmail.com');
      console.log('🔑 Password: your_password_here (please change this)');
      console.log('🆔 User ID:', userId);
      
    } else {
      // Create new user
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash('your_password_here', 10);
      
      console.log('Creating new user with ID:', userId);
      console.log('Password hash length:', hashedPassword.length);
      
      const user = await sequelize.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, first_name, last_name, created_at
      `, {
        bind: [userId, 'eneamuja87@gmail.com', hashedPassword, 'Enea', 'Muja', true],
        type: Sequelize.QueryTypes.SELECT
      });
      
      console.log('✅ User created:', user[0]);
      
      // Create subscription
      const subscriptionId = uuidv4();
      await sequelize.query(`
        INSERT INTO subscriptions (id, user_id, plan, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, {
        bind: [subscriptionId, userId, 'free', 'active'],
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ Subscription created');
      
      // Create user settings
      const settingsId = uuidv4();
      await sequelize.query(`
        INSERT INTO user_settings (id, user_id, language, timezone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, {
        bind: [settingsId, userId, 'en', 'UTC'],
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ User settings created');
      
      // Create notification settings
      const notificationSettingsId = uuidv4();
      await sequelize.query(`
        INSERT INTO notification_settings (id, user_id, mood_reminder, journal_reminder, sleep_reminder, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, {
        bind: [notificationSettingsId, userId, true, true, true],
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log('✅ Notification settings created');
      console.log('\n🎉 Your user account has been recreated!');
      console.log('📧 Email: eneamuja87@gmail.com');
      console.log('🔑 Password: your_password_here (please change this)');
      console.log('🆔 User ID:', userId);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

recreateUser();
