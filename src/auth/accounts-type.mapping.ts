import { AccountType } from '@prisma/client';
import { CreateAdminDto } from './dto/admin/create-admin.dto';
import { UpdateAdminDto } from './dto/admin/update-admin.dto';
import { CreateGeneralUserDto } from './dto/general-user/create-general-user.dto';
import { UpdateGeneralUserDto } from './dto/general-user/update-general-user.dto';

type Options = {
  fillable: string[];
  relations: string[];
  searchable: string[];
  createDto: any;
  updateDto: any;
};

export type AccountTypeMapping = Record<
  (typeof AccountType)[keyof typeof AccountType],
  Options
>;
export const accountTypeMapping: AccountTypeMapping = {
  [AccountType.ADMIN]: {
    fillable: ['firstName', 'lastName', 'email', 'phone', 'password'],
    relations: ['account'],
    searchable: ['firstName', 'lastName', 'email'],
    createDto: CreateAdminDto,
    updateDto: UpdateAdminDto,
  },
  [AccountType.GENERAL_USER]: {
    fillable: ['firstName', 'lastName', 'username', 'telegramId'],
    relations: ['account'],
    searchable: ['firstName', 'lastName', 'username'],
    createDto: CreateGeneralUserDto,
    updateDto: UpdateGeneralUserDto,
  },
};
