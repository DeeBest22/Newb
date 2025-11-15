import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateContentSlideDto {
  @ApiProperty({
    type: String,
    description: 'Course Content Slide Title',
    example: 'What exactly is Blockchain?',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: String,
    description: 'Course Content Slide Body',
    example:
      'Blockchain is a distributed ledger technology that allows multiple parties to have access to the same data in real-time.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    type: Number,
    description: 'Course Topic ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  topicId: number;
}
