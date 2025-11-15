import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TelegramAuthDto {
  @ApiProperty({ description: 'Telegram user ID' })
  @IsNumber()
  id: bigint;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  photo_url?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  auth_date?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  hash?: string;
}
