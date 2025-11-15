import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiEndpoint = (summary: string, isProtected = true): any => {
  const decorators = [
    ApiOperation({ summary }),
    ApiResponse({ status: 400, description: 'bad request.' }),
    ApiResponse({ status: 500, description: 'server error.' }),
  ];

  if (isProtected) {
    decorators.push(ApiResponse({ status: 401, description: 'unauthorized.' }));
  }

  return applyDecorators(...decorators);
};
