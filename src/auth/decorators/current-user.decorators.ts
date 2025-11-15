import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { CurrentUserData } from '../interfaces';

export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: CurrentUserData | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
