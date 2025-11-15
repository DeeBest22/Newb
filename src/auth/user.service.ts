import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { omit } from '@app/core/utils/functions';
import { PrismaService } from '@app/core/database/prisma.service';
import { HashingService } from './hashing.service';
import { UserDatabaseService } from './db/user.db.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import ResetPasswordDto from './dto/reser-password.dto';
import { AccountType, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class UserService {
  constructor(
    private readonly userDatabaseService: UserDatabaseService,
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
  ) {}

  async createTelegramUser(
    telegramData: {
      telegramId: bigint;
      firstName?: string;
      lastName?: string;
      username?: string;
      photoUrl?: string;
    },
    referrerId?: number | null,
    pointsToAward?: number | null,
  ) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: telegramData.firstName?.toUpperCase().trim() || 'Newbie',
            lastName: telegramData.lastName?.toUpperCase().trim(),
            email: `telegram_${telegramData.telegramId}_${nanoid(5)}@example.com`,
            password: '',
            isActivated: true,
            isTermsAccepted: true,
          },
        });

        const account = await tx.account.create({
          data: {
            type: AccountType.GENERAL_USER,
            users: {
              connect: { id: user.id },
            },
          },
          include: { users: { select: { id: true, email: true } } },
        });

        const generalUser = await tx.generalUser.create({
          data: {
            accountId: account.id,
            telegramId: telegramData.telegramId,
            firstName: telegramData.firstName,
            lastName: telegramData.lastName,
            username: telegramData.username,
            photoUrl: telegramData.photoUrl,
            referralCode: nanoid(10),
            referredById: referrerId ?? null,
            points: 0,
            level: 1,
          },
        });

        if (referrerId && pointsToAward && pointsToAward > 0) {
          await tx.generalUser.update({
            where: { accountId: referrerId },
            data: { points: { increment: pointsToAward } },
          });
        }

        return { user, account, generalUser };
      });
    } catch (error) {
      console.error('Error during createTelegramUser transaction:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new InternalServerErrorException(
          'Failed to create user due to potential conflict.',
        );
      }
      throw new InternalServerErrorException(
        'Failed to create Telegram user account.',
      );
    }
  }

  async create(data: any, tx: any = null) {
    if (!data.password) {
      throw new BadRequestException(
        'Password is required for non-Telegram users',
      );
    }

    const baseData = {
      email: data.email.toLowerCase().trim(),
      firstName: data.firstName.toUpperCase().trim(),
      lastName: data.lastName.toUpperCase().trim(),
      password: await this.hashingService.hashPassword(data.password),
    };

    return await this.userDatabaseService.create(
      {
        ...data,
        ...baseData,
      },
      tx,
    );
  }

  async findAll(filterOptions: any, paginationOptions: any) {
    const [data, totalCount] = await this.userDatabaseService.findAll(
      filterOptions,
      paginationOptions,
      ['accounts'] as string[],
    );
    return { data, totalCount };
  }

  async findOne(id: number) {
    return this.userDatabaseService.findById(id, ['accounts']);
  }

  async update(id: number, data: any) {
    let updateData = omit(data, ['accountId']);

    if (data?.firstName) {
      updateData = {
        ...updateData,
        firstName: data.firstName.toUpperCase().trim(),
      };
    }

    if (data?.lastName) {
      updateData = {
        ...updateData,
        lastName: data.lastName.toUpperCase().trim(),
      };
    }

    if (data?.email) {
      updateData = {
        ...updateData,
        email: data.email.toLowerCase().trim(),
      };
    }

    return await this.userDatabaseService.update(id, updateData);
  }

  async changePassword(
    id: number,
    { oldPassword, newPassword }: ChangePasswordDto,
  ) {
    const user = await this.userDatabaseService.findFirst({ id });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isValidPassword = await this.hashingService.comparePasswords(
      oldPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new BadRequestException('The provided password is incorrect');
    }
    const hashedNewPassword =
      await this.hashingService.hashPassword(newPassword);

    await this.userDatabaseService.update(user.id, {
      password: hashedNewPassword,
      isFirstLogin: false,
    });

    return { message: 'Password changed successfully' };
  }

  async resetPassword(email: string, { password }: ResetPasswordDto) {
    const user = await this.userDatabaseService.findFirst({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.password = await this.hashingService.hashPassword(password);

    await this.userDatabaseService.update(user.id, user);

    return { message: 'Password changed successfully' };
  }

  async delete(id: number) {
    return this.userDatabaseService.delete(id);
  }

  async userExists(email: string) {
    const user = await this.userDatabaseService.findFirst({ email });
    return !!user;
  }
}
