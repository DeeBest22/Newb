import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import TelegramBot = require('node-telegram-bot-api');
import { AuthService } from '../../auth/auth.service';
import { TelegramVerificationService } from '../../auth/telegram-verification.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Status } from '@prisma/client';
import { TelegramQuizService } from '../handlers/telegram-quiz.service';
import { TelegramPollService } from '../handlers/telegram-poll.service';

@Injectable()
export class TelegramBotSetupService implements OnModuleInit, OnModuleDestroy {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramBotSetupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly telegramVerificationService: TelegramVerificationService,
    private readonly quizService: TelegramQuizService,
    private readonly pollService: TelegramPollService,
  ) {}

  onModuleInit() {
    this.initializeBot();
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stopPolling();
    }
  }

  private initializeBot() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });
    this.setupBotHandlers();
    this.logger.log('Telegram bot initialized successfully');
  }

  getBot(): TelegramBot {
    return this.bot;
  }

  private setupBotHandlers() {
    // Handle /start command
    this.bot.onText(/\/start(?: (.+))?/, async (msg) => {
      await this.sendWelcomeMessage(msg);
    });

    // Handle regular messages
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await this.sendWelcomeMessage(msg);
      }
    });

    // Handle web app data
    this.bot.on('web_app_data', async (webAppMsg) => {
      await this.handleWebAppData(webAppMsg);
    });

    // Handle poll answers
    this.bot.on('poll_answer', async (pollAnswer) => {
      await this.handlePollAnswer(pollAnswer);
    });

    // Handle chat member updates
    this.bot.on('my_chat_member', async (chatMemberUpdate) => {
      await this.handleChatMemberUpdate(chatMemberUpdate);
    });

    // Handle bot errors
    this.bot.on('error', (error) => {
      this.logger.error('Telegram bot error:', error);
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      this.logger.error('Telegram polling error:', error);
    });
  }

  private async sendWelcomeMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const startParam = msg.text?.match(/\/start(?: (.+))?/)?.[1];

    const webAppUrl = new URL(process.env.WEBAPP_URL!);
    const communityUrl = new URL(process.env.COMMUNITY_URL!);
    const channelUrl = new URL(process.env.CANNEL_URL!);

    if (startParam) {
      webAppUrl.searchParams.set('tg_start_param', startParam);
    }

    const username = msg.from?.username ? `@${msg.from.username}` : 'there';

    try {
      await this.bot.sendMessage(
        chatId,
        `👋 Welcome to Newbnet - Your Web3 Power Up!\n\nHey ${username},\n\nYou just stepped into Newbnet, the ultimate spot for learning, earning, and vibing with the crypto community.\n\nNo gatekeeping, no boring lectures - just fun, rewards, and alpha all in one place!\n\n✨ What we have:\n\n🟢 Newbot is your Telegram crypto coach that rewards you for learning\n🎯 Quizzes, Versus battles, marketplace and a surprise for early members\n💡 Stick around for daily fun topics, debates, and airdrop-worthy engagement\n\n🚀 Get in, introduce yourself, and let's get this Web3 journey started!`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '👋 Launch',
                  web_app: { url: webAppUrl.toString() },
                },
              ],
              [
                {
                  text: 'Join community',
                  url: communityUrl.toString(),
                },
              ],
              [
                {
                  text: 'Join channel',
                  url: channelUrl.toString(),
                },
              ],
            ],
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send welcome message to ${chatId}:`, error);
    }
  }

  private async handleWebAppData(webAppMsg: TelegramBot.Message) {
    const chatId = webAppMsg.chat.id;

    try {
      const initData = webAppMsg.web_app_data?.data;

      if (!initData) {
        throw new Error('No authentication data received');
      }

      const authResult = await this.authService.telegramLogin(initData);

      await this.bot.sendMessage(
        chatId,
        '✅ Authentication successful! You can now use the web app.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Continue in App',
                  web_app: { url: process.env.WEBAPP_URL },
                },
              ],
            ],
          },
        },
      );
    } catch (error) {
      this.logger.error('Telegram auth error:', error);
      await this.bot.sendMessage(
        chatId,
        '❌ Authentication failed. Please try again or contact support.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Retry Authentication',
                  web_app: { url: process.env.WEBAPP_URL },
                },
              ],
            ],
          },
        },
      );
    }
  }

  private async handlePollAnswer(pollAnswer: TelegramBot.PollAnswer) {
    const user = pollAnswer.user;

    // Check if it's a quiz answer
    const isQuizAnswer = await this.quizService.handlePollAnswer(pollAnswer);

    if (!isQuizAnswer) {
      // Handle as regular poll answer
      await this.pollService.handlePollAnswer(pollAnswer);
    }
  }

  private async handleChatMemberUpdate(
    chatMemberUpdate: TelegramBot.ChatMemberUpdated,
  ) {
    const chat = chatMemberUpdate.chat;
    const newStatus = chatMemberUpdate.new_chat_member.status;

    if (newStatus === 'member' || newStatus === 'administrator') {
      await this.handleBotAddedToChat(chat);
    } else if (newStatus === 'kicked' || newStatus === 'left') {
      await this.handleBotRemovedFromChat(chat);
    }
  }

  private async handleBotAddedToChat(chat: TelegramBot.Chat) {
    this.logger.log(
      `Bot was added to ${chat.type} with ID ${chat.id}, title: ${chat.title || 'N/A'}`,
    );

    try {
      // Save chat to database
      await this.prisma.chat.upsert({
        where: { chatId: chat.id.toString() },
        update: {
          chatType: chat.type,
          title: chat.title,
          username: chat.username,
          status: Status.ACTIVE,
        },
        create: {
          chatId: chat.id.toString(),
          chatType: chat.type,
          title: chat.title,
          username: chat.username,
          status: Status.ACTIVE,
        },
      });

      this.logger.log(`Chat ${chat.id} saved/updated in database.`);

      // Send welcome message to the chat
      await this.bot.sendMessage(
        chat.id,
        `🎉 Welcome to the future! Thanks for adding me to ${chat.title || 'this chat'}!\n\nI'm Newbot, your friendly Web3 coach here to make learning crypto fun with:\n✨ Interactive quizzes that reward you\n🗳️ Engaging community polls\n📚 Easy-to-digest crypto education\n🎯 Exciting community challenges\n\n📋 **Pro Tip**: For the best experience, consider making me an admin so I can share polls, quizzes, and educational content seamlessly. No worries - I only need basic permissions to serve you better!\n\nReady to dive into Web3 together? 🌊`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle bot added to chat ${chat.id}:`,
        error,
      );
    }
  }

  private async handleBotRemovedFromChat(chat: TelegramBot.Chat) {
    this.logger.log(
      `Bot was removed from ${chat.type} with ID ${chat.id}, title: ${chat.title || 'N/A'}`,
    );

    try {
      // Update chat status in database
      await this.prisma.chat.update({
        where: { chatId: chat.id.toString() },
        data: {
          status: Status.DELETED,
        },
      });

      this.logger.log(`Chat ${chat.id} status updated in database.`);
    } catch (error) {
      this.logger.error(`Failed to update chat ${chat.id} status:`, error);
    }
  }

  public async verifyMiniAppUser(initData: string) {
    try {
      return await this.telegramVerificationService.extractTelegramUserData(
        initData,
      );
    } catch (error) {
      this.logger.error('Verification failed:', error);
      return null;
    }
  }
}
