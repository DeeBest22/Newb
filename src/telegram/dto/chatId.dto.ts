import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatIdDto {
  @ApiProperty({
    type: String,
    description: 'Telegram Community chat Id',
    example: '-1002785322930',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  chatId: string;
}
