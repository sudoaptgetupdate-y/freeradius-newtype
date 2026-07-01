export declare class TelegramService {
    private static instance;
    private bot;
    isInitialized: boolean;
    private constructor();
    static getInstance(): TelegramService;
    initBot(token: string): Promise<void>;
    processUpdate(update: any): Promise<void>;
    private handleMessage;
    private handleCallbackQuery;
    private getChatAuthorization;
    private handleHelpCommand;
    private handleStatusCommand;
    private handleFindCommand;
    private handleUserCommand;
    private handleVoucherCommand;
    private handleKickCallback;
    private handleSuspendCallback;
    private handleReactivateCallback;
    private showDeleteConfirmation;
    private handleDeleteCallback;
    sendMasterAlert(message: string): Promise<void>;
    sendDirectMessage(chatId: string, message: string): Promise<void>;
    sendAlertToTenant(tenantId: string, message: string, inlineKeyboard?: any[][]): Promise<void>;
}
//# sourceMappingURL=telegram.service.d.ts.map