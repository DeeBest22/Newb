import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreatePollDto {
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
    description: 'The question for the poll (1-300 characters).',
    example: 'What is your favorite crypto?',
  })
  @IsString()
  @IsNotEmpty()
  question: 'What is your favorite crypto?';

  @ApiProperty({
    description:
      'An array of poll options (2-10 strings, 1-100 characters each).',
    example: ['Bitcoin', 'Ethereum', 'Solana', 'Other'],
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error('Invalid JSON format for options');
      }
    }
    return value;
  })
  options: string[];
}
