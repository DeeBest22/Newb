import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class GetInviteLinkDto {
  @ApiProperty({
    type: String,
    description: 'Telegram chat ID (group or channel)',
    example: '-1002785322930',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @ApiProperty({
    type: String,
    description: 'Optional name for the invite link',
    example: 'Special Access Link',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: Number,
    description: 'Optional expiration date as Unix timestamp',
    example: 1735689600,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  expireDate?: number;

  @ApiProperty({
    type: Number,
    description:
      'Optional maximum number of users that can join using this link (1-99999)',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99999)
  memberLimit?: number;
}
