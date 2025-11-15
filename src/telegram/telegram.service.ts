import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  CreatePollDto,
  MessageButton,
  BulkMessageResponse,
  BulkImageResponse,
  ScheduleQuizRequest,
  ChatInviteInfo,
  ChatInfo,
} from '../interfaces/telegram.interfaces';
import { TelegramBotSetupService } from './telegram-bot-setup.service';
import { TelegramQuizService } from '../handlers/telegram-quiz.service';
import { TelegramPollService } from '../handlers/telegram-poll.service';
import { TelegramMessageService } from '../handlers/telegram-message.service';
import { TelegramLeaderboardService } from '../operations/telegram-leaderboard.service';
import { TelegramChatService } from '../operations/telegram-chat.service';
import { TelegramSchedulerService } from '../operations/telegram-scheduler.service';
import { CreateQuizDto } from '../dto/create-quiz.dto';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly botSetupService: TelegramBotSetupService,
    private readonly quizService: TelegramQuizService,
    private readonly pollService: TelegramPollService,
    private readonly messageService: TelegramMessageService,
    private readonly leaderboardService: TelegramLeaderboardService,
    private readonly chatService: TelegramChatService,
    private readonly schedulerService: TelegramSchedulerService,
  ) {}

  async onModuleInit() {
    // Initialize bot and share instance across all services
    await this.initializeServices();
    this.logger.log('Telegram service initialized successfully');
  }

  async onModuleDestroy() {
    // Cleanup scheduler tasks on shutdown
    await this.schedulerService.cleanup();
    this.logger.log('Telegram service destroyed successfully');
  }

  private async initializeServices() {
    const bot = this.botSetupService.getBot();

    // Share bot instance with all services
    this.quizService.setBot(bot);
    this.pollService.setBot(bot);
    this.messageService.setBot(bot);
    this.leaderboardService.setBot(bot);
    this.chatService.setBot(bot);
    this.schedulerService.setBot(bot);

    // CRITICAL FIX: Inject quiz service into scheduler for answer tracking
    this.schedulerService.setQuizService(this.quizService);

    this.logger.log(
      '✅ All services initialized with bot instance and cross-dependencies',
    );
  }

  // Authentication
  async verifyMiniAppUser(initData: string) {
    return this.botSetupService.verifyMiniAppUser(initData);
  }

  // Quiz-related methods
  async sendQuiz(createQuizDto: CreateQuizDto): Promise<any> {
    return this.quizService.sendQuiz(createQuizDto);
  }

  async sendAutoDeleteQuiz(createQuizDto: CreateQuizDto): Promise<any> {
    return this.quizService.sendAutoDeleteQuiz(createQuizDto);
  }

  async getQuizWinners(chatId: string, startDate?: Date, endDate?: Date) {
    return this.quizService.getQuizWinners(chatId, startDate, endDate);
  }

  // Poll-related methods
  async sendPoll(createPollDto: CreatePollDto): Promise<any> {
    return this.pollService.sendPoll(createPollDto);
  }

  async sendBulkPoll(
    chatIds: string[],
    question: string,
    options: string[],
  ): Promise<BulkMessageResponse> {
    return this.pollService.sendBulkPoll(chatIds, question, options);
  }

  async getPollVotes(chatId: string, startDate?: Date, endDate?: Date) {
    return this.pollService.getPollVotes(chatId, startDate, endDate);
  }

  async getPollStatistics(pollId: string) {
    return this.pollService.getPollStatistics(pollId);
  }

  // Message-related methods
  async sendFormattedMessage(
    chatId: string | number,
    message: string,
    button?: MessageButton,
  ) {
    return this.messageService.sendFormattedMessage(chatId, message, button);
  }

  async sendAutoDeleteFormattedMessage(
    chatId: string | number,
    message: string,
    button?: MessageButton,
  ) {
    return this.messageService.sendAutoDeleteFormattedMessage(
      chatId,
      message,
      button,
    );
  }

  async sendBulkFormattedMessage(
    chatIds: string[],
    message: string,
    button?: MessageButton,
  ): Promise<BulkMessageResponse> {
    return this.messageService.sendBulkFormattedMessage(
      chatIds,
      message,
      button,
    );
  }

  async sendImage(
    chatId: string | number,
    imageBuffer: Buffer,
    caption?: string,
  ): Promise<any> {
    return this.messageService.sendImage(chatId, imageBuffer, caption);
  }

  async sendBulkImage(
    chatIds: string[],
    imageBuffer: Buffer,
    caption?: string,
  ): Promise<BulkImageResponse> {
    return this.messageService.sendBulkImage(chatIds, imageBuffer, caption);
  }

  async broadcastMessageToAllUsers(
    message: string,
  ): Promise<{ successful: number; failed: number }> {
    return this.messageService.broadcastMessageToAllUsers(message);
  }

  // Leaderboard-related methods
  async sendLeaderboard(chatId: string, leaderboard: string) {
    return this.leaderboardService.sendLeaderboard(chatId, leaderboard);
  }

  async generateLeaderboardMessage(
    chatId: string,
    period: 'Daily' | 'Weekly' | 'Monthly' | 'All-Time',
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<string> {
    return this.leaderboardService.generateLeaderboardMessage(
      chatId,
      period,
      startDate,
      endDate,
      limit,
    );
  }

  async sendDailyLeaderboard(chatId: string) {
    return this.leaderboardService.sendDailyLeaderboard(chatId);
  }

  async sendWeeklyLeaderboard(chatId: string) {
    return this.leaderboardService.sendWeeklyLeaderboard(chatId);
  }

  async sendMonthlyLeaderboard(chatId: string) {
    return this.leaderboardService.sendMonthlyLeaderboard(chatId);
  }

  async sendAllTimeLeaderboard(chatId: string) {
    return this.leaderboardService.sendAllTimeLeaderboard(chatId);
  }

  async getLeaderboardStats(
    chatId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all',
  ) {
    return this.leaderboardService.getLeaderboardStats(chatId, period);
  }

  // Chat-related methods
  async getChatInviteLink(chatId: string): Promise<ChatInviteInfo> {
    return this.chatService.getChatInviteLink(chatId);
  }

  async createChatInviteLink(
    chatId: string,
    name?: string,
    expireDate?: number,
    memberLimit?: number,
  ): Promise<ChatInviteInfo> {
    return this.chatService.createChatInviteLink(
      chatId,
      name,
      expireDate,
      memberLimit,
    );
  }

  async getChatInfo(chatId: string): Promise<ChatInfo> {
    return this.chatService.getChatInfo(chatId);
  }

  async revokeChatInviteLink(chatId: string, inviteLink: string): Promise<any> {
    return this.chatService.revokeChatInviteLink(chatId, inviteLink);
  }

  async editChatInviteLink(
    chatId: string,
    inviteLink: string,
    name?: string,
    expireDate?: number,
    memberLimit?: number,
  ): Promise<ChatInviteInfo> {
    return this.chatService.editChatInviteLink(
      chatId,
      inviteLink,
      name,
      expireDate,
      memberLimit,
    );
  }

  async getChatMember(chatId: string, userId: number): Promise<any> {
    return this.chatService.getChatMember(chatId, userId);
  }

  async getChatAdministrators(chatId: string): Promise<any> {
    return this.chatService.getChatAdministrators(chatId);
  }

  async setChatTitle(chatId: string, title: string): Promise<any> {
    return this.chatService.setChatTitle(chatId, title);
  }

  async setChatDescription(chatId: string, description: string): Promise<any> {
    return this.chatService.setChatDescription(chatId, description);
  }

  // Scheduler-related methods
  async scheduleQuizzes(request: ScheduleQuizRequest): Promise<any> {
    return this.schedulerService.scheduleQuizzes(request);
  }

  async clearScheduledQuizzes(chatIds: string[]): Promise<void> {
    return this.schedulerService.clearScheduledQuizzes(chatIds);
  }

  async getScheduledQuizzes(chatId?: string) {
    return this.schedulerService.getScheduledQuizzes(chatId);
  }

  async cancelScheduledQuiz(quizId: number): Promise<void> {
    return this.schedulerService.cancelScheduledQuiz(quizId);
  }

  async getSchedulingStats(): Promise<any> {
    return this.schedulerService.getSchedulingStats();
  }

  // ADD: Debug methods to help troubleshoot quiz answer tracking
  async getActiveQuizzes() {
    return this.quizService.getActiveQuizzes();
  }

  async getActiveQuizzesCount() {
    return this.quizService.getActiveQuizzesCount();
  }

  async getActiveQuizByPollId(pollId: string) {
    return this.quizService.getActiveQuizByPollId(pollId);
  }

  // Legacy method support for backward compatibility
  // You can remove these if you update all controller calls

  /**
   * @deprecated Use scheduleQuizzes instead
   */
  async scheduleQuizzesLegacy(
    chatIds: (string | number)[],
    quizzes: CreateQuizDto[],
    startTime: Date,
    intervalMinutes: number,
  ): Promise<any> {
    const request: ScheduleQuizRequest = {
      chatIds,
      quizzes: quizzes.map((quiz) => ({
        question: quiz.question,
        options: quiz.options,
        correctOptionIndex: quiz.correctOptionIndex,
      })),
      startTime,
      intervalMinutes,
    };

    return this.scheduleQuizzes(request);
  }
}
