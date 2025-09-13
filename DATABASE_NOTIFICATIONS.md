# Lyra AI Database & Notification System

This document describes the enhanced database and notification system for Lyra AI.

## Database Improvements

### ✅ Database Relationships & Associations

All models now have proper relationships established in `backend/src/models/index.ts`:

- **User** has one-to-many relationships with all user data models
- **Subscription** belongs to User
- **Calendar** events belong to Calendar connections
- **Google Fit** data belongs to Google Fit connections
- Proper foreign key constraints and cascade deletes

### ✅ Database Indexes & Constraints

Comprehensive indexes added for optimal performance:

```sql
-- User indexes
CREATE UNIQUE INDEX ON users (email);
CREATE UNIQUE INDEX ON users (google_id);

-- Subscription indexes
CREATE UNIQUE INDEX ON subscriptions (user_id);
CREATE INDEX ON subscriptions (plan);
CREATE INDEX ON subscriptions (status);

-- Data indexes
CREATE INDEX ON mood_entries (user_id, created_at);
CREATE INDEX ON sleep_logs (user_id, bedtime);
CREATE INDEX ON journal_entries (user_id, created_at);
CREATE INDEX ON savings_records (user_id, created_at, category);
```

### ✅ Database Migrations

Complete migration system with:

- **Migration Runner**: `backend/src/database/migrationRunner.ts`
- **Initial Schema**: `backend/src/database/migrations/001-initial-schema.ts`
- **CLI Commands**: `backend/src/scripts/db-cli.ts`

#### Migration Commands

```bash
# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:migrate:down

# Check migration status
npm run db:migrate:status

# Reset database
npm run db:reset

# Fresh setup (reset + migrate + seed)
npm run db:fresh
```

### ✅ Database Seeding

Comprehensive seeding system with:

- **Demo Data**: `backend/src/database/seeds/001-demo-data.ts`
- **Sample Users**: Free, Pro, and Premium users
- **Historical Data**: 30 days of mood, sleep, energy, journal entries
- **Chat Messages**: AI conversations
- **Savings Records**: Financial tracking data

#### Seeding Commands

```bash
# Run seeds
npm run db:seed

# Rollback seeds
npm run db:seed:rollback

# Check seed status
npm run db:seed:status
```

## Enhanced Push Notification System

### ✅ Notification Templates

Pre-built notification templates in `backend/src/services/enhancedPushNotificationService.ts`:

```typescript
const templates = [
  'mood_reminder',           // Daily mood check-ins
  'journal_reminder',        // Journal writing reminders
  'sleep_reminder',          // Bedtime reminders
  'savings_celebration',     // Savings achievements
  'mood_insight',           // Mood pattern insights
  'location_alert',         // Spending intervention alerts
  'weekly_summary',         // Weekly progress summaries
  'goal_reminder',          // Goal progress reminders
  'crisis_support',         // Mental health support
  'subscription_upgrade'    // Premium feature promotions
];
```

### ✅ Notification Scheduling

Advanced scheduling system with:

- **Immediate Notifications**: Sent instantly based on triggers
- **Scheduled Notifications**: Queued for future delivery
- **Recurring Notifications**: Based on user preferences
- **Contextual Notifications**: Triggered by user behavior

#### Scheduling Features

```typescript
// Schedule a notification
await enhancedPushService.scheduleNotification(
  userId,
  'weekly_summary',
  new Date('2024-01-15T10:00:00Z'),
  { userName: 'John' }
);

// Process scheduled notifications (cron job)
await enhancedPushService.processScheduledNotifications();
```

### ✅ Notification Preferences Management

Comprehensive preference system in `backend/src/services/notificationPreferencesService.ts`:

#### User Preferences

```typescript
interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  category: 'reminder' | 'insight' | 'intervention' | 'achievement' | 'promotion' | 'support';
  enabled: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format
  conditions?: Record<string, any>;
}
```

#### Global Settings

```typescript
interface GlobalSettings {
  enabled: boolean;
  quietHours: { start: string; end: string };
  maxNotificationsPerDay: number;
  priorityLevel: 'low' | 'normal' | 'high';
}
```

### ✅ Notification Scheduler Service

Automated notification system with cron jobs in `backend/src/services/notificationSchedulerService.ts`:

#### Scheduled Jobs

- **Every Minute**: Process scheduled notifications & send reminders
- **Every 5 Minutes**: Send contextual notifications
- **Weekly**: Send weekly summaries (Monday 10 AM)
- **Monthly**: Send monthly insights (1st at 9 AM)
- **Daily**: Cleanup old notifications (2 AM)
- **Weekly**: Send subscription reminders (Friday 3 PM)
- **Weekly**: Send goal reminders (Tuesday 11 AM)
- **Daily**: Send crisis support checks (6 PM)

#### Job Management

```typescript
// Start scheduler
notificationScheduler.start();

// Stop scheduler
notificationScheduler.stop();

// Get job status
const status = notificationScheduler.getStatus();

// Manually trigger job
await notificationScheduler.triggerJob('weekly-summary');
```

## Usage Examples

### Database Management

```bash
# Fresh database setup
npm run db:fresh

# Check migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:down
```

### Notification Testing

```bash
# Test notification
npm run notifications:test -- --user=123 --template=mood_reminder

# Schedule notification
npm run notifications:schedule -- --user=123 --template=weekly_summary --date="2024-01-15T10:00:00Z"
```

### Programmatic Usage

```typescript
// Send notification
const result = await enhancedPushService.sendToUser(
  userId,
  'mood_reminder',
  { userName: 'John', mood: 7 }
);

// Check preferences
const shouldSend = await notificationPreferences.shouldSendNotification(
  userId,
  'location_alert',
  { mood: 3, nearbyStores: 5 }
);

// Update preferences
await notificationPreferences.updatePreference(
  userId,
  'mood_reminder',
  { enabled: false, time: '10:00' }
);
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token

# Notification Settings
NOTIFICATION_QUIET_HOURS_START=22:00
NOTIFICATION_QUIET_HOURS_END=08:00
MAX_NOTIFICATIONS_PER_DAY=10
```

### Database Models

All models are properly connected with:
- Foreign key relationships
- Cascade deletes
- Proper indexes
- Data validation
- Timestamps

### Notification Templates

Templates support:
- Variable interpolation (`${userName}`, `${mood}`)
- Conditional sending based on user preferences
- Quiet hours respect
- Daily notification limits
- Priority levels

## Monitoring & Logging

All operations are logged with:
- Success/failure status
- Performance metrics
- Error details
- User activity tracking

## Security

- User data isolation
- Secure token handling
- Rate limiting
- Input validation
- SQL injection prevention

## Performance

- Optimized database queries
- Proper indexing
- Connection pooling
- Batch processing
- Async operations

This enhanced system provides a robust foundation for Lyra AI's database and notification infrastructure.

