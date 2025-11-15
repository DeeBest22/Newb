// telegram-verification.service.ts
import { Injectable } from '@nestjs/common';
import { AuthDataValidator } from '@telegram-auth/server';
import { urlStrToAuthDataMap } from '@telegram-auth/server/utils';

@Injectable()
export class TelegramVerificationService {
  private readonly validator: AuthDataValidator;

  constructor() {
    this.validator = new AuthDataValidator({
      botToken: process.env.TELEGRAM_BOT_TOKEN, // Use env var for security
    });
  }

  async extractTelegramUserData(initData: string): Promise<any> {
    // initData is expected to be like: "id=12345&first_name=John&...&hash=abcdef..."
    const dataMap = urlStrToAuthDataMap(
      `https://newb-bot.vercel.app/?${initData}`,
    );

    try {
      const user = await this.validator.validate(dataMap);
      return user;
    } catch (err) {
      console.error('Telegram auth validation failed:', err);
      throw new Error('Invalid Telegram authentication data');
    }
  }
}
