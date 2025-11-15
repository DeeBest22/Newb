import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendAutoDeleteMessageDto {
  @ApiProperty({
    type: String,
    description: 'Telegram Community chat Id',
    example: '-1002785322930',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @ApiProperty({
    type: String,
    description: 'message',
    example:
      'Do not forget to go claim youe point at\n\n https://t.me/NewbNetBot',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: String,
    description: 'message',
    example: {
      text: '👋Launch',
      webAppUrl: 'https://t.me/NewbNetBot',
      isWebApp: true,
    },
    required: true,
  })
  @IsOptional()
  @IsString()
  button?: {
    text: string;
    url: string;
    isWebApp?: boolean;
  };
}
