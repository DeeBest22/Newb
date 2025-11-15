import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Account, Prisma } from '@prisma/client';
import { AccountType } from '@prisma/client';
import { AccountDatabaseService } from './db/accounts.db.service';
import { HashingService } from './hashing.service';
import { pick, validateAccountId } from '@app/core/utils/functions';
import { UserService } from './user.service';
import { UserDatabaseService } from './db/user.db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from './config/jwt.config';

// Ensure refreshSecret is part of the configuration type
declare module './config/jwt.config' {
  interface JwtConfig {
    refreshSecret: string | undefined;
  }
}
import { JwtPayload } from './interfaces';
import { LoginDto } from './dto/login.dto';
import { ValidationException } from '@app/core/utils/errors/http-error.filter';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramVerificationService } from './telegram-verification.service';

// Define Referral Award Amount
const REFERRAL_POINTS_AWARD = 1000;
const REFERRAL_PARAM_PREFIX = 'ref_';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountsDbService: AccountDatabaseService,
    private readonly hashingService: HashingService,
    private readonly userService: UserService,
    private readonly userDatabaseService: UserDatabaseService,
    private jwtService: JwtService,
    // private logger: Logger,
    // private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly telegramVerificationService: TelegramVerificationService,
  ) {}

  async telegramLogin(initData: string, startParam?: string) {
    try {
      // console.log('Raw startParam received:', startParam);
      if (startParam) {
        // console.log('Processing startParam:', startParam);
        if (startParam.startsWith(REFERRAL_PARAM_PREFIX)) {
          const referralCode = startParam.substring(
            REFERRAL_PARAM_PREFIX.length,
          );
          console.log('Extracted referral code:', referralCode);
        }
      }

      const telegramData =
        await this.telegramVerificationService.extractTelegramUserData(
          initData,
        );
      console.log('telegramLogin: Telegram Data Extracted:', telegramData);
      const telegramIdBigInt = BigInt(telegramData.id);
      const telegramIdString = telegramData.id.toString();

      const existingGeneralUser =
        await this.prismaService.generalUser.findUnique({
          where: { telegramId: telegramIdBigInt },
          include: { account: { include: { users: true } } },
        });

      // --- Logic for EXISTING User ---
      if (existingGeneralUser) {
        console.log(
          `telegramLogin: Existing user found: TGID ${telegramIdBigInt}, AccountID ${existingGeneralUser.accountId}`,
        );
        await this.prismaService.generalUser.update({
          where: { accountId: existingGeneralUser.accountId },
          data: { updatedAt: new Date() },
        });

        const tokens = await this.generateTokens(existingGeneralUser.account);

        // --- NEW LOGIC START ---
        const pointsToClaim = await this._claimQuizWinnings(telegramIdString);
        // --- NEW LOGIC END ---

        console.log('telegramLogin tokens & points:', {
          ...tokens,
          pointsToClaim,
        });

        return { ...tokens, pointsToClaim };
      }

      // --- Logic for NEW User ---
      console.log(`telegramLogin: New user detected: TGID ${telegramIdBigInt}`);
      let referrerId: number | null = null;

      if (startParam && startParam.startsWith(REFERRAL_PARAM_PREFIX)) {
        const referralCode = startParam.substring(REFERRAL_PARAM_PREFIX.length);
        if (referralCode) {
          console.log(
            `telegramLogin: Searching for referrer with code: ${referralCode}`,
          );
          const referrerUser = await this.prismaService.generalUser.findUnique({
            where: { referralCode: referralCode },
            select: { accountId: true, telegramId: true },
          });

          if (referrerUser && referrerUser.telegramId !== telegramIdBigInt) {
            referrerId = referrerUser.accountId;
            console.log(`telegramLogin: Referrer found: ID ${referrerId}`);
          } else if (referrerUser) {
            console.log(
              `telegramLogin: Self-referral attempt detected for TGID ${telegramIdBigInt}`,
            );
          } else {
            console.log(
              `telegramLogin: Referrer with code ${referralCode} not found.`,
            );
          }
        }
      }

      console.log(
        `telegramLogin: Calling createTelegramUser for TGID ${telegramIdBigInt} with referrerId: ${referrerId}`,
      );

      const { user, account } = await this.userService.createTelegramUser(
        {
          telegramId: telegramIdBigInt,
          firstName: telegramData.first_name,
          lastName: telegramData.last_name,
          username: telegramData.username,
          photoUrl: telegramData.photo_url,
        },
        referrerId,
        REFERRAL_POINTS_AWARD,
      );
      console.log(
        `telegramLogin: New user created. UserID: ${user.id}, AccountID: ${account.id}`,
      );

      if (!account.users) {
        account.users = [{ id: user.id, email: user.email || '' }];
      }

      const tokens = await this.generateTokens(
        account as Account & { users: { id: number; email: string }[] },
      );

      const pointsToClaim = await this._claimQuizWinnings(telegramIdString);

      console.log('telegramLogin tokens & points (new user):', {
        ...tokens,
        pointsToClaim,
      });

      return { ...tokens, pointsToClaim };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        console.error(
          'Telegram login error: Potential duplicate user detected during creation.',
          error,
        );
        throw new ConflictException('User already exists.');
      }
      console.error('Telegram login error:', error);
      throw new BadRequestException('Authentication failed.');
    }
  }

  // Modified create method to handle different account types
  async create(data: any) {
    const { accountType, ...userData } = data;

    // Validate account type
    if (!Object.values(AccountType).includes(accountType)) {
      throw new BadRequestException('Invalid account type');
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        // Create base user (different handling for Telegram vs email/password users)
        const user = await tx.user.create({
          data: {
            firstName: userData.firstName?.toUpperCase(),
            lastName: userData.lastName?.toUpperCase(),
            email:
              accountType !== AccountType.GENERAL_USER
                ? userData.email.toLowerCase()
                : `${userData.firstName}.${userData.lastName}@example.com`,
            password:
              accountType !== AccountType.GENERAL_USER
                ? await this.hashingService.hashPassword(userData.password)
                : '',
            isActivated: true,
            isTermsAccepted: accountType === AccountType.GENERAL_USER,
          },
        });

        // Create account
        const account = await tx.account.create({
          data: {
            type: accountType,
            users: {
              connect: { id: user.id },
            },
          },
        });

        // Create account-specific data
        switch (accountType) {
          case AccountType.ADMIN:
            await tx.admin.create({
              data: {
                accountId: account.id,
                email: userData.email.toLowerCase(),
                firstName: userData.firstName?.toUpperCase(),
                lastName: userData.lastName?.toUpperCase(),
                phone: userData.phone,
              },
            });
            break;

          case AccountType.GENERAL_USER:
            await tx.generalUser.create({
              data: {
                accountId: account.id,
                telegramId: userData.telegramId,
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
              },
            });
            break;

          default:
            throw new BadRequestException('Unsupported account type');
        }

        // Send welcome email for admin users
        if (accountType === AccountType.ADMIN) {
          await this.sendAdminWelcomeEmail({
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName}`,
          });
        }

        return { user, account };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('User already exists');
        }
      }
      console.error('Error creating account:', error);
      throw new BadRequestException('Failed to create account');
    }
  }

  async login(data: LoginDto) {
    const { email, password } = data;
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const lowercaseEmail = email.toLowerCase(); // Cast email to lowercase
    const user = await this.userDatabaseService.findFirst({
      email: lowercaseEmail,
    });
    if (!user) {
      throw new NotFoundException('User not found');
      // return null;
    }
    const isValidPassword = await this.hashingService.comparePasswords(
      password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid Credentials'); // Invalid password
    }

    if (!user.accounts || user.accounts.length === 0) {
      throw new UnauthorizedException('No Accounts created for user');
    }

    if (validateAccountId(user.accountId, user.accounts)) {
      throw new UnauthorizedException('Invalid Account Specified');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        email: user.email,
        currentAccountId: user.accounts[0].id,
        currentAccountType: user.accounts[0].type,
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      },
    );

    try {
      await this.userDatabaseService.update(user.id, {
        lastLogin: new Date(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }

    return { accessToken: accessToken };
  }

  async findAll(filterOptions, paginationOptions) {
    if (
      filterOptions.type &&
      Object.keys(AccountType).includes(filterOptions.type)
    ) {
      const [data, totalCount] = await this.accountsDbService.findAll(
        {
          ...filterOptions,
        },
        paginationOptions,
      );
      return { data, totalCount };
    }

    throw new ValidationException({
      type: 'Account type is required',
    });
  }

  async findOne(id: number, relations: string[] = []) {
    const account = await this.accountsDbService.findById(id, relations);
    // console.log('Account: ', account);

    if (!account || account.deletedAt) {
      throw new BadRequestException('Account not found or has been deleted');
    }

    // if (
    //   account.type === AccountType.STAFF ||
    //   account.type === AccountType.GENERAL_USER
    // ) {
    //   const accountTypeData = await this.accountsDbService.findAccountTypeData(
    //     account.id,
    //     account.type,
    //     // ['school.school'],
    //   );

    //   return {
    //     [account.type.toLowerCase()]: accountTypeData,
    //   };
    // }
    const accountTypeData = await this.accountsDbService.findAccountTypeData(
      account.id,
      account.type,
    );

    return {
      [account.type.toLowerCase()]: accountTypeData,
    };
  }

  async update(id: number, data) {
    const account = await this.accountsDbService.update(id, data);
    if (
      [AccountType.ADMIN, AccountType.GENERAL_USER].includes(
        account?.type as any,
      )
    ) {
      const userData = pick(data, ['firstName', 'lastName', 'email']);

      const userId = account?.users[0]?.id;

      if (userId) {
        await this.userService.update(userId, userData);
      }
    }

    return account;
  }

  async updatePoints(id: number, dto) {
    // First verify user exists
    const user = await this.prismaService.generalUser.findUnique({
      where: { accountId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const newPoints = user.points + dto.points;

    return await this.prismaService.generalUser.update({
      where: { accountId: id },
      data: {
        points: newPoints,
        updatedAt: new Date(),
      },
    });
  }

  async FindByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      include: {
        accounts: {
          include: {
            admin: true,
            general_user: true,
          },
        },
      },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} account`;
  }

  private async generateTokens(
    account: Account & { users: { id: number; email: string }[] },
  ) {
    const user = account.users[0];
    const payload: JwtPayload = {
      sub: user.id,
      currentAccountId: account.id,
      currentAccountType: account.type,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.refreshTokenTtl,
      }),
    ]);

    // Store hashed refresh token
    await this.userDatabaseService.update(user.id, {
      hashedRt: await this.hashingService.hashPassword(refreshToken),
    });

    return { accessToken, refreshToken };
  }

  private async sendAdminWelcomeEmail(data: { email: string; name: string }) {
    // Implement your email sending logic here
    console.log(`Sending welcome email to admin: ${data.email}`);
  }

  // --- 👇 ADD THIS NEW PRIVATE METHOD ---
  /**
   * Checks for unclaimed quiz winnings, aggregates points, and marks them as claimed.
   * @param telegramId The user's Telegram ID.
   * @returns The total number of points available to be claimed.
   */
  private async _claimQuizWinnings(telegramId: string): Promise<number> {
    const unclaimedWinnings = await this.prismaService.quizWinners.findMany({
      where: {
        telegramId: telegramId,
        isClaimed: false,
      },
    });

    if (!unclaimedWinnings || unclaimedWinnings.length === 0) {
      return 0; // No points to claim
    }

    // Calculate the total points from all unclaimed wins
    const pointsToClaim = unclaimedWinnings.reduce(
      (sum, winner) => sum + winner.points,
      0,
    );

    // Mark these specific winnings as claimed in the database
    await this.prismaService.quizWinners.updateMany({
      where: {
        telegramId: telegramId,
        isClaimed: false,
      },
      data: {
        isClaimed: true,
      },
    });

    Logger.log(
      `User with Telegram ID ${telegramId} has ${pointsToClaim} quiz points ready to be claimed.`,
    );

    return pointsToClaim;
  }
}
