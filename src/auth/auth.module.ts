import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/core/database/prisma.service';
import { HashingService } from './hashing.service';
import { AccountDatabaseService } from './db/accounts.db.service';
import { UserService } from './user.service';
import { UserDatabaseService } from './db/user.db.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { REQUEST_USER_KEY } from './constants/auth.constants';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { AccountsGuard, JwtAuthGuard } from './guards';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LocalStrategy } from './strategies';
import { ThrottlerModule } from '@nestjs/throttler';
import { TelegramAuthController } from './telegram-auth.controller';
import { TelegramVerificationService } from './telegram-verification.service';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: REQUEST_USER_KEY,
      session: false,
    }),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // Time-to-live in milliseconds (e.g., 60 seconds)
          limit: 10, // Maximum number of requests within the TTL
        },
      ],
    }),
  ],
  controllers: [AuthController, TelegramAuthController],
  providers: [
    JwtStrategy,
    AuthService,
    PrismaService,
    HashingService,
    AccountDatabaseService,
    UserService,
    UserDatabaseService,
    TelegramVerificationService,
    LocalStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AccountsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AuthService, HashingService, TelegramVerificationService],
})
export class AuthModule {}
