import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?\n" +
    "For demo purposes, you can:\n" +
    "1. Set up a free Supabase database at https://supabase.com\n" +
    "2. Use a local PostgreSQL database\n" +
    "3. Create a .env file with: DATABASE_URL=postgresql://user:password@localhost:5432/dbname"
  );
}

// Create postgres client with connection error handling
// Supabase requires SSL for external connections
const databaseUrl = process.env.DATABASE_URL;
const isSupabase = databaseUrl?.includes('supabase.co');

// Configure SSL for Supabase - use rejectUnauthorized: false for Supabase's self-signed certs
// or use 'require' for basic SSL requirement
const sslConfig = isSupabase 
  ? { rejectUnauthorized: false } // Supabase uses self-signed certificates
  : false;

const client = postgres(databaseUrl, {
  max: 1, // Limit connection pool for serverless environments
  onnotice: () => {}, // Suppress notices
  connection: {
    application_name: 'metalfabdemo',
  },
  connect_timeout: 30, // 30 second connection timeout (increased for network issues)
  idle_timeout: 20, // 20 second idle timeout
  ssl: sslConfig,
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },
});

// Test connection on startup
client`SELECT 1`.catch((err) => {
  console.error('\n❌ Database Connection Error:');
  const maskedUrl = process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@');
  console.error(`   Unable to connect to: ${maskedUrl}`);
  console.error(`   Error: ${err.message}`);
  console.error('\n💡 Setup Instructions:');
  console.error('   1. Go to your Supabase project: https://supabase.com/dashboard');
  console.error('   2. Navigate to Project Settings > Database');
  console.error('   3. Find "Connection string" and select "URI" format');
  console.error('   4. Copy the connection string (it includes the password)');
  console.error('   5. Add to your .env file:');
  console.error('      DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
  console.error('      OR use direct connection:');
  console.error('      DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
  console.error('   6. Make sure to use the DATABASE PASSWORD (not the anon key)');
  console.error('   7. Run the SQL from supabase_setup.sql in the Supabase SQL Editor\n');
  
  // Additional troubleshooting for common issues
  if (err.message.includes('password') || err.message.includes('authentication')) {
    console.error('   🔑 Authentication Error: Check that your DATABASE_URL includes the correct password');
    console.error('      The password is different from your Supabase anon key!');
  }
  if (err.message.includes('SSL') || err.message.includes('certificate')) {
    console.error('   🔒 SSL Error: Connection should work with current SSL settings');
  }
  if (err.message.includes('timeout') || err.message.includes('ECONNREFUSED')) {
    console.error('   🌐 Network Error: Check your internet connection and Supabase project status');
    console.error('      Ensure your IP is not blocked in Supabase firewall settings');
  }
});

export const db = drizzle(client, { schema });
