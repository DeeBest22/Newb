import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const transformChatIds = ({ value }: { value: any }): string[] => {
  if (typeof value === 'string') {
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        return value.split(',').map((id) => id.trim());
      }
    }
    return value.split(',').map((id) => id.trim());
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

export class SendImageDto {
  @ApiProperty({
    type: [String],
    description:
      'Array of Telegram chat IDs. Can be sent as a JSON string array or a comma-separated string.',
    example: ['-1002785322930', '-1002414675242', '-1002478732490'],
    required: true,
    maxItems: 50,
  })
  @Transform(transformChatIds)
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  chatIds: string[];

  @ApiPropertyOptional({
    description: 'The caption to accompany the image (optional)',
    example: 'Check out this awesome image!',
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;
}
