import { db } from "../db";
import { TelegramService } from "../services/telegram.service";
export const handleTelegramWebhook = async (request, reply) => {
    const { token } = request.params;
    const settings = await db.query.globalSettings.findFirst();
    if (!settings || settings.telegramToken !== token) {
        // Return 403 or silently ignore to prevent port scanners/attackers
        return reply.code(403).send({ error: "Unauthorized webhook" });
    }
    const telegramService = TelegramService.getInstance();
    try {
        // Process update asynchronously so we return 200 immediately to Telegram
        telegramService.processUpdate(request.body);
    }
    catch (error) {
        request.log.error(error, "Error processing telegram webhook payload");
    }
    return reply.send({ ok: true });
};
//# sourceMappingURL=webhooks.controller.js.map