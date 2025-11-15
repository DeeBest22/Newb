import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetOneInviteLinkDto {
  @ApiProperty({
    type: String,
    description: 'Telegram chat ID (group or channel)',
    example: '-1002785322930',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  chatId: string;
}
