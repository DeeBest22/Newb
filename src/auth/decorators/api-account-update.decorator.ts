import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpdateAdminDto, UpdateGeneralUserDto } from '../dto';

export const ApiAccountUpdate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update Authenticated Account Profile',
    }),
    ApiExtraModels(UpdateAdminDto, UpdateGeneralUserDto),
    ApiBody({
      schema: {
        oneOf: [
          {
            $ref: getSchemaPath(UpdateAdminDto),
          },
          {
            $ref: getSchemaPath(UpdateGeneralUserDto),
          },
        ],
      },
    }),
  );
