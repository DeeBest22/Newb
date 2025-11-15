import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export default class ResetPasswordDto {
  @ApiProperty({
    type: String,
    minimum: 8,
    maximum: 20,
    description: 'At least 1 capital, 1 small, 1 special character & 1 number',
  })
  @IsString()
  @MaxLength(20)
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\w+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password: string;
}
