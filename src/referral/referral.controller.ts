import { Controller, Get } from '@nestjs/common';
import { ReferralService } from './referral.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@app/auth/decorators';
import { CurrentUserData } from '@app/auth/interfaces';

@ApiTags('Referral')
@ApiBearerAuth()
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('link')
  @ApiOperation({ summary: "Get the current user's referral link" })
  @ApiResponse({
    status: 200,
    description: 'Referral link returned successfully.',
  })
  async getReferralLink(@CurrentUser() user: CurrentUserData) {
    const userId = user.accounts[0].id;
    return this.referralService.getUserReferralLink(userId);
  }

  @Get('referred-users')
  @ApiOperation({
    summary: 'Get the list of users referred by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of referred users returned successfully.',
  })
  async getReferredUsers(@CurrentUser() user: CurrentUserData) {
    const userId = user.accounts[0].id;
    return this.referralService.getReferredUsers(userId);
  }
}
