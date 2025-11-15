import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import TelegramBot = require('node-telegram-bot-api');
import { PrismaService } from '@app/core/database/prisma.service';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { ActiveQuiz } from '../interfaces/telegram.interfaces';
import { TelegramUtils } from '../utils/telegram.utils';

@Injectable()
export class TelegramQuizService {
  private readonly logger = new Logger(TelegramQuizService.name);
  private activeQuizzes: ActiveQuiz[] = [];
  private bot: TelegramBot;

  constructor(private readonly prisma: PrismaService) {}

  setBot(bot: TelegramBot) {
    this.bot = bot;
    console.log('Bot injected into Quiz:', !!bot);
  }

  // Helper method to determine if chat is a channel
  private async isChannel(chatId: string | number): Promise<boolean> {
    try {
      const chat = await this.bot.getChat(chatId);
      return chat.type === 'channel';
    } catch (error) {
      this.logger.error(`Failed to get chat info for ${chatId}:`, error);
      return true;
    }
  }

  // ADD: Method to add active quiz (used by scheduler service)
  addActiveQuiz(quiz: ActiveQuiz): void {
    this.activeQuizzes.push(quiz);

    // Auto cleanup after 1 hour
    setTimeout(() => {
      this.activeQuizzes = this.activeQuizzes.filter(
        (q) => q.pollId !== quiz.pollId,
      );
    }, 3600 * 1000);

    this.logger.log(
      `Added active quiz with pollId: ${quiz.pollId} for chat: ${quiz.chatId}`,
    );
  }

