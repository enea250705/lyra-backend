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
    
    // Create your user account
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('your_password_here', 10); // Change this password
    
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
      INSERT INTO user_settings (id, user_id, language, timezone, theme, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, {
      bind: [settingsId, userId, 'en', 'UTC', 'light'],
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
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

recreateUser();
