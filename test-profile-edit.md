# Testing Profile Edit Feature

## Setup Required

1. **Avatar Storage Bucket Setup**
   - Go to your Supabase dashboard
   - Navigate to Storage > Buckets
   - Run the SQL from `database/setup-avatar-storage.sql`
   - This creates the 'avatars' bucket with proper permissions

2. **Test Steps**

### Basic Profile Edit Test
1. Open the app and login
2. Go to Profile tab
3. Tap the settings/gear icon (top right)
4. Edit Profile Modal should open
5. Try changing:
   - Name (required field)
   - Bio (optional)
   - Age (optional, 1-120)
   - Profile picture (tap avatar to change)

### Avatar Upload Test
1. In Edit Profile Modal, tap the avatar
2. Choose from:
   - Camera (take new photo)
   - Photo Library (select existing)
   - Remove Photo (delete current)
3. Crop/adjust if needed
4. Save profile
5. Check if avatar appears correctly

### Offline/Fallback Test
1. Turn off internet
2. Try editing profile with new avatar
3. Should save locally and sync when online

## Expected Behavior

- ✅ Modal opens smoothly
- ✅ Form validation works (name required, age 1-120)
- ✅ Avatar picker shows options
- ✅ Changes save to database
- ✅ UI updates immediately
- ✅ Loading states show during save
- ✅ Error handling for network issues
- ✅ Local fallback for avatar storage

## Current Implementation

- **EditProfileModal.tsx**: Full-featured edit modal with image picker
- **AvatarUploadService.ts**: Handles upload with fallback mechanisms
- **ProfileService.ts**: Enhanced with new upload integration
- **Profile Screen**: Uses modal instead of inline editing

## Files Modified

1. `components/EditProfileModal.tsx` - New professional edit modal
2. `app/(tabs)/profile.tsx` - Integrated modal, removed old edit UI
3. `lib/avatarUploadService.ts` - Robust upload system
4. `lib/profileService.ts` - Enhanced with new upload service
5. `database/setup-avatar-storage.sql` - Storage bucket setup

## Storage Bucket Setup (Run in Supabase SQL Editor)

```sql
-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for public access to avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy for users to upload their own avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```
