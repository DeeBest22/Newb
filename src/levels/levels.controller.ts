import { Controller, Get } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { CurrentUser } from '@app/auth/decorators';
import { CurrentUserData } from '@app/auth/interfaces';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Accounts } from '@app/auth/decorators/accounts.decorator';
import { AccountType } from '@prisma/client';

@ApiTags('levels')
@ApiBearerAuth()
@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @ApiOperation({ summary: 'Get user level' })
  @ApiResponse({
    status: 200,
    description: 'user level retrieved successfully',
  })
  @Get()
  async getLevelInfo(@CurrentUser() user: CurrentUserData) {
    const levelInfo = await this.levelsService.calculateLevel(
      user.accounts[0].id,
    );
    const rank = await this.levelsService.getLeaderboardPosition(
      user.accounts[0].id,
    );

    return {
      ...levelInfo,
      rank,
    };
  }
}
