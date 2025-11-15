import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountType } from '@prisma/client';
import { Observable } from 'rxjs';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { ACCOUNTS_KEY } from '../decorators/accounts.decorator';
import { CurrentUserData } from '../interfaces';

@Injectable()
export class AccountsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const contextAccounts = this.reflector.getAllAndOverride<AccountType[]>(
      ACCOUNTS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!contextAccounts) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserData | undefined = request[REQUEST_USER_KEY];
    if (!user) {
      return false;
    }
    const accountType = user.account.type;
    const accountId = user.account.id;
    // Append Current User AccountID to request body and query
    if (
      user.account.type !== AccountType.ADMIN &&
      user.account.type !== AccountType.GENERAL_USER
    ) {
      request.body['accountId'] = accountId;
      request.query['accountId'] = accountId;
      // Hack to append ID to request for updating account profile
      if (request.url === '/accounts') {
        request.body['id'] = accountId;
      }
    }

    return contextAccounts.some((account) => accountType === account);
  }
}
