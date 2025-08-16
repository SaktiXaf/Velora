# Profile Persistence Test

## Test Case: Data tersimpan setelah update profile

### Prerequisites:
1. User sudah login
2. Bisa edit profile (name, bio, age, avatar)

### Test Steps:

1. **Update Profile:**
   - Login ke aplikasi
   - Tap icon settings di profile
   - Edit semua field:
     - Name: "Test User Updated"
     - Bio: "This is my test bio"
     - Age: 28
     - Avatar: Upload foto baru
   - Save profile

2. **Verify Immediate Update:**
   - ✅ Profile screen harus menampilkan data baru
   - ✅ Avatar baru harus terlihat
   - ✅ Name, bio, age harus terupdate

3. **Test Persistence (Logout/Login):**
   - Logout dari aplikasi
   - Login kembali dengan user yang sama
   - Cek profile data:
     - ✅ Name: "Test User Updated"
     - ✅ Bio: "This is my test bio" 
     - ✅ Age: 28
     - ✅ Avatar: Foto yang diupload sebelumnya

4. **Debug Info:**
   - Check console logs untuk:
     - "✅ Profile updated successfully in database"
     - "✅ Updated data: [JSON data]"
     - "✅ Profile cached and avatar synced"
     - "👤 Profile loaded successfully"

### Expected Results:
- ✅ Data persist setelah logout/login
- ✅ Avatar tetap tersimpan
- ✅ Tidak ada data yang reset ke default

### Common Issues & Solutions:

**Issue 1: Data reset setelah login**
- Solution: ProfileService.ensureProfileExists() dipanggil saat login
- Check: Database benar-benar menyimpan update

**Issue 2: Avatar hilang**
- Solution: AvatarUploadService menyimpan ke Supabase storage + cache lokal
- Check: Avatar URL tersimpan di database

**Issue 3: Cache conflict**
- Solution: Cache di-update saat profile di-update
- Check: Local cache consistency dengan database

### Files Updated:

1. **lib/profileService.ts:**
   - Enhanced updateProfile() dengan better error handling
   - Enhanced getProfile() dengan detailed logging
   - Added ensureProfileExists() untuk create profile otomatis

2. **app/(tabs)/profile.tsx:**
   - Call ensureProfileExists() saat login berhasil
   - Enhanced loadUserProfile() dengan profile creation
   - Better error handling dan logging

3. **components/EditProfileModal.tsx:**
   - Modern edit modal dengan image picker
   - Form validation
   - Enhanced user experience

### Test Commands:

```javascript
// Run in browser console to check profile data
console.log('Current user:', user);
console.log('Profile data:', userData);

// Check cached data
ProfileService.getProfile(user.id).then(profile => {
  console.log('Server profile:', profile);
});

// Check local cache
AsyncStorage.getItem('profile_cache_' + user.id).then(cached => {
  console.log('Cached profile:', JSON.parse(cached || '{}'));
});
```

### Database Check:

Run in Supabase SQL editor:
```sql
SELECT id, name, email, bio, age, avatar, created_at, updated_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```
