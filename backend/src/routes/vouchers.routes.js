import { generateVouchers, getJobStatus, getVoucherBatches, getVouchers, generateVouchersSchema, getVoucherSettings, updateVoucherSettings, updateVoucherSettingsSchema } from "../controllers/vouchers.controller";
export default async function vouchersRoutes(app) {
    const fastify = app.withTypeProvider();
    fastify.addHook("preHandler", app.authenticate);
    fastify.post("/generate", {
        schema: {
            body: generateVouchersSchema
        }
    }, generateVouchers);
    fastify.get("/jobs/:id", getJobStatus);
    fastify.get("/", getVoucherBatches);
    fastify.get("/batch", getVouchers);
    fastify.get("/settings", getVoucherSettings);
    fastify.put("/settings", {
        schema: {
            body: updateVoucherSettingsSchema
        }
    }, updateVoucherSettings);
}
//# sourceMappingURL=vouchers.routes.js.map