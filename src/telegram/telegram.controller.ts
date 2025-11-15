import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  HttpException,
  Query,
  Param,
} from '@nestjs/common';
import {
  BulkMessageResponse,
  BulkImageResponse,
  ScheduleQuizRequest,
} from './interfaces/telegram.interfaces';
import { SendMessageDto } from './dto/send-message.dto';
import { Accounts } from '@app/auth/decorators/accounts.decorator';
import { AccountType } from '@prisma/client';
import { ApiEndpoint } from '@app/core/decorators';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BroadcastMessageDto } from './dto/broadcast-bot-message.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SendImageDto } from './dto/send-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreatePollDto } from './dto/create-poll-votes.dto';
import { SendAutoDeleteMessageDto } from './dto/send-auto-delete-message.dto';
import { SendLeaderboardDto } from './dto/leaderboard.dto';
import { SendSingleMessageDto } from './dto/send-single-message.dto';
import { SendSingleImageDto } from './dto/send-single-image.dto';
import { CreateMultiplePollDto } from './dto/create-poll-vote-for-multiple-chats.dto';
import { GetInviteLinkDto } from './dto/get-invite-link.dto';
import { GetOneInviteLinkDto } from './dto/get-one-chat-invite-link.dto';
import { TelegramService } from './services/telegram.service';
import { ChatIdDto } from './dto/chatId.dto';
import { ChatMemberInfoDto } from './dto/chat-member-info-dto';
import { SetChatTitleDto } from './dto/set-chat-title.dto';
import { SetChatDescriptionDto } from './dto/set-chat-description.dto';

const BASE_PATH = 'telegram-base';
@Controller(BASE_PATH)
@ApiTags(BASE_PATH)
@ApiBearerAuth()
export class TelegramMessageController {
  constructor(private readonly telegramService: TelegramService) {}

