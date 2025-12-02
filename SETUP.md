# Setup Guide for Metal Fabrication Supplier Portal Demo

## Quick Start

This demo requires a PostgreSQL database. Follow these steps to get started:

## 1. Database Setup

### Option A: Supabase (Recommended for Demo)

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Project Settings** > **Database**
4. Copy your **Connection String** (URI format)
5. Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

6. Open the Supabase SQL Editor and run the contents of `supabase_setup.sql` to create all tables

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```bash
   createdb metalfabdemo
   ```
3. Create a `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/metalfabdemo
   ```
4. Run the migrations or execute `supabase_setup.sql`

## 2. Environment Variables

Create a `.env` file in the project root with at minimum:

```env
# Required: Database connection
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Optional: Email service (defaults to 'mock' for demo)
EMAIL_PROVIDER=mock

# Optional: Session secret (generate a random string)
SESSION_SECRET=your-random-secret-key

# Optional: Server port (defaults to 5000)
PORT=5000
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Email Configuration

By default, the app uses **mock email service** which logs emails to the console instead of sending them. This is perfect for demos.

To use real email (Microsoft Graph API), set:
```env
EMAIL_PROVIDER=graph
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
SENDER_EMAIL=your_email@domain.com
```

## Troubleshooting

### Database Connection Errors

If you see `ENOTFOUND` errors:
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure your IP is allowed in Supabase (Settings > Database > Connection Pooling)

### Port Already in Use

If port 5000 is already in use:
- Set `PORT=3000` (or another port) in your `.env` file

## Demo Mode

This application runs in **demo mode** by default:
- Authentication is bypassed (mock admin user)
- Email service uses mock mode (logs to console)
- All routes are publicly accessible

Perfect for demonstrations without requiring full setup!

