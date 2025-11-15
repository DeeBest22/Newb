import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import TelegramBot = require('node-telegram-bot-api');
import { Readable } from 'stream';
import { PrismaService } from '@app/core/database/prisma.service';
import {
  MessageButton,
  BulkMessageResponse,
  MessageResult,
  BulkImageResponse,
  ImageResult,
} from '../interfaces/telegram.interfaces';
import { TelegramUtils } from '../utils/telegram.utils';

@Injectable()
export class TelegramMessageService {
  private readonly logger = new Logger(TelegramMessageService.name);
  private bot: TelegramBot;

  constructor(private readonly prisma: PrismaService) {}

  setBot(bot: TelegramBot) {
    this.bot = bot;
    console.log('Bot injected into Message:', !!bot);
  }

  async sendFormattedMessage(
    chatId: string | number,
    message: string,
    button?: MessageButton,
  ) {
    try {
      const options: TelegramBot.SendMessageOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      };

      const isGroupChat = TelegramUtils.isGroupChat(chatId);

      if (button) {
        if (button.isWebApp && !isGroupChat) {
          options.reply_markup = {
            inline_keyboard: [
              [{ text: button.text, web_app: { url: button.url } }],
            ],
          };
        } else if (button.isWebApp && isGroupChat) {
          this.logger.warn(
            `Attempted to send WebApp button to group chat ${chatId}. Sending as URL button instead.`,
          );
          options.reply_markup = {
            inline_keyboard: [[{ text: button.text, url: button.url }]],
          };
        } else {
          options.reply_markup = {
            inline_keyboard: [[{ text: button.text, url: button.url }]],
          };
        }
      }

      await this.bot.sendMessage(chatId, message, options);
      TelegramUtils.logOperation('Message send', chatId, true);

      return { success: true, message: 'Message sent successfully' };
    } catch (error: any) {
      const errorMessage = this.handleMessageError(error, chatId);
      TelegramUtils.logOperation('Message send', chatId, false, error);
      throw new HttpException(errorMessage.message, errorMessage.statusCode);
    }
  }

  async sendAutoDeleteFormattedMessage(
    chatId: string | number,
    message: string,
    button?: MessageButton,
  ) {
    try {
      const options: TelegramBot.SendMessageOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      };

      const isGroupChat = TelegramUtils.isGroupChat(chatId);

      if (button) {
        if (button.isWebApp && !isGroupChat) {
          options.reply_markup = {
            inline_keyboard: [
              [{ text: button.text, web_app: { url: button.url } }],
            ],
          };
        } else if (button.isWebApp && isGroupChat) {
          this.logger.warn(
            `Attempted to send WebApp button to group chat ${chatId}. Sending as URL button instead.`,
          );
          options.reply_markup = {
            inline_keyboard: [[{ text: button.text, url: button.url }]],
          };
        } else {
          options.reply_markup = {
            inline_keyboard: [[{ text: button.text, url: button.url }]],
          };
        }
      }

      const sentMessage = await this.bot.sendMessage(chatId, message, options);
      this.logger.log(
        `Message sent to chat ${chatId}, will be deleted after 1 hour`,
      );

      // Schedule message deletion after 1 hour
      setTimeout(async () => {
        try {
          await this.bot.deleteMessage(chatId, sentMessage.message_id);
          this.logger.log(
            `Message ${sentMessage.message_id} deleted from chat ${chatId}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to delete message ${sentMessage.message_id} from chat ${chatId}:`,
            error,
          );
        }
      }, 3600 * 1000); // 1 hour

      return {
        success: true,
        message: 'Message sent successfully and will be deleted after 1 hour',
      };
    } catch (error: any) {
      const errorMessage = this.handleMessageError(error, chatId);
      TelegramUtils.logOperation(
        'Auto-delete message send',
        chatId,
        false,
        error,
      );
      throw new HttpException(errorMessage.message, errorMessage.statusCode);
    }
  }

  async sendBulkFormattedMessage(
    chatIds: string[],
    message: string,
    button?: MessageButton,
  ): Promise<BulkMessageResponse> {
    const startTime = Date.now();
    const results: MessageResult[] = [];
    const failedChats: Array<{ chatId: string; reason: string }> = [];

    // Validate inputs
    const validation = TelegramUtils.validateBulkLimits(
      chatIds,
      100,
      'chat IDs',
    );
    if (!validation.isValid) {
      throw new HttpException(validation.error!, HttpStatus.BAD_REQUEST);
    }

    // Rate limiting configuration
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES = 350;

    this.logger.log(`Starting bulk message send to ${chatIds.length} chats`);

    try {
      const batches = TelegramUtils.splitIntoBatches(chatIds, BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        this.logger.log(
          `Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} chats`,
        );

        const batchPromises = batch.map(async (chatId) => {
          try {
            await this.sendFormattedMessage(chatId, message, button);
            return {
              chatId,
              success: true,
              message: 'Message sent successfully',
            };
          } catch (error: any) {
            const errorReason = TelegramUtils.extractErrorReason(error);
            this.logger.error(
              `Failed to send message to ${chatId}: ${errorReason}`,
            );

            failedChats.push({ chatId, reason: errorReason });

            return {
              chatId,
              success: false,
              message: 'Failed to send message',
              error: errorReason,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (batchIndex < batches.length - 1) {
          await TelegramUtils.delay(DELAY_BETWEEN_BATCHES);
        }
      }

      const duration = Date.now() - startTime;
      const totalSent = results.filter((r) => r.success).length;
      const totalFailed = results.filter((r) => !r.success).length;

      this.logger.log(
        `Bulk message completed: ${totalSent} sent, ${totalFailed} failed in ${duration}ms`,
      );

      return {
        totalSent,
        totalFailed,
        results,
        duration,
        failedChats,
      };
    } catch (error: any) {
      this.logger.error('Bulk message send failed:', error);
      throw new HttpException(
        'Bulk message send failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendImage(
    chatId: string | number,
    imageBuffer: Buffer,
    caption?: string,
  ): Promise<any> {
    try {
      const imageStream = new Readable();
      imageStream.push(imageBuffer);
      imageStream.push(null);

      const sentMessage = await this.bot.sendPhoto(chatId, imageStream, {
        caption: caption || undefined,
        parse_mode: 'Markdown',
      });

      TelegramUtils.logOperation('Image send', chatId, true);

      return {
        success: true,
        message: 'Image sent successfully.',
        data: sentMessage,
      };
    } catch (error: any) {
      const errorMessage = this.handleMessageError(error, chatId);
      TelegramUtils.logOperation('Image send', chatId, false, error);
      throw new HttpException(errorMessage.message, errorMessage.statusCode);
    }
  }

  async sendBulkImage(
    chatIds: string[],
    imageBuffer: Buffer,
    caption?: string,
  ): Promise<BulkImageResponse> {
    const startTime = Date.now();
    const results: ImageResult[] = [];
    const failedChats: Array<{ chatId: string; reason: string }> = [];

    // Validate inputs
    const validation = TelegramUtils.validateBulkLimits(
      chatIds,
      50,
      'chat IDs',
    );
    if (!validation.isValid) {
      throw new HttpException(validation.error!, HttpStatus.BAD_REQUEST);
    }

    // Rate limiting for images (smaller batches, longer delays)
    const BATCH_SIZE = 8;
    const DELAY_BETWEEN_BATCHES = 400;

    this.logger.log(`Starting bulk image send to ${chatIds.length} chats`);

    try {
      const batches = TelegramUtils.splitIntoBatches(chatIds, BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        this.logger.log(
          `Processing image batch ${batchIndex + 1}/${batches.length} with ${batch.length} chats`,
        );

        const batchPromises = batch.map(async (chatId) => {
          try {
            const result = await this.sendImage(chatId, imageBuffer, caption);
            return {
              chatId,
              success: true,
              message: 'Image sent successfully',
              data: result.data,
            };
          } catch (error: any) {
            const errorReason = TelegramUtils.extractErrorReason(error);
            this.logger.error(
              `Failed to send image to ${chatId}: ${errorReason}`,
            );

            failedChats.push({ chatId, reason: errorReason });

            return {
              chatId,
              success: false,
              message: 'Failed to send image',
              error: errorReason,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (batchIndex < batches.length - 1) {
          await TelegramUtils.delay(DELAY_BETWEEN_BATCHES);
        }
      }

      const duration = Date.now() - startTime;
      const totalSent = results.filter((r) => r.success).length;
      const totalFailed = results.filter((r) => !r.success).length;

      this.logger.log(
        `Bulk image send completed: ${totalSent} sent, ${totalFailed} failed in ${duration}ms`,
      );

      return {
        totalSent,
        totalFailed,
        results,
        duration,
        failedChats,
      };
    } catch (error: any) {
      this.logger.error('Bulk image send failed:', error);
      throw new HttpException(
        'Bulk image send failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async broadcastMessageToAllUsers(
    message: string,
  ): Promise<{ successful: number; failed: number }> {
    const chatIds = await this.getAllUserChatIds();
    if (!chatIds || chatIds.length === 0) {
      this.logger.warn('No user chat IDs found to broadcast message.');
      return { successful: 0, failed: 0 };
    }

    const webAppUrl = process.env.WEBAPP_URL;
    if (!webAppUrl) {
      this.logger.error(
        'WEBAPP_URL is not defined in environment variables. Cannot add Launch button.',
      );
    }

    const launchButton = webAppUrl
      ? { text: '👋 Launch', url: webAppUrl, isWebApp: true }
      : undefined;

    this.logger.log(`Starting broadcast to ${chatIds.length} users.`);
    const results = { successful: 0, failed: 0 };

    for (const chatId of chatIds) {
      try {
        await this.sendFormattedMessage(chatId, message, launchButton);
        this.logger.log(
          `Broadcast message with Launch button sent to user ID ${chatId}`,
        );
        results.successful++;
      } catch (error) {
        this.logger.error(
          `Failed to send broadcast message to user ID ${chatId} during broadcast loop.`,
        );
        results.failed++;
      }
    }

    this.logger.log(
      `Broadcast finished. Successful: ${results.successful}, Failed: ${results.failed}`,
    );
    return results;
  }

  private async getAllUserChatIds(): Promise<string[]> {
    try {
      const generalUsers = await this.prisma.generalUser.findMany({
        select: { telegramId: true },
      });

      const chatIds = generalUsers
        .map((user) => user.telegramId.toString())
        .filter((id) => id.trim() !== '');

      if (chatIds.length === 0) {
        this.logger.warn('No user telegram IDs found in the database.');
      }
      return chatIds;
    } catch (error) {
      this.logger.error(
        'Failed to fetch user telegram IDs from database:',
        error,
      );
      return [];
    }
  }

  private handleMessageError(
    error: any,
    chatId: string | number,
  ): { message: string; statusCode: number } {
    let errorMessage = 'Failed to send message';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (error.response && error.response.body) {
      const body = error.response.body;
      errorMessage = `Telegram API Error: ${body.error_code} - ${body.description}`;
      statusCode =
        body.error_code === 403 ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;

      if (body.error_code === 403) {
        this.logger.warn(
          `Bot was blocked by user ${chatId} or chat was deactivated.`,
        );
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { message: errorMessage, statusCode };
  }
}