  // =================== MESSAGE ENDPOINTS ===================

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Send message to multiple communities')
  @Post('send-message')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<BulkMessageResponse> {
    return this.telegramService.sendBulkFormattedMessage(
      sendMessageDto.chatIds,
      sendMessageDto.message,
      sendMessageDto.button,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Send message to community')
  @Post('send-single-message')
  async sendSingleMessage(@Body() sendMessageDto: SendSingleMessageDto) {
    return this.telegramService.sendFormattedMessage(
      sendMessageDto.chatId,
      sendMessageDto.message,
      sendMessageDto.button,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Send message to community that auto delete after 1 hour')
  @Post('send-one-hour-auto-delete-message')
  async sendAutoDeleteMessage(
    @Body() sendMessageDto: SendAutoDeleteMessageDto,
  ) {
    return this.telegramService.sendAutoDeleteFormattedMessage(
      sendMessageDto.chatId,
      sendMessageDto.message,
      sendMessageDto.button,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiEndpoint('Broadcast message to all bot users')
  @Post('broadcast-to-all')
  async broadcastToAllUsers(@Body() broadcastMessageDto: BroadcastMessageDto) {
    const results = await this.telegramService.broadcastMessageToAllUsers(
      broadcastMessageDto.message,
    );
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: `Broadcast initiated. Attempted: ${results.successful + results.failed}, Successful: ${results.successful}, Failed: ${results.failed}. Check server logs for details.`,
      data: results,
    };
  }

  // =================== IMAGE ENDPOINTS ===================

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Send an image to multiple Telegram channels or groups')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatIds: {
          type: 'array',
          items: { type: 'string' },
          example: [
            '-1002539449352',
            '-1002306607418',
            '-1002814512312',
            '-1002414675242',
            '-1002651283101',
            '-1002805775588',
            '-1002519283711',
            '-1002268273820',
            '-1002577561755',
            '-1002428293968',
            '-1002334752205',
            '-1002283708103',
            '-1002823582749',
            '-1002700389201',
            '-1002496020627',
            '-1002782540302',
            '-1002673103792',
            '-1002933177813',
            '-1002424251448',
            '-1002658614016',
            '-1002774992264',
            '-1002324380190',
            '-1002793222433',
            '-1002869884193',
            '-1002376754434',
            '-4972548544',
            '-1002580067108',
            '-1002634046443',
            '-1002726944203',
            '-1002233061343',
            '-1002660382615',
            '-1002394786535',
            '-1002635194967',
            '-1003049272013',
            '-1002600724433',
            '-1002760504801',
            '-1002833904614',
            '-1003177213052',
            '-1002991198945',
          ],
          maxItems: 50,
        },
        caption: { type: 'string', example: 'Check out this image!' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['chatIds', 'image'],
    },
  })
  @Post('send-image')
  @UseInterceptors(FileInterceptor('image'))
  async sendImage(
    @Body() sendImageDto: SendImageDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkImageResponse> {
    if (!file) {
      throw new HttpException(
        'Image file is required.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.telegramService.sendBulkImage(
      sendImageDto.chatIds,
      file.buffer,
      sendImageDto.caption,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Send an image to a Telegram channel or group')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatId: { type: 'string', example: '-1002785322930' },
        caption: { type: 'string', example: 'Check out this image!' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['chatId', 'image'],
    },
  })
  @Post('send-single-image')
  @UseInterceptors(FileInterceptor('image'))
  async sendSingleImage(
    @Body() sendImageDto: SendSingleImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException(
        'Image file is required.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.telegramService.sendImage(
      sendImageDto.chatId,
      file.buffer,
      sendImageDto.caption,
    );
  }

  // =================== QUIZ ENDPOINTS ===================

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create and send a quiz to a Telegram channel or group')
  @Post('create-quiz')
  async createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.telegramService.sendQuiz(createQuizDto);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint(
    'Create and send a quiz with auto-delete after 10 minutes to a Telegram channel or group',
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatId: { type: 'string', example: '-1002785322930' },
        question: { type: 'string', example: 'What is the capital of France?' },
        options: {
          type: 'array',
          items: { type: 'string' },
          example: ['Paris', 'London', 'Berlin', 'Madrid'],
        },
        correctOptionIndex: { type: 'number', example: 0 },
      },
      required: ['chatId', 'question', 'options', 'correctOptionIndex'],
    },
  })
  @Post('create-auto-delete-quiz')
  async createAutoDeleteQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.telegramService.sendAutoDeleteQuiz(createQuizDto);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get quiz winners for a specific chat')
  @ApiQuery({ name: 'chatId', required: true, type: 'string' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @Get('quiz-winners')
  async getQuizWinners(
    @Query('chatId') chatId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.telegramService.getQuizWinners(
      chatId,
      startDateObj,
      endDateObj,
    );
  }

  // =================== SCHEDULING ENDPOINTS ===================

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint(
    'Schedule multiple quizzes with configurable intervals and auto-delete after 10 minutes',
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatIds: {
          type: 'array',
          items: { type: 'string' },
          example: [
            '-1002539449352',
            '-1002306607418',
            '-1002814512312',
            '-1002414675242',
            '-1002651283101',
            '-1002805775588',
            '-1002519283711',
            '-1002268273820',
            '-1002577561755',
            '-1002428293968',
            '-1002334752205',
            '-1002283708103',
            '-1002823582749',
            '-1002700389201',
            '-1002496020627',
            '-1002782540302',
            '-1002673103792',
            '-1002933177813',
            '-1002424251448',
            '-1002658614016',
            '-1002774992264',
            '-1002324380190',
            '-1002793222433',
            '-1002869884193',
            '-1002376754434',
            '-4972548544',
            '-1002580067108',
            '-1002634046443',
            '-1002726944203',
            '-1002233061343',
            '-1002660382615',
            '-1002394786535',
            '-1002635194967',
            '-1003049272013',
            '-1002600724433',
            '-1002760504801',
            '-1002833904614',
            '-1003177213052',
            '-1002991198945',
          ],
          description:
            'Array of chat IDs (channels or groups) to send quizzes to',
        },
        startTime: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-20T10:00:00Z',
          description: 'Start time for the first quiz',
        },
        intervalMinutes: {
          type: 'number',
          example: 60,
          description:
            'Interval between quizzes in minutes (e.g., 10, 30, 60, 120)',
        },
        quizzes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                example: 'What is the capital of France?',
              },
              options: {
                type: 'array',
                items: { type: 'string' },
                example: ['Paris', 'London', 'Berlin', 'Madrid'],
              },
              correctOptionIndex: { type: 'number', example: 0 },
            },
            required: ['question', 'options', 'correctOptionIndex'],
          },
        },
      },
      required: ['chatIds', 'startTime', 'intervalMinutes', 'quizzes'],
    },
  })
  @Post('schedule-quizzes')
  async scheduleQuizzes(
    @Body()
    body: {
      chatIds: (string | number)[];
      startTime: string;
      intervalMinutes: number;
      quizzes: {
        question: string;
        options: string[];
        correctOptionIndex: number;
      }[];
    },
  ) {
    const { chatIds, startTime, intervalMinutes, quizzes } = body;

    const request: ScheduleQuizRequest = {
      chatIds,
      quizzes,
      startTime: new Date(startTime),
      intervalMinutes,
    };

    return this.telegramService.scheduleQuizzes(request);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get scheduled quizzes')
  @ApiQuery({ name: 'chatId', required: false, type: 'string' })
  @Get('scheduled-quizzes')
  async getScheduledQuizzes(@Query('chatId') chatId?: string) {
    return this.telegramService.getScheduledQuizzes(chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Cancel a scheduled quiz')
  @ApiParam({ name: 'quizId', type: 'string' })
  @Post('scheduled-quizzes/:quizId/cancel')
  async cancelScheduledQuiz(@Param('quizId') quizId: number) {
    await this.telegramService.cancelScheduledQuiz(quizId);
    return {
      success: true,
      message: 'Scheduled quiz cancelled successfully',
    };
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Clear all scheduled quizzes for specific chats')
  @Post('clear-scheduled-quizzes')
  async clearScheduledQuizzes(@Body() body: { chatIds: string[] }) {
    await this.telegramService.clearScheduledQuizzes(body.chatIds);
    return {
      success: true,
      message: 'Scheduled quizzes cleared successfully',
    };
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get scheduling statistics')
  @Get('scheduling-stats')
  async getSchedulingStats() {
    return this.telegramService.getSchedulingStats();
  }

  // =================== POLL ENDPOINTS ===================

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create and send a poll to a Telegram channel or group')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatId: { type: 'string', example: '-1002785322930' },
        question: { type: 'string', example: 'What is your favorite crypto?' },
        options: {
          type: 'array',
          items: { type: 'string' },
          example: ['Bitcoin', 'Ethereum', 'Solana', 'Other'],
        },
      },
      required: ['chatId', 'question', 'options'],
    },
  })
  @Post('create-poll')
  async createPoll(@Body() createPollDto: CreatePollDto) {
    return this.telegramService.sendPoll(createPollDto);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Send poll to multiple communities')
  @Post('send-bulk-poll')
  async sendBulkPoll(
    @Body() createPollDto: CreateMultiplePollDto,
  ): Promise<BulkMessageResponse> {
    return this.telegramService.sendBulkPoll(
      createPollDto.chatIds,
      createPollDto.question,
      createPollDto.options,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get poll votes for a specific chat')
  @ApiQuery({ name: 'chatId', required: true, type: 'string' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @Get('poll-votes')
  async getPollVotes(
    @Query('chatId') chatId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.telegramService.getPollVotes(chatId, startDateObj, endDateObj);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get poll statistics')
  @ApiParam({ name: 'pollId', type: 'string' })
  @Get('poll-stats/:pollId')
  async getPollStatistics(@Param('pollId') pollId: string) {
    return this.telegramService.getPollStatistics(pollId);
  }

  // =================== LEADERBOARD ENDPOINTS ===================

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Send leaderboard to community')
  @Post('send-leaderboard')
  async sendLeaderboard(@Body() sendLeaderboardDto: SendLeaderboardDto) {
    return this.telegramService.sendLeaderboard(
      sendLeaderboardDto.chatId,
      sendLeaderboardDto.leaderboard,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Generate and send daily leaderboard')
  @Post('send-daily-leaderboard')
  async sendDailyLeaderboard(@Body() body: ChatIdDto) {
    return this.telegramService.sendDailyLeaderboard(body.chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Generate and send weekly leaderboard')
  @Post('send-weekly-leaderboard')
  async sendWeeklyLeaderboard(@Body() body: ChatIdDto) {
    return this.telegramService.sendWeeklyLeaderboard(body.chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Generate and send monthly leaderboard')
  @Post('send-monthly-leaderboard')
  async sendMonthlyLeaderboard(@Body() body: ChatIdDto) {
    return this.telegramService.sendMonthlyLeaderboard(body.chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Generate and send all-time leaderboard')
  @Post('send-alltime-leaderboard')
  async sendAllTimeLeaderboard(@Body() body: ChatIdDto) {
    return this.telegramService.sendAllTimeLeaderboard(body.chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get leaderboard statistics')
  @ApiQuery({ name: 'chatId', required: true, type: 'string' })
  @ApiQuery({
    name: 'period',
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'all'],
  })
  @Get('leaderboard-stats')
  async getLeaderboardStats(
    @Query('chatId') chatId: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'all',
  ) {
    return this.telegramService.getLeaderboardStats(chatId, period);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Generate leaderboard message without sending')
  @ApiQuery({ name: 'chatId', required: true, type: 'string' })
  @ApiQuery({
    name: 'period',
    required: true,
    enum: ['Daily', 'Weekly', 'Monthly', 'All-Time'],
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    minimum: 1,
    maximum: 50,
  })
  @Get('generate-leaderboard')
  async generateLeaderboard(
    @Query('chatId') chatId: string,
    @Query('period') period: 'Daily' | 'Weekly' | 'Monthly' | 'All-Time',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    const limitNum = limit ? parseInt(limit.toString()) : 10;

    const message = await this.telegramService.generateLeaderboardMessage(
      chatId,
      period,
      startDateObj,
      endDateObj,
      limitNum,
    );

    return {
      success: true,
      message: 'Leaderboard generated successfully',
      data: { leaderboardMessage: message },
    };
  }

  // =================== CHAT MANAGEMENT ENDPOINTS ===================

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get primary invite link for a group/channel')
  @Post('get-invite-link')
  async getInviteLink(@Body() body: GetOneInviteLinkDto) {
    return this.telegramService.getChatInviteLink(body.chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create a new invite link for a group/channel')
  @Post('create-invite-link')
  async createInviteLink(@Body() getInviteLinkDto: GetInviteLinkDto) {
    return this.telegramService.createChatInviteLink(
      getInviteLinkDto.chatId,
      getInviteLinkDto.name,
      getInviteLinkDto.expireDate,
      getInviteLinkDto.memberLimit,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get chat information including invite link if available')
  @Post('get-chat-info')
  async getChatInfo(@Body() body: GetOneInviteLinkDto) {
    return this.telegramService.getChatInfo(body.chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Revoke a chat invite link')
  @Post('revoke-invite-link')
  async revokeChatInviteLink(
    @Body() body: { chatId: string; inviteLink: string },
  ) {
    return this.telegramService.revokeChatInviteLink(
      body.chatId,
      body.inviteLink,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Edit a chat invite link')
  @Post('edit-invite-link')
  async editChatInviteLink(
    @Body()
    body: {
      chatId: string;
      inviteLink: string;
      name?: string;
      expireDate?: number;
      memberLimit?: number;
    },
  ) {
    return this.telegramService.editChatInviteLink(
      body.chatId,
      body.inviteLink,
      body.name,
      body.expireDate,
      body.memberLimit,
    );
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get chat member information')
  @Post('get-chat-member')
  async getChatMember(@Body() body: ChatMemberInfoDto) {
    return this.telegramService.getChatMember(body.chatId, body.userId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get chat administrators')
  @Post('get-chat-administrators')
  async getChatAdministrators(@Body() body: ChatIdDto) {
    return this.telegramService.getChatAdministrators(body.chatId);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Set chat title')
  @Post('set-chat-title')
  async setChatTitle(@Body() body: SetChatTitleDto) {
    return this.telegramService.setChatTitle(body.chatId, body.title);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Set chat description')
  @Post('set-chat-description')
  async setChatDescription(@Body() body: SetChatDescriptionDto) {
    return this.telegramService.setChatDescription(
      body.chatId,
      body.description,
    );
  }
}
