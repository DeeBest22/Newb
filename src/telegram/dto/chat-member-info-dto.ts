import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChatMemberInfoDto {
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
    type: Number,
    description: 'Telegram Community User Id',
    example: '420564286',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
