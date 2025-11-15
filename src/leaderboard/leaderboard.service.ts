import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/core/database/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { toJSON } from '@app/core/utils/functions';
import { TelegramService } from '@app/telegram/services/telegram.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly telegramService: TelegramService,
  ) {}

  async getLeaderboard(
    currentUserId?: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const cacheKey = `leaderboard:page:${page}:limit:${limit}`;

    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return this.processCachedLeaderboard(cached, currentUserId);
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const totalUsers = await this.prisma.generalUser.count();

      const users = await this.prisma.generalUser.findMany({
        select: {
          accountId: true,
          firstName: true,
          lastName: true,
          username: true,
          points: true,
          photoUrl: true,
        },
        orderBy: {
          points: 'desc',
        },
        skip,
        take,
      });

      const usersWithPositions = users.map((user, index) => ({
        ...user,
        position: skip + index + 1,
      }));

      let currentUserEntry: {
        position: number;
        accountId?: number;
        firstName?: string | null;
        lastName?: string | null;
        username?: string | null;
        photoUrl?: string | null;
        points?: number;
      } | null = null;

      if (currentUserId) {
        const currentUserRank = await this.getUserRank(currentUserId);
        if (currentUserRank) {
          currentUserEntry = {
            ...(await this.prisma.generalUser.findUnique({
              where: { accountId: currentUserId },
              select: {
                accountId: true,
                firstName: true,
                lastName: true,
                username: true,
                points: true,
                photoUrl: true,
              },
            })),
            position: currentUserRank,
          };
        }
      }

      const response = {
        data: usersWithPositions,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
        currentUser: currentUserEntry,
      };

      await this.cacheManager.set(cacheKey, response, 60000);

      return toJSON(response);
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      throw error;
    }
  }

  async getCommunityLeaderboard(
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ) {
    const cacheKey = `community-leaderboard:page:${page}:limit:${limit}:${startDate?.getTime() || 'all'}:${endDate?.getTime() || 'all'}`;

    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const skip = (page - 1) * limit;
      const take = limit;

      // Build where clause for date filtering
      const whereClause: any = {
        deletedAt: null,
        chatId: { not: null },
      };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      // Get community stats grouped by chatId
      const communityStats = await this.prisma.quizWinners.groupBy({
        by: ['chatId'],
        where: whereClause,
        _sum: {
          points: true,
        },
        _count: {
          telegramId: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        skip,
        take,
      });

      // Get total count for pagination
      const totalCommunities = await this.prisma.quizWinners.groupBy({
        by: ['chatId'],
        where: whereClause,
      });

      // Fetch community information and build leaderboard
      const communitiesWithInfo = await Promise.all(
        communityStats.map(async (stat, index) => {
          const communityInfo = await this.getCommunityInfo(stat.chatId!);

          // Get top performers in this community
          const topPerformers = await this.prisma.quizWinners.groupBy({
            by: ['telegramId', 'firstName'],
            where: {
              ...whereClause,
              chatId: stat.chatId,
            },
            _sum: {
              points: true,
            },
            orderBy: {
              _sum: {
                points: 'desc',
              },
            },
            take: 3,
          });

          const formattedTopPerformers = topPerformers.map((performer) => ({
            telegramId: performer.telegramId,
            firstName: performer.firstName || 'Unknown',
            points: performer._sum.points || 0,
          }));

          return {
            position: skip + index + 1,
            chatId: stat.chatId,
            communityName: communityInfo.name,
            communityType: communityInfo.type,
            communityUsername: communityInfo.username,
            totalPoints: stat._sum.points || 0,
            totalParticipants: stat._count.telegramId,
            topPerformers: formattedTopPerformers,
            inviteLink: communityInfo.inviteLink,
          };
        }),
      );

      const response = {
        data: communitiesWithInfo,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCommunities.length,
          totalPages: Math.ceil(totalCommunities.length / limit),
        },
        summary: {
          totalCommunities: totalCommunities.length,
          totalPointsDistributed: communitiesWithInfo.reduce(
            (sum, community) => sum + community.totalPoints,
            0,
          ),
          totalParticipants: communitiesWithInfo.reduce(
            (sum, community) => sum + community.totalParticipants,
            0,
          ),
        },
      };

      // Cache for 5 minutes
      await this.cacheManager.set(cacheKey, response, 300000);

      return toJSON(response);
    } catch (error) {
      console.error('Error in getCommunityLeaderboard:', error);
      throw error;
    }
  }

  async getCommunityDetails(chatId: string, startDate?: Date, endDate?: Date) {
    const cacheKey = `community-details:${chatId}:${startDate?.getTime() || 'all'}:${endDate?.getTime() || 'all'}`;

    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Build where clause
      const whereClause: any = {
        chatId: chatId,
        deletedAt: null,
      };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      // Get community info
      const communityInfo = await this.getCommunityInfo(chatId);

      // Get community statistics
      const totalStats = await this.prisma.quizWinners.aggregate({
        where: whereClause,
        _sum: {
          points: true,
        },
        _count: {
          telegramId: true,
        },
      });

      // Get unique participants count
      const uniqueParticipants = await this.prisma.quizWinners.groupBy({
        by: ['telegramId'],
        where: whereClause,
      });

      // Get top 10 performers in this community
      const topPerformers = await this.prisma.quizWinners.groupBy({
        by: ['telegramId', 'firstName', 'username'],
        where: whereClause,
        _sum: {
          points: true,
        },
        _count: {
          telegramId: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: 10,
      });

      const formattedTopPerformers = topPerformers.map((performer, index) => ({
        position: index + 1,
        telegramId: performer.telegramId,
        firstName: performer.firstName || 'Unknown',
        username: performer.username,
        points: performer._sum.points || 0,
        quizzesTaken: performer._count.telegramId,
      }));

      // Get recent activity (last 10 quiz winners)
      const recentActivity = await this.prisma.quizWinners.findMany({
        where: whereClause,
        select: {
          telegramId: true,
          firstName: true,
          username: true,
          points: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      const response = {
        community: {
          chatId,
          name: communityInfo.name,
          type: communityInfo.type,
          username: communityInfo.username,
          memberCount: communityInfo.memberCount,
          inviteLink: communityInfo.inviteLink,
        },
        statistics: {
          totalPoints: totalStats._sum.points || 0,
          totalQuizResponses: totalStats._count.telegramId,
          uniqueParticipants: uniqueParticipants.length,
          averagePointsPerParticipant:
            uniqueParticipants.length > 0
              ? Math.round(
                  (totalStats._sum.points || 0) / uniqueParticipants.length,
                )
              : 0,
        },
        topPerformers: formattedTopPerformers,
        recentActivity,
      };

      // Cache for 3 minutes
      await this.cacheManager.set(cacheKey, response, 180000);

      return toJSON(response);
    } catch (error) {
      console.error('Error in getCommunityDetails:', error);
      throw error;
    }
  }

  private async getCommunityInfo(chatId: string): Promise<{
    name: string;
    type: string;
    username?: string;
    memberCount?: number;
    inviteLink?: string;
  }> {
    const cacheKey = `community-info:${chatId}`;

    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as any;
      }

      // Try to get info from Telegram
      try {
        const chatInfo = await this.telegramService.getChatInfo(chatId);

        const info = {
          name: chatInfo.title || `Community ${chatId}`,
          type: this.formatChatType(chatInfo.type),
          username: chatInfo.username,
          memberCount: chatInfo.memberCount,
          inviteLink: chatInfo.inviteLink,
        };

        // Cache for 1 hour
        await this.cacheManager.set(cacheKey, info, 3600000);
        return info;
      } catch (telegramError) {
        // Fallback if Telegram API fails
        console.warn(
          `Failed to get Telegram info for chat ${chatId}:`,
          telegramError,
        );

        const fallbackInfo = {
          name: `Community ${chatId}`,
          type: 'Unknown',
        };

        // Cache fallback for 5 minutes (shorter cache for failed requests)
        await this.cacheManager.set(cacheKey, fallbackInfo, 300000);
        return fallbackInfo;
      }
    } catch (error) {
      console.error(`Error getting community info for ${chatId}:`, error);
      return {
        name: `Community ${chatId}`,
        type: 'Unknown',
      };
    }
  }

  private formatChatType(type: string): string {
    switch (type) {
      case 'supergroup':
        return 'Group';
      case 'channel':
        return 'Channel';
      case 'group':
        return 'Group';
      default:
        return type;
    }
  }

  private async getUserRank(userId: number): Promise<number | null> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ rank: number }>>`
        SELECT rank FROM (
          SELECT 
            "accountId", 
            RANK() OVER (ORDER BY points DESC) as rank
          FROM "GeneralUser"
        ) ranked_users
        WHERE "accountId" = ${userId}
      `;

      return result[0]?.rank || null;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  }

  private processCachedLeaderboard(cached: any, currentUserId?: number) {
    if (currentUserId && !cached.currentUser) {
      return this.getUserRank(currentUserId).then((rank) => {
        if (rank) {
          return this.prisma.generalUser
            .findUnique({
              where: { accountId: currentUserId },
              select: {
                accountId: true,
                firstName: true,
                lastName: true,
                username: true,
                points: true,
                photoUrl: true,
              },
            })
            .then((user) => ({
              ...cached,
              currentUser: user ? { ...user, position: rank } : null,
            }));
        }
        return cached;
      });
    }
    return cached;
  }

  async invalidateCache() {
    const keys = await (this.cacheManager as any).store.keys('leaderboard:*');
    const communityKeys = await (this.cacheManager as any).store.keys(
      'community-*',
    );
    await Promise.all([
      ...keys.map((key) => this.cacheManager.del(key)),
      ...communityKeys.map((key) => this.cacheManager.del(key)),
    ]);
  }

  async invalidateCommunityCache(chatId?: string) {
    if (chatId) {
      const keys = await (this.cacheManager as any).store.keys(
        `community-*${chatId}*`,
      );
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    } else {
      const keys = await (this.cacheManager as any).store.keys('community-*');
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    }
  }
}
