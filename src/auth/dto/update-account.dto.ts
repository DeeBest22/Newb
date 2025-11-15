import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateAccountDto {
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  id: string;
}
