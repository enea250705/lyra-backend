-- Direct SQL commands to clean up orphaned records
-- Run these commands directly on your production database

-- 1. First, check if the orphaned user exists
SELECT id FROM users WHERE id = 'c11ed8a9-ba3a-4c97-917e-0600e4985488';

-- 2. If the above returns no results, then clean up all orphaned records
-- Delete from emotion_insights table
DELETE FROM emotion_insights WHERE user_id NOT IN (SELECT id FROM users);

-- Delete from usage_analytics table  
DELETE FROM usage_analytics WHERE user_id NOT IN (SELECT id FROM users);

-- Delete from all other tables with user_id references
DELETE FROM subscriptions WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM mood_entries WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM sleep_logs WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM energy_entries WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM focus_sessions WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM journal_entries WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM daily_checkins WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM chat_messages WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM notification_settings WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM user_settings WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM savings_records WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM google_fit_connections WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM google_fit_steps WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM google_fit_heart_rates WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM google_fit_activities WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM google_fit_sleep WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM google_fit_weights WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM google_fit_sync_status WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM calendar_connections WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM calendar_events WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM bank_connections WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM transactions WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM spending_limits WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM blocked_merchants WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM spending_alerts WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM savings_tracking WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM savings_entries WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM push_devices WHERE user_id NOT IN (SELECT id FROM users);

-- 3. Check how many records were deleted
SELECT 'emotion_insights' as table_name, COUNT(*) as orphaned_records FROM emotion_insights WHERE user_id NOT IN (SELECT id FROM users)
UNION ALL
SELECT 'usage_analytics' as table_name, COUNT(*) as orphaned_records FROM usage_analytics WHERE user_id NOT IN (SELECT id FROM users)
UNION ALL
SELECT 'subscriptions' as table_name, COUNT(*) as orphaned_records FROM subscriptions WHERE user_id NOT IN (SELECT id FROM users);
