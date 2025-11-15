import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiEndpoint } from '@app/core/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { CurrentUser, Public } from '@app/auth/decorators';
import { CurrentUserData } from '@app/auth/interfaces';
import { Accounts } from '@app/auth/decorators/accounts.decorator';
import { AccountType } from '@prisma/client';

const BASE_PATH = 'task';
@Controller(BASE_PATH)
@ApiTags(BASE_PATH)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get User tasks')
  @Get('user')
  async getMyTasks(@CurrentUser() user: CurrentUserData) {
    const userId = user.accounts[0].id;
    if (!userId) {
      throw new BadRequestException('User not found in request');
    }
    return this.taskService.getUserTasks(+userId);
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get User streak')
  @Get('streak')
  async getStreak(@CurrentUser() user: CurrentUserData) {
    const userId = user.accounts[0].id;
    return this.taskService.getStreakInfo(userId);
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Complete user task')
  @Post('complete/:userId')
  async completeTask(
    @Param('userId') userId: number,
    @Body() dto: CreateTaskDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User not found in request');
    }
    return this.taskService.completeTask(+userId, dto);
  }
}
