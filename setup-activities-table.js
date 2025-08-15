// Script to create activities table in Supabase
import { supabase } from './lib/supabase';

const createActivitiesTable = async () => {
  try {
    console.log('🔧 Creating activities table...');
    
    // The SQL query to create the table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create activities table for cross-device synchronization
        CREATE TABLE IF NOT EXISTS activities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('run', 'bike', 'walk')),
          date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          distance DECIMAL(10,2) NOT NULL,
          duration INTEGER NOT NULL,
          pace DECIMAL(5,2) NOT NULL,
          calories INTEGER NOT NULL,
          avg_speed DECIMAL(5,2) NOT NULL,
          max_speed DECIMAL(5,2) NOT NULL,
          path JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);
        CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date DESC);

        -- Enable Row Level Security (RLS)
        ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies - users can only access their own activities
        DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
        CREATE POLICY "Users can view their own activities" ON activities
          FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
        CREATE POLICY "Users can insert their own activities" ON activities
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
        CREATE POLICY "Users can update their own activities" ON activities
          FOR UPDATE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
        CREATE POLICY "Users can delete their own activities" ON activities
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (error) {
      console.error('❌ Error creating activities table:', error);
    } else {
      console.log('✅ Activities table created successfully!');
    }
  } catch (error) {
    console.error('❌ Script error:', error);
  }
};

// Test the table creation
createActivitiesTable();
