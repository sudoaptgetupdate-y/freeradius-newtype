import { getSettings, updateSettings, settingsSchema, syncTelegramWebhook } from "../controllers/settings.controller";
export const settingsRoutes = async (app) => {
    // All settings routes require authentication
    app.addHook("preHandler", app.authenticate);
    app.get("/", getSettings);
    app.put("/", {
        schema: {
            body: settingsSchema,
        },
    }, updateSettings);
    app.post("/telegram/sync-webhook", syncTelegramWebhook);
};
export default settingsRoutes;
//# sourceMappingURL=settings.routes.js.map