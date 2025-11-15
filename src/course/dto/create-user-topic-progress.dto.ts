import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserTopicProgressDto {
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
    description: 'Topic ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  topicId: number;

  @ApiProperty({
    type: Boolean,
    description: 'Is Course Completed',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  completed: boolean;

  @ApiProperty({
    type: String,
    description: 'Course Completion Date',
    example: '2023-10-01T00:00:00Z',
    required: true,
  })
  @IsString()
  @IsOptional()
  completedAt: string;
}
