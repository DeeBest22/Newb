import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/core/database/prisma.service';
import { LEVELS } from './levels.config';
import { toJSON } from '@app/core/utils/functions';

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateLevel(userId: number) {
    const user = await this.prisma.generalUser.findUnique({
      where: { accountId: userId },
      select: { points: true, level: true, telegramId: true },
    });

    if (!user) return null;

    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];

    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (user.points >= LEVELS[i].threshold) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1] || null;
        break;
      }
    }

    const progress = nextLevel
      ? Math.min(
          100,
          ((user.points - currentLevel.threshold) /
            (nextLevel.threshold - currentLevel.threshold)) *
            100,
        )
      : 100;

    if (user.level !== currentLevel.level) {
      await this.prisma.generalUser.update({
        where: { accountId: userId },
        data: { level: currentLevel.level },
      });
    }

    // Apply toJSON to the entire response
    return toJSON({
      currentLevel,
      nextLevel,
      progress,
      points: user.points,
      telegramId: user.telegramId, // This would be a BigInt
    });
  }

  async getLeaderboardPosition(userId: number) {
    const result = await this.prisma.$queryRaw<{ rank: bigint }[]>`
      SELECT rank FROM (
        SELECT 
          "accountId", 
          RANK() OVER (ORDER BY points DESC) as rank
        FROM "GeneralUser"
      ) ranked_users
      WHERE "accountId" = ${userId}
    `;

    // Convert BigInt to number
    return Number(result[0]?.rank) || null;
  }
}
