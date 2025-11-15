import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetChatTitleDto {
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
    description: 'Set chat title for a community',
    example: 'My Title',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;
}
