import { Logger } from '@nestjs/common';

export class TelegramUtils {
  private static readonly logger = new Logger(TelegramUtils.name);

  /**
   * Extract meaningful error reasons from Telegram API errors
   */
  static extractErrorReason(error: any): string {
    if (error.response && error.response.body) {
      const body = error.response.body;
      const errorCode = body.error_code;
      const description = body.description;

      // Map common error codes to user-friendly messages
      switch (errorCode) {
        case 403:
          if (description?.includes('kicked')) {
            return 'Bot was removed/kicked from the group';
          }
          if (description?.includes('blocked')) {
            return 'Bot was blocked by the chat';
          }
          return 'Bot lacks permission or was blocked/removed from chat';
        case 400:
          if (description?.includes('chat not found')) {
            return 'Chat not found or invalid chat ID';
          }
          if (description?.includes('not enough rights')) {
            return 'Bot lacks permission to send messages in this chat';
          }
          return `Bad request: ${description}`;
        case 429:
          return 'Rate limited - too many requests';
        case 404:
          return 'Chat not found';
        default:
          return `Telegram API Error (${errorCode}): ${description}`;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error occurred';
  }

  /**
   * Create a delay promise
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate quiz options
   */
  static validateQuizOptions(options: string[]): {
    isValid: boolean;
    error?: string;
  } {
    if (
      !Array.isArray(options) ||
      options.some((opt) => typeof opt !== 'string')
    ) {
      return { isValid: false, error: 'Options must be an array of strings.' };
    }

    if (options.length < 2 || options.length > 10) {
      return { isValid: false, error: 'Options must contain 2-10 items.' };
    }

    return { isValid: true };
  }

  /**
   * Validate correct option index
   */
  static validateCorrectOptionIndex(
    correctOptionIndex: number,
    optionsLength: number,
  ): { isValid: boolean; error?: string } {
    if (correctOptionIndex < 0 || correctOptionIndex >= optionsLength) {
      return { isValid: false, error: 'Correct option index is out of range.' };
    }

    return { isValid: true };
  }

  /**
   * Check if a chat ID represents a group chat
   */
  static isGroupChat(chatId: string | number): boolean {
    return typeof chatId === 'number'
      ? chatId < 0
      : chatId.toString().startsWith('-');
  }

  /**
   * Sanitize chat ID to string
   */
  static sanitizeChatId(chatId: string | number): string {
    return chatId.toString();
  }

  /**
   * Split array into batches
   */
  static splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Generate unique timeout key for scheduled operations
   */
  static generateTimeoutKey(chatId: string | number, index: number): string {
    return `${chatId}-${index}`;
  }

  /**
   * Log operation with context
   */
  static logOperation(
    operation: string,
    chatId: string | number,
    success: boolean,
    error?: any,
  ): void {
    if (success) {
      this.logger.log(`${operation} successful for chat ${chatId}`);
    } else {
      this.logger.error(`${operation} failed for chat ${chatId}:`, error);
    }
  }

  /**
   * Validate bulk operation limits
   */
  static validateBulkLimits(
    items: any[],
    maxItems: number,
    itemName: string,
  ): { isValid: boolean; error?: string } {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        isValid: false,
        error: `${itemName} array is required and must not be empty.`,
      };
    }

    if (items.length > maxItems) {
      return {
        isValid: false,
        error: `Maximum ${maxItems} ${itemName} can be provided.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate date is in the future
   */
  static validateFutureDate(date: Date): { isValid: boolean; error?: string } {
    if (!date || isNaN(date.getTime())) {
      return { isValid: false, error: 'Valid date is required.' };
    }

    const now = new Date();
    if (date < now) {
      return { isValid: false, error: 'Date must be in the future.' };
    }

    return { isValid: true };
  }

  /**
   * Calculate time differences for scheduling
   */
  static calculateScheduleTimes(
    startTime: Date,
    intervalMinutes: number,
    count: number,
  ): Date[] {
    const intervalMs = intervalMinutes * 60 * 1000;
    const times: Date[] = [];

    for (let i = 0; i < count; i++) {
      times.push(new Date(startTime.getTime() + i * intervalMs));
    }

    return times;
  }

  /**
   * Format user display name
   */
  static formatUserDisplayName(
    firstName?: string | null,
    lastName?: string | null,
    username?: string | null,
  ): string {
    if (firstName) {
      return lastName ? `${firstName} ${lastName}` : firstName;
    }
    if (username) {
      return `@${username}`;
    }
    return 'Unknown User';
  }

  /**
   * Generate leaderboard position emoji
   */
  static getPositionEmoji(position: number): string {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🔸';
    }
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Escape Markdown special characters
   */
  static escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }

  /**
   * Generate random ID for tracking purposes
   */
  static generateRandomId(length: number = 8): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
