import { logger } from "../../utils/logger";
import { getWbot } from "../../libs/wbot";
import { handleMessage } from "../WbotServices/wbotMessageListener";
import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";

interface MessageCheckOptions {
  interval?: number; // Check interval in milliseconds (default: 5 minutes)
  limit?: number; // Maximum messages to fetch per check (default: 50)
  enabled?: boolean; // Enable/disable message checking (default: true)
}

interface SessionCheckInfo {
  whatsappId: number;
  lastCheck: Date;
  lastMessageId?: string;
  interval: NodeJS.Timeout;
}

class MessageCheckService {
  private activeChecks: Map<number, SessionCheckInfo> = new Map();
  private defaultOptions: MessageCheckOptions = {
    interval: 5 * 60 * 1000, // 5 minutes
    limit: 50,
    enabled: true
  };

  /**
   * Start regular message checking for a WhatsApp session
   */
  public startMessageChecking = async (
    whatsappId: number,
    options: MessageCheckOptions = {}
  ): Promise<void> => {
    const config = { ...this.defaultOptions, ...options };

    if (!config.enabled) {
      logger.info(`Message checking disabled for WhatsApp ID: ${whatsappId}`);
      return;
    }

    // Stop existing check if running
    this.stopMessageChecking(whatsappId);

    try {
      // Verify WhatsApp session exists and is connected
      const whatsapp = await Whatsapp.findByPk(whatsappId);
      if (!whatsapp || whatsapp.status !== "CONNECTED") {
        logger.warn(`Cannot start message checking - WhatsApp ${whatsappId} not connected`);
        return;
      }

      const checkInfo: SessionCheckInfo = {
        whatsappId,
        lastCheck: new Date(),
        interval: setInterval(
          () => this.checkForNewMessages(whatsappId, config),
          config.interval
        )
      };

      this.activeChecks.set(whatsappId, checkInfo);

      logger.info(`Started message checking for WhatsApp ID: ${whatsappId} (interval: ${config.interval}ms)`);

      // Run initial check
      await this.checkForNewMessages(whatsappId, config);

    } catch (error) {
      logger.error(`Failed to start message checking for WhatsApp ID: ${whatsappId}:`, error);
    }
  };

  /**
   * Stop message checking for a WhatsApp session
   */
  public stopMessageChecking = (whatsappId: number): void => {
    const checkInfo = this.activeChecks.get(whatsappId);
    if (checkInfo) {
      clearInterval(checkInfo.interval);
      this.activeChecks.delete(whatsappId);
      logger.info(`Stopped message checking for WhatsApp ID: ${whatsappId}`);
    }
  };

  /**
   * Check for new messages in a WhatsApp session
   */
  private checkForNewMessages = async (
    whatsappId: number,
    options: MessageCheckOptions
  ): Promise<void> => {
    const checkInfo = this.activeChecks.get(whatsappId);
    if (!checkInfo) {
      logger.warn(`Message check info not found for WhatsApp ID: ${whatsappId}`);
      return;
    }

    try {
      const wbot = getWbot(whatsappId);

      // Get all chats
      const chats = await wbot.getChats();
      let totalProcessed = 0;
      let totalNewMessages = 0;

      logger.info(`Checking for new messages in ${chats.length} chats for WhatsApp ID: ${whatsappId}`);

      for (const chat of chats) {
        try {
          // Fetch recent messages (last 100 messages to find new ones)
          const recentMessages = await chat.fetchMessages({
            limit: Math.min(options.limit || 50, 100)
          });

          // Process messages that are newer than our last check
          for (const msg of recentMessages.reverse()) { // Reverse to process newest first
            // Skip messages from self (to avoid processing sent messages)
            if (msg.fromMe) {
              continue;
            }

            // Check if message is newer than last check
            const msgTimestamp = new Date(msg.timestamp * 1000);
            if (msgTimestamp > checkInfo.lastCheck) {
              // Validate DR number before processing
              const drNumber = this.extractDrNumber(msg);
              if (!drNumber) {
                logger.debug(`Skipping message without DR number from ${msg.from}`);
                continue;
              }

              // Process the message using existing handler
              await handleMessage(msg, wbot);
              totalNewMessages++;
              logger.debug(`Processed new message with DR number: ${drNumber}`);
            }
          }

          totalProcessed += recentMessages.length;
        } catch (chatError) {
          logger.warn(`Error checking messages for chat ${chat.id}:`, chatError);
        }
      }

      // Update last check time
      checkInfo.lastCheck = new Date();

      logger.info(`Message check completed for WhatsApp ID: ${whatsappId} - ` +
        `Processed: ${totalProcessed}, New messages: ${totalNewMessages}`);

    } catch (error) {
      if (error instanceof AppError && error.message === "ERR_WAPP_NOT_INITIALIZED") {
        logger.warn(`WhatsApp session ${whatsappId} not initialized, stopping message checks`);
        this.stopMessageChecking(whatsappId);
      } else {
        logger.error(`Error checking messages for WhatsApp ID: ${whatsappId}:`, error);
      }
    }
  };

  /**
   * Extract DR number from message
   */
  private extractDrNumber = (msg: any): string | null => {
    // Check message body
    if (msg.body) {
      const bodyMatch = msg.body.match(/DR\d{7}/);
      if (bodyMatch && /^DR\d{7}$/.test(bodyMatch[0])) {
        return bodyMatch[0];
      }
    }

    // Check contact name if available
    if (msg._data && msg._data.notifyName) {
      const nameMatch = msg._data.notifyName.match(/DR\d{7}/);
      if (nameMatch && /^DR\d{7}$/.test(nameMatch[0])) {
        return nameMatch[0];
      }
    }

    return null;
  };

  /**
   * Start message checking for all connected WhatsApp sessions
   */
  public startAllMessageChecks = async (options: MessageCheckOptions = {}): Promise<void> => {
    try {
      const connectedWhatsapps = await Whatsapp.findAll({
        where: { status: "CONNECTED" }
      });

      logger.info(`Starting message checking for ${connectedWhatsapps.length} connected sessions`);

      for (const whatsapp of connectedWhatsapps) {
        await this.startMessageChecking(whatsapp.id, options);
      }
    } catch (error) {
      logger.error("Failed to start message checking for all sessions:", error);
    }
  };

  /**
   * Stop all active message checks
   */
  public stopAllMessageChecks = (): void => {
    const whatsappIds = Array.from(this.activeChecks.keys());
    for (const whatsappId of whatsappIds) {
      this.stopMessageChecking(whatsappId);
    }
    logger.info(`Stopped all message checking (${whatsappIds.length} sessions)`);
  };

  /**
   * Get status of message checking
   */
  public getMessageCheckingStatus = (): Array<{
    whatsappId: number;
    lastCheck: Date;
    isActive: boolean;
  }> => {
    return Array.from(this.activeChecks.values()).map(checkInfo => ({
      whatsappId: checkInfo.whatsappId,
      lastCheck: checkInfo.lastCheck,
      isActive: true
    }));
  };

  /**
   * Update message checking options for a specific session
   */
  public updateMessageChecking = (
    whatsappId: number,
    options: MessageCheckOptions
  ): void => {
    this.stopMessageChecking(whatsappId);
    this.startMessageChecking(whatsappId, options);
  };
}

// Export singleton instance
export const messageCheckService = new MessageCheckService();
export default MessageCheckService;