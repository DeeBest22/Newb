import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserPointtDto {
  @ApiProperty({
    type: Number,
    description: 'User Points to Add',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  points: number;
}
