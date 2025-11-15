import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TelegramLoginDto {
  @ApiProperty({ description: 'Telegram initData string', type: String })
  @IsString()
  @IsNotEmpty()
  initData: string;

  @ApiProperty({
    description: 'Optional start parameter from Telegram deep link',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  startParam?: string;
}
