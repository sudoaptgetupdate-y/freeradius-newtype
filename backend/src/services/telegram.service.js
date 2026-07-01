import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { globalSettings } from '../schema/settings';
import { tenants } from '../schema/tenants';
import { radcheck, radacct, radusergroup, radgroupcheck, radgroupreply, radreply } from '../schema/freeradius';
import { nas } from '../schema/nas';
import { eq, and, isNull, like, or } from 'drizzle-orm';
import { RadiusCoAService } from './radius-coa.service';
export class TelegramService {
    static instance;
    bot = null;
    isInitialized = false;
    constructor() { }
    static getInstance() {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }
    async initBot(token) {
        // We only process webhooks, no polling.
        this.bot = new TelegramBot(token, { polling: false });
        this.isInitialized = true;
    }
    async processUpdate(update) {
        if (!this.bot || !this.isInitialized)
            return;
        if (update.message) {
            await this.handleMessage(update.message);
        }
        else if (update.callback_query) {
            await this.handleCallbackQuery(update.callback_query);
        }
    }
    async handleMessage(msg) {
        if (!msg.text)
            return;
        const text = msg.text.trim();
        const chatId = msg.chat.id;
        // Check if the chat is authorized (matches a tenant or master admin)
        const authInfo = await this.getChatAuthorization(chatId.toString());
        if (!authInfo.isAuthorized) {
            return; // Ignore unauthorized chats silently to avoid spam
        }
        if (text.startsWith('/status')) {
            await this.handleStatusCommand(chatId, authInfo);
        }
        else if (text.startsWith('/user ')) {
            await this.handleUserCommand(chatId, text.split(' ')[1], authInfo);
        }
        else if (text.startsWith('/find ')) {
            const query = text.substring(6).trim();
            await this.handleFindCommand(chatId, query, authInfo);
        }
        else if (text.startsWith('/voucher ')) {
            await this.handleVoucherCommand(chatId, text, authInfo);
        }
        else if (text === '/help') {
            await this.handleHelpCommand(chatId);
        }
    }
    async handleCallbackQuery(query) {
        if (!query.data || !query.message)
            return;
        const chatId = query.message.chat.id;
        const authInfo = await this.getChatAuthorization(chatId.toString());
        if (!authInfo.isAuthorized) {
            this.bot?.answerCallbackQuery(query.id, { text: "Unauthorized." });
            return;
        }
        const [action, ...args] = query.data.split(':');
        try {
            if (action === 'kick') {
                await this.handleKickCallback(chatId, args[0], authInfo);
                this.bot?.answerCallbackQuery(query.id, { text: "Kick command sent." });
            }
            else if (action === 'suspend') {
                await this.handleSuspendCallback(chatId, args[0], authInfo);
                this.bot?.answerCallbackQuery(query.id, { text: "User suspended." });
            }
            else if (action === 'reactivate') {
                await this.handleReactivateCallback(chatId, args[0], authInfo);
                this.bot?.answerCallbackQuery(query.id, { text: "User reactivated." });
            }
            else if (action === 'delete_confirm') {
                await this.handleDeleteCallback(chatId, args[0], authInfo);
                this.bot?.answerCallbackQuery(query.id, { text: "User deleted." });
            }
            else if (action === 'delete') {
                // Just show confirmation buttons
                await this.showDeleteConfirmation(chatId, args[0], query.message.message_id);
                this.bot?.answerCallbackQuery(query.id);
            }
            else if (action === 'user') {
                await this.handleUserCommand(chatId, args[0], authInfo);
                this.bot?.answerCallbackQuery(query.id);
            }
        }
        catch (e) {
            console.error("Callback error", e);
            this.bot?.answerCallbackQuery(query.id, { text: "Error executing command." });
        }
    }
    async getChatAuthorization(chatId) {
        // 1. Check if it's the master admin
        const settings = await db.query.globalSettings.findFirst();
        if (settings && settings.telegramEnabled && settings.telegramChatId === chatId) {
            return { isAuthorized: true, tenantId: null, isMaster: true };
        }
        // 2. Check if it matches a tenant
        const tenant = await db.query.tenants.findFirst({
            where: and(eq(tenants.telegramEnabled, true), eq(tenants.telegramChatId, chatId))
        });
        if (tenant) {
            return { isAuthorized: true, tenantId: tenant.id, isMaster: false };
        }
        return { isAuthorized: false, tenantId: null, isMaster: false };
    }
    async handleHelpCommand(chatId) {
        const text = `
🤖 *SaaS FreeRADIUS Bot Commands*

/status - ดูสถานะเซิร์ฟเวอร์/เราเตอร์ และยอดคนออนไลน์
/user <username> - ดูข้อมูลผู้ใช้และจัดการบัญชี
/find <keyword> - ค้นหาผู้ใช้งานจากชื่อ/เบอร์โทร/Username
/voucher <count> <package> - สั่งสร้างคูปองใช้งานเน็ต
`;
        this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }
    async handleStatusCommand(chatId, auth) {
        let text = `📊 *System Status*\n\n`;
        // Get online users
        const activeSessions = await db.select().from(radacct).where(and(isNull(radacct.acctstoptime), auth.tenantId ? eq(radacct.tenantId, auth.tenantId) : undefined));
        text += `👤 *Active Users:* ${activeSessions.length}\n`;
        // Get NAS status
        const nasRecords = await db.select().from(nas).where(auth.tenantId ? eq(nas.tenantId, auth.tenantId) : undefined);
        text += `📡 *Routers:* ${nasRecords.length}\n`;
        this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }
    async handleFindCommand(chatId, query, auth) {
        if (!query) {
            this.bot?.sendMessage(chatId, "❌ กรุณาระบุคำค้นหา เช่น /find somchai");
            return;
        }
        // Search radcheck
        const results = await db.select().from(radcheck).where(and(like(radcheck.username, `%${query}%`), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined)).limit(10);
        if (results.length === 0) {
            this.bot?.sendMessage(chatId, "❌ ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา");
            return;
        }
        const inlineKeyboard = results.map(r => [{
                text: `👤 ${r.username}`,
                callback_data: `user:${r.username}`
            }]);
        this.bot?.sendMessage(chatId, "🔍 *ผลการค้นหา:*", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        });
    }
    async handleUserCommand(chatId, username, auth) {
        if (!username) {
            this.bot?.sendMessage(chatId, "❌ กรุณาระบุ username เช่น /user somchai");
            return;
        }
        const userRecords = await db.select().from(radcheck).where(and(eq(radcheck.username, username), eq(radcheck.attribute, 'Cleartext-Password'), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined));
        if (userRecords.length === 0) {
            this.bot?.sendMessage(chatId, `❌ ไม่พบผู้ใช้: ${username}`);
            return;
        }
        const user = userRecords[0];
        // Check if online
        const activeSessions = await db.select().from(radacct).where(and(eq(radacct.username, username), eq(radacct.tenantId, user.tenantId), isNull(radacct.acctstoptime)));
        const isOnline = activeSessions.length > 0;
        const isSuspended = !!user.deletedAt;
        // Get group
        const groups = await db.select().from(radusergroup).where(and(eq(radusergroup.username, username), eq(radusergroup.tenantId, user.tenantId)));
        const profileName = groups.length > 0 ? groups[0].groupname : "N/A";
        let text = `👤 *ข้อมูลผู้ใช้งาน: ${username}*\n`;
        text += `--------------------------------------\n`;
        text += `• สถานะบัญชี: ${isSuspended ? '🔴 ถูกระงับ' : '🟢 ปกติ (Active)'}\n`;
        text += `• สถานะเชื่อมต่อ: ${isOnline ? '🟢 ออนไลน์ (Online)' : '⚫ ออฟไลน์'}\n`;
        if (isOnline) {
            text += `• IP: ${activeSessions[0].framedipaddress}\n`;
            text += `• MAC: ${activeSessions[0].callingstationid}\n`;
        }
        text += `• แพ็กเกจ: ${profileName}\n`;
        const inlineKeyboard = [];
        if (isOnline) {
            inlineKeyboard.push([{ text: "⚡ เตะอุปกรณ์ (Kick)", callback_data: `kick:${username}` }]);
        }
        if (isSuspended) {
            inlineKeyboard.push([{ text: "🟢 ปลดระงับ (Reactivate)", callback_data: `reactivate:${username}` }]);
        }
        else {
            inlineKeyboard.push([{ text: "🚫 ระงับ (Suspend)", callback_data: `suspend:${username}` }]);
        }
        inlineKeyboard.push([
            { text: "🗑️ ลบบัญชี (Delete)", callback_data: `delete:${username}` }
        ]);
        this.bot?.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        });
    }
    async handleVoucherCommand(chatId, commandText, auth) {
        this.bot?.sendMessage(chatId, "⏳ ระบบกำลังทยอยพัฒนาส่วนสร้างคูปองผ่าน Telegram ครับ...");
    }
    // --- Callbacks ---
    async handleKickCallback(chatId, username, auth) {
        // Find active session
        const activeSessions = await db.select().from(radacct).where(and(eq(radacct.username, username), isNull(radacct.acctstoptime), auth.tenantId ? eq(radacct.tenantId, auth.tenantId) : undefined)).limit(1);
        if (activeSessions.length === 0) {
            this.bot?.sendMessage(chatId, `❌ ผู้ใช้ ${username} ไม่ได้ออนไลน์อยู่`);
            return;
        }
        const session = activeSessions[0];
        // Get NAS to find IP
        const nasRecord = await db.select().from(nas).where(eq(nas.nasname, session.nasipaddress)).limit(1);
        if (nasRecord.length === 0) {
            this.bot?.sendMessage(chatId, `❌ ไม่พบข้อมูล Gateway IP: ${session.nasipaddress}`);
            return;
        }
        try {
            await RadiusCoAService.disconnectUser({ ip: nasRecord[0].nasname, secret: nasRecord[0].secret }, username);
            // Update radacct
            await db.update(radacct).set({
                acctstoptime: new Date(),
                acctterminatecause: 'Admin Reset'
            }).where(eq(radacct.radacctid, session.radacctid));
            this.bot?.sendMessage(chatId, `✅ สั่งเตะผู้ใช้ ${username} เรียบร้อยแล้ว`);
        }
        catch (error) {
            this.bot?.sendMessage(chatId, `❌ สั่งเตะไม่สำเร็จ: เกิดข้อผิดพลาดในการเชื่อมต่อ CoA`);
        }
    }
    async handleSuspendCallback(chatId, username, auth) {
        await db.update(radcheck).set({ deletedAt: new Date() }).where(and(eq(radcheck.username, username), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined));
        this.bot?.sendMessage(chatId, `🚫 ระงับบัญชี ${username} เรียบร้อยแล้ว`);
    }
    async handleReactivateCallback(chatId, username, auth) {
        await db.update(radcheck).set({ deletedAt: null }).where(and(eq(radcheck.username, username), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined));
        this.bot?.sendMessage(chatId, `🟢 เปิดใช้งานบัญชี ${username} เรียบร้อยแล้ว`);
    }
    async showDeleteConfirmation(chatId, username, messageId) {
        this.bot?.editMessageReplyMarkup({
            inline_keyboard: [
                [{ text: "⚠️ ยืนยันลบบัญชีนี้ (ลบถาวร)", callback_data: `delete_confirm:${username}` }],
                [{ text: "❌ ยกเลิก", callback_data: `user:${username}` }]
            ]
        }, { chat_id: chatId, message_id: messageId });
    }
    async handleDeleteCallback(chatId, username, auth) {
        // Delete from radcheck and radusergroup
        await db.delete(radcheck).where(and(eq(radcheck.username, username), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined));
        await db.delete(radusergroup).where(and(eq(radusergroup.username, username), auth.tenantId ? eq(radusergroup.tenantId, auth.tenantId) : undefined));
        this.bot?.sendMessage(chatId, `🗑️ บัญชี ${username} ถูกลบออกจากระบบแล้ว`);
    }
    // --- External Alert Dispatchers ---
    async sendMasterAlert(message) {
        if (!this.bot || !this.isInitialized)
            return;
        const settings = await db.query.globalSettings.findFirst();
        if (settings && settings.telegramEnabled && settings.telegramChatId) {
            try {
                await this.bot.sendMessage(settings.telegramChatId, `🚨 *System Alert*\n${message}`, { parse_mode: 'Markdown' });
            }
            catch (e) {
                console.error("Failed to send master telegram alert:", e);
            }
        }
    }
    async sendDirectMessage(chatId, message) {
        if (!this.bot || !this.isInitialized) {
            throw new Error("Telegram bot is not initialized. Please check Global Settings.");
        }
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    async sendAlertToTenant(tenantId, message, inlineKeyboard) {
        if (!this.bot || !this.isInitialized)
            return;
        const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
        if (tenant && tenant.telegramEnabled && tenant.telegramChatId) {
            try {
                const options = { parse_mode: 'Markdown' };
                if (inlineKeyboard && inlineKeyboard.length > 0) {
                    options.reply_markup = { inline_keyboard: inlineKeyboard };
                }
                await this.bot.sendMessage(tenant.telegramChatId, message, options);
            }
            catch (e) {
                console.error(`Failed to send telegram alert to tenant ${tenantId}:`, e);
            }
        }
    }
}
//# sourceMappingURL=telegram.service.js.map