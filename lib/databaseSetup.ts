import { supabase } from './supabase';

export class DatabaseSetup {
  
  static async checkAndCreateUsersTable(): Promise<{ success: boolean, message: string }> {
    try {
      console.log('🔍 Checking users table...');
      
      // First, try to query the table
      const { data, error: queryError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (!queryError) {
        console.log('✅ Users table exists and accessible');
        return { success: true, message: 'Users table exists' };
      }
      
      // If table doesn't exist, create it
      if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
        console.log('🏗️ Users table does not exist, creating...');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL DEFAULT 'User',
            bio TEXT,
            age INTEGER,
            avatar TEXT,
            phone VARCHAR(20),
            address TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create RLS policies
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
          
          -- Policy for users to read their own data
          CREATE POLICY "Users can read own data" ON public.users
            FOR SELECT USING (auth.uid() = id);
          
          -- Policy for users to insert their own data
          CREATE POLICY "Users can insert own data" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
          
          -- Policy for users to update their own data
          CREATE POLICY "Users can update own data" ON public.users
            FOR UPDATE USING (auth.uid() = id);
          
          -- Create trigger for updated_at
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON public.users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { 
          sql: createTableSQL 
        });
        
        if (createError) {
          console.error('❌ Failed to create users table:', createError);
          return { success: false, message: `Failed to create table: ${createError.message}` };
        }
        
        console.log('✅ Users table created successfully');
        return { success: true, message: 'Users table created successfully' };
      }
      
      // Other database error
      console.error('❌ Database error:', queryError);
      return { success: false, message: `Database error: ${queryError.message}` };
      
    } catch (error) {
      console.error('❌ Error checking/creating users table:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  static async createUserProfile(userId: string, email: string, name?: string): Promise<{ success: boolean, message: string }> {
    try {
      console.log('👤 Creating user profile for:', userId, email);
      
      // Try direct insert first
      const profileData = {
        id: userId,
        email: email,
        name: name || email.split('@')[0] || 'User',
        bio: '',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to create profile:', error);
        
        // If it's a RLS error, try with auth bypass
        if (error.code === '42501') {
          console.log('⚠️ RLS blocking insert, attempting workaround...');
          
          // Try using upsert with on_conflict
          const { data: upsertData, error: upsertError } = await supabase
            .from('users')
            .upsert(profileData, { 
              onConflict: 'email',
              ignoreDuplicates: false 
            })
            .select()
            .single();
          
          if (upsertError) {
            return { success: false, message: `Profile creation failed: ${upsertError.message}` };
          } else {
            console.log('✅ Profile created via upsert');
            return { success: true, message: 'Profile created successfully via upsert' };
          }
        }
        
        return { success: false, message: `Profile creation failed: ${error.message}` };
      }
      
      console.log('✅ Profile created successfully');
      return { success: true, message: 'Profile created successfully' };
      
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error creating profile' 
      };
    }
  }
  
  static async debugTableStructure(): Promise<void> {
    try {
      console.log('🔍 === DATABASE STRUCTURE DEBUG ===');
      
      // Check if table exists
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'users');
      
      console.log('📋 Table existence check:', { 
        exists: !!tables?.length, 
        error: tablesError?.message 
      });
      
      // Try to get table columns
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'users');
      
      console.log('📋 Table columns:', { 
        columns: columns?.map(c => ({ name: c.column_name, type: c.data_type, nullable: c.is_nullable })),
        error: columnsError?.message 
      });
      
      // Check RLS status
      const { data: rlsInfo, error: rlsError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .eq('tablename', 'users');
      
      console.log('🔒 RLS status:', { 
        enabled: rlsInfo?.[0]?.rowsecurity, 
        error: rlsError?.message 
      });
      
      // Try a simple count query
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Table count:', { count, error: countError?.message });
      
      console.log('🔍 === END DEBUG ===');
      
    } catch (error) {
      console.error('❌ Error debugging table structure:', error);
    }
  }
}
