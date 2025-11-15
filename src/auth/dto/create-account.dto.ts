import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @ApiProperty({
    enum: AccountType,
    required: true,
  })
  accountType: AccountType;
}
