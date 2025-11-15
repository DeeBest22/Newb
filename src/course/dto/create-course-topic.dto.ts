import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCourseTopicDto {
  @ApiProperty({
    type: String,
    description: 'Course Topic Name',
    example: 'Introduction to Blockchain',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

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
    type: Number,
    description: 'Topic Points',
    example: 100,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  points: number;
}
