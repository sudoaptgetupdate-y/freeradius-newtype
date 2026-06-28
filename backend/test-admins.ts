import { db } from './src/db'; import { admins } from './src/schema/admins'; db.select().from(admins).then(r => console.log(r)).catch(e => console.error(e)).finally(() => process.exit(0));
