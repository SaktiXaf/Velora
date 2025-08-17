# Database Setup Guide for Velora App

## 🚀 Quick Setup (New Project)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run Complete Schema**
   ```sql
   -- Copy and paste the content from: sql/complete_schema.sql
   ```

3. **Verify Tables Created**
   - Check that `users`, `follows`, and `activities` tables are created
   - Verify all indexes and constraints are in place

## 🔄 Migration (Existing Project)

If you already have a `users` table:

1. **Backup Your Data** (Important!)
   ```sql
   CREATE TABLE users_backup AS SELECT * FROM users;
   ```

2. **Run Migration Script**
   ```sql
   -- Copy and paste the content from: sql/migrate_existing_users.sql
   ```

3. **Update Your Code**
   - The interface has been updated to use `name` instead of `full_name`
   - Updated to use `profile_picture` instead of `avatar_url`

## 📊 Database Schema Overview

### Users Table
```sql
id                UUID PRIMARY KEY
email             VARCHAR(255) UNIQUE NOT NULL  
password          VARCHAR(255) NOT NULL
name              VARCHAR(100)
bio               TEXT
profile_picture   TEXT
address           TEXT
age               INTEGER (1-120)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### Follows Table
```sql
id              UUID PRIMARY KEY
follower_id     UUID → users.id (CASCADE DELETE)
following_id    UUID → users.id (CASCADE DELETE)
created_at      TIMESTAMP
```

### Activities Table  
```sql
id           UUID PRIMARY KEY
user_id      UUID → users.id (CASCADE DELETE)
type         VARCHAR(50) ('post', 'like', 'update_profile', etc.)
content      TEXT
metadata     JSONB
created_at   TIMESTAMP
```

## 🔐 Row Level Security (RLS)

The schema includes RLS policies:
- Users can view all profiles
- Users can only update their own profile
- Users can manage their own follows and activities

## 📈 Performance Features

- **Indexes** on frequently queried columns
- **Views** for common aggregations (user_stats)
- **Triggers** for automatic timestamp updates
- **Constraints** for data integrity

## 🧪 Testing

Sample queries included in the schema file:
- Get user followers/following
- Get user activity timeline
- Get user statistics

## 📝 Notes

- Password field expects hashed values (use bcrypt)
- Age has constraint (1-120 years)
- Users cannot follow themselves
- Unique constraint prevents duplicate follows
- All foreign key relationships use CASCADE DELETE

## 🚨 Security Considerations

1. **Never store plain text passwords**
2. **Use Supabase Auth for authentication**
3. **RLS policies are enabled by default**
4. **Validate all user inputs**
5. **Use prepared statements to prevent SQL injection**
