import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Accounts } from './decorators/accounts.decorator';
import { AccountType } from '@prisma/client';
import { ApiAccountCreate, ApiAccountUpdate, CurrentUser } from './decorators';
import { ApiFilterPagination } from '@app/core/decorators/api-filter-pagination.decorator';
import { LoginDto } from './dto/login.dto';
import { CurrentUserData } from './interfaces';
import { convertBigIntToString, omit } from '@app/core/utils/functions';
import { PaginationInterceptor } from '@app/core/database/pagination/pagination.interceptor';
import { ApiEndpoint, FiltersQuery } from '@app/core/decorators';
import { PaginationQuery } from '@app/core/database/pagination/pagination-query.decorator';
import { Public } from './decorators/public.decorator';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { UpdateGeneralUserDto } from './dto';
import { UpdateUserPointtDto } from './dto/general-user/update-user-point.dto';

const BASE_PATH = 'auth';
@Controller(BASE_PATH)
@ApiTags(BASE_PATH)
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiConsumes('application/json')
  @ApiAccountCreate()
  @Post()
  async create(
    @Body()
    createAccountDto,
  ) {
    return await this.authService.create(createAccountDto);
  }

  @Public()
  @Post('telegram')
  @ApiOperation({ summary: 'Authenticate via Telegram' })
  async telegramAuth(@Body('initData') initData: string) {
    return this.authService.telegramLogin(initData);
  }
  // async telegramAuth(@Body() telegramAuthDto: TelegramAuthDto) {
  //   return this.authService.telegramLogin(telegramAuthDto);
  // }

  @Public()
  /*@UseGuards(LocalAuthGuard)*/
  @ApiOperation({
    summary: 'Login as user of any Account',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
  })
  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    if (loginDto.email) {
      loginDto.email = loginDto.email.toLowerCase();
    }
    return this.authService.login(loginDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Authenticated user data',
  })
  @Get('/me')
  async me(@CurrentUser() user: CurrentUserData) {
    const result = omit(user, ['password', 'hashedRt', 'account']);
    // return omit(user, ['password', 'hashedRt', 'account']);
    // const result = await this.authService.findAll(filterOptions, paginationOptions);
    return convertBigIntToString(result);
  }

  @Accounts(AccountType.ADMIN)
  @ApiQuery({
    name: 'type',
    type: 'string',
    required: true,
    enum: [...Object.keys(AccountType)],
  })
  @ApiFilterPagination('Get all Accounts by account type')
  @UseInterceptors(PaginationInterceptor)
  @Get()
  async findAll(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    const result = await this.authService.findAll(
      filterOptions,
      paginationOptions,
    );
    return convertBigIntToString(result);
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @ApiEndpoint('Get Account by ID')
  @ApiOperation({ summary: 'Get Account by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account found',
  })
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const result = await this.authService.findOne(+id);
    return convertBigIntToString(result);
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @ApiAccountUpdate()
  @Patch(':id')
  async update(
    //TODO: Fix Account Validation pipe for update function
    // @Body(AccountValidationPipe(HandlerAction.UPDATE))
    @Body()
    updateAccountDto,
    @Param('id') id: number,
  ) {
    return await this.authService.update(+id, updateAccountDto);
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Update User Points')
  @Patch(':id/points')
  async updatePoints(
    @Param('id') id: number,
    @Body() dto: UpdateUserPointtDto,
  ) {
    const result = await this.authService.updatePoints(+id, dto);
    return convertBigIntToString(result);
  }

  @Accounts(AccountType.ADMIN)
  @Get('find-by-email/:email')
  async FindByEmail(@Param('email') email: string) {
    return await this.authService.FindByEmail(email);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
