import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { UpdateAccountDto } from '../update-account.dto';
import { CreateAdminDto } from './create-admin.dto';

export class UpdateAdminDto extends IntersectionType(
  PickType(UpdateAccountDto, ['id']),
  PartialType(OmitType(CreateAdminDto, ['accountType'])),
) {}
