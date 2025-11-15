import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { AccountType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { CreateAccountDto } from '../create-account.dto';

export class CreateGeneralUserDto extends PickType(CreateAccountDto, [
  'accountType',
]) {
  @ApiProperty({
    enum: AccountType,
  })
  @ApiProperty({
    type: String,
    description: 'User Email',
    example: 'josh@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    type: String,
    description: 'Account Type',
    enum: ['GENERAL_USER'],
  })
  accountType: AccountType;

  @ApiProperty({
    type: String,
    description: 'User First Name',
    example: 'Josh',
  })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    type: Number,
    description: 'Telegram User Id',
    example: 12345,
  })
  @IsNotEmpty()
  telegramId: number;

  @ApiProperty({
    type: String,
    description: 'User Last Name',
    example: 'Doe',
  })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    type: String,
    description: 'Username',
    example: 'josh',
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    type: String,
    description: 'User Phone Number',
    example: '08123456789',
  })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'User Password',
    example: 'password',
  })
  @IsNotEmpty()
  password: string;
}
