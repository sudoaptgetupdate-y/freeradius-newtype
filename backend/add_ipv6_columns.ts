import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Adding missing IPv6 columns to radacct table...');
  try {
    await db.execute(sql`ALTER TABLE radacct ADD COLUMN IF NOT EXISTS framedipv6address inet`);
    await db.execute(sql`ALTER TABLE radacct ADD COLUMN IF NOT EXISTS framedipv6prefix inet`);
    await db.execute(sql`ALTER TABLE radacct ADD COLUMN IF NOT EXISTS framedinterfaceid text`);
    await db.execute(sql`ALTER TABLE radacct ADD COLUMN IF NOT EXISTS delegatedipv6prefix inet`);
    console.log('Columns added successfully!');
  } catch (error) {
    console.error('Failed to add columns:', error);
  }
  process.exit(0);
}

main().catch(console.error);
