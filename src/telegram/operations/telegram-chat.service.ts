import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import TelegramBot = require('node-telegram-bot-api');
import { ChatInviteInfo, ChatInfo } from '../interfaces/telegram.interfaces';
import { TelegramUtils } from '../utils/telegram.utils';

@Injectable()
export class TelegramChatService {
  private readonly logger = new Logger(TelegramChatService.name);
  private bot: TelegramBot;

  constructor() {}

  setBot(bot: TelegramBot) {
    this.bot = bot;
    console.log('Bot injected into Chat:', !!bot);
  }

  async getChatInviteLink(chatId: string | number): Promise<ChatInviteInfo> {
    try {
      const chatInfo = await this.bot.getChat(chatId);

      if (chatInfo.invite_link) {
        return {
          inviteLink: chatInfo.invite_link,
          chatTitle: chatInfo.title,
          chatType: chatInfo.type,
          chatId: chatId,
        };
      }

      const inviteLink = await this.bot.exportChatInviteLink(chatId);

      return {
        inviteLink: inviteLink,
        chatTitle: chatInfo.title,
        chatType: chatInfo.type,
        chatId: chatId,
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(error, chatId, 'get invite link');
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async createChatInviteLink(
    chatId: string | number,
    name?: string,
    expireDate?: number,
    memberLimit?: number,
  ): Promise<ChatInviteInfo> {
    try {
      const options: any = {};

      if (name) options.name = name;
      if (expireDate) options.expire_date = expireDate;
      if (memberLimit) {
        if (memberLimit < 1 || memberLimit > 99999) {
          throw new HttpException(
            'Member limit must be between 1 and 99999',
            HttpStatus.BAD_REQUEST,
          );
        }
        options.member_limit = memberLimit;
      }

      const inviteLink = await this.bot.createChatInviteLink(chatId, options);
      const chatInfo = await this.bot.getChat(chatId);

      return {
        inviteLink: inviteLink.invite_link,
        name: inviteLink.name,
        creator: inviteLink.creator,
        isPrimary: inviteLink.is_primary,
        isRevoked: inviteLink.is_revoked,
        expireDate: inviteLink.expire_date,
        memberLimit: inviteLink.member_limit,
        pendingJoinRequestCount: inviteLink.pending_join_request_count,
        chatTitle: chatInfo.title,
        chatType: chatInfo.type,
        chatId: chatId,
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(
        error,
        chatId,
        'create invite link',
      );
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async getChatInfo(chatId: string | number): Promise<ChatInfo> {
    try {
      const chatInfo = await this.bot.getChat(chatId);

      let memberCount: number | undefined;
      try {
        memberCount = await this.bot.getChatMembersCount(chatId);
      } catch (error) {
        this.logger.warn(`Could not get member count for chat ${chatId}`);
      }

      let botStatus: any = null;
      let botPermissions: any = null;
      try {
        const botInfo = await this.bot.getMe();
        const botMember = await this.bot.getChatMember(chatId, botInfo.id);
        botStatus = botMember.status;
        if (botMember.status === 'administrator') {
          botPermissions = botMember;
        }
      } catch (error) {
        this.logger.warn(`Could not get bot status for chat ${chatId}`);
      }

      const canSendMessages = botStatus
        ? botStatus === 'administrator' || botStatus === 'member'
        : null;

      const result: ChatInfo = {
        id: chatInfo.id,
        type: chatInfo.type,
        title: chatInfo.title,
        username: chatInfo.username,
        description: chatInfo.description,
        inviteLink: chatInfo.invite_link,
        memberCount: memberCount,
        botStatus: botStatus,
        canSendMessages: canSendMessages,
        botPermissions: botPermissions,
      };

      // Add type-specific properties
      if (chatInfo.type === 'channel' || chatInfo.type === 'supergroup') {
        result.linkedChatId = (chatInfo as any).linked_chat_id;
      }

      if (chatInfo.type === 'supergroup') {
        const supergroupInfo = chatInfo as any;
        result.slowModeDelay = supergroupInfo.slow_mode_delay;
        result.stickerSetName = supergroupInfo.sticker_set_name;
        result.canSetStickerSet = supergroupInfo.can_set_sticker_set;
        result.location = supergroupInfo.location;
      }

      TelegramUtils.logOperation('Get chat info', chatId, true);
      return result;
    } catch (error: any) {
      const errorInfo = this.handleChatError(error, chatId, 'get chat info');
      TelegramUtils.logOperation('Get chat info', chatId, false, error);
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async revokeChatInviteLink(
    chatId: string | number,
    inviteLink: string,
  ): Promise<any> {
    try {
      const revokedLink = await this.bot.revokeChatInviteLink(
        chatId,
        inviteLink,
      );
      TelegramUtils.logOperation('Revoke invite link', chatId, true);

      return {
        success: true,
        message: 'Invite link revoked successfully',
        data: revokedLink,
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(
        error,
        chatId,
        'revoke invite link',
      );
      TelegramUtils.logOperation('Revoke invite link', chatId, false, error);
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async editChatInviteLink(
    chatId: string | number,
    inviteLink: string,
    name?: string,
    expireDate?: number,
    memberLimit?: number,
  ): Promise<ChatInviteInfo> {
    try {
      const options: any = { invite_link: inviteLink };

      if (name !== undefined) options.name = name;
      if (expireDate !== undefined) options.expire_date = expireDate;
      if (memberLimit !== undefined) {
        if (memberLimit < 1 || memberLimit > 99999) {
          throw new HttpException(
            'Member limit must be between 1 and 99999',
            HttpStatus.BAD_REQUEST,
          );
        }
        options.member_limit = memberLimit;
      }

      const editedLink = await this.bot.editChatInviteLink(
        chatId,
        inviteLink,
        options,
      );
      const chatInfo = await this.bot.getChat(chatId);

      TelegramUtils.logOperation('Edit invite link', chatId, true);

      return {
        inviteLink: editedLink.invite_link,
        name: editedLink.name,
        creator: editedLink.creator,
        isPrimary: editedLink.is_primary,
        isRevoked: editedLink.is_revoked,
        expireDate: editedLink.expire_date,
        memberLimit: editedLink.member_limit,
        pendingJoinRequestCount: editedLink.pending_join_request_count,
        chatTitle: chatInfo.title,
        chatType: chatInfo.type,
        chatId: chatId,
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(error, chatId, 'edit invite link');
      TelegramUtils.logOperation('Edit invite link', chatId, false, error);
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async getChatMember(chatId: string | number, userId: number): Promise<any> {
    try {
      const member = await this.bot.getChatMember(chatId, userId);
      TelegramUtils.logOperation('Get chat member', chatId, true);

      return {
        success: true,
        message: 'Chat member retrieved successfully',
        data: member,
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(error, chatId, 'get chat member');
      TelegramUtils.logOperation('Get chat member', chatId, false, error);
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async getChatAdministrators(chatId: string | number): Promise<any> {
    try {
      const admins = await this.bot.getChatAdministrators(chatId);
      TelegramUtils.logOperation('Get chat administrators', chatId, true);

      return {
        success: true,
        message: 'Chat administrators retrieved successfully',
        data: admins,
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(
        error,
        chatId,
        'get chat administrators',
      );
      TelegramUtils.logOperation(
        'Get chat administrators',
        chatId,
        false,
        error,
      );
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async setChatTitle(chatId: string | number, title: string): Promise<any> {
    try {
      if (!title || title.trim().length === 0) {
        throw new HttpException(
          'Title cannot be empty',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (title.length > 255) {
        throw new HttpException(
          'Title must be 255 characters or less',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.bot.setChatTitle(chatId, title);
      TelegramUtils.logOperation('Set chat title', chatId, true);

      return {
        success: true,
        message: 'Chat title updated successfully',
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(error, chatId, 'set chat title');
      TelegramUtils.logOperation('Set chat title', chatId, false, error);
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  async setChatDescription(
    chatId: string | number,
    description: string,
  ): Promise<any> {
    try {
      if (description && description.length > 255) {
        throw new HttpException(
          'Description must be 255 characters or less',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.bot.setChatDescription(chatId, description);
      TelegramUtils.logOperation('Set chat description', chatId, true);

      return {
        success: true,
        message: 'Chat description updated successfully',
      };
    } catch (error: any) {
      const errorInfo = this.handleChatError(
        error,
        chatId,
        'set chat description',
      );
      TelegramUtils.logOperation('Set chat description', chatId, false, error);
      throw new HttpException(errorInfo.message, errorInfo.statusCode);
    }
  }

  private handleChatError(
    error: any,
    chatId: string | number,
    operation: string,
  ): { message: string; statusCode: number } {
    this.logger.error(`Failed to ${operation} for chat ${chatId}:`, error);

    let errorMessage = `Failed to ${operation}`;
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (error.response && error.response.body) {
      const body = error.response.body;
      const errorCode = body.error_code;
      const description = body.description;

      switch (errorCode) {
        case 400:
          if (description?.includes('chat not found')) {
            errorMessage = 'Chat not found or invalid chat ID';
            statusCode = HttpStatus.NOT_FOUND;
          } else if (description?.includes('not enough rights')) {
            errorMessage = `Bot lacks permission to ${operation} in this chat`;
            statusCode = HttpStatus.FORBIDDEN;
          } else if (description?.includes('expire_date')) {
            errorMessage = 'Invalid expiration date';
            statusCode = HttpStatus.BAD_REQUEST;
          } else if (description?.includes('member_limit')) {
            errorMessage = 'Invalid member limit (must be 1-99999)';
            statusCode = HttpStatus.BAD_REQUEST;
          } else {
            errorMessage = `Bad request: ${description}`;
            statusCode = HttpStatus.BAD_REQUEST;
          }
          break;
        case 403:
          errorMessage = 'Bot lacks permission or was removed from chat';
          statusCode = HttpStatus.FORBIDDEN;
          break;
        case 404:
          errorMessage = 'Chat not found';
          statusCode = HttpStatus.NOT_FOUND;
          break;
        default:
          errorMessage = `Telegram API Error (${errorCode}): ${description}`;
          statusCode = HttpStatus.BAD_REQUEST;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { message: errorMessage, statusCode };
  }
}
