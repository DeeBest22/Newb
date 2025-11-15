import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserAnswerDto {
  @ApiProperty({
    type: Number,
    description: 'User ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    type: Number,
    description: 'Question ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  questionId: number;

  @ApiProperty({
    type: Number,
    description: 'Answer ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  answerId: number;

  @ApiProperty({
    type: Boolean,
    description: 'Is Correct Answer',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;
}
