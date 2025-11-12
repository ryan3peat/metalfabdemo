import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running database migration: update-quote-status-enum.sql');

    const migrationPath = path.join(__dirname, '../server/migrations/update-quote-status-enum.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('⚠️  This will update all existing quote statuses:');
    console.log('   - pending → initial_submitted');
    console.log('   - approved → pending_documentation');
    console.log('   - rejected → rejected (unchanged)');
    console.log('');

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🔍 Verifying migration...');

    // Verify the migration
    const result = await db.execute(sql`
      SELECT preliminary_approval_status, COUNT(*) as count
      FROM supplier_quotes
      GROUP BY preliminary_approval_status
    `);

    console.log('📊 Current quote status distribution:');
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
