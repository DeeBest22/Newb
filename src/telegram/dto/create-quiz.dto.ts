import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateQuizDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the chat (channel or group) to send the quiz to.',
    example: '-1002785322930',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  chatId: string;

  @ApiProperty({
    type: String,
    description: 'The question for the quiz (1-300 characters).',
    example: 'What is the capital of Nigeria?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description:
      'An array of answer options (2-10 strings, 1-100 characters each).',
    example: ['Lagos', 'Abuja', 'Kano'],
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

  @ApiProperty({
    description: '0-based index of the correct answer in the options array.',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(9)
  correctOptionIndex: number;
}
