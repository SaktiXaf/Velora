# Fix untuk PGRST116 Error - "JSON object requested, multiple (or no) rows returned"

## 🔍 Root Cause
Error PGRST116 terjadi ketika:
1. Query `UPDATE` menggunakan `.single()` tapi tidak menemukan row yang cocok
2. User belum ada di database tapi langsung di-update
3. ID user tidak cocok dengan data di database

## 🛠️ Solutions Implemented

### 1. Enhanced updateProfile() Function
```typescript
// Sekarang di ProfileService.updateProfile():
// 1. Check if user exists first
const { data: existingUser, error: checkError } = await supabase
  .from('users')
  .select('id')
  .eq('id', userId)
  .single();

// 2. If user doesn't exist, create it first
if (checkError && checkError.code === 'PGRST116') {
  await this.ensureProfileExists(userId, email, name);
}

// 3. Then do the update
const { data, error } = await supabase
  .from('users')
  .update(updates)
  .eq('id', userId)
  .select('*')
  .single();
```

### 2. Better Profile Creation
```typescript
// ensureProfileExists() now:
// 1. Check existence with direct query (not using getProfile)
// 2. Create with minimal required fields only
// 3. Return success/failure status
// 4. Cache the created profile
```

### 3. Enhanced Error Handling
- ✅ PGRST116 detection and auto-recovery
- ✅ Network error fallback to local cache
- ✅ Detailed logging untuk debugging
- ✅ User creation sebelum update

### 4. Profile Screen Improvements
```typescript
// Di handleSave():
// 1. Ensure profile exists before update
await ProfileService.ensureProfileExists(user.id, user.email, data.name);

// 2. Then do the update
const success = await ProfileService.updateProfile(user.id, updates);
```

## 🧪 Testing Steps

### Test Case 1: New User First Update
1. Login dengan user baru
2. Langsung edit profile
3. Expected: Profile dibuat otomatis → Update berhasil
4. Verify: Check database ada user baru

### Test Case 2: Existing User Update
1. Login dengan user yang sudah ada
2. Edit profile
3. Expected: Update langsung berhasil
4. Verify: Data terupdate di database

### Test Case 3: Network Error Handling
1. Disconnect network
2. Edit profile
3. Expected: Data cached locally
4. Reconnect → Data sync ke server

## 🔧 Debug Commands

### Console Debugging
```javascript
// Check user ID
console.log('User ID:', user?.id);
console.log('User Email:', user?.email);

// Test profile existence
ProfileService.getProfile(user.id).then(profile => {
  console.log('Profile exists:', !!profile);
  console.log('Profile data:', profile);
});

// Test profile creation
ProfileService.ensureProfileExists(user.id, user.email, 'Test User').then(result => {
  console.log('Profile creation result:', result);
});
```

### Database Check (Supabase SQL Editor)
```sql
-- Check if user exists
SELECT * FROM users WHERE id = 'your-user-id-here';

-- Check all users
SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- Check user count
SELECT COUNT(*) as user_count FROM users;
```

### Logs to Watch For
```
✅ Logs yang menandakan sukses:
- "✅ Profile already exists"
- "✅ Profile created successfully"
- "✅ Profile updated successfully in database"
- "✅ Updated profile cached locally"

❌ Logs yang menandakan masalah:
- "❌ User not found in database, creating profile first..."
- "❌ Error updating profile in database"
- "❌ Failed to create profile for user"
```

## 📊 Flow Chart

```
Login → Check Profile Exists → Create if Missing → Update Profile → Cache Data
   ↓         ↓                    ↓               ↓              ↓
  User    getProfile()      ensureProfileExists() updateProfile() cacheProfile()
   ↓         ↓                    ↓               ↓              ↓
Profile   Found/Missing      Created/Error     Updated/Error   Cached/Error
Screen       ↓                    ↓               ↓              ↓
   ↓      Load Data         Auto Retry Update  Show Success   UI Updated
Display   ↓                     ↓               ↓              ↓
Profile   UI Updated        Profile Ready    Data Persisted  Done ✅
```

## 🚨 Common Issues & Solutions

### Issue 1: "User still not found after creation attempt"
```
Root Cause: Database constraint atau network issue
Solution: Check database logs, verify user ID format
```

### Issue 2: Cache conflict
```
Root Cause: Local cache tidak sync dengan database
Solution: Clear AsyncStorage cache dan reload
```

### Issue 3: Avatar upload gagal
```
Root Cause: Storage bucket belum setup atau permission
Solution: Run setup-avatar-storage.sql script
```

## ✅ Verification Checklist

- [ ] User baru → Profile dibuat otomatis
- [ ] Update profile → Data tersimpan ke database  
- [ ] Logout/Login → Data persist
- [ ] Avatar upload → Photo tersimpan
- [ ] Network error → Fallback ke cache
- [ ] Error logs → Informatif dan actionable

Dengan fixes ini, error PGRST116 seharusnya tidak muncul lagi karena sistem akan memastikan profile ada sebelum melakukan update! 🎉
