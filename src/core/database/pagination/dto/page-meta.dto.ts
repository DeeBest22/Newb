import { ApiProperty } from '@nestjs/swagger';
// import { PageOptionsDto } from './page-option.dto'
export class PageMetaDto {
  @ApiProperty()
  readonly total_items: number;

  @ApiProperty()
  readonly item_count: number;

  @ApiProperty()
  readonly items_perpage: number;

  @ApiProperty()
  readonly total_pages: number;

  @ApiProperty()
  readonly current_page: number;

  @ApiProperty()
  readonly has_previous_page: boolean;

  @ApiProperty()
  readonly has_next_page: boolean;
}
