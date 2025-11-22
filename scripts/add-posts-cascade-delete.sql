-- Script to ensure posts table has ON DELETE CASCADE for event_id
-- This ensures that when an event is deleted, all related posts are also deleted

-- First, check if posts table exists and has event_id column
-- If the foreign key constraint doesn't exist or doesn't have CASCADE, we'll add/update it

-- Step 1: Drop existing foreign key constraint if it exists (without CASCADE)
DO $$
BEGIN
    -- Check if there's a foreign key constraint on event_id that doesn't have CASCADE
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'posts' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'event_id'
            AND tc.constraint_name NOT LIKE '%_cascade'
    ) THEN
        -- Find the constraint name
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT tc.constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'posts' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND kcu.column_name = 'event_id'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE format('ALTER TABLE posts DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
            END IF;
        END;
    END IF;
END $$;

-- Step 2: Add foreign key constraint with ON DELETE CASCADE
-- This will only add if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'posts' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'event_id'
            AND kcu.referenced_table_name = 'events'
    ) THEN
        ALTER TABLE posts
        ADD CONSTRAINT posts_event_id_fkey 
        FOREIGN KEY (event_id) 
        REFERENCES events(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Verify the constraint was created/updated
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'posts' 
    AND kcu.column_name = 'event_id'
    AND tc.constraint_type = 'FOREIGN KEY';








