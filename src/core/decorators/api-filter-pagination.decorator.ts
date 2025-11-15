import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export const ApiFilterPagination = (summary: string): any => {
  return applyDecorators(
    ApiOperation({
      summary,
    }),
    ApiQuery({ name: 'search', type: 'string', required: false }),
    ApiQuery({ name: 'page', type: 'number', required: false }),
    ApiQuery({ name: 'sortBy', type: 'string', required: false }),
    ApiResponse({
      status: 200,
      description: 'Ok',
    }),
  );
};
