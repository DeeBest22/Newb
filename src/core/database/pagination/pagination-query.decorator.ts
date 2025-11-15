import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const PaginationQuery = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();

    const { limit, page } = req.query;

    const parsedLimit = limit ? parseInt(limit.toString(), 10) : 10;
    const parsedPage = page ? parseInt(page.toString(), 10) : 1;

    const skip = (parsedPage - 1) * parsedLimit;

    return {
      limit: parsedLimit,
      skip,
      page: parsedPage,
    };
  },
);
