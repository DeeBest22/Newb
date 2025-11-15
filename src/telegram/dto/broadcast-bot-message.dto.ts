import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BroadcastMessageDto {
  @ApiProperty({
    description: 'The message content to broadcast to all users.',
    example:
      'Yo Newb!\nTime to hit the books (the fun kind)! 📚 Go grab a lesson, claim your daily quota ⚡, and don’t ghost your taxes  they miss you! 🧾\n\nLearn stuff. Get points. Rule the chain.👑',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
