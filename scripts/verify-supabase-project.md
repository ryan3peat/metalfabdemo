# How to Verify Your Supabase Project

## Step 1: Check if Project Exists and is Active

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Look for your project with ID: `qnndqiaoeslxlkdvskqn`
3. Check if the project shows as **"Active"** (not paused)

## Step 2: Get the Correct Connection String

1. In Supabase Dashboard, select your project
2. Go to **Settings** → **Database**
3. Scroll down to **Connection string** section
4. Make sure you select **"URI"** format (not Session mode)
5. Copy the **entire connection string**

The connection string should look like one of these formats:

**Direct Connection:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.qnndqiaoeslxlkdvskqn.supabase.co:5432/postgres
```

**Connection Pooler (Alternative):**
```
postgresql://postgres.qnndqiaoeslxlkdvskqn:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## Step 3: Verify Project Status

If your project is paused:
- Free tier projects pause after inactivity
- Go to Dashboard → Your Project → Click "Restore" or "Resume"

If project doesn't exist:
- The project reference ID might be wrong
- Check your Supabase dashboard for the correct project ID

## Step 4: Test DNS Resolution

Run this PowerShell command to test if the hostname resolves:

```powershell
Test-NetConnection -ComputerName db.qnndqiaoeslxlkdvskqn.supabase.co -Port 5432
```

If this fails, the project might be paused or the hostname is incorrect.
