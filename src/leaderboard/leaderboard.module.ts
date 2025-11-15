import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaService } from '@app/core/database/prisma.service';
import { TelegramModule } from '@app/telegram/telegram.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
      max: 100,
    }),
    TelegramModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, PrismaService],
  exports: [],
})
export class LeaderboardModule {}
