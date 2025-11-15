import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetTasksDto {
  @ApiProperty({
    type: Number,
    description: 'User Id',
    example: 2,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: string;
}
