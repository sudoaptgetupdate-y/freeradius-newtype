import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { globalSettings } from '../schema/settings';
import { tenants } from '../schema/tenants';
import { radcheck, radacct, radusergroup, radgroupcheck, radgroupreply, radreply } from '../schema/freeradius';
import { nas } from '../schema/nas';
import { eq, and, isNull, like, or, inArray } from 'drizzle-orm';
import { organizations, userOrganizations } from '../schema/organizations';
import { RadiusCoAService } from './radius-coa.service';
import { vouchers } from '../schema/vouchers';
import { voucherQueue } from '../lib/queue';
import { userinfo } from '../schema/userinfo';
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
    async ensureInitialized() {
        if (this.isInitialized && this.bot)
            return true;
        const settings = await db.query.globalSettings.findFirst();
        if (settings && settings.telegramToken) {
            await this.initBot(settings.telegramToken);
            return true;
        }
        return false;
    }
    async processUpdate(update) {
        try {
            await this.ensureInitialized();
            if (!this.bot || !this.isInitialized)
                return;
            if (update.message) {
                await this.handleMessage(update.message);
            }
            else if (update.callback_query) {
                await this.handleCallbackQuery(update.callback_query);
            }
        }
        catch (error) {
            console.error("Error in Telegram processUpdate:", error);
        }
    }
    async handleMessage(msg) {
        if (!msg.text)
            return;
        const text = msg.text.trim();
        const chatId = msg.chat.id;
        // Split command and arguments
        const parts = text.split(/\s+/);
        const commandWithBot = parts[0]?.toLowerCase() || "";
        // Remove @botname suffix if present (e.g. /status@botname -> /status)
        const command = commandWithBot.split('@')[0];
        const args = parts.slice(1);
        // Allow /start, /chatid, or /myid for anyone so they can find their chat ID easily
        if (command === '/start' || command === '/chatid' || command === '/myid') {
            await this.ensureInitialized();
            this.bot?.sendMessage(chatId, `ℹ️ *Your Chat ID:* \`${chatId}\`\n\nCopy this ID and save it in your Tenant Portal Settings or Global Settings to authorize this chat.`, { parse_mode: 'Markdown' });
            return;
        }
        // Check if the chat is authorized (matches a tenant or master admin)
        const authInfo = await this.getChatAuthorization(chatId.toString());
        if (!authInfo.isAuthorized) {
            return; // Ignore unauthorized chats silently to avoid spam
        }
        if (command === '/status') {
            await this.handleStatusCommand(chatId, authInfo);
        }
        else if (command === '/user') {
            const username = args[0] || "";
            await this.handleUserCommand(chatId, username, authInfo);
        }
        else if (command === '/find') {
            const query = args.join(' ');
            await this.handleFindCommand(chatId, query, authInfo);
        }
        else if (command === '/group') {
            const groupName = args.join(' ');
            await this.handleGroupCommand(chatId, groupName, authInfo);
        }
        else if (command === '/voucher') {
            await this.handleVoucherCommand(chatId, args, authInfo);
        }
        else if (command === '/help') {
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
            else if (action === 'suspend_group') {
                await this.handleSuspendGroupCallback(chatId, args[0], authInfo);
                this.bot?.answerCallbackQuery(query.id, { text: "Group suspended." });
            }
            else if (action === 'reactivate_group') {
                await this.handleReactivateGroupCallback(chatId, args[0], authInfo);
                this.bot?.answerCallbackQuery(query.id, { text: "Group reactivated." });
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
/group <groupname> - ดูรายละเอียดของกลุ่มและจัดการสมาชิก
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
        // Get matching usernames from userinfo (first name, last name, phone, email, username)
        const userinfoMatches = await db.select({ username: userinfo.username }).from(userinfo).where(and(or(like(userinfo.username, `%${query}%`), like(userinfo.firstName, `%${query}%`), like(userinfo.lastName, `%${query}%`), like(userinfo.phone, `%${query}%`), like(userinfo.email, `%${query}%`)), auth.tenantId ? eq(userinfo.tenantId, auth.tenantId) : undefined)).limit(20);
        // Also search radcheck directly in case there is no userinfo entry
        const radcheckMatches = await db.select({ username: radcheck.username }).from(radcheck).where(and(like(radcheck.username, `%${query}%`), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined)).limit(20);
        // Combine and get unique usernames
        const uniqueUsernames = Array.from(new Set([
            ...userinfoMatches.map(u => u.username),
            ...radcheckMatches.map(r => r.username)
        ])).slice(0, 10);
        if (uniqueUsernames.length === 0) {
            this.bot?.sendMessage(chatId, "❌ ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา");
            return;
        }
        const inlineKeyboard = uniqueUsernames.map(username => [{
                text: `👤 ${username}`,
                callback_data: `user:${username}`
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
        // Get profile
        const groups = await db.select().from(radusergroup).where(and(eq(radusergroup.username, username), eq(radusergroup.tenantId, user.tenantId)));
        const profileName = groups.length > 0 ? groups[0].groupname : "N/A";
        // Get logical group
        const orgQuery = await db.select({ name: organizations.name })
            .from(userOrganizations)
            .innerJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
            .where(and(eq(userOrganizations.username, username), auth.tenantId ? eq(userOrganizations.tenantId, auth.tenantId) : undefined));
        const logicalGroupName = orgQuery.length > 0 ? orgQuery[0].name : "-";
        let text = `👤 *ข้อมูลผู้ใช้งาน: ${username}*\n`;
        text += `--------------------------------------\n`;
        text += `• กลุ่ม (Group): ${logicalGroupName}\n`;
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
    async handleGroupCommand(chatId, groupName, auth) {
        if (!groupName) {
            this.bot?.sendMessage(chatId, "❌ กรุณาระบุชื่อกลุ่ม เช่น /group Grade10");
            return;
        }
        const orgs = await db.select().from(organizations).where(and(eq(organizations.name, groupName), isNull(organizations.deletedAt), auth.tenantId ? eq(organizations.tenantId, auth.tenantId) : undefined));
        if (orgs.length === 0) {
            this.bot?.sendMessage(chatId, `❌ ไม่พบกลุ่ม: ${groupName}`);
            return;
        }
        const org = orgs[0];
        // get user count
        const usersInGroup = await db.select().from(userOrganizations).where(eq(userOrganizations.organizationId, org.id));
        let text = `👥 *รายละเอียดกลุ่ม: ${org.name}*\n`;
        text += `--------------------------------------\n`;
        text += `• จำนวนสมาชิก: ${usersInGroup.length} คน\n`;
        text += `• โปรไฟล์ที่ผูกอยู่ (Default): ${org.defaultProfile || 'ไม่มี'}\n`;
        if (org.description)
            text += `• คำอธิบาย: ${org.description}\n`;
        const inlineKeyboard = [];
        if (usersInGroup.length > 0) {
            inlineKeyboard.push([
                { text: "🚫 ระงับการใช้งาน (Suspend)", callback_data: `suspend_group:${org.id}` },
                { text: "🟢 ปลดระงับ (Reactivate)", callback_data: `reactivate_group:${org.id}` }
            ]);
        }
        this.bot?.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        });
    }
    async handleVoucherCommand(chatId, args, auth) {
        const effectiveTenantId = auth.tenantId;
        if (!effectiveTenantId) {
            this.bot?.sendMessage(chatId, "❌ คำสั่งนี้ใช้ได้สำหรับบัญชี Tenant Admin เท่านั้น");
            return;
        }
        // 1. Fetch available profiles for validation and suggestion
        let uniqueProfiles = [];
        try {
            const checkRows = await db.select({ groupname: radgroupcheck.groupname }).from(radgroupcheck).where(eq(radgroupcheck.tenantId, effectiveTenantId));
            const replyRows = await db.select({ groupname: radgroupreply.groupname }).from(radgroupreply).where(eq(radgroupreply.tenantId, effectiveTenantId));
            uniqueProfiles = Array.from(new Set([
                ...checkRows.map(r => r.groupname),
                ...replyRows.map(r => r.groupname)
            ]));
        }
        catch (e) {
            console.error("Failed to fetch profiles for tenant", e);
        }
        const showUsageHelp = () => {
            let helpText = `ℹ️ *รูปแบบคำสั่ง:* \`/voucher <จำนวนคูปอง> <ชื่อแพ็กเกจ>\`\n`;
            helpText += `ตัวอย่าง: \`/voucher 5 Basic_WiFi\`\n\n`;
            if (uniqueProfiles.length > 0) {
                helpText += `📋 *แพ็กเกจที่ใช้งานได้ในระบบของคุณ:*\n`;
                uniqueProfiles.forEach(p => {
                    helpText += `- \`${p}\`\n`;
                });
            }
            else {
                helpText += `⚠️ ไม่พบข้อมูลแพ็กเกจในระบบของคุณ กรุณาสร้างแพ็กเกจก่อน`;
            }
            this.bot?.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
        };
        if (args.length < 2) {
            showUsageHelp();
            return;
        }
        const countStr = args[0] || "";
        const packageName = args[1] || "";
        const count = parseInt(countStr, 10);
        if (isNaN(count) || count <= 0) {
            this.bot?.sendMessage(chatId, "❌ จำนวนคูปองต้องเป็นตัวเลขที่มากกว่า 0");
            return;
        }
        if (count > 100) {
            this.bot?.sendMessage(chatId, "❌ อนุญาตให้สร้างได้ไม่เกิน 100 ใบต่อครั้งผ่าน Telegram");
            return;
        }
        if (!uniqueProfiles.includes(packageName)) {
            this.bot?.sendMessage(chatId, `❌ ไม่พบแพ็กเกจชื่อ \`${packageName}\` ในระบบของคุณ`);
            showUsageHelp();
            return;
        }
        this.bot?.sendMessage(chatId, `⏳ กำลังสร้างคูปองจำนวน ${count} ใบ สำหรับแพ็กเกจ \`${packageName}\` กรุณารอสักครู่...`, { parse_mode: 'Markdown' });
        try {
            const job = await voucherQueue.add("generate_vouchers", {
                tenantId: effectiveTenantId,
                amount: count,
                groupname: packageName,
                type: "code",
                codeLength: 6
            });
            // Poll for job completion
            let attempts = 0;
            let completed = false;
            let jobResult = null;
            while (attempts < 20) { // max 10 seconds (20 * 500ms)
                await new Promise(resolve => setTimeout(resolve, 500));
                const state = await job.getState();
                if (state === 'completed') {
                    jobResult = job.returnvalue;
                    completed = true;
                    break;
                }
                else if (state === 'failed') {
                    break;
                }
                attempts++;
            }
            if (completed && jobResult && jobResult.batchId) {
                // Fetch vouchers from db
                const generatedVouchers = await db.select().from(vouchers).where(eq(vouchers.batchId, jobResult.batchId));
                let responseText = `✅ *สร้างคูปองสำเร็จ!* จำนวน ${generatedVouchers.length} ใบ\n`;
                responseText += `📦 *แพ็กเกจ:* \`${packageName}\`\n`;
                responseText += `--------------------------------------\n`;
                const displayCount = Math.min(generatedVouchers.length, 15);
                for (let i = 0; i < displayCount; i++) {
                    const v = generatedVouchers[i];
                    responseText += `• Code: \`${v.code}\` ${v.password ? `| Pass: \`${v.password}\`` : ""}\n`;
                }
                if (generatedVouchers.length > 15) {
                    responseText += `--------------------------------------\n`;
                    responseText += `*และอีก ${generatedVouchers.length - 15} ใบที่เหลือ* สามารถเข้าดูและพิมพ์คูปองทั้งหมดได้ทาง Web Portal`;
                }
                this.bot?.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
            }
            else {
                this.bot?.sendMessage(chatId, `❌ ใช้เวลานานเกินไปในการสร้างคูปองในคิว กรุณาตรวจสอบผลการสร้างที่ระบบหลังบ้าน/Web Portal`);
            }
        }
        catch (error) {
            console.error("Voucher generation via telegram failed:", error);
            this.bot?.sendMessage(chatId, `❌ เกิดข้อผิดพลาดในการสร้างคูปอง: ${error.message || error}`);
        }
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
        this.bot?.sendMessage(chatId, `🟢 ปลดระงับบัญชี ${username} เรียบร้อยแล้ว`);
    }
    async handleSuspendGroupCallback(chatId, groupId, auth) {
        const members = await db.select({ username: userOrganizations.username }).from(userOrganizations).where(and(eq(userOrganizations.organizationId, groupId), auth.tenantId ? eq(userOrganizations.tenantId, auth.tenantId) : undefined));
        if (members.length > 0) {
            const usernames = members.map(m => m.username);
            await db.update(radcheck).set({ deletedAt: new Date() }).where(and(inArray(radcheck.username, usernames), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined));
        }
        this.bot?.sendMessage(chatId, `🚫 ระงับบัญชีทั้งหมดในกลุ่มเรียบร้อยแล้ว`);
    }
    async handleReactivateGroupCallback(chatId, groupId, auth) {
        const members = await db.select({ username: userOrganizations.username }).from(userOrganizations).where(and(eq(userOrganizations.organizationId, groupId), auth.tenantId ? eq(userOrganizations.tenantId, auth.tenantId) : undefined));
        if (members.length > 0) {
            const usernames = members.map(m => m.username);
            await db.update(radcheck).set({ deletedAt: null }).where(and(inArray(radcheck.username, usernames), auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined));
        }
        this.bot?.sendMessage(chatId, `🟢 ปลดระงับบัญชีทั้งหมดในกลุ่มเรียบร้อยแล้ว`);
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
        await this.ensureInitialized();
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
        await this.ensureInitialized();
        if (!this.bot || !this.isInitialized) {
            throw new Error("Telegram bot is not initialized. Please check Global Settings.");
        }
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    async sendAlertToTenant(tenantId, message, inlineKeyboard) {
        await this.ensureInitialized();
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