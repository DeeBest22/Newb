import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateWaitlistDto {
  @ApiProperty({
    type: String,
    description: 'The email of the user',
    example: 'example@email.com',
    required: true,
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Telegram username of the user',
    example: 'laughter',
    required: false,
  })
  @IsString()
  @IsOptional()
  telegramUsername: string;

  @ApiProperty({
    type: String,
    description: 'Referral code of the user',
    example: 'josh',
    required: false,
  })
  @IsString()
  @IsOptional()
  ref: string;
}
