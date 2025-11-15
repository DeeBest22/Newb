import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { AccountType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { CreateAccountDto } from '../create-account.dto';

export class CreateAdminDto extends PickType(CreateAccountDto, [
  'accountType',
]) {
  @ApiProperty({
    enum: AccountType,
  })
  @ApiProperty({
    type: String,
    description: 'Admin Email',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    type: String,
    description: 'Account Type',
    enum: ['ADMIN'],
  })
  accountType: AccountType;

  @ApiProperty({
    type: String,
    description: 'Admin First Name',
  })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    type: String,
    description: 'Admin Last Name',
  })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    type: String,
    description: 'Admin Phone NUmber',
  })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Admin Password',
    example: 'password',
  })
  @IsNotEmpty()
  password: string;
}
