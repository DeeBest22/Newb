import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean } from 'class-validator';
import { PageMetaDto } from './page-meta.dto';

export class PageDto {
  @IsBoolean()
  success: boolean;

  @IsArray()
  @ApiProperty({ isArray: true })
  readonly data: [];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;
}
