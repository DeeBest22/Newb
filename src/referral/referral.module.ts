import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { PrismaService } from '@app/core/database/prisma.service';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService, PrismaService],
})
export class ReferralModule {}
