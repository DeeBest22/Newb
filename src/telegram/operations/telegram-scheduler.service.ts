import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as cron from 'node-cron';
import TelegramBot = require('node-telegram-bot-api');
import { PrismaService } from '@app/core/database/prisma.service';
import {
  ScheduledQuiz,
  ScheduleQuizRequest,
  ActiveQuiz,
} from '../interfaces/telegram.interfaces';
import { TelegramUtils } from '../utils/telegram.utils';

@Injectable()
export class TelegramSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramSchedulerService.name);
  private bot: TelegramBot;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  // ADD: Reference to quiz service for answer tracking
  private quizService: any;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Restore scheduled quizzes from database on app startup
    await this.restoreScheduledQuizzes();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  setBot(bot: TelegramBot) {
    this.bot = bot;
    this.logger.log(`Bot injected into Scheduler service: ${!!bot}`);

    // Test bot connectivity
    if (bot) {
      bot
        .getMe()
        .then((botInfo) => {
          this.logger.log(`Bot connected successfully: @${botInfo.username}`);
          console.log('Bot injected into Scheduler:', !!bot);
        })
        .catch((error) => {
          this.logger.error('Bot connection test failed:', error);
        });
    }
  }

  // ADD: Method to inject quiz service
  setQuizService(quizService: any) {
    this.quizService = quizService;
    this.logger.log(`Quiz service injected into Scheduler: ${!!quizService}`);
  }

  async scheduleQuizzes(request: ScheduleQuizRequest): Promise<any> {
    const { chatIds, quizzes, startTime, intervalMinutes } = request;

    // Validate inputs
    const chatIdsValidation = TelegramUtils.validateBulkLimits(
      chatIds,
      50,
      'chat IDs',
    );
    if (!chatIdsValidation.isValid) {
      throw new HttpException(chatIdsValidation.error!, HttpStatus.BAD_REQUEST);
    }

    const quizzesValidation = TelegramUtils.validateBulkLimits(
      quizzes,
      30,
      'quizzes',
    );
    if (!quizzesValidation.isValid) {
      throw new HttpException(quizzesValidation.error!, HttpStatus.BAD_REQUEST);
    }

    const dateValidation = TelegramUtils.validateFutureDate(startTime);
    if (!dateValidation.isValid) {
      throw new HttpException(dateValidation.error!, HttpStatus.BAD_REQUEST);
    }

    if (intervalMinutes < 1 || intervalMinutes > 1440) {
      throw new HttpException(
        'Interval minutes must be between 1 and 1440 (24 hours).',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate each chat ID and quiz
    for (const chatId of chatIds) {
      if (
        !chatId ||
        (typeof chatId !== 'string' && typeof chatId !== 'number')
      ) {
        throw new HttpException(
          'All chat IDs must be valid strings or numbers.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    for (const quiz of quizzes) {
      const optionsValidation = TelegramUtils.validateQuizOptions(quiz.options);
      if (!optionsValidation.isValid) {
        throw new HttpException(
          optionsValidation.error!,
          HttpStatus.BAD_REQUEST,
        );
      }

      const indexValidation = TelegramUtils.validateCorrectOptionIndex(
        quiz.correctOptionIndex,
        quiz.options.length,
      );
      if (!indexValidation.isValid) {
        throw new HttpException(indexValidation.error!, HttpStatus.BAD_REQUEST);
      }
    }

    // Clear existing scheduled quizzes for these chats
    await this.clearScheduledQuizzes(chatIds.map((id) => id.toString()));

    // Calculate schedule times
    const scheduleTimes = TelegramUtils.calculateScheduleTimes(
      startTime,
      intervalMinutes,
      quizzes.length,
    );

    // Create scheduled quiz records in database
    const scheduledQuizzes: ScheduledQuiz[] = [];

    for (const chatId of chatIds) {
      for (let i = 0; i < quizzes.length; i++) {
        const quiz = quizzes[i];
        const scheduledTime = scheduleTimes[i];

        const scheduledQuiz = await this.prisma.scheduledQuiz.create({
          data: {
            chatId: chatId.toString(),
            question: quiz.question,
            options: JSON.stringify(quiz.options),
            correctOptionIndex: quiz.correctOptionIndex,
            scheduledTime: scheduledTime,
            status: 'pending',
          },
        });

        scheduledQuizzes.push({
          id: scheduledQuiz.id,
          chatId: chatId,
          question: quiz.question,
          options: quiz.options,
          correctOptionIndex: quiz.correctOptionIndex,
          scheduledTime: scheduledTime,
          status: 'pending',
        });
      }
    }

    // Schedule the quizzes using cron
    await this.scheduleQuizzesWithCron(scheduledQuizzes);

    return {
      success: true,
      message: `Successfully scheduled ${quizzes.length} quizzes for ${chatIds.length} chat(s) starting at ${startTime.toISOString()} with ${intervalMinutes}-minute intervals.`,
      data: {
        chatIds: chatIds,
        intervalMinutes: intervalMinutes,
        totalQuizzes: quizzes.length * chatIds.length,
        schedule: chatIds.map((chatId) => ({
          chatId,
          quizzes: quizzes.map((quiz, index) => ({
            quizNumber: index + 1,
            scheduledTime: scheduleTimes[index],
            question: quiz.question,
          })),
        })),
      },
    };
  }

  private async scheduleQuizzesWithCron(scheduledQuizzes: ScheduledQuiz[]) {
    this.logger.log(`Scheduling ${scheduledQuizzes.length} quizzes with cron`);

    for (const quiz of scheduledQuizzes) {
      if (!quiz.id) {
        this.logger.warn(`Skipping quiz without ID: ${quiz.question}`);
        continue;
      }

      const cronExpression = this.dateToCronExpression(quiz.scheduledTime);
      const taskKey = `quiz-${quiz.id}`;

      try {
        this.logger.log(
          `Creating cron task ${taskKey} with expression: ${cronExpression}`,
        );

        // Create a wrapper function to ensure proper context
        const taskFunction = async () => {
          this.logger.log(
            `🚀 CRON TRIGGERED: Executing quiz ${quiz.id} for chat ${quiz.chatId}`,
          );

          if (!this.bot) {
            this.logger.error(
              `❌ Bot instance not available when executing quiz ${quiz.id}`,
            );
            return;
          }

          await this.executeScheduledQuiz(quiz);
        };

        const task = cron.schedule(cronExpression, taskFunction, {
          timezone: 'Africa/Lagos',
        });

        // Verify task was created and started
        this.logger.log(`Task created. Running status: ${task.getStatus}`);

        this.scheduledTasks.set(taskKey, task);

        this.logger.log(
          `✅ Successfully scheduled quiz ${quiz.id} for ${quiz.scheduledTime.toISOString()}`,
        );

        // Log next execution time for debugging
        const now = new Date();
        const timeUntilExecution = quiz.scheduledTime.getTime() - now.getTime();
        this.logger.log(
          `⏱️  Quiz ${quiz.id} will execute in ${Math.round(timeUntilExecution / 1000)} seconds`,
        );
      } catch (error) {
        this.logger.error(`❌ Failed to schedule quiz ${quiz.id}:`, error);
      }
    }

    this.logger.log(
      `📊 Total active scheduled tasks: ${this.scheduledTasks.size}`,
    );
  }

  private async executeScheduledQuiz(quiz: ScheduledQuiz) {
    const taskKey = `quiz-${quiz.id}`;

    try {
      this.logger.log(
        `Executing scheduled quiz ${quiz.id} for chat ${quiz.chatId}`,
      );

      if (!this.bot) {
        throw new Error('Bot instance not available');
      }

      // Send the quiz
      const sentMessage = await this.bot.sendPoll(
        quiz.chatId,
        quiz.question,
        quiz.options,
        {
          type: 'quiz',
          correct_option_id: quiz.correctOptionIndex,
          is_anonymous: false,
        },
      );

      // CRITICAL FIX: Register the quiz with the quiz service for answer tracking
      if (this.quizService) {
        const activeQuiz: ActiveQuiz = {
          pollId: sentMessage.poll.id,
          correctOptionIndex: quiz.correctOptionIndex,
          chatId: quiz.chatId,
          answeredUsers: new Set<number>(),
          messageId: sentMessage.message_id,
        };

        // Add to quiz service's active quizzes
        this.quizService.addActiveQuiz(activeQuiz);

        this.logger.log(
          `✅ Quiz ${quiz.id} registered with quiz service for answer tracking`,
        );
      } else {
        this.logger.error(
          `❌ Quiz service not available - answers will not be tracked for quiz ${quiz.id}`,
        );
      }

      this.logger.log(
        `Quiz ${quiz.id} sent successfully to chat ${quiz.chatId}. Message ID: ${sentMessage.message_id}`,
      );

      // Schedule reminder after 5 minutes
      setTimeout(async () => {
        try {
          const reminderMessage = await this.bot.sendMessage(
            quiz.chatId,
            '⏰ Only 5 minutes left to answer the quiz and claim your points! Jump in now! 🎯',
          );

          this.logger.log(`Reminder sent for quiz ${quiz.id}`);

          // Schedule reminder deletion after 5 minutes
          setTimeout(async () => {
            try {
              await this.bot.deleteMessage(
                quiz.chatId,
                reminderMessage.message_id,
              );
              this.logger.log(`Reminder message deleted for quiz ${quiz.id}`);
            } catch (error) {
              this.logger.error(
                `Failed to delete reminder message for quiz ${quiz.id}:`,
                error,
              );
            }
          }, 300 * 1000); // 5 minutes
        } catch (error) {
          this.logger.error(
            `Failed to send reminder for quiz ${quiz.id}:`,
            error,
          );
        }
      }, 300 * 1000); // 5 minutes

      // Schedule quiz deletion after 10 minutes
      setTimeout(async () => {
        try {
          await this.bot.deleteMessage(quiz.chatId, sentMessage.message_id);
          this.logger.log(`Quiz message deleted for quiz ${quiz.id}`);

          // Clean up from quiz service active quizzes
          if (this.quizService) {
            this.quizService.clearActiveQuiz(sentMessage.poll.id);
            this.logger.log(`Quiz ${quiz.id} removed from active quizzes`);
          }

          // Check if this was the last quiz for this chat and send leaderboard
          await this.checkAndSendDailyLeaderboard(quiz.chatId.toString());
        } catch (error) {
          this.logger.error(
            `Failed to delete quiz message for quiz ${quiz.id}:`,
            error,
          );
        }
      }, 600 * 1000); // 10 minutes

      // Update status in database
      if (quiz.id) {
        await this.prisma.scheduledQuiz.update({
          where: { id: quiz.id },
          data: { status: 'sent' },
        });
      }

      this.logger.log(`Successfully executed scheduled quiz ${quiz.id}`);
    } catch (error) {
      this.logger.error(`Failed to execute scheduled quiz ${quiz.id}:`, error);

      // Update status in database
      if (quiz.id) {
        try {
          await this.prisma.scheduledQuiz.update({
            where: { id: quiz.id },
            data: { status: 'failed' },
          });
        } catch (dbError) {
          this.logger.error(`Failed to update quiz status in DB:`, dbError);
        }
      }
    } finally {
      // Remove the scheduled task
      const task = this.scheduledTasks.get(taskKey);
      if (task) {
        task.destroy();
        this.scheduledTasks.delete(taskKey);
        this.logger.log(`Cleaned up task for quiz ${quiz.id}`);
      }
    }
  }

  // ADDED: Weekly leaderboard cron job
  @Cron('0 0 10 * * 0', { timeZone: 'Africa/Lagos' }) // Sunday 10:00 AM WAT
  async sendWeeklyLeaderboardToAllChats() {
    this.logger.log('Starting weekly leaderboard broadcast to all chats');

    try {
      // Get all chats that have quiz activity
      const activeChatIds = await this.prisma.quizWinners.findMany({
        select: { chatId: true },
        distinct: ['chatId'],
        where: {
          deletedAt: null,
          chatId: { not: null },
        },
      });

      this.logger.log(
        `Found ${activeChatIds.length} active chats for weekly leaderboard`,
      );

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

      let successCount = 0;
      let failureCount = 0;

      for (const { chatId } of activeChatIds) {
        if (!chatId) continue;

        try {
          await this.sendSimpleWeeklyLeaderboard(
            chatId,
            startOfWeek,
            endOfWeek,
          );
          successCount++;

          // Add delay to avoid rate limiting
          await this.delay(100);
        } catch (error) {
          this.logger.error(
            `Failed to send weekly leaderboard to chat ${chatId}:`,
            error,
          );
          failureCount++;
        }
      }

      this.logger.log(
        `Weekly leaderboard broadcast completed. Success: ${successCount}, Failed: ${failureCount}`,
      );
    } catch (error) {
      this.logger.error('Failed to broadcast weekly leaderboard:', error);
    }
  }

  private async sendSimpleWeeklyLeaderboard(
    chatId: string,
    startOfWeek: Date,
    endOfWeek: Date,
  ) {
    try {
      const leaderboard = await this.prisma.quizWinners.groupBy({
        by: ['telegramId', 'firstName'],
        where: {
          chatId: chatId,
          createdAt: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
          deletedAt: null,
        },
        _sum: {
          points: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: 10,
      });

      let message = '🏆 Weekly Leaderboard 🏆\n\n';

      if (leaderboard.length === 0) {
        message +=
          'No participants yet for this week.\nGet started with our quizzes to claim your spot!';
      } else {
        message += `Top ${Math.min(leaderboard.length, 10)} Quiz Masters This Week:\n\n`;
        leaderboard.forEach((entry, index) => {
          const rank = index + 1;
          const name = entry.firstName || 'Unknown';
          const points = entry._sum.points || 0;
          const emoji =
            rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🔸';
          message += `${emoji} ${rank}. ${name} - ${points} points\n`;
        });
        message +=
          '\n🎯 Keep participating in quizzes to maintain your ranking! 🚀';
      }

      await this.bot.sendMessage(chatId, message);
      this.logger.log(`Weekly leaderboard sent successfully to chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate/send weekly leaderboard for chat ${chatId}:`,
        error,
      );
      throw error;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async checkAndSendDailyLeaderboard(chatId: string) {
    // Check if there are any more pending quizzes for today for this chat
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    const pendingQuizzes = await this.prisma.scheduledQuiz.count({
      where: {
        chatId: chatId,
        status: 'pending',
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // If no more quizzes for today, trigger daily leaderboard
    if (pendingQuizzes === 0) {
      try {
        await this.sendSimpleDailyLeaderboard(chatId);
        this.logger.log(
          `Daily leaderboard notification sent to chat ${chatId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send daily leaderboard notification to chat ${chatId}:`,
          error,
        );
      }
    }
  }

  private async sendSimpleDailyLeaderboard(chatId: string) {
    // Generate a simple daily leaderboard
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    try {
      const leaderboard = await this.prisma.quizWinners.groupBy({
        by: ['telegramId', 'firstName'],
        where: {
          chatId: chatId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          deletedAt: null,
        },
        _sum: {
          points: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: 10,
      });

      let message = '🏆 Daily Leaderboard 🏆\n\n';

      if (leaderboard.length === 0) {
        message +=
          'No participants yet for today.\nGet started with our quizzes to claim your spot!';
      } else {
        message += `Top ${Math.min(leaderboard.length, 10)} Quiz Masters:\n\n`;
        leaderboard.forEach((entry, index) => {
          const rank = index + 1;
          const name = entry.firstName || 'Unknown';
          const points = entry._sum.points || 0;
          const emoji =
            rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🔸';
          message += `${emoji} ${rank}. ${name} - ${points} points\n`;
        });
        message += '\nKeep answering quizzes to climb the ranks! 🚀';
      }

      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error(
        `Failed to generate/send daily leaderboard for chat ${chatId}:`,
        error,
      );
    }
  }

  async clearScheduledQuizzes(chatIds: string[]): Promise<void> {
    try {
      // Get all scheduled quizzes for these chats
      const scheduledQuizzes = await this.prisma.scheduledQuiz.findMany({
        where: {
          chatId: { in: chatIds },
          status: 'pending',
        },
      });

      // Cancel cron tasks
      for (const quiz of scheduledQuizzes) {
        const taskKey = `quiz-${quiz.id}`;
        const task = this.scheduledTasks.get(taskKey);
        if (task) {
          task.destroy();
          this.scheduledTasks.delete(taskKey);
          this.logger.log(`Cancelled scheduled task for quiz ${quiz.id}`);
        }
      }

      // Update database status
      await this.prisma.scheduledQuiz.updateMany({
        where: {
          chatId: { in: chatIds },
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });

      this.logger.log(`Cleared scheduled quizzes for ${chatIds.length} chats`);
    } catch (error) {
      this.logger.error('Failed to clear scheduled quizzes:', error);
    }
  }

  async getScheduledQuizzes(chatId?: string): Promise<ScheduledQuiz[]> {
    const whereClause: any = {
      status: 'pending',
    };

    if (chatId) {
      whereClause.chatId = chatId;
    }

    const dbQuizzes = await this.prisma.scheduledQuiz.findMany({
      where: whereClause,
      orderBy: {
        scheduledTime: 'asc',
      },
    });

    return dbQuizzes.map((quiz) => ({
      id: quiz.id,
      chatId: quiz.chatId,
      question: quiz.question,
      options: JSON.parse(quiz.options),
      correctOptionIndex: quiz.correctOptionIndex,
      scheduledTime: quiz.scheduledTime,
      status: quiz.status as 'pending' | 'sent' | 'failed',
      createdAt: quiz.createdAt,
    }));
  }

  async cancelScheduledQuiz(quizId: number): Promise<void> {
    try {
      // Cancel cron task
      const taskKey = `quiz-${quizId}`;
      const task = this.scheduledTasks.get(taskKey);
      if (task) {
        task.destroy();
        this.scheduledTasks.delete(taskKey);
      }

      // Update database
      await this.prisma.scheduledQuiz.update({
        where: { id: quizId },
        data: { status: 'cancelled' },
      });

      this.logger.log(`Cancelled scheduled quiz ${quizId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel scheduled quiz ${quizId}:`, error);
      throw new HttpException(
        'Failed to cancel scheduled quiz',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async restoreScheduledQuizzes(): Promise<void> {
    try {
      const now = new Date();
      const pendingQuizzes = await this.prisma.scheduledQuiz.findMany({
        where: {
          status: 'pending',
          scheduledTime: {
            gt: now, // Only restore future quizzes
          },
        },
        orderBy: {
          scheduledTime: 'asc',
        },
      });

      this.logger.log(`Restoring ${pendingQuizzes.length} scheduled quizzes`);

      if (pendingQuizzes.length === 0) {
        this.logger.log('No pending quizzes to restore');
        return;
      }

      const scheduledQuizzes: ScheduledQuiz[] = pendingQuizzes.map((quiz) => ({
        id: quiz.id,
        chatId: quiz.chatId,
        question: quiz.question,
        options: JSON.parse(quiz.options),
        correctOptionIndex: quiz.correctOptionIndex,
        scheduledTime: quiz.scheduledTime,
        status: 'pending',
      }));

      await this.scheduleQuizzesWithCron(scheduledQuizzes);

      // Mark past quizzes as failed
      const updatedCount = await this.prisma.scheduledQuiz.updateMany({
        where: {
          status: 'pending',
          scheduledTime: {
            lte: now,
          },
        },
        data: {
          status: 'failed',
        },
      });

      this.logger.log(
        `Successfully restored ${scheduledQuizzes.length} scheduled quizzes and marked ${updatedCount.count} past quizzes as failed`,
      );
    } catch (error) {
      this.logger.error('Failed to restore scheduled quizzes:', error);
    }
  }

  private dateToCronExpression(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);

    const partMap = parts.reduce(
      (acc, part) => {
        if (part.type !== 'literal') {
          acc[part.type] = part.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const minute = partMap.minute;
    const hour = partMap.hour;
    const day = partMap.day;
    const month = partMap.month;

    const cronExpr = `${minute} ${hour} ${day} ${month} *`;

    this.logger.log(
      `🕐 Cron expression for ${date.toISOString()}: ${cronExpr}`,
    );
    this.logger.log(`🌍 Current time: ${new Date().toISOString()}`);
    this.logger.log(`⏰ Target time: ${date.toISOString()}`);
    this.logger.log(`⏳ Time difference: ${date.getTime() - Date.now()}ms`);

    // Validate the cron expression
    if (cron.validate(cronExpr)) {
      this.logger.log(`✅ Cron expression is valid`);
    } else {
      this.logger.error(`❌ Invalid cron expression: ${cronExpr}`);
    }

    return cronExpr;
  }

  async getSchedulingStats(): Promise<any> {
    const totalScheduled = await this.prisma.scheduledQuiz.count({
      where: { status: 'pending' },
    });

    const totalSent = await this.prisma.scheduledQuiz.count({
      where: { status: 'sent' },
    });

    const totalFailed = await this.prisma.scheduledQuiz.count({
      where: { status: 'failed' },
    });

    const totalCancelled = await this.prisma.scheduledQuiz.count({
      where: { status: 'cancelled' },
    });

    const activeTasks = this.scheduledTasks.size;

    const upcomingQuizzes = await this.getScheduledQuizzes();

    // Get next 5 upcoming quizzes
    const nextQuizzes = upcomingQuizzes
      .filter((quiz) => quiz.scheduledTime > new Date())
      .slice(0, 5)
      .map((quiz) => ({
        id: quiz.id,
        chatId: quiz.chatId,
        question: TelegramUtils.truncateText(quiz.question, 50),
        scheduledTime: quiz.scheduledTime,
      }));

    return {
      totalScheduled,
      totalSent,
      totalFailed,
      totalCancelled,
      activeTasks,
      nextQuizzes,
      totalUpcoming: upcomingQuizzes.length,
    };
  }

  async rescheduleQuiz(quizId: number, newTime: Date): Promise<void> {
    try {
      const dateValidation = TelegramUtils.validateFutureDate(newTime);
      if (!dateValidation.isValid) {
        throw new HttpException(dateValidation.error!, HttpStatus.BAD_REQUEST);
      }

      // Cancel existing task
      const taskKey = `quiz-${quizId}`;
      const existingTask = this.scheduledTasks.get(taskKey);
      if (existingTask) {
        existingTask.destroy();
        this.scheduledTasks.delete(taskKey);
      }

      // Get quiz details
      const quiz = await this.prisma.scheduledQuiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new HttpException(
          'Scheduled quiz not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (quiz.status !== 'pending') {
        throw new HttpException(
          'Cannot reschedule non-pending quiz',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update database
      await this.prisma.scheduledQuiz.update({
        where: { id: quizId },
        data: { scheduledTime: newTime },
      });

      // Schedule new task
      const scheduledQuiz: ScheduledQuiz = {
        id: quiz.id,
        chatId: quiz.chatId,
        question: quiz.question,
        options: JSON.parse(quiz.options),
        correctOptionIndex: quiz.correctOptionIndex,
        scheduledTime: newTime,
        status: 'pending',
      };

      await this.scheduleQuizzesWithCron([scheduledQuiz]);

      this.logger.log(
        `Successfully rescheduled quiz ${quizId} to ${newTime.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(`Failed to reschedule quiz ${quizId}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to reschedule quiz',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Clean up method for graceful shutdown
  async cleanup(): Promise<void> {
    this.logger.log('Cleaning up scheduled tasks...');

    for (const [taskKey, task] of this.scheduledTasks.entries()) {
      try {
        task.destroy();
        this.logger.log(`Destroyed task: ${taskKey}`);
      } catch (error) {
        this.logger.error(`Failed to destroy task ${taskKey}:`, error);
      }
    }

    this.scheduledTasks.clear();
    this.logger.log('All scheduled tasks cleaned up');
  }

  // Utility method to get task status
  getActiveTasksCount(): number {
    return this.scheduledTasks.size;
  }

  // Method to check if a specific quiz is scheduled
  isQuizScheduled(quizId: string): boolean {
    return this.scheduledTasks.has(`quiz-${quizId}`);
  }

  // ADD THIS: Debug method to test scheduling immediately
  async testScheduling(): Promise<void> {
    this.logger.log('=== TESTING SCHEDULING FUNCTIONALITY ===');

    // Test in 30 seconds from now
    const testTime = new Date(Date.now() + 30000);
    this.logger.log(`Creating test task for: ${testTime.toISOString()}`);

    const cronExpr = this.dateToCronExpression(testTime);

    const task = cron.schedule(
      cronExpr,
      () => {
        this.logger.log('🎯 TEST CRON TASK EXECUTED SUCCESSFULLY!');

        if (this.bot) {
          this.logger.log('✅ Bot instance is available in test task');
        } else {
          this.logger.error('❌ Bot instance NOT available in test task');
        }
      },
      {
        timezone: 'Africa/Lagos',
      },
    );

    this.logger.log(`Test task created. Status: ${task.getStatus}`);
    this.scheduledTasks.set('test-task', task);

    // Clean up test task after 2 minutes
    setTimeout(() => {
      task.destroy();
      this.scheduledTasks.delete('test-task');
      this.logger.log('🧹 Test task cleaned up');
    }, 120000);
  }
}
