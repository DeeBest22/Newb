import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSingleImageDto {
  @ApiProperty({
    description:
      'The Telegram chat ID of the channel or group (e.g., -123456789 or @channelname)',
    example: '-1002785322930',
  })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({
    description: 'The caption to accompany the image (optional)',
    example: 'Check out this awesome image!',
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;
}
