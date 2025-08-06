-- Add chat_messages table to existing Lyra AI database
-- Migration script for chat messages persistence feature

-- Enable UUID extension for PostgreSQL (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'lyra')),
    is_voice BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);

-- Add comments for documentation
COMMENT ON TABLE chat_messages IS 'Stores chat messages between users and Lyra AI';
COMMENT ON COLUMN chat_messages.user_id IS 'Reference to the user who owns this message';
COMMENT ON COLUMN chat_messages.text IS 'The content of the chat message';
COMMENT ON COLUMN chat_messages.sender IS 'Who sent the message: user or lyra';
COMMENT ON COLUMN chat_messages.is_voice IS 'Whether this message was sent via voice input';
COMMENT ON COLUMN chat_messages.created_at IS 'Timestamp when the message was created';

-- Verify the table was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        RAISE NOTICE '✅ chat_messages table created successfully!';
    ELSE
        RAISE EXCEPTION '❌ Failed to create chat_messages table';
    END IF;
END $$; 