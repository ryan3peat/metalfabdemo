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
const client = postgres(databaseUrl, {
  max: 1, // Limit connection pool for serverless environments
  onnotice: () => {}, // Suppress notices
  connection: {
    application_name: 'metalfabdemo',
  },
  connect_timeout: 30, // 30 second connection timeout (increased for network issues)
  idle_timeout: 20, // 20 second idle timeout
  ssl: databaseUrl?.includes('supabase.co') ? 'require' : false, // Require SSL for Supabase
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },
});

// Test connection on startup
client`SELECT 1`.catch((err) => {
  console.error('\n❌ Database Connection Error:');
  console.error(`   Unable to connect to: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
  console.error(`   Error: ${err.message}`);
  console.error('\n💡 Setup Instructions:');
  console.error('   1. Create a free Supabase project at https://supabase.com');
  console.error('   2. Get your database URL from Project Settings > Database');
  console.error('   3. Create a .env file in the project root with:');
  console.error('      DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
  console.error('   4. Run the SQL from supabase_setup.sql in the Supabase SQL Editor\n');
});

export const db = drizzle(client, { schema });