  async sendQuiz(createQuizDto: CreateQuizDto): Promise<any> {
    const { chatId, question, options, correctOptionIndex } = createQuizDto;

    // Validate quiz data
    const optionsValidation = TelegramUtils.validateQuizOptions(options);
    if (!optionsValidation.isValid) {
      this.logger.error(`Invalid options: ${optionsValidation.error}`);
      throw new HttpException(optionsValidation.error!, HttpStatus.BAD_REQUEST);
    }

    const indexValidation = TelegramUtils.validateCorrectOptionIndex(
      correctOptionIndex,
      options.length,
    );
    if (!indexValidation.isValid) {
      this.logger.error(`Invalid correctOptionIndex: ${indexValidation.error}`);
      throw new HttpException(indexValidation.error!, HttpStatus.BAD_REQUEST);
    }

    try {
      // Check if chat is a channel
      const isChannelChat = await this.isChannel(chatId);

      this.logger.log(
        `Sending quiz to chat ${chatId} (${isChannelChat ? 'channel' : 'group/supergroup'})`,
      );

      const sentMessage = await this.bot.sendPoll(chatId, question, options, {
        type: 'quiz',
        correct_option_id: correctOptionIndex,
        is_anonymous: isChannelChat,
      });

      // Register the quiz for answer tracking
      const activeQuiz: ActiveQuiz = {
        pollId: sentMessage.poll.id,
        correctOptionIndex: correctOptionIndex,
        chatId: chatId,
        answeredUsers: new Set<number>(),
      };

      this.addActiveQuiz(activeQuiz);

      TelegramUtils.logOperation('Quiz send', chatId, true);

      return {
        success: true,
        message: 'Quiz sent successfully.',
        data: sentMessage,
      };
    } catch (error) {
      TelegramUtils.logOperation('Quiz send', chatId, false, error);
      throw new HttpException(
        'Failed to send quiz.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendAutoDeleteQuiz(createQuizDto: CreateQuizDto): Promise<any> {
    const { chatId, question, options, correctOptionIndex } = createQuizDto;

    // Validate quiz data
    const optionsValidation = TelegramUtils.validateQuizOptions(options);
    if (!optionsValidation.isValid) {
      this.logger.error(`Invalid options: ${optionsValidation.error}`);
      throw new HttpException(optionsValidation.error!, HttpStatus.BAD_REQUEST);
    }

    const indexValidation = TelegramUtils.validateCorrectOptionIndex(
      correctOptionIndex,
      options.length,
    );
    if (!indexValidation.isValid) {
      this.logger.error(`Invalid correctOptionIndex: ${indexValidation.error}`);
      throw new HttpException(indexValidation.error!, HttpStatus.BAD_REQUEST);
    }

    try {
      // Check if chat is a channel
      const isChannelChat = await this.isChannel(chatId);

      this.logger.log(
        `Sending auto-delete quiz to chat ${chatId} (${isChannelChat ? 'channel' : 'group/supergroup'})`,
      );

      const sentMessage = await this.bot.sendPoll(chatId, question, options, {
        type: 'quiz',
        correct_option_id: correctOptionIndex,
        is_anonymous: isChannelChat,
      });

      // Register the quiz for answer tracking
      const activeQuiz: ActiveQuiz = {
        pollId: sentMessage.poll.id,
        correctOptionIndex: correctOptionIndex,
        chatId: chatId,
        answeredUsers: new Set<number>(),
        messageId: sentMessage.message_id,
      };

      this.addActiveQuiz(activeQuiz);

      // Schedule reminder after 5 minutes
      setTimeout(async () => {
        await this.sendQuizReminder(chatId, sentMessage.poll.id);
      }, 300 * 1000); // 5 minutes

      // Schedule quiz deletion after 10 minutes
      setTimeout(async () => {
        await this.deleteQuizMessage(
          chatId,
          sentMessage.message_id,
          sentMessage.poll.id,
        );
      }, 600 * 1000); // 10 minutes

      TelegramUtils.logOperation('Auto-delete quiz send', chatId, true);

      return {
        success: true,
        message: 'Quiz sent successfully and will be deleted after 10 minutes.',
        data: sentMessage,
      };
    } catch (error) {
      TelegramUtils.logOperation('Auto-delete quiz send', chatId, false, error);
      throw new HttpException(
        'Failed to send auto-delete quiz.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async sendQuizReminder(chatId: string | number, pollId: string) {
    try {
      const reminderMessage = await this.bot.sendMessage(
        chatId,
        '⏰ Only 5 minutes left to answer the quiz and claim your points! Jump in now! 🎯',
      );

      this.logger.log(`Reminder sent for quiz ${pollId} in chat ${chatId}`);

      // Schedule reminder deletion after 5 minutes
      setTimeout(async () => {
        try {
          await this.bot.deleteMessage(chatId, reminderMessage.message_id);
          this.logger.log(
            `Reminder message ${reminderMessage.message_id} deleted from chat ${chatId}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to delete reminder message ${reminderMessage.message_id} from chat ${chatId}:`,
            error,
          );
        }
      }, 300 * 1000); // 5 minutes
    } catch (error) {
      this.logger.error(
        `Failed to send reminder for quiz ${pollId} in chat ${chatId}:`,
        error,
      );
    }
  }

  private async deleteQuizMessage(
    chatId: string | number,
    messageId: number,
    pollId: string,
  ) {
    try {
      await this.bot.deleteMessage(chatId, messageId);
      this.logger.log(`Quiz message ${messageId} deleted from chat ${chatId}`);

      // Remove from active quizzes
      this.clearActiveQuiz(pollId);
    } catch (error) {
      this.logger.error(
        `Failed to delete quiz message ${messageId} from chat ${chatId}:`,
        error,
      );
    }
  }

  async handlePollAnswer(pollAnswer: TelegramBot.PollAnswer): Promise<boolean> {
    const user = pollAnswer.user;
    const quiz = this.activeQuizzes.find(
      (q) => q.pollId === pollAnswer.poll_id,
    );

    if (!quiz) {
      this.logger.warn(
        `No active quiz found for pollId: ${pollAnswer.poll_id}`,
      );
      return false; // Not a quiz answer
    }

    this.logger.log(
      `Processing poll answer for quiz ${quiz.pollId} from user ${user.id}`,
    );

    if (pollAnswer.option_ids[0] === quiz.correctOptionIndex) {
      if (quiz.answeredUsers.has(user.id)) {
        this.logger.log(
          `User ${user.first_name} (@${user.username}) with ID ${user.id} already answered quiz ${quiz.pollId} correctly.`,
        );
        return true;
      }

      this.logger.log(
        `User ${user.first_name} (@${user.username}) with ID ${user.id} answered the quiz in chat ${quiz.chatId} correctly!`,
      );

      quiz.answeredUsers.add(user.id);

      try {
        const points = 20;

        await this.prisma.quizWinners.create({
          data: {
            telegramId: user.id.toString(),
            username: user.username || null,
            firstName: user.first_name || null,
            lastName: user.last_name || null,
            chatId: quiz.chatId.toString(),
            pollId: quiz.pollId,
            points: points,
          },
        });

        this.logger.log(
          `✅ Successfully logged quiz winner ${user.id} to the database with ${points} points.`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Failed to log quiz winner ${user.id} to the database:`,
          error,
        );
      }
    } else {
      this.logger.log(
        `User ${user.first_name} (@${user.username}) with ID ${user.id} answered quiz ${quiz.pollId} incorrectly.`,
      );
    }

    return true; // Was a quiz answer
  }

  getActiveQuizzes(): ActiveQuiz[] {
    return [...this.activeQuizzes];
  }

  clearActiveQuiz(pollId: string) {
    const initialLength = this.activeQuizzes.length;
    this.activeQuizzes = this.activeQuizzes.filter((q) => q.pollId !== pollId);
    const clearedCount = initialLength - this.activeQuizzes.length;

    if (clearedCount > 0) {
      this.logger.log(
        `Cleared ${clearedCount} active quiz(s) with pollId: ${pollId}`,
      );
    }
  }

  async getQuizWinners(chatId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = {
      chatId: chatId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    return await this.prisma.quizWinners.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ADD: Method to get quiz by pollId (useful for debugging)
  getActiveQuizByPollId(pollId: string): ActiveQuiz | undefined {
    return this.activeQuizzes.find((q) => q.pollId === pollId);
  }

  // ADD: Method to get total active quizzes count
  getActiveQuizzesCount(): number {
    return this.activeQuizzes.length;
  }
}
