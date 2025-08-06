# Chat Messages Migration

This migration adds the `chat_messages` table to the Lyra AI database to enable chat message persistence.

## 📋 What This Migration Does

- Creates the `chat_messages` table with proper structure
- Adds necessary indexes for performance
- Includes data validation constraints
- Adds documentation comments

## 🚀 Running the Migration

### Option 1: Using the Node.js Script (Recommended)

```bash
# Navigate to the backend directory
cd backend

# Run the migration script
node migrate_chat_messages.js
```

### Option 2: Using the SQL File Directly

```bash
# Connect to your PostgreSQL database
psql -h your-host -U your-user -d your-database -f add_chat_messages_table.sql
```

### Option 3: Using the General Migration Script

```bash
# This will run all migrations including the new chat_messages table
node migrate.js
```

## 📊 Table Structure

The `chat_messages` table has the following structure:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for the message |
| `user_id` | UUID | NOT NULL, FOREIGN KEY | Reference to the user who owns this message |
| `text` | TEXT | NOT NULL | The content of the chat message |
| `sender` | VARCHAR(10) | NOT NULL, CHECK | Who sent the message: 'user' or 'lyra' |
| `is_voice` | BOOLEAN | DEFAULT FALSE | Whether this message was sent via voice input |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the message was created |

## 🔍 Indexes Created

- `idx_chat_messages_user_id` - For fast user-based queries
- `idx_chat_messages_created_at` - For chronological ordering
- `idx_chat_messages_sender` - For sender-based filtering

## ✅ Verification

After running the migration, you can verify it worked by:

1. **Check if the table exists:**
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_name = 'chat_messages';
   ```

2. **Check the table structure:**
   ```sql
   \d chat_messages
   ```

3. **Check if indexes were created:**
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'chat_messages';
   ```

## 🎯 Features Enabled

Once this migration is complete, the following features will be available:

- ✅ **Chat message persistence** - Messages are saved to the database
- ✅ **Message history** - Users can see their conversation history
- ✅ **Cross-device sync** - Messages are available on all devices
- ✅ **Performance optimization** - Proper indexing for fast queries
- ✅ **Data integrity** - Foreign key constraints and validation

## 🔧 Troubleshooting

### Common Issues

1. **Permission denied**: Make sure your database user has CREATE TABLE permissions
2. **Connection failed**: Check your DATABASE_URL environment variable
3. **Table already exists**: The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times

### Rollback

If you need to rollback this migration:

```sql
-- Drop the table and indexes
DROP TABLE IF EXISTS chat_messages CASCADE;
```

## 📞 Support

If you encounter any issues with this migration, please check:

1. Database connection settings
2. User permissions
3. PostgreSQL version compatibility
4. Existing table conflicts

The migration is designed to be idempotent and safe to run multiple times. 