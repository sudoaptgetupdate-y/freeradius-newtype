import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { globalSettings } from '../schema/settings';
import { tenants } from '../schema/tenants';
import { radcheck, radacct, radusergroup, radgroupcheck, radgroupreply, radreply } from '../schema/freeradius';
import { nas } from '../schema/nas';
import { eq, and, isNull, like, or, inArray } from 'drizzle-orm';
import { organizations, userOrganizations } from '../schema/organizations';
import { RadiusCoAService } from './radius-coa.service';

export class TelegramService {
  private static instance: TelegramService;
  private bot: TelegramBot | null = null;
  public isInitialized = false;

  private constructor() {}

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public async initBot(token: string) {
    // We only process webhooks, no polling.
    this.bot = new TelegramBot(token, { polling: false });
    this.isInitialized = true;
  }

  public async processUpdate(update: any) {
    if (!this.bot || !this.isInitialized) return;

    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async handleMessage(msg: any) {
    if (!msg.text) return;
    
    const text = msg.text.trim();
    const chatId = msg.chat.id;

    // Check if the chat is authorized (matches a tenant or master admin)
    const authInfo = await this.getChatAuthorization(chatId.toString());
    if (!authInfo.isAuthorized) {
      return; // Ignore unauthorized chats silently to avoid spam
    }

    if (text.startsWith('/status')) {
      await this.handleStatusCommand(chatId, authInfo);
    } else if (text.startsWith('/user ')) {
      await this.handleUserCommand(chatId, text.split(' ')[1], authInfo);
    } else if (text.startsWith('/find ')) {
      const query = text.substring(6).trim();
      await this.handleFindCommand(chatId, query, authInfo);
    } else if (text.startsWith('/group ')) {
      await this.handleGroupCommand(chatId, text.split(' ')[1], authInfo);
    } else if (text.startsWith('/voucher ')) {
      await this.handleVoucherCommand(chatId, text, authInfo);
    } else if (text === '/help') {
      await this.handleHelpCommand(chatId);
    }
  }

  private async handleCallbackQuery(query: any) {
    if (!query.data || !query.message) return;
    const chatId = query.message.chat.id;
    
    const authInfo = await this.getChatAuthorization(chatId.toString());
    if (!authInfo.isAuthorized) {
      this.bot?.answerCallbackQuery(query.id, { text: "Unauthorized." });
      return;
    }

    const [action, ...args] = query.data.split(':');
    
    try {
      if (action === 'kick') {
        await this.handleKickCallback(chatId, args[0] as string, authInfo);
        this.bot?.answerCallbackQuery(query.id, { text: "Kick command sent." });
      } else if (action === 'suspend') {
        await this.handleSuspendCallback(chatId, args[0] as string, authInfo);
        this.bot?.answerCallbackQuery(query.id, { text: "User suspended." });
      } else if (action === 'reactivate') {
        await this.handleReactivateCallback(chatId, args[0] as string, authInfo);
        this.bot?.answerCallbackQuery(query.id, { text: "User reactivated." });
      } else if (action === 'delete_confirm') {
        await this.handleDeleteCallback(chatId, args[0] as string, authInfo);
        this.bot?.answerCallbackQuery(query.id, { text: "User deleted." });
      } else if (action === 'delete') {
        // Just show confirmation buttons
        await this.showDeleteConfirmation(chatId, args[0] as string, query.message.message_id);
        this.bot?.answerCallbackQuery(query.id);
      } else if (action === 'suspend_group') {
        await this.handleSuspendGroupCallback(chatId, args[0] as string, authInfo);
        this.bot?.answerCallbackQuery(query.id, { text: "Group suspended." });
      } else if (action === 'reactivate_group') {
        await this.handleReactivateGroupCallback(chatId, args[0] as string, authInfo);
        this.bot?.answerCallbackQuery(query.id, { text: "Group reactivated." });
      } else if (action === 'user') {
        await this.handleUserCommand(chatId, args[0] as string, authInfo);
        this.bot?.answerCallbackQuery(query.id);
      }
    } catch (e: any) {
      console.error("Callback error", e);
      this.bot?.answerCallbackQuery(query.id, { text: "Error executing command." });
    }
  }

  private async getChatAuthorization(chatId: string): Promise<{ isAuthorized: boolean, tenantId: string | null, isMaster: boolean }> {
    // 1. Check if it's the master admin
    const settings = await db.query.globalSettings.findFirst();
    if (settings && settings.telegramEnabled && settings.telegramChatId === chatId) {
      return { isAuthorized: true, tenantId: null, isMaster: true };
    }

    // 2. Check if it matches a tenant
    const tenant = await db.query.tenants.findFirst({
      where: and(
        eq(tenants.telegramEnabled, true),
        eq(tenants.telegramChatId, chatId)
      )
    });

    if (tenant) {
      return { isAuthorized: true, tenantId: tenant.id, isMaster: false };
    }

    return { isAuthorized: false, tenantId: null, isMaster: false };
  }

  private async handleHelpCommand(chatId: number) {
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

  private async handleStatusCommand(chatId: number, auth: { tenantId: string | null, isMaster: boolean }) {
    let text = `📊 *System Status*\n\n`;
    
    // Get online users
    const activeSessions = await db.select().from(radacct).where(
      and(
        isNull(radacct.acctstoptime),
        auth.tenantId ? eq(radacct.tenantId, auth.tenantId) : undefined
      )
    );

    text += `👤 *Active Users:* ${activeSessions.length}\n`;

    // Get NAS status
    const nasRecords = await db.select().from(nas).where(
      auth.tenantId ? eq(nas.tenantId, auth.tenantId) : undefined
    );
    text += `📡 *Routers:* ${nasRecords.length}\n`;

    this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  private async handleFindCommand(chatId: number, query: string, auth: { tenantId: string | null }) {
    if (!query) {
      this.bot?.sendMessage(chatId, "❌ กรุณาระบุคำค้นหา เช่น /find somchai");
      return;
    }

    // Search radcheck
    const results = await db.select().from(radcheck).where(
      and(
        like(radcheck.username, `%${query}%`),
        auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined
      )
    ).limit(10);

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

  private async handleUserCommand(chatId: number, username: string, auth: { tenantId: string | null }) {
    if (!username) {
      this.bot?.sendMessage(chatId, "❌ กรุณาระบุ username เช่น /user somchai");
      return;
    }

    const userRecords = await db.select().from(radcheck).where(
      and(
        eq(radcheck.username, username),
        eq(radcheck.attribute, 'Cleartext-Password'),
        auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined
      )
    );

    if (userRecords.length === 0) {
      this.bot?.sendMessage(chatId, `❌ ไม่พบผู้ใช้: ${username}`);
      return;
    }

    const user = userRecords[0]!;
    
    // Check if online
    const activeSessions = await db.select().from(radacct).where(
      and(
        eq(radacct.username, username),
        eq(radacct.tenantId, user.tenantId!),
        isNull(radacct.acctstoptime)
      )
    );
    const isOnline = activeSessions.length > 0;
    const isSuspended = !!user.deletedAt;

    // Get profile
    const groups = await db.select().from(radusergroup).where(
      and(eq(radusergroup.username, username), eq(radusergroup.tenantId, user.tenantId!))
    );
    const profileName = groups.length > 0 ? groups[0]!.groupname : "N/A";

    // Get logical group
    const orgQuery = await db.select({ name: organizations.name })
      .from(userOrganizations)
      .innerJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
      .where(
        and(
          eq(userOrganizations.username, username),
          auth.tenantId ? eq(userOrganizations.tenantId, auth.tenantId) : undefined
        )
      );
    const logicalGroupName = orgQuery.length > 0 ? orgQuery[0]!.name : "-";

    let text = `👤 *ข้อมูลผู้ใช้งาน: ${username}*\n`;
    text += `--------------------------------------\n`;
    text += `• กลุ่ม (Group): ${logicalGroupName}\n`;
    text += `• สถานะบัญชี: ${isSuspended ? '🔴 ถูกระงับ' : '🟢 ปกติ (Active)'}\n`;
    text += `• สถานะเชื่อมต่อ: ${isOnline ? '🟢 ออนไลน์ (Online)' : '⚫ ออฟไลน์'}\n`;
    if (isOnline) {
      text += `• IP: ${activeSessions[0]!.framedipaddress}\n`;
      text += `• MAC: ${activeSessions[0]!.callingstationid}\n`;
    }
    text += `• แพ็กเกจ: ${profileName}\n`;

    const inlineKeyboard: any[][] = [];
    
    if (isOnline) {
      inlineKeyboard.push([{ text: "⚡ เตะอุปกรณ์ (Kick)", callback_data: `kick:${username}` }]);
    }
    
    if (isSuspended) {
      inlineKeyboard.push([{ text: "🟢 ปลดระงับ (Reactivate)", callback_data: `reactivate:${username}` }]);
    } else {
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

  private async handleGroupCommand(chatId: number, groupName: string, auth: { tenantId: string | null }) {
    if (!groupName) {
      this.bot?.sendMessage(chatId, "❌ กรุณาระบุชื่อกลุ่ม เช่น /group Grade10");
      return;
    }

    const orgs = await db.select().from(organizations).where(
      and(
        eq(organizations.name, groupName),
        isNull(organizations.deletedAt),
        auth.tenantId ? eq(organizations.tenantId, auth.tenantId) : undefined
      )
    );

    if (orgs.length === 0) {
      this.bot?.sendMessage(chatId, `❌ ไม่พบกลุ่ม: ${groupName}`);
      return;
    }

    const org = orgs[0]!;
    
    // get user count
    const usersInGroup = await db.select().from(userOrganizations).where(eq(userOrganizations.organizationId, org.id));
    
    let text = `👥 *รายละเอียดกลุ่ม: ${org.name}*\n`;
    text += `--------------------------------------\n`;
    text += `• จำนวนสมาชิก: ${usersInGroup.length} คน\n`;
    text += `• โปรไฟล์ที่ผูกอยู่ (Default): ${org.defaultProfile || 'ไม่มี'}\n`;
    if (org.description) text += `• คำอธิบาย: ${org.description}\n`;

    const inlineKeyboard: any[][] = [];
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

  private async handleVoucherCommand(chatId: number, commandText: string, auth: { tenantId: string | null }) {
    this.bot?.sendMessage(chatId, "⏳ ระบบกำลังทยอยพัฒนาส่วนสร้างคูปองผ่าน Telegram ครับ...");
  }

  // --- Callbacks ---

  private async handleKickCallback(chatId: number, username: string, auth: { tenantId: string | null }) {
    // Find active session
    const activeSessions = await db.select().from(radacct).where(
      and(
        eq(radacct.username, username),
        isNull(radacct.acctstoptime),
        auth.tenantId ? eq(radacct.tenantId, auth.tenantId) : undefined
      )
    ).limit(1);

    if (activeSessions.length === 0) {
      this.bot?.sendMessage(chatId, `❌ ผู้ใช้ ${username} ไม่ได้ออนไลน์อยู่`);
      return;
    }

    const session = activeSessions[0]!;
    
    // Get NAS to find IP
    const nasRecord = await db.select().from(nas).where(
        eq(nas.nasname, session.nasipaddress)
    ).limit(1);

    if (nasRecord.length === 0) {
      this.bot?.sendMessage(chatId, `❌ ไม่พบข้อมูล Gateway IP: ${session.nasipaddress}`);
      return;
    }

    try {
      await RadiusCoAService.disconnectUser({ ip: nasRecord[0]!.nasname, secret: nasRecord[0]!.secret }, username);
      
      // Update radacct
      await db.update(radacct).set({
        acctstoptime: new Date(),
        acctterminatecause: 'Admin Reset'
      }).where(eq(radacct.radacctid, session.radacctid));

      this.bot?.sendMessage(chatId, `✅ สั่งเตะผู้ใช้ ${username} เรียบร้อยแล้ว`);
    } catch (error) {
      this.bot?.sendMessage(chatId, `❌ สั่งเตะไม่สำเร็จ: เกิดข้อผิดพลาดในการเชื่อมต่อ CoA`);
    }
  }

  private async handleSuspendCallback(chatId: number, username: string, auth: { tenantId: string | null }) {
    await db.update(radcheck).set({ deletedAt: new Date() }).where(
      and(
        eq(radcheck.username, username),
        auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined
      )
    );
    this.bot?.sendMessage(chatId, `🚫 ระงับบัญชี ${username} เรียบร้อยแล้ว`);
  }

  private async handleReactivateCallback(chatId: number, username: string, auth: { tenantId: string | null }) {
    await db.update(radcheck).set({ deletedAt: null }).where(
      and(
        eq(radcheck.username, username),
        auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined
      )
    );
    this.bot?.sendMessage(chatId, `🟢 ปลดระงับบัญชี ${username} เรียบร้อยแล้ว`);
  }

  private async handleSuspendGroupCallback(chatId: number, groupId: string, auth: { tenantId: string | null }) {
    const members = await db.select({ username: userOrganizations.username }).from(userOrganizations).where(
      and(
        eq(userOrganizations.organizationId, groupId),
        auth.tenantId ? eq(userOrganizations.tenantId, auth.tenantId) : undefined
      )
    );
    
    if (members.length > 0) {
      const usernames = members.map(m => m.username);
      await db.update(radcheck).set({ deletedAt: new Date() }).where(
        and(
          inArray(radcheck.username, usernames),
          auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined
        )
      );
    }
    this.bot?.sendMessage(chatId, `🚫 ระงับบัญชีทั้งหมดในกลุ่มเรียบร้อยแล้ว`);
  }

  private async handleReactivateGroupCallback(chatId: number, groupId: string, auth: { tenantId: string | null }) {
    const members = await db.select({ username: userOrganizations.username }).from(userOrganizations).where(
      and(
        eq(userOrganizations.organizationId, groupId),
        auth.tenantId ? eq(userOrganizations.tenantId, auth.tenantId) : undefined
      )
    );
    
    if (members.length > 0) {
      const usernames = members.map(m => m.username);
      await db.update(radcheck).set({ deletedAt: null }).where(
        and(
          inArray(radcheck.username, usernames),
          auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined
        )
      );
    }
    this.bot?.sendMessage(chatId, `🟢 ปลดระงับบัญชีทั้งหมดในกลุ่มเรียบร้อยแล้ว`);
  }

  private async showDeleteConfirmation(chatId: number, username: string, messageId: number) {
    this.bot?.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: "⚠️ ยืนยันลบบัญชีนี้ (ลบถาวร)", callback_data: `delete_confirm:${username}` }],
        [{ text: "❌ ยกเลิก", callback_data: `user:${username}` }]
      ]
    }, { chat_id: chatId, message_id: messageId });
  }

  private async handleDeleteCallback(chatId: number, username: string, auth: { tenantId: string | null }) {
    // Delete from radcheck and radusergroup
    await db.delete(radcheck).where(
      and(
        eq(radcheck.username, username),
        auth.tenantId ? eq(radcheck.tenantId, auth.tenantId) : undefined
      )
    );
    await db.delete(radusergroup).where(
      and(
        eq(radusergroup.username, username),
        auth.tenantId ? eq(radusergroup.tenantId, auth.tenantId) : undefined
      )
    );
    this.bot?.sendMessage(chatId, `🗑️ บัญชี ${username} ถูกลบออกจากระบบแล้ว`);
  }

  // --- External Alert Dispatchers ---

  public async sendMasterAlert(message: string) {
    if (!this.bot || !this.isInitialized) return;
    const settings = await db.query.globalSettings.findFirst();
    if (settings && settings.telegramEnabled && settings.telegramChatId) {
      try {
        await this.bot.sendMessage(settings.telegramChatId, `🚨 *System Alert*\n${message}`, { parse_mode: 'Markdown' });
      } catch (e) {
        console.error("Failed to send master telegram alert:", e);
      }
    }
  }

  public async sendDirectMessage(chatId: string, message: string) {
    if (!this.bot || !this.isInitialized) {
      throw new Error("Telegram bot is not initialized. Please check Global Settings.");
    }
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  public async sendAlertToTenant(tenantId: string, message: string, inlineKeyboard?: any[][]) {
    if (!this.bot || !this.isInitialized) return;
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (tenant && tenant.telegramEnabled && tenant.telegramChatId) {
      try {
        const options: any = { parse_mode: 'Markdown' };
        if (inlineKeyboard && inlineKeyboard.length > 0) {
          options.reply_markup = { inline_keyboard: inlineKeyboard };
        }
        await this.bot.sendMessage(tenant.telegramChatId, message, options);
      } catch (e) {
        console.error(`Failed to send telegram alert to tenant ${tenantId}:`, e);
      }
    }
  }
}
