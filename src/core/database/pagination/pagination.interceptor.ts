import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { limit, page } = req.query;

    return next.handle().pipe(
      map((payload) => ({
        data: payload.data,
        meta: {
          totalCount: payload.totalCount,
          limit: limit ? parseInt(limit.toString(), 10) : 10,
          page: page ? parseInt(page.toString(), 10) : 1,
        },
      })),
    );
  }
}
