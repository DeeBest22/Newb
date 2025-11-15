import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTaskDto {
  // @ApiProperty({
  //   type: Number,
  //   description: 'User Id',
  //   example: 2,
  //   required: true,
  // })
  // @IsNumber()
  // @IsNotEmpty()
  // userId: number;

  @ApiProperty({
    type: String,
    description: 'Task Id',
    example: 'daily-login',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({
    type: String,
    description: 'Task Type',
    example: 'daily',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  taskType: string;

  @ApiProperty({
    type: Boolean,
    description: 'Is task completed',
    example: true,
    required: true,
  })
  // @IsString()
  @IsBoolean()
  @IsNotEmpty()
  completed: boolean;

  @ApiProperty({
    type: String,
    description: 'Date task completed',
    example: '2025-04-24T13:31:15.988Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  completedAt: string;

  @ApiProperty({
    type: String,
    description: 'Date task completed',
    example: '2025-04-24T13:31:15.988Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  expiresAt: string;
}
