import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetChatDescriptionDto {
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
    description: 'Set chat description for a community',
    example: 'My description',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
