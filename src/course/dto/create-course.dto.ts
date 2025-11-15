import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    type: String,
    description: 'Course Name',
    example: 'Blockchain Basics',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: String,
    description: 'Course Description',
    example: 'Learn the basics of blockchain technology.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    type: String,
    description: 'Course Image URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image: string;

  @ApiProperty({
    type: Number,
    description: 'Course Category ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({
    type: Number,
    description: 'Course Points',
    example: 200,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  points: number;
}
