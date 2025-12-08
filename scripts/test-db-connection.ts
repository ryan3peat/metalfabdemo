import "dotenv/config";
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

console.log('🔍 Verifying DATABASE_URL...\n');

// Mask password in URL for display
const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
console.log(`Connection String: ${maskedUrl}\n`);

// Check URL format
const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
const match = databaseUrl.match(urlPattern);

if (!match) {
  console.error('❌ Invalid DATABASE_URL format!');
  console.error('Expected format: postgresql://user:password@host:port/database');
  console.error('\nExample:');
  console.error('postgresql://postgres:yourpassword@db.qnndqiaoeslxlkdvskqn.supabase.co:5432/postgres');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

console.log('✅ URL Format: Valid');
console.log(`   User: ${user}`);
console.log(`   Password: ${password ? '***' + password.slice(-3) : 'MISSING'}`);
console.log(`   Host: ${host}`);
console.log(`   Port: ${port}`);
console.log(`   Database: ${database}\n`);

// Check if it's a Supabase URL
if (host.includes('supabase.co')) {
  console.log('✅ Detected: Supabase database');
  
  // Check if it's the correct project
  if (host.includes('qnndqiaoeslxlkdvskqn')) {
    console.log('✅ Project ID matches: qnndqiaoeslxlkdvskqn');
  } else {
    console.log('⚠️  Warning: Host does not match expected project ID');
  }
} else {
  console.log('ℹ️  Not a Supabase URL (this is fine if using local PostgreSQL)');
}

console.log('\n🔌 Testing database connection...\n');

// Test connection
const client = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
});

try {
  const result = await client`SELECT version(), current_database(), current_user`;
  
  console.log('✅ Connection Successful!\n');
  console.log('Database Information:');
  console.log(`   PostgreSQL Version: ${result[0].version.split(',')[0]}`);
  console.log(`   Current Database: ${result[0].current_database}`);
  console.log(`   Current User: ${result[0].current_user}\n`);
  
  // Test if we can query a table
  try {
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables in database:`);
      tables.slice(0, 10).forEach((t: any) => {
        console.log(`   - ${t.table_name}`);
      });
      if (tables.length > 10) {
        console.log(`   ... and ${tables.length - 10} more`);
      }
    } else {
      console.log('⚠️  No tables found. Run supabase_setup_clean.sql to create tables.');
    }
  } catch (err: any) {
    console.log('ℹ️  Could not list tables (this is okay if tables don\'t exist yet)');
  }
  
  await client.end();
  console.log('\n✅ Database connection test completed successfully!');
  process.exit(0);
  
} catch (err: any) {
  console.error('\n❌ Connection Failed!\n');
  console.error(`Error: ${err.message}\n`);
  
  if (err.message.includes('password') || err.message.includes('authentication')) {
    console.error('💡 Authentication Error:');
    console.error('   - Check that your password is correct');
    console.error('   - Get the password from: Supabase Dashboard → Settings → Database → Database Password');
    console.error('   - Make sure you\'re using the DATABASE password, not the anon key\n');
  } else if (err.message.includes('SSL') || err.message.includes('certificate')) {
    console.error('💡 SSL Error:');
    console.error('   - This should be handled automatically, but check your connection string\n');
  } else if (err.message.includes('timeout') || err.message.includes('ECONNREFUSED')) {
    console.error('💡 Network Error:');
    console.error('   - Check your internet connection');
    console.error('   - Verify Supabase project is active (not paused)');
    console.error('   - Check firewall settings in Supabase Dashboard\n');
  } else if (err.message.includes('does not exist')) {
    console.error('💡 Database Error:');
    console.error('   - Verify the database name is correct (usually "postgres" for Supabase)\n');
  }
  
  await client.end();
  process.exit(1);
}
