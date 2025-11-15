import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCourseCategoryDto {
  @ApiProperty({
    type: String,
    description: 'Name of Category',
    example: 'Blockchain',
    required: true,
  })
  @IsString()
  name: string;
}
