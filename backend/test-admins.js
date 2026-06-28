"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./src/db");
const admins_1 = require("./src/schema/admins");
db_1.db.select().from(admins_1.admins).then(r => console.log(r)).catch(e => console.error(e)).finally(() => process.exit(0));
//# sourceMappingURL=test-admins.js.map