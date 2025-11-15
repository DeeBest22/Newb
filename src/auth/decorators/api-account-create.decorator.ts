import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  getSchemaPath,
} from '@nestjs/swagger';

import { AccountType } from '@prisma/client';
import { CreateAdminDto } from '../dto/admin/create-admin.dto';
import { CreateGeneralUserDto } from '../dto/general-user/create-general-user.dto';

export const ApiAccountCreate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create an Account',
      description: `Creates an account based on an account type( ${Object.values(
        AccountType,
      ).join(', ')})`,
    }),
    ApiExtraModels(CreateAdminDto, CreateGeneralUserDto),
    ApiBody({
      schema: {
        oneOf: [
          {
            $ref: getSchemaPath(CreateAdminDto),
          },
          {
            $ref: getSchemaPath(CreateGeneralUserDto),
          },
        ],
      },
    }),
  );
