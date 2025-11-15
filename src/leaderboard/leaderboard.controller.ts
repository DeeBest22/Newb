import { Controller, Get, Query, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { CurrentUserData } from '@app/auth/interfaces';
import { CurrentUser } from '@app/auth/decorators';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get general user leaderboard with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'User leaderboard data with pagination info',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'number' },
              accountId: { type: 'number' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              username: { type: 'string' },
              points: { type: 'number' },
              photoUrl: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        currentUser: {
          type: 'object',
          properties: {
            position: { type: 'number' },
            accountId: { type: 'number' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            points: { type: 'number' },
            photoUrl: { type: 'string' },
          },
        },
      },
    },
  })
  async getLeaderboard(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.min(Math.max(1, Number(limit) || 10), 100);

    const response = await this.leaderboardService.getLeaderboard(
      user.accounts[0].id,
      page,
      limit,
    );
    return response;
  }

  @Get('communities')
  @ApiOperation({
    summary:
      'Get community leaderboard based on quiz points accumulated by community members',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 50)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter results from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter results until this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Community leaderboard data with pagination info',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'number' },
              chatId: { type: 'string' },
              communityName: { type: 'string' },
              communityType: { type: 'string' },
              communityUsername: { type: 'string' },
              totalPoints: { type: 'number' },
              totalParticipants: { type: 'number' },
              topPerformers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    telegramId: { type: 'string' },
                    firstName: { type: 'string' },
                    points: { type: 'number' },
                  },
                },
              },
              inviteLink: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalCommunities: { type: 'number' },
            totalPointsDistributed: { type: 'number' },
            totalParticipants: { type: 'number' },
          },
        },
      },
    },
  })
  async getCommunityLeaderboard(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.min(Math.max(1, Number(limit) || 10), 50);

    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    // Validate dates
    if (startDate && isNaN(startDateObj!.getTime())) {
      throw new Error('Invalid startDate format. Use ISO 8601 format.');
    }
    if (endDate && isNaN(endDateObj!.getTime())) {
      throw new Error('Invalid endDate format. Use ISO 8601 format.');
    }
    if (startDateObj && endDateObj && startDateObj > endDateObj) {
      throw new Error('startDate cannot be later than endDate.');
    }

    const response = await this.leaderboardService.getCommunityLeaderboard(
      page,
      limit,
      startDateObj,
      endDateObj,
    );
    return response;
  }

  @Get('communities/:chatId')
  @ApiOperation({
    summary:
      'Get detailed information about a specific community including leaderboard and statistics',
  })
  @ApiParam({
    name: 'chatId',
    type: String,
    description: 'Telegram chat ID of the community',
    example: '-1002785322930',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter results from this date (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter results until this date (ISO 8601 format)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Detailed community information with leaderboard and statistics',
    schema: {
      type: 'object',
      properties: {
        community: {
          type: 'object',
          properties: {
            chatId: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            username: { type: 'string' },
            memberCount: { type: 'number' },
            inviteLink: { type: 'string' },
          },
        },
        statistics: {
          type: 'object',
          properties: {
            totalPoints: { type: 'number' },
            totalQuizResponses: { type: 'number' },
            uniqueParticipants: { type: 'number' },
            averagePointsPerParticipant: { type: 'number' },
          },
        },
        topPerformers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'number' },
              telegramId: { type: 'string' },
              firstName: { type: 'string' },
              username: { type: 'string' },
              points: { type: 'number' },
              quizzesTaken: { type: 'number' },
            },
          },
        },
        recentActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              telegramId: { type: 'string' },
              firstName: { type: 'string' },
              username: { type: 'string' },
              points: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getCommunityDetails(
    @Param('chatId') chatId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    // Validate dates
    if (startDate && isNaN(startDateObj!.getTime())) {
      throw new Error('Invalid startDate format. Use ISO 8601 format.');
    }
    if (endDate && isNaN(endDateObj!.getTime())) {
      throw new Error('Invalid endDate format. Use ISO 8601 format.');
    }
    if (startDateObj && endDateObj && startDateObj > endDateObj) {
      throw new Error('startDate cannot be later than endDate.');
    }

    const response = await this.leaderboardService.getCommunityDetails(
      chatId,
      startDateObj,
      endDateObj,
    );
    return response;
  }
}
