import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetPagination = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    const paginationParams = {
      limit: Number(req.query.limit) || 10,
      min: 1,
      max: 100,
      sort_by: req.query.sort_by || '',
      page: Number(req.query.page) || 1,
      ...req.query,
      url: req.originalUrl,
    };

    let limit = paginationParams.limit ? paginationParams.limit : 0;
    let skip = paginationParams.limit
      ? paginationParams.page
        ? (paginationParams.page - 1) * paginationParams.limit
        : 0
      : 0;
    const sortBy = paginationParams.sort_by
      ? paginationParams.sort_by.toString().split('.')
      : [];

    if (req.query.limit) {
      const tmp = Number(req.query.limit);
      if (!Number.isNaN(tmp)) {
        limit = tmp;
      }
    }
    if (req.query.skip) {
      const tmp = Number(req.query.skip);
      if (!Number.isNaN(tmp) && tmp > 0) {
        skip = tmp;
      }
    }

    if (paginationParams.max) {
      limit = Math.min(limit, paginationParams.max);
    }

    if (paginationParams.min) {
      limit = Math.max(limit, paginationParams.min);
    }

    const { dir, key } = {
      key: paginationParams.sort_by ? sortBy[0] : 'id',
      dir: paginationParams.sort_by ? sortBy[1] : 'asc',
    };

    return {
      query: req.query,
      skip,
      key,
      dir,
      ...paginationParams,
    };
  },
);
