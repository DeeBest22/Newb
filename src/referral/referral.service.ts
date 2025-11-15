import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

// const MINI_APP_BASE_URL =
//   process.env.MINI_APP_URL || 'https://t.me/JoshNewbBot';

@Injectable()
export class ReferralService {
  MINI_APP_BASE_URL = process.env.MINI_APP_URL;
  constructor(private prisma: PrismaService) {}

  async getUserReferralLink(userId: number): Promise<{ referralLink: string }> {
    const user = await this.prisma.generalUser.findUnique({
      where: { accountId: userId },
      select: { referralCode: true },
    });

    if (!user || !user.referralCode) {
      throw new NotFoundException('User or referral code not found.');
    }

    const referralLink = `${this.MINI_APP_BASE_URL}?start=ref_${user.referralCode}`;
    return { referralLink };
  }

  async getReferredUsers(referrerId: number) {
    const referredUsers = await this.prisma.generalUser.findMany({
      where: { referredById: referrerId },
      select: {
        accountId: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        level: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return referredUsers;
  }
}
