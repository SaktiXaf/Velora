# Database Security Issue Fix

## The Problem

The error `new row violates row-level security policy (USING expression) for table "users"` indicates that your Supabase database has Row Level Security (RLS) enabled, but the policies are not configured correctly to allow authenticated users to insert/update their own profiles.

## Root Cause

Supabase databases come with RLS enabled by default for security. This means:
1. Only users with proper permissions can read/write data
2. Policies must be set up to define who can access what data
3. Without proper policies, even authenticated users can't modify data

## The Fix Applied

### 1. Enhanced ProfileService
- Added user ID verification (auth user must match profile user)
- Separated INSERT and UPDATE operations instead of using UPSERT
- Enhanced error handling for RLS violations
- Added local caching as fallback when database operations fail

### 2. Added Missing Method
- Added `forceProfileSync()` method that was being called but didn't exist

## Database Policy Setup (Required)

You need to set up RLS policies in your Supabase dashboard:

### Go to Supabase Dashboard → Authentication → Policies

### Policy 1: Allow users to read their own profile
```sql
CREATE POLICY "Users can view own profile" ON "public"."users"
FOR SELECT USING (auth.uid() = id);
```

### Policy 2: Allow users to insert their own profile
```sql
CREATE POLICY "Users can insert own profile" ON "public"."users"
FOR INSERT WITH CHECK (auth.uid() = id);
```

### Policy 3: Allow users to update their own profile
```sql
CREATE POLICY "Users can update own profile" ON "public"."users"
FOR UPDATE USING (auth.uid() = id);
```

### Alternative: Disable RLS (Less Secure)
If you want to disable RLS for testing:
```sql
ALTER TABLE "public"."users" DISABLE ROW LEVEL SECURITY;
```

## Testing the Fix

### 1. Set up the database policies (recommended)
- Go to Supabase Dashboard
- Navigate to Authentication → Policies
- Add the three policies above

### 2. Or disable RLS temporarily
- Go to Table Editor → users table
- Click on the settings gear
- Disable "Enable Row Level Security"

### 3. Test the app
- Run `npx expo start`
- Try to edit and save your profile
- Check console for detailed logs

## Expected Results

After applying the fix:
- ✅ Profile updates should work without RLS violations
- ✅ Data will be cached locally if database fails
- ✅ Detailed logging shows exactly what's happening
- ✅ `forceProfileSync` method is now available

## Fallback Behavior

Even if database operations fail due to RLS:
- Profile data is cached locally
- App continues to work with cached data
- Data will sync when policies are fixed
- No data loss occurs

## Next Steps

1. **Set up database policies** (recommended for security)
2. **Test profile editing** in the app
3. **Monitor console logs** for any remaining issues
4. **Verify data persistence** after logout/login
