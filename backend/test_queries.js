import { db } from './src/db';
import { sql } from 'drizzle-orm';
async function main() {
    const attrs = await db.execute(sql `SELECT DISTINCT attribute FROM radcheck`);
    console.log('Attributes:', attrs);
    const radcheckAll = await db.execute(sql `SELECT * FROM radcheck LIMIT 10`);
    console.log('radcheckAll:', radcheckAll);
    process.exit(0);
}
main().catch(console.error);
//# sourceMappingURL=test_queries.js.map