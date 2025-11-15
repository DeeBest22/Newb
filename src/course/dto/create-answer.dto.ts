import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({
    type: String,
    description: 'Course Topic Question Answer',
    example: 'What is Blockchain?',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    type: Boolean,
    description: 'Is Correct Answer',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;

  @ApiProperty({
    type: Number,
    description: 'Question ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  questionId: number;
}
