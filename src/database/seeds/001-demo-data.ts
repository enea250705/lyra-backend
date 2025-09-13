import { QueryInterface } from 'sequelize';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Starting database seeding...');

    // Create demo users
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    // Insert demo users (with conflict handling)
    await queryInterface.sequelize.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, is_verified, created_at, updated_at)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'demo@lyra.ai', '${hashedPassword}', 'Demo', 'User', true, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', 'pro@lyra.ai', '${hashedPassword}', 'Pro', 'User', true, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', 'premium@lyra.ai', '${hashedPassword}', 'Premium', 'User', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create subscriptions (with conflict handling)
    await queryInterface.sequelize.query(`
      INSERT INTO subscriptions (id, user_id, plan, status, cancel_at_period_end, created_at, updated_at, current_period_start, current_period_end)
      VALUES 
        ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'free', 'active', false, NOW(), NOW(), NULL, NULL),
        ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'pro', 'active', false, NOW(), NOW(), NOW(), NOW() + INTERVAL '30 days'),
        ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'premium', 'active', false, NOW(), NOW(), NOW(), NOW() + INTERVAL '30 days')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create user settings
    await queryInterface.bulkInsert('user_settings', [
      {
        id: '750e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        language: 'en',
        timezone: 'UTC',
        units: JSON.stringify({ temperature: 'celsius', distance: 'km' }),
        preferences: JSON.stringify({ theme: 'light', notifications: true }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '750e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        language: 'en',
        timezone: 'UTC',
        units: JSON.stringify({ temperature: 'celsius', distance: 'km' }),
        preferences: JSON.stringify({ theme: 'dark', notifications: true }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '750e8400-e29b-41d4-a716-446655440003',
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        language: 'en',
        timezone: 'UTC',
        units: JSON.stringify({ temperature: 'celsius', distance: 'km' }),
        preferences: JSON.stringify({ theme: 'auto', notifications: true }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create notification settings
    await queryInterface.bulkInsert('notification_settings', [
      {
        id: '850e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        mood_reminder: true,
        mood_reminder_time: '09:00',
        journal_reminder: true,
        journal_reminder_time: '21:00',
        sleep_reminder: true,
        sleep_reminder_time: '22:00',
        finance_reminder: true,
        finance_reminder_frequency: 'daily',
        created_at: new Date(),
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        mood_reminder: true,
        mood_reminder_time: '08:30',
        journal_reminder: true,
        journal_reminder_time: '20:30',
        sleep_reminder: true,
        sleep_reminder_time: '21:30',
        finance_reminder: true,
        finance_reminder_frequency: 'daily',
        created_at: new Date(),
      },
      {
        id: '850e8400-e29b-41d4-a716-446655440003',
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        mood_reminder: true,
        mood_reminder_time: '08:00',
        journal_reminder: true,
        journal_reminder_time: '20:00',
        sleep_reminder: true,
        sleep_reminder_time: '21:00',
        finance_reminder: true,
        finance_reminder_frequency: 'daily',
        created_at: new Date(),
      },
    ]);

    // Create sample mood entries for the last 30 days
    const moodEntries = [];
    const userIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003'
    ];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const userId of userIds) {
        const moodValue = Math.floor(Math.random() * 5) + 3; // Random mood between 3-7
        const categories = ['happy', 'neutral', 'stressed', 'energetic', 'calm'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        moodEntries.push({
          id: uuidv4(),
          user_id: userId,
          mood_value: moodValue,
          mood_category: category,
          notes: i % 3 === 0 ? `Sample mood entry for ${date.toDateString()}` : null,
          created_at: date,
        });
      }
    }

    await queryInterface.bulkInsert('mood_entries', moodEntries);

    // Create sample sleep logs for the last 30 days
    const sleepLogs = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const userId of userIds) {
        const bedtime = new Date(date);
        bedtime.setHours(22 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
        
        const wakeTime = new Date(bedtime);
        wakeTime.setHours(bedtime.getHours() + 7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
        
        const sleepDuration = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60);
        const sleepQuality = Math.floor(Math.random() * 5) + 3; // Random quality between 3-7
        
        sleepLogs.push({
          id: uuidv4(),
          user_id: userId,
          bedtime: bedtime,
          wake_time: wakeTime,
          sleep_duration: Math.round(sleepDuration * 100) / 100,
          sleep_quality: sleepQuality,
          sleep_stages: JSON.stringify({
            light: Math.floor(Math.random() * 60) + 30,
            deep: Math.floor(Math.random() * 60) + 60,
            rem: Math.floor(Math.random() * 60) + 45,
            awake: Math.floor(Math.random() * 30) + 10,
          }),
          notes: i % 4 === 0 ? `Sleep notes for ${date.toDateString()}` : null,
          created_at: date,
          updated_at: date,
        });
      }
    }

    await queryInterface.bulkInsert('sleep_logs', sleepLogs);

    // Create sample energy entries
    const energyEntries = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const userId of userIds) {
        const energyLevel = Math.floor(Math.random() * 5) + 3; // Random energy between 3-7
        
        energyEntries.push({
          id: uuidv4(),
          user_id: userId,
          energy_level: energyLevel,
          notes: i % 5 === 0 ? `Energy level notes for ${date.toDateString()}` : null,
          created_at: date,
        });
      }
    }

    await queryInterface.bulkInsert('energy_entries', energyEntries);

    // Create sample journal entries
    const journalEntries = [];
    const journalTitles = [
      'Morning Reflection',
      'Daily Gratitude',
      'Evening Thoughts',
      'Weekend Plans',
      'Work Update',
      'Personal Growth',
      'Relationship Notes',
      'Health Check-in',
      'Creative Ideas',
      'Future Planning'
    ];

    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const userId of userIds) {
        const title = journalTitles[Math.floor(Math.random() * journalTitles.length)];
        const mood = Math.floor(Math.random() * 5) + 3;
        
        journalEntries.push({
          id: uuidv4(),
          user_id: userId,
          title: title,
          content: `This is a sample journal entry for ${date.toDateString()}. It contains some thoughts and reflections about the day.`,
          mood: mood,
          tags: JSON.stringify(['sample', 'demo', 'reflection']),
          created_at: date,
          updated_at: date,
        });
      }
    }

    await queryInterface.bulkInsert('journal_entries', journalEntries);

    // Create sample daily checkins
    const dailyCheckins = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const userId of userIds) {
        const mood = Math.floor(Math.random() * 5) + 3;
        const energy = Math.floor(Math.random() * 5) + 3;
        const sleepHours = 6 + Math.random() * 3; // Random sleep between 6-9 hours
        
        dailyCheckins.push({
          id: uuidv4(),
          user_id: userId,
          mood: mood,
          energy: energy,
          sleep_hours: Math.round(sleepHours * 100) / 100,
          goals: JSON.stringify(['Exercise', 'Read', 'Meditate']),
          notes: i % 7 === 0 ? `Weekly check-in notes for ${date.toDateString()}` : null,
          checkin_date: date.toISOString().split('T')[0],
          created_at: date,
        });
      }
    }

    await queryInterface.bulkInsert('daily_checkins', dailyCheckins);

    // Create sample chat messages
    const chatMessages = [];
    const userMessages = [
      'How are you feeling today?',
      'I had a great day at work',
      'Can you help me track my mood?',
      'I want to improve my sleep',
      'What insights do you have for me?',
      'I need some motivation',
      'Tell me about my patterns',
      'How can I save more money?',
      'I feel stressed lately',
      'What should I focus on today?'
    ];

    const aiResponses = [
      'I\'m here to help you track and improve your wellbeing. Let\'s start with how you\'re feeling right now.',
      'That\'s wonderful! A positive work day can really boost your overall mood and energy.',
      'I\'d be happy to help you track your mood. On a scale of 1-10, how would you rate your current mood?',
      'Sleep is crucial for your wellbeing. Let\'s look at your sleep patterns and find ways to improve them.',
      'Based on your recent data, I can see some interesting patterns. Would you like me to share some insights?',
      'I understand you need motivation. Let\'s focus on your recent wins and set some achievable goals.',
      'I\'ve noticed some patterns in your mood and energy levels. Would you like me to explain what I\'ve found?',
      'Great question! I can help you identify spending patterns and suggest ways to save money.',
      'I\'m sorry to hear you\'re feeling stressed. Let\'s work together to find some strategies to help you cope.',
      'Based on your current mood and energy, I suggest focusing on self-care activities today.'
    ];

    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setTime(date.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in last 30 days
      
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const userMessage = userMessages[Math.floor(Math.random() * userMessages.length)];
      const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      // User message
      chatMessages.push({
        id: uuidv4(),
        user_id: userId,
        message: userMessage,
        is_user: true,
        metadata: JSON.stringify({ timestamp: date.toISOString() }),
        created_at: date,
      });
      
      // AI response (slightly later)
      const aiDate = new Date(date.getTime() + Math.random() * 60000); // Within 1 minute
      chatMessages.push({
        id: uuidv4(),
        user_id: userId,
        message: aiResponse,
        is_user: false,
        metadata: JSON.stringify({ timestamp: aiDate.toISOString() }),
        created_at: aiDate,
      });
    }

    await queryInterface.bulkInsert('chat_messages', chatMessages);

    // Create sample savings records
    const savingsRecords = [];
    const reasons = [
      'Skipped expensive coffee',
      'Avoided impulse purchase',
      'Cancelled unused subscription',
      'Chose cheaper alternative',
      'Prevented mood-based spending',
      'Avoided expensive store',
      'Waited 24 hours before buying',
      'Found better deal online',
      'Used coupon instead',
      'Made coffee at home'
    ];

    const categories = ['food', 'shopping', 'entertainment', 'transport', 'subscription', 'other'];
    const triggerTypes = ['mood_alert', 'location_alert', 'ai_suggestion', 'manual', 'time_based', 'weather_based'];

    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setTime(date.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const triggerType = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
      
      const originalAmount = Math.floor(Math.random() * 100) + 10; // 10-110
      const savedAmount = Math.floor(originalAmount * 0.3) + 5; // 30% + 5
      const actualAmount = originalAmount - savedAmount;
      
      savingsRecords.push({
        id: uuidv4(),
        user_id: userId,
        amount: actualAmount,
        reason: reason,
        category: category,
        original_amount: originalAmount,
        saved_amount: savedAmount,
        trigger_type: triggerType,
        metadata: JSON.stringify({
          location: 'Sample Location',
          mood_at_time: Math.floor(Math.random() * 5) + 3,
          weather: 'sunny'
        }),
        created_at: date,
        updated_at: date,
      });
    }

    await queryInterface.bulkInsert('savings_records', savingsRecords);

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  try {
    logger.info('Rolling back database seeding...');

    // Clear all seeded data
    await queryInterface.bulkDelete('savings_records', {});
    await queryInterface.bulkDelete('chat_messages', {});
    await queryInterface.bulkDelete('daily_checkins', {});
    await queryInterface.bulkDelete('journal_entries', {});
    await queryInterface.bulkDelete('energy_entries', {});
    await queryInterface.bulkDelete('sleep_logs', {});
    await queryInterface.bulkDelete('mood_entries', {});
    await queryInterface.bulkDelete('notification_settings', {});
    await queryInterface.bulkDelete('user_settings', {});
    await queryInterface.bulkDelete('subscriptions', {});
    await queryInterface.bulkDelete('users', {});

    logger.info('Database seeding rollback completed successfully');
  } catch (error) {
    logger.error('Database seeding rollback failed:', error);
    throw error;
  }
};
