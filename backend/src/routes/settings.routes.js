import { getSettings, updateSettings, settingsSchema } from "../controllers/settings.controller";
export const settingsRoutes = async (app) => {
    // All settings routes require authentication
    app.addHook("preHandler", app.authenticate);
    app.get("/", getSettings);
    app.put("/", {
        schema: {
            body: settingsSchema,
        },
    }, updateSettings);
};
export default settingsRoutes;
//# sourceMappingURL=settings.routes.js.map