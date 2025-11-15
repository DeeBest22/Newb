import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiFilterPagination } from '@app/core/decorators/api-filter-pagination.decorator';
import { PaginationInterceptor } from '@app/core/database/pagination/pagination.interceptor';
import { FiltersQuery } from '@app/core/decorators';
import { PaginationQuery } from '@app/core/database/pagination/pagination-query.decorator';

const BASE_PATH = 'waitlist';
@Controller(BASE_PATH)
@ApiTags(BASE_PATH)
@ApiBearerAuth()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  create(@Body() createWaitlistDto: CreateWaitlistDto) {
    return this.waitlistService.create(createWaitlistDto);
  }

  // @Public()
  // @Accounts(AccountType.ADMIN, AccountType.STAFF)
  @ApiFilterPagination('Get All Waitlist User')
  @UseInterceptors(PaginationInterceptor)
  @Get()
  async findAll(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return await this.waitlistService.findAll(filterOptions, paginationOptions);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waitlistService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWaitlistDto: UpdateWaitlistDto,
  ) {
    return this.waitlistService.update(+id, updateWaitlistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waitlistService.remove(+id);
  }
}
