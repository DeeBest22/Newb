import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AuthModule } from './auth/auth.module';
import { TelegramUtils } from './telegram/telegram.utils';
import { CourseModule } from './course/course.module';
import { PrismaService } from './core/database/prisma.service';
import { TaskModule } from './task/task.module';
import { ReferralModule } from './referral/referral.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LevelsModule } from './levels/levels.module';
import { MulterModule } from '@nestjs/platform-express';
import { TelegramMessageController } from './telegram/telegram.controller';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB file size limit
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    CoreModule,
    WaitlistModule,
    AuthModule,
    CourseModule,
    TaskModule,
    ReferralModule,
    LeaderboardModule,
    LevelsModule,
    TelegramModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: TelegramUtils,
      useFactory: () => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
          throw new Error(
            'TELEGRAM_BOT_TOKEN is not defined in environment variables',
          );
        }
        return new TelegramUtils(token);
      },
    },
  ],
  exports: [TelegramUtils, PrismaService],
})
export class AppModule {}
