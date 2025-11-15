import { SetMetadata } from '@nestjs/common';

export const ACCOUNTS_KEY = 'accounts';

export const Accounts = (...accounts: string[]) =>
  SetMetadata(ACCOUNTS_KEY, accounts);
