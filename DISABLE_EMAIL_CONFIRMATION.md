# 📧 Disable Email Confirmation Guide

## Problem:
User mendaftar tapi diminta check email padahal tidak ada email yang diterima.

## Solution: Disable Email Confirmation

### 🔧 Method 1: Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Go to Authentication Settings**
   - Klik menu "Authentication" di sidebar
   - Pilih "Settings" tab

3. **Disable Email Confirmations**
   - Scroll ke section "Email Confirmations"
   - **Turn OFF** "Enable email confirmations"
   - Click "Save"

4. **Test Registration**
   - User sekarang bisa langsung login setelah register
   - Data akan tersimpan ke tabel users

### 🔧 Method 2: SQL Script (Alternative)

Jika Method 1 tidak bekerja, jalankan script ini di SQL Editor:

```sql
-- Auto-confirm specific user
SELECT auto_confirm_user('user@example.com');

-- OR manually confirm in auth.users table
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'user@example.com'
AND email_confirmed_at IS NULL;
```

### ✅ Expected Flow After Fix:

1. **User Register** → Input: nama, email, alamat, umur, password
2. **Registration Success** → User langsung login
3. **Profile Created** → Data tersimpan di tabel `users`
4. **Redirect to App** → User masuk ke halaman utama

### 🧪 Test Registration:

```
Email: test@velora.com
Name: John Doe  
Address: Jakarta
Age: 25
Password: password123
```

### 🚨 Important Notes:

- **Development**: OK to disable email confirmation
- **Production**: Enable email confirmation untuk security
- **Database**: Pastikan RLS policies sudah diupdate (jalankan `sql/dev_rls_setup.sql`)

### 📊 Verify Data Saved:

Setelah berhasil register, check di Supabase:
- Table Editor → `users` → Lihat data user baru
- Should contain: id, email, name, address, age, created_at
