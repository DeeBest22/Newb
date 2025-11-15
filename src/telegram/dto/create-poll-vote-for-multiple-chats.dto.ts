import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateMultiplePollDto {
  @ApiProperty({
    type: [String],
    description: 'Array of Telegram Community chat IDs',
    example: [
      '-1002539449352',
      '-1002306607418',
      '-1002814512312',
      '-1002414675242',
      '-1002651283101',
      '-1002805775588',
      '-1002519283711',
      '-1002268273820',
      '-1002577561755',
      '-1002428293968',
      '-1002334752205',
      '-1002283708103',
      '-1002823582749',
      '-1002700389201',
      '-1002496020627',
      '-1002782540302',
      '-1002673103792',
      '-1002933177813',
      '-1002424251448',
      '-1002658614016',
      '-1002774992264',
      '-1002324380190',
      '-1002793222433',
      '-1002869884193',
      '-1002376754434',
      '-4972548544',
      '-1002580067108',
      '-1002634046443',
      '-1002726944203',
      '-1002233061343',
      '-1002660382615',
      '-1002394786535',
      '-1002635194967',
      '-1003049272013',
      '-1002600724433',
      '-1002760504801',
      '-1002833904614',
      '-1003177213052',
      '-1002991198945',
    ],
    required: true,
    maxItems: 50,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  chatIds: string[];

  @ApiProperty({
    description: 'The question for the poll (1-300 characters).',
    example: 'What is your favorite crypto?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description:
      'An array of poll options (2-10 strings, 1-100 characters each).',
    example: ['Bitcoin', 'Ethereum', 'Solana', 'Other'],
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error('Invalid JSON format for options');
      }
    }
    return value;
  })
  options: string[];
}
