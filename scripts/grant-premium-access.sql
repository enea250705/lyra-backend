-- Grant Premium Access to eneamuja87@gmail.com
-- Run this SQL script directly in your PostgreSQL database

-- First, let's find the user ID for the email
DO $$
DECLARE
    user_id_var UUID;
    existing_subscription_count INTEGER;
BEGIN
    -- Find user by email
    SELECT id INTO user_id_var
    FROM users 
    WHERE email = 'eneamuja87@gmail.com';
    
    -- Check if user exists
    IF user_id_var IS NULL THEN
        RAISE NOTICE 'User with email eneamuja87@gmail.com not found. Please register first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', user_id_var;
    
    -- Check if subscription already exists
    SELECT COUNT(*) INTO existing_subscription_count
    FROM subscriptions 
    WHERE user_id = user_id_var;
    
    IF existing_subscription_count > 0 THEN
        -- Update existing subscription to Premium
        UPDATE subscriptions 
        SET 
            plan = 'premium',
            status = 'active',
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '1 year',
            cancel_at_period_end = false,
            canceled_at = NULL,
            metadata = jsonb_build_object(
                'source', 'manual_grant',
                'grantedBy', 'developer',
                'grantedAt', NOW()::text,
                'reason', 'Developer access'
            ),
            updated_at = NOW()
        WHERE user_id = user_id_var;
        
        RAISE NOTICE '✅ Existing subscription updated to Premium!';
    ELSE
        -- Create new Premium subscription
        INSERT INTO subscriptions (
            id,
            user_id,
            plan,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            platform,
            environment,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            user_id_var,
            'premium',
            'active',
            NOW(),
            NOW() + INTERVAL '1 year',
            false,
            'manual',
            'development',
            jsonb_build_object(
                'source', 'manual_grant',
                'grantedBy', 'developer',
                'grantedAt', NOW()::text,
                'reason', 'Developer access'
            ),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ New Premium subscription created!';
    END IF;
    
    RAISE NOTICE '🎉 Premium Access Granted Successfully!';
    RAISE NOTICE '📧 Email: eneamuja87@gmail.com';
    RAISE NOTICE '📦 Plan: PREMIUM';
    RAISE NOTICE '📊 Status: ACTIVE';
    RAISE NOTICE '📅 Valid until: %', (NOW() + INTERVAL '1 year')::date;
    RAISE NOTICE '🔓 All Premium features are now unlocked!';
END $$;

-- Verify the subscription was created/updated
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    s.plan,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.created_at as subscription_created,
    s.updated_at as subscription_updated
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'eneamuja87@gmail.com';