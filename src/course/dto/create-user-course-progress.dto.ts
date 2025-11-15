import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserCourseProgressDto {
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
    description: 'Course ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  courseId: number;

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
