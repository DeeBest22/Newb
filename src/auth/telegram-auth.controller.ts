import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { Public } from './decorators';

const BASE_PATH = 'auth-telegram';
@Controller(BASE_PATH)
@ApiTags(BASE_PATH)
@ApiBearerAuth()
export class TelegramAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate or Register via Telegram' })
  @ApiResponse({
    status: 200,
    description: 'Returns access and refresh tokens',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Telegram authentication data',
  })
  async login(@Body() loginDto: TelegramLoginDto) {
    console.log('Telegram login DTO:', loginDto);
    return this.authService.telegramLogin(
      loginDto.initData,
      loginDto.startParam,
    );
  }
}
