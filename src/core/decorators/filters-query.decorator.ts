import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const FiltersQuery = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();

    // Destructure query parameters with optional accountId
    const { sortBy, limit, page, ...search } = req.query;

    //let sortKey: string;

    const sortKey = req.query.accountId
      ? 'accountId'
      : sortBy?.toString().split('.')[0];

    const sortDir =
      sortKey === 'accountId'
        ? 'desc'
        : sortBy
          ? sortBy.toString().split('.')[1]
          : 'desc';

    return {
      sortKey,
      sortDir,
      ...search,
      limit,
      page,
    };
  },
);
