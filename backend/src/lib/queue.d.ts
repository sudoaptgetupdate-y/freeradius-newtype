import { Queue } from "bullmq";
import IORedis from "ioredis";
export declare const redisConnection: IORedis;
export declare const voucherQueue: Queue<any, any, string, any, any, string>;
//# sourceMappingURL=queue.d.ts.map