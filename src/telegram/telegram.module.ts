import { Module } from '@nestjs/common';
import { TelegramMessageController } from './telegram.controller';
import { PrismaService } from '@app/core/database/prisma.service';
import { TelegramMessageService } from './handlers/telegram-message.service';
import { TelegramPollService } from './handlers/telegram-poll.service';
import { TelegramQuizService } from './handlers/telegram-quiz.service';
import { TelegramChatService } from './operations/telegram-chat.service';
import { TelegramLeaderboardService } from './operations/telegram-leaderboard.service';
import { TelegramSchedulerService } from './operations/telegram-scheduler.service';
import { TelegramBotSetupService } from './services/telegram-bot-setup.service';
import { TelegramService } from './services/telegram.service';
import { AuthModule } from '@app/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TelegramMessageController],
  providers: [
    TelegramBotSetupService,
    TelegramService,
    PrismaService,
    TelegramMessageService,
    TelegramPollService,
    TelegramQuizService,
    TelegramChatService,
    TelegramLeaderboardService,
    TelegramSchedulerService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
