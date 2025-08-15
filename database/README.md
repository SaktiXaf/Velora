# BlueTrack Database Schema

Database schema untuk menyimpan data followers dan following setiap akun di aplikasi BlueTrack.

## 📁 File Structure

```
database/
├── schema.sql      # Schema lengkap dengan semua fitur
├── migration.sql   # Script setup database dari awal
├── queries.sql     # Query-query untuk aplikasi
└── README.md       # Dokumentasi ini
```

## 🗃️ Database Schema

### 1. Tabel `users`

Menyimpan data pengguna aplikasi.

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    bio TEXT,
    avatar TEXT,
    age INTEGER CHECK (age > 0 AND age <= 120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

**Fields:**
- `id`: UUID primary key
- `email`: Email unik pengguna
- `name`: Nama lengkap
- `username`: Username unik (opsional)
- `bio`: Bio/deskripsi pengguna
- `avatar`: URL foto profil
- `age`: Umur pengguna
- `created_at`: Waktu pembuatan akun
- `updated_at`: Waktu update terakhir
- `is_active`: Status aktif akun

### 2. Tabel `follows`

Menyimpan relasi follower/following antar pengguna.

```sql
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);
```

**Fields:**
- `id`: UUID primary key
- `follower_id`: ID pengguna yang mengikuti
- `following_id`: ID pengguna yang diikuti
- `created_at`: Waktu mulai mengikuti

**Constraints:**
- Unique constraint: Mencegah duplikasi follow
- Check constraint: Mencegah self-follow
- Foreign key: Cascade delete saat user dihapus

### 3. View `user_follow_stats`

View untuk menghitung statistics followers/following.

```sql
CREATE VIEW public.user_follow_stats AS
SELECT 
    u.id,
    u.name,
    u.username,
    COALESCE(followers.count, 0) as followers_count,
    COALESCE(following.count, 0) as following_count
FROM public.users u
LEFT JOIN ... -- Detail di schema.sql
```

## 🚀 Quick Setup

### 1. Setup Database Baru

Jalankan script migration untuk setup database dari awal:

```sql
-- Di PostgreSQL/Supabase
\i database/migration.sql
```

### 2. Manual Setup

Jika ingin setup manual, jalankan file sesuai urutan:

```sql
\i database/schema.sql
```

## 📊 Sample Data

Database akan otomatis terisi dengan sample data:

**Sample Users:**
- Alex Runner (alex_runner) - Marathon enthusiast
- Maria Fitness (maria_fit) - Fitness trainer  
- John Cyclist (john_bikes) - Cycling enthusiast
- Sarah Walker (sarah_walks) - Daily walker
- David Coach (david_coach) - Professional coach
- Emma Runner (emma_runs) - Ultra marathon runner
- Mike Trainer (mike_train) - Personal trainer
- Lisa Zen (lisa_yoga) - Yoga instructor

**Sample Network:**
- Total 8 users dengan follow relationships yang realistis
- Maria sebagai trainer paling banyak followers
- Alex sebagai active user yang follow banyak orang

## 🔍 Query Examples

### Mendapatkan Followers

```sql
SELECT u.name, u.username, u.bio, f.created_at as followed_at
FROM users u
JOIN follows f ON u.id = f.follower_id
WHERE f.following_id = '[USER_ID]'
ORDER BY f.created_at DESC;
```

### Mendapatkan Following

```sql
SELECT u.name, u.username, u.bio, f.created_at as followed_at
FROM users u
JOIN follows f ON u.id = f.following_id
WHERE f.follower_id = '[USER_ID]'
ORDER BY f.created_at DESC;
```

### Mendapatkan Statistics

```sql
SELECT followers_count, following_count
FROM user_follow_stats
WHERE id = '[USER_ID]';
```

### Follow User

```sql
SELECT follow_user('[FOLLOWER_ID]', '[FOLLOWING_ID]') as success;
```

### Unfollow User

```sql
SELECT unfollow_user('[FOLLOWER_ID]', '[FOLLOWING_ID]') as success;
```

## 🛡️ Security Features

### Row Level Security (RLS)

Database menggunakan Row Level Security untuk keamanan:

**Users Table:**
- Public read untuk semua profile
- Update hanya untuk profile sendiri

**Follows Table:**
- Public read untuk semua follow relationships
- Insert/Update/Delete hanya untuk follow sendiri

### Constraints

- **Email unique**: Mencegah duplikasi email
- **Username unique**: Mencegah duplikasi username
- **Self-follow prevention**: User tidak bisa follow diri sendiri
- **Duplicate follow prevention**: Mencegah follow ganda
- **Age validation**: Umur harus 1-120 tahun

## 📈 Performance

### Indexes

Database menggunakan indexes untuk performa optimal:

```sql
-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at);
```

### Query Optimization

- View `user_follow_stats` untuk statistics yang cepat
- Compound index untuk query followers/following
- Limit dan pagination untuk performa

## 🔧 Functions

### `follow_user(follower_id, following_id)`

Function untuk follow user dengan validasi:
- Cek user exists dan aktif
- Cek belum follow sebelumnya
- Insert follow record
- Return boolean success

### `unfollow_user(follower_id, following_id)`

Function untuk unfollow user:
- Delete follow record
- Return boolean berhasil atau tidak

### `update_updated_at_column()`

Trigger function untuk auto-update timestamp pada tabel users.

## 🧪 Testing

### Verification Queries

Setelah setup, jalankan query berikut untuk verifikasi:

```sql
-- Cek jumlah users
SELECT COUNT(*) FROM users;

-- Cek jumlah follows  
SELECT COUNT(*) FROM follows;

-- Cek top users by followers
SELECT name, followers_count 
FROM user_follow_stats 
ORDER BY followers_count DESC LIMIT 5;
```

### Expected Results

- 8 sample users
- ~20+ follow relationships
- Maria Fitness sebagai user dengan followers terbanyak

## 📱 Integration dengan Aplikasi

### Supabase Client

Gunakan queries dari `queries.sql` dengan Supabase client:

```typescript
// Get followers
const { data: followers } = await supabase
  .from('users')
  .select(`
    id, name, username, bio, avatar,
    follows!follows_following_id_fkey(created_at)
  `)
  .eq('follows.following_id', userId);
```

### Error Handling

Database schema mendukung graceful error handling:
- Foreign key constraints
- Check constraints  
- Unique constraints
- RLS policies

## 🔄 Maintenance

### Cleanup Commands

```sql
-- Remove inactive user follows
DELETE FROM follows 
WHERE follower_id IN (SELECT id FROM users WHERE is_active = false)
   OR following_id IN (SELECT id FROM users WHERE is_active = false);

-- Reindex for performance
REINDEX INDEX idx_follows_follower_id;
REINDEX INDEX idx_follows_following_id;
```

### Backup

Backup tabel penting:

```sql
-- Backup users
CREATE TABLE users_backup AS SELECT * FROM users;

-- Backup follows
CREATE TABLE follows_backup AS SELECT * FROM follows;
```

## 📞 Support

Jika ada masalah dengan database:

1. Cek log error di PostgreSQL/Supabase
2. Verify indexes dengan `EXPLAIN ANALYZE`
3. Cek RLS policies jika ada permission error
4. Review constraint violations

---

**Created for BlueTrack App** 🏃‍♂️💙
