import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import TelegramBot = require('node-telegram-bot-api');
import { PrismaService } from '@app/core/database/prisma.service';
import { LeaderboardEntry } from '../interfaces/telegram.interfaces';
import { TelegramUtils } from '../utils/telegram.utils';

@Injectable()
export class TelegramLeaderboardService {
  private readonly logger = new Logger(TelegramLeaderboardService.name);
  private bot: TelegramBot;

  constructor(private readonly prisma: PrismaService) {}

  setBot(bot: TelegramBot) {
    this.bot = bot;
    console.log('Bot injected into Leaderboard:', !!bot);
  }

  async sendLeaderboard(chatId: string, leaderboard: string) {
    try {
      const options: TelegramBot.SendMessageOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      };

      await this.bot.sendMessage(chatId, `🏆 ${leaderboard}`, options);
      TelegramUtils.logOperation('Leaderboard send', chatId, true);

      return {
        success: true,
        message: 'Leaderboard sent successfully',
      };
    } catch (error: any) {
      const errorMessage = this.handleLeaderboardError(error, chatId);
      TelegramUtils.logOperation('Leaderboard send', chatId, false, error);
      throw new HttpException(errorMessage.message, errorMessage.statusCode);
    }
  }

  async generateLeaderboardMessage(
    chatId: string,
    period: 'Daily' | 'Weekly' | 'Monthly' | 'All-Time',
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
  ): Promise<string> {
    try {
      const leaderboard = await this.getLeaderboardData(
        chatId,
        startDate,
        endDate,
        limit,
      );

      if (leaderboard.length === 0) {
        return `🏆 ${period} Leaderboard 🏆\n\nNo participants yet for this ${period.toLowerCase()} period.\nGet started with our quizzes to claim your spot!`;
      }

      let message = `🏆 ${period} Leaderboard 🏆\n\nTop ${Math.min(leaderboard.length, limit)} Quiz Masters:\n\n`;

      leaderboard.forEach((entry, index) => {
        const rank = index + 1;
        const positionEmoji = TelegramUtils.getPositionEmoji(rank);
        const displayName = TelegramUtils.formatUserDisplayName(
          entry.firstName,
        );
        const points = entry.points || 0;

        message += `${positionEmoji} ${rank}. ${TelegramUtils.escapeMarkdown(displayName)} - ${points} points\n`;
      });

      message += `\nKeep answering quizzes to climb the ranks! 🚀`;

      return message;
    } catch (error) {
      this.logger.error(
        `Failed to generate ${period.toLowerCase()} leaderboard for chat ${chatId}:`,
        error,
      );
      return `🏆 ${period} Leaderboard 🏆\n\nError generating leaderboard. Please try again later.`;
    }
  }

  private async getLeaderboardData(
    chatId: string | number,
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
  ): Promise<LeaderboardEntry[]> {
    const whereClause: any = {
      chatId: chatId.toString(),
      deletedAt: null,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const leaderboard = await this.prisma.quizWinners.groupBy({
      by: ['telegramId', 'firstName'],
      where: whereClause,
      _sum: {
        points: true,
      },
      orderBy: {
        _sum: {
          points: 'desc',
        },
      },
      take: limit,
    });

    return leaderboard.map((entry, index) => ({
      telegramId: entry.telegramId,
      firstName: entry.firstName,
      points: entry._sum.points || 0,
      rank: index + 1,
    }));
  }

  async sendDailyLeaderboard(chatId: string) {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const message = await this.generateLeaderboardMessage(
      chatId,
      'Daily',
      startOfDay,
      endOfDay,
    );

    try {
      await this.bot.sendMessage(chatId, message);
      this.logger.log(`Daily leaderboard sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send daily leaderboard to chat ${chatId}:`,
        error,
      );
    }
  }

  @Cron('0 0 10 * * 0', { timeZone: 'Africa/Lagos' }) // Sunday 10:00 AM WAT
  async sendWeeklyLeaderboardCron() {
    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    const endOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay() + 6,
      23,
      59,
      59,
      999,
    );

    const chatIds = await this.getActiveChatIds();

    for (const { chatId } of chatIds) {
      if (!chatId) continue;

      const message = await this.generateLeaderboardMessage(
        chatId,
        'Weekly',
        startOfWeek,
        endOfWeek,
      );

      try {
        await this.bot.sendMessage(chatId, message);
        this.logger.log(`Weekly leaderboard sent to chat ${chatId}`);
        // Add delay to avoid rate limiting
        await TelegramUtils.delay(100);
      } catch (error) {
        this.logger.error(
          `Failed to send weekly leaderboard to chat ${chatId}:`,
          error,
        );
      }
    }
  }

  async sendWeeklyLeaderboard(chatId: string) {
    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    const endOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay() + 6,
      23,
      59,
      59,
      999,
    );

    const message = await this.generateLeaderboardMessage(
      chatId,
      'Weekly',
      startOfWeek,
      endOfWeek,
    );

    try {
      await this.bot.sendMessage(chatId, message);
      this.logger.log(`Weekly leaderboard sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send weekly leaderboard to chat ${chatId}:`,
        error,
      );
    }
  }

  async sendMonthlyLeaderboard(chatId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const message = await this.generateLeaderboardMessage(
      chatId,
      'Monthly',
      startOfMonth,
      endOfMonth,
    );

    try {
      await this.bot.sendMessage(chatId, message);
      this.logger.log(`Monthly leaderboard sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send monthly leaderboard to chat ${chatId}:`,
        error,
      );
    }
  }

  async sendAllTimeLeaderboard(chatId: string) {
    const message = await this.generateLeaderboardMessage(chatId, 'All-Time');

    try {
      await this.bot.sendMessage(chatId, message);
      this.logger.log(`All-time leaderboard sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send all-time leaderboard to chat ${chatId}:`,
        error,
      );
    }
  }

  async getLeaderboardStats(
    chatId: string | number,
    period: 'daily' | 'weekly' | 'monthly' | 'all',
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    const now = new Date();

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        break;
      case 'weekly':
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay(),
        );
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() + 6,
          23,
          59,
          59,
          999,
        );
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        break;
      case 'all':
        // No date restrictions for all-time stats
        break;
    }

    return await this.getLeaderboardData(chatId, startDate, endDate, 50);
  }

  private async getActiveChatIds(): Promise<{ chatId: string }[]> {
    const results = await this.prisma.quizWinners.findMany({
      select: { chatId: true },
      distinct: ['chatId'],
      where: { deletedAt: null },
    });

    return results.filter(
      (result): result is { chatId: string } => result.chatId !== null,
    );
  }

  private handleLeaderboardError(
    error: any,
    chatId: string | number,
  ): { message: string; statusCode: number } {
    let errorMessage = 'Failed to send leaderboard';
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
