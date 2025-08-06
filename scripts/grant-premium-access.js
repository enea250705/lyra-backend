const { Sequelize } = require('sequelize');
const User = require('../dist/models/User').default;
const Subscription = require('../dist/models/Subscription').default;
const { SubscriptionPlan, SubscriptionStatus } = require('../dist/models/Subscription');

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'lyra_dev',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  }
);

async function grantPremiumAccess() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const email = 'eneamuja87@gmail.com';
    
    // Find user by email
    const user = await User.findOne({
      where: { email: email }
    });

    if (!user) {
      console.log(`User with email ${email} not found. Please register first.`);
      return;
    }

    console.log(`Found user: ${user.firstName || 'Unknown'} (${user.email})`);

    // Check if user already has a subscription
    let subscription = await Subscription.findOne({
      where: { userId: user.id }
    });

    const currentDate = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(currentDate.getFullYear() + 1);

    if (subscription) {
      // Update existing subscription to Premium
      await subscription.update({
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: currentDate,
        currentPeriodEnd: oneYearFromNow,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        metadata: {
          source: 'manual_grant',
          grantedBy: 'developer',
          grantedAt: currentDate.toISOString(),
          reason: 'Developer access'
        }
      });
      console.log('✅ Existing subscription updated to Premium!');
    } else {
      // Create new Premium subscription
      subscription = await Subscription.create({
        userId: user.id,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: currentDate,
        currentPeriodEnd: oneYearFromNow,
        cancelAtPeriodEnd: false,
        platform: 'manual',
        environment: 'development',
        metadata: {
          source: 'manual_grant',
          grantedBy: 'developer',
          grantedAt: currentDate.toISOString(),
          reason: 'Developer access'
        }
      });
      console.log('✅ New Premium subscription created!');
    }

    console.log('\n🎉 Premium Access Granted Successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 User: ${user.firstName || 'Unknown'} ${user.lastName || ''}`);
    console.log(`📦 Plan: ${subscription.plan.toUpperCase()}`);
    console.log(`📊 Status: ${subscription.status.toUpperCase()}`);
    console.log(`📅 Valid until: ${oneYearFromNow.toLocaleDateString()}`);
    console.log('\n🔓 All Premium features are now unlocked!');
    
    // List Premium features
    console.log('\n✨ Premium Features Available:');
    console.log('• Advanced Sleep Analysis & Correlations');
    console.log('• Location-based Mood Alerts');
    console.log('• SMS Alert System');
    console.log('• Crisis Support & Emergency Contacts');
    console.log('• Unlimited Data Storage & History');
    console.log('• Advanced AI Coaching & Insights');
    console.log('• Priority Customer Support');
    console.log('• Advanced Health Data Integration');
    console.log('• AI Savings Recommendations');
    console.log('• Automatic Savings Detection');
    console.log('• Expense Forecasting & Analytics');
    console.log('• Custom Intervention Rules');

  } catch (error) {
    console.error('❌ Error granting Premium access:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
grantPremiumAccess();