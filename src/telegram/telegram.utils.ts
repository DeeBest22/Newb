import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramUtils {
  constructor(private readonly botToken: string) {}

  verifyWebAppData(initData: string): boolean {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    // Remove hash and sort remaining parameters
    params.delete('hash');
    const dataToCheck: string[] = [];
    params.sort();
    params.forEach((val, key) => {
      dataToCheck.push(`${key}=${val}`);
    });

    // Create verification hash
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataToCheck.join('\n'))
      .digest('hex');

    return calculatedHash === hash;
  }

  parseWebAppData(initData: string): TelegramWebAppData {
    if (!this.verifyWebAppData(initData)) {
      throw new Error('Invalid Telegram data');
    }

    const params = new URLSearchParams(initData);
    return {
      user: {
        id: parseInt(params.get('user.id') ?? '0'),
        first_name: params.get('user.first_name') ?? undefined,
        last_name: params.get('user.last_name') ?? undefined,
        username: params.get('user.username') ?? undefined,
      },
      auth_date: parseInt(params.get('auth_date') ?? '0'),
    };
  }

  isDataFresh(auth_date: number, maxAgeSeconds = 3600): boolean {
    return Date.now() / 1000 - auth_date <= maxAgeSeconds;
  }
}

interface TelegramWebAppData {
  user: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  auth_date: number;
}
