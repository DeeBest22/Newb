import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCourseTopicQuestionDto {
  @ApiProperty({
    type: String,
    description: 'Course Topic Question Name',
    example: 'What is Blockchain?',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    type: Number,
    description: 'Topic ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  topicId: number;
}
