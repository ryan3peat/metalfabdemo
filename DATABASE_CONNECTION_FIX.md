# Database Connection Issues - Fix Guide

## Issues Identified

### 1. **Wrong Environment Variables**
You provided:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Problem**: This project uses **direct PostgreSQL connection**, not the Supabase client library. The code expects:
- `DATABASE_URL` (PostgreSQL connection string)

### 2. **Missing Database Password**
The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is for client-side Supabase SDK usage, NOT for direct database connections. You need the actual **database password**.

### 3. **Connection String Format**
The connection string must be in PostgreSQL URI format, not Supabase API keys.

## How to Fix

### Step 1: Get Your Database Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qnndqiaoeslxlkdvskqn`
3. Navigate to **Project Settings** → **Database**
4. Scroll down to **Connection string** section
5. Select **URI** format (not Session mode or Transaction mode)
6. Copy the connection string - it should look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   OR for direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qnndqiaoeslxlkdvskqn.supabase.co:5432/postgres
   ```

### Step 2: Update Your .env File

Create or update your `.env` file in the project root:

```env
# Database Configuration
# Use the connection string from Supabase (URI format)
DATABASE_URL=postgresql://postgres:[YOUR-ACTUAL-PASSWORD]@db.qnndqiaoeslxlkdvskqn.supabase.co:5432/postgres

# Optional: Session secret
SESSION_SECRET=your-random-secret-key

# Optional: Server port
PORT=5000
```

**Important Notes:**
- Replace `[YOUR-ACTUAL-PASSWORD]` with the actual database password from Supabase
- The password is **different** from the anon key you provided
- You can find/reset the password in Supabase Dashboard → Project Settings → Database → Database Password

### Step 3: Verify Database Setup

Make sure you've run the database schema setup:

1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `supabase_setup.sql` file
3. This creates all necessary tables, enums, and indexes

### Step 4: Test the Connection

Run the application:
```bash
npm run dev
```

The application will test the connection on startup. If there are errors, check the console output for specific troubleshooting steps.

## Common Connection Issues

### Authentication Failed
- **Cause**: Wrong password or missing password in connection string
- **Fix**: Get the correct database password from Supabase Dashboard → Project Settings → Database

### SSL/TLS Error
- **Cause**: SSL configuration issues
- **Fix**: The code has been updated to handle Supabase SSL certificates properly

### Connection Timeout
- **Cause**: Network issues or IP blocked
- **Fix**: 
  - Check your internet connection
  - Verify Supabase project is active
  - Check Supabase firewall settings (Settings → Database → Connection Pooling)

### Connection Refused
- **Cause**: Wrong host/port or project paused
- **Fix**: 
  - Verify the connection string format
  - Ensure your Supabase project is not paused

## What Was Changed

1. **Updated `server/db.ts`**:
   - Improved SSL configuration for Supabase (handles self-signed certificates)
   - Enhanced error messages with specific troubleshooting steps
   - Better connection error detection and reporting

## Next Steps

1. Get your database password from Supabase
2. Update `.env` with the correct `DATABASE_URL`
3. Test the connection
4. If issues persist, check the console error messages for specific guidance

## Additional Resources

- [Supabase Database Connection Docs](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
