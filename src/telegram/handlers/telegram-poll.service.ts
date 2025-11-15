import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import TelegramBot = require('node-telegram-bot-api');
import { PrismaService } from '@app/core/database/prisma.service';
import {
  ActivePoll,
  CreatePollDto,
  BulkMessageResponse,
  MessageResult,
} from '../interfaces/telegram.interfaces';
import { TelegramUtils } from '../utils/telegram.utils';

@Injectable()
export class TelegramPollService {
  private readonly logger = new Logger(TelegramPollService.name);
  private activePolls: ActivePoll[] = [];
  private bot: TelegramBot;

  constructor(private readonly prisma: PrismaService) {}

  setBot(bot: TelegramBot) {
    this.bot = bot;
    console.log('Bot injected into Poll:', !!bot);
  }

  async sendPoll(createPollDto: CreatePollDto): Promise<any> {
    const { chatId, question, options } = createPollDto;

    // Validate poll options
    const validation = TelegramUtils.validateQuizOptions(options);
    if (!validation.isValid) {
      this.logger.error(`Invalid options: ${validation.error}`);
      throw new HttpException(validation.error!, HttpStatus.BAD_REQUEST);
    }

    try {
      const sentMessage = await this.bot.sendPoll(chatId, question, options, {
        type: 'regular',
        is_anonymous: false,
      });

      this.activePolls.push({
        pollId: sentMessage.poll.id,
        chatId: chatId,
        answeredUsers: new Set<number>(),
      });

      // Auto cleanup after 1 hour
      setTimeout(() => {
        this.activePolls = this.activePolls.filter(
          (p) => p.pollId !== sentMessage.poll.id,
        );
      }, 3600 * 1000);

      TelegramUtils.logOperation('Poll send', chatId, true);

      return {
        success: true,
        message: 'Poll sent successfully.',
        data: sentMessage,
      };
    } catch (error) {
      TelegramUtils.logOperation('Poll send', chatId, false, error);
      throw new HttpException(
        'Failed to send poll.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendBulkPoll(
    chatIds: string[],
    question: string,
    options: string[],
  ): Promise<BulkMessageResponse> {
    const startTime = Date.now();
    const results: MessageResult[] = [];
    const failedChats: Array<{ chatId: string; reason: string }> = [];

    // Validate inputs
    const chatIdsValidation = TelegramUtils.validateBulkLimits(
      chatIds,
      50,
      'chat IDs',
    );
    if (!chatIdsValidation.isValid) {
      throw new HttpException(chatIdsValidation.error!, HttpStatus.BAD_REQUEST);
    }

    const optionsValidation = TelegramUtils.validateQuizOptions(options);
    if (!optionsValidation.isValid) {
      throw new HttpException(optionsValidation.error!, HttpStatus.BAD_REQUEST);
    }

    // Rate limiting configuration
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES = 350;

    this.logger.log(`Starting bulk poll send to ${chatIds.length} chats`);

    try {
      const batches = TelegramUtils.splitIntoBatches(chatIds, BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        this.logger.log(
          `Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} chats`,
        );

        const batchPromises = batch.map(async (chatId) => {
          try {
            const sentMessage = await this.bot.sendPoll(
              chatId,
              question,
              options,
              {
                type: 'regular',
                is_anonymous: false,
              },
            );

            this.activePolls.push({
              pollId: sentMessage.poll.id,
              chatId: chatId,
              answeredUsers: new Set<number>(),
            });

            // Auto cleanup
            setTimeout(() => {
              this.activePolls = this.activePolls.filter(
                (p) => p.pollId !== sentMessage.poll.id,
              );
            }, 3600 * 1000);

            return {
              chatId,
              success: true,
              message: 'Poll sent successfully',
            };
          } catch (error: any) {
            const errorReason = TelegramUtils.extractErrorReason(error);
            this.logger.error(
              `Failed to send poll to ${chatId}: ${errorReason}`,
            );

            failedChats.push({ chatId, reason: errorReason });

            return {
              chatId,
              success: false,
              message: 'Failed to send poll',
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
        `Bulk poll completed: ${totalSent} sent, ${totalFailed} failed in ${duration}ms`,
      );

      return {
        totalSent,
        totalFailed,
        results,
        duration,
        failedChats,
      };
    } catch (error: any) {
      this.logger.error('Bulk poll send failed:', error);
      throw new HttpException(
        'Bulk poll send failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handlePollAnswer(pollAnswer: TelegramBot.PollAnswer): Promise<void> {
    const user = pollAnswer.user;
    const poll = this.activePolls.find((p) => p.pollId === pollAnswer.poll_id);

    if (!poll) {
      return; // Not an active poll
    }

    if (poll.answeredUsers.has(user.id)) {
      this.logger.log(
        `User ${user.first_name} (@${user.username}) with ID ${user.id} already voted in poll ${poll.pollId}.`,
      );
      return;
    }

    this.logger.log(
      `User ${user.first_name} (@${user.username}) with ID ${user.id} voted in poll ${poll.pollId} in chat ${poll.chatId}. Option: ${pollAnswer.option_ids[0]}`,
    );

    poll.answeredUsers.add(user.id);

    try {
      await this.prisma.pollVotes.create({
        data: {
          telegramId: user.id.toString(),
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          chatId: poll.chatId.toString(),
          pollId: poll.pollId,
          optionId: pollAnswer.option_ids[0],
        },
      });

      this.logger.log(
        `Successfully logged poll vote for user ${user.id} to the database.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log poll vote for user ${user.id} to the database:`,
        error,
      );
    }
  }

  getActivePolls(): ActivePoll[] {
    return [...this.activePolls];
  }

  clearActivePoll(pollId: string) {
    this.activePolls = this.activePolls.filter((p) => p.pollId !== pollId);
  }

  async getPollVotes(chatId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = {
      chatId: chatId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    return await this.prisma.pollVotes.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPollStatistics(pollId: string) {
    const votes = await this.prisma.pollVotes.findMany({
      where: { pollId, deletedAt: null },
      select: { optionId: true },
    });

    const optionCounts: { [key: number]: number } = {};
    votes.forEach((vote) => {
      optionCounts[vote.optionId] = (optionCounts[vote.optionId] || 0) + 1;
    });

    return {
      totalVotes: votes.length,
      optionCounts,
      mostPopularOption: Object.keys(optionCounts).reduce((a, b) =>
        optionCounts[parseInt(a)] > optionCounts[parseInt(b)] ? a : b,
      ),
    };
  }
}
