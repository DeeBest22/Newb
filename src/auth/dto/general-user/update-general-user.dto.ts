import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { UpdateAccountDto } from '../update-account.dto';
import { CreateGeneralUserDto } from './create-general-user.dto';

export class UpdateGeneralUserDto extends IntersectionType(
  PickType(UpdateAccountDto, ['id']),
  PartialType(OmitType(CreateGeneralUserDto, ['accountType'])),
) {}
