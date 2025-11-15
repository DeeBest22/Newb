import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    type: String,
    example: 'superadmin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({
    type: String,
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
  /*
  @ApiProperty({
    type: String,
  })
  @IsOptional()
  accountId?: string;*/
}
