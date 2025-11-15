import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request as ExpressRequest } from 'express';

interface Request extends ExpressRequest {
  user?: any;
}
import { Observable } from 'rxjs';
import { AccountDatabaseService } from '../db/accounts.db.service';

@Injectable()
export class AccountUpdateInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly accountDbService: AccountDatabaseService,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const accountId = request.params.id;

    if (accountId) {
      this.accountDbService.findById(+accountId).then((account) => {
        request.body.accountType = account.type;
      });
    } else {
      request.body.accountType = request.user;
    }

    return next.handle();
  }
}
