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
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ApiEndpoint, FiltersQuery } from '@app/core/decorators';
import { Accounts } from '@app/auth/decorators/accounts.decorator';
import { AccountType } from '@prisma/client';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { CreateCourseTopicDto } from './dto/create-course-topic.dto';
import { CreateCourseTopicQuestionDto } from './dto/create-course-topic-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateContentSlideDto } from './dto/create-content-slide.dto';
import { CreateUserAnswerDto } from './dto/create-user-answer.dto';
import { CreateUserCourseProgressDto } from './dto/create-user-course-progress.dto';
import { CreateUserTopicProgressDto } from './dto/create-user-topic-progress.dto';
import { PaginationQuery } from '@app/core/database/pagination/pagination-query.decorator';
import { ApiFilterPagination } from '@app/core/decorators/api-filter-pagination.decorator';
import { PaginationInterceptor } from '@app/core/database/pagination/pagination.interceptor';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public } from '@app/auth/decorators';
import { CurrentUserData } from '@app/auth/interfaces';
import { PrismaService } from '@app/core/database/prisma.service';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { uploadFileToContabo } from '@app/core/utils/image-upload.service';

const BASE_PATH = 'course';
@Controller(BASE_PATH)
@ApiTags(BASE_PATH)
@ApiBearerAuth()
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly prismaService: PrismaService,
  ) {}

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create Course')
  @Post()
  createCourse(@Body() data: CreateCourseDto) {
    return this.courseService.createCourse(data);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create Course Category')
  @Post('course-category')
  createCourseCategory(@Body() data: CreateCourseCategoryDto) {
    return this.courseService.createCourseCategory(data);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create Course Topic')
  @Post('course-topic')
  createCourseTopic(@Body() data: CreateCourseTopicDto) {
    return this.courseService.createCourseTopic(data);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create Course Topic Question')
  @Post('course-topic-question')
  createCourseTopicQuestion(@Body() data: CreateCourseTopicQuestionDto) {
    return this.courseService.createCourseTopicQuestion(data);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create Question Answer')
  @Post('question-answer')
  createQuestionAnswer(@Body() data: CreateAnswerDto) {
    return this.courseService.createQuestionAnswer(data);
  }

  @Accounts(AccountType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create Content Slide')
  @Post('content-slide')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], {
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/heic',
          'image/heif',
          'image/svg+xml',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        topicId: { type: 'number' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async createContentSlide(
    @Body() data: CreateContentSlideDto,
    @UploadedFiles() files?: { images?: Express.Multer.File[] },
  ) {
    const topicId = +data.topicId;

    let imageUrls: string[] = [];

    if (files?.images) {
      imageUrls = await Promise.all(
        files.images.map(async (file) => {
          return await uploadFileToContabo(file.buffer, file.originalname);
        }),
      );
    }

    return this.courseService.createContentSlide({
      ...data,
      topicId,
      images: imageUrls,
    });
  }

  // @Accounts(AccountType.ADMIN)
  // @HttpCode(HttpStatus.CREATED)
  // @ApiEndpoint('Create Content Slide')
  // @Post('content-slide')
  // createContentSlide(@Body() data: CreateContentSlideDto) {
  //   return this.courseService.createContentSlide(data);
  // }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create User Answer')
  @Post('user-answer')
  createUserAnswer(@Body() data: CreateUserAnswerDto) {
    return this.courseService.createUserAnswer(data);
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create User Course Progress')
  @Post('user-course-progress')
  createUserCourseProgress(@Body() data: CreateUserCourseProgressDto) {
    return this.courseService.createUserCourseProgress(data);
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiEndpoint('Create User Topic Progress')
  @Post('add-user-topic-progress')
  createUserTopicProgress(@Body() data: CreateUserTopicProgressDto) {
    console.log('data:', data);
    return this.courseService.createUserTopicProgress(data);
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All course')
  @ApiFilterPagination('Get All course')
  @UseInterceptors(PaginationInterceptor)
  @Get()
  findAllCourse(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllCourse(filterOptions, paginationOptions);
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All course category')
  @ApiFilterPagination('Get All category')
  @UseInterceptors(PaginationInterceptor)
  @Get('course-category')
  findAllCourseCategory(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllCourseCategory(
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All Content Slide')
  @ApiFilterPagination('Get All Content Slide')
  @UseInterceptors(PaginationInterceptor)
  @Get('content-slide')
  findAllContentSlide(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllContentSlide(
      filterOptions,
      paginationOptions,
    );
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All Course Topic')
  @ApiFilterPagination('Get All Course Topic')
  @UseInterceptors(PaginationInterceptor)
  @Get('course-topic')
  findAllCourseTopic(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllCourseTopic(
      filterOptions,
      paginationOptions,
    );
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All Course Topic Question')
  @ApiFilterPagination('Get All Course Topic Question')
  @UseInterceptors(PaginationInterceptor)
  @Get('course-topic-question')
  findAllCourseTopicQuestion(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllCourseTopicQuestion(
      filterOptions,
      paginationOptions,
    );
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All Answer')
  @ApiFilterPagination('Get All Answer')
  @UseInterceptors(PaginationInterceptor)
  @Get('answer')
  findAllAnswer(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllAnswer(filterOptions, paginationOptions);
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All User Answer')
  @ApiFilterPagination('Get All User Answer')
  @UseInterceptors(PaginationInterceptor)
  @Get('user-answer')
  findAllUserAnswer(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllUserAnswer(
      filterOptions,
      paginationOptions,
    );
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All User Course Progress')
  @ApiFilterPagination('Get All User Course Progress')
  @UseInterceptors(PaginationInterceptor)
  @Get('user-course-progress')
  findAllUserCourseProgress(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllUserCourseProgress(
      filterOptions,
      paginationOptions,
    );
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All User Topic Progress')
  @ApiFilterPagination('Get All User Topic Progress')
  @UseInterceptors(PaginationInterceptor)
  @Get('user-topic-progress')
  findAllUserTopicProgress(
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllUserTopicProgress(
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Update User Topic Progress')
  @Patch('update-user-topic-progress/:topicId/:userId')
  update(
    @Param('topicId') topicId: number,
    @Param('userId') userId: number,
    @Body() data,
  ) {
    console.log('data:', data);
    console.log('topicId:', topicId);
    return this.courseService.updateUserTopicProgress(+topicId, +userId, data);
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All Course Topic for a Course')
  @ApiFilterPagination('Get All Course Topic for a Course')
  @UseInterceptors(PaginationInterceptor)
  @Get('course-topic-for-a-course/:courseId')
  findAllCourseTopicForACourse(
    @Param('courseId') courseId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllCourseTopicForACourse(
      +courseId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get All Content Slide for a Topic')
  @ApiFilterPagination('Get All Content Slide for a Topic')
  @UseInterceptors(PaginationInterceptor)
  @Get('content-slide-for-a-topic/:topicId')
  findAllContentSlideForATopic(
    @Param('topicId') topicId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAllContentSlideForATopic(
      +topicId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get Answer for a Question')
  @ApiFilterPagination('Get Answer for a Question')
  @UseInterceptors(PaginationInterceptor)
  @Get('answer-for-a-question/:questionId')
  findAnswerForAQuestion(
    @Param('questionId') questionId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findAnswerForAQuestion(
      +questionId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get User Answer for a Question')
  @ApiFilterPagination('Get User Answer for a Question')
  @UseInterceptors(PaginationInterceptor)
  @ApiQuery({ name: 'questionId', required: false })
  @Get('user-answer-for-a-question/:userId')
  findUserAnswerForAQuestion(
    @Param('userId') userId: number,
    @Query('questionId') questionId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findUserAnswerForAQuestion(
      +userId,
      +questionId,
      filterOptions,
      paginationOptions,
    );
  }

  @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get User Answer for All Question')
  @ApiFilterPagination('Get User Answer for All Question')
  @UseInterceptors(PaginationInterceptor)
  @Get('user-answer-for-all-question/:userId')
  findUserAnswerForAllQuestion(
    @Param('userId') userId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findUserAnswerForAllQuestion(
      +userId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get Course Topic Question')
  @ApiFilterPagination('Get Course Topic Question')
  @UseInterceptors(PaginationInterceptor)
  @Get('course-topic-question/:topicId')
  findTopicQuestion(
    @Param('topicId') topicId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findTopicQuestion(
      +topicId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get Category Courses')
  @ApiFilterPagination('Get Category Courses')
  @UseInterceptors(PaginationInterceptor)
  @Get('all-category-course/:categoryId')
  findCOursesForCategory(
    @Param('categoryId') categoryId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findCoursesForCategory(
      +categoryId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get User Course Progress')
  @ApiFilterPagination('Get User Course Progress')
  @UseInterceptors(PaginationInterceptor)
  @Get('get-user-course-progress/:userId/:courseId')
  findUserCourseProgress(
    @Param('userId') userId: number,
    @Param('courseId') courseId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findUserCourseProgress(
      +userId,
      +courseId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get User Course Progress')
  @ApiFilterPagination('Get User Course Progress')
  @UseInterceptors(PaginationInterceptor)
  @Get('get-user-topic-progress/:userId/:topicId')
  findUserTopicProgress(
    @Param('userId') userId: number,
    @Param('topicId') topicId: number,
    @FiltersQuery() filterOptions,
    @PaginationQuery() paginationOptions,
  ) {
    return this.courseService.findUserTopicProgress(
      +userId,
      +topicId,
      filterOptions,
      paginationOptions,
    );
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get User Course Progress')
  @Get('get-one-course-topic/:id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOneTopic(+id);
  }

  // @Accounts(AccountType.ADMIN, AccountType.GENERAL_USER)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get Topic Question By Id')
  @Get('get-one-topic-question/:id')
  findOneQuestion(@Param('id') id: string) {
    return this.courseService.findOneQuestion(+id);
  }

  @HttpCode(HttpStatus.OK)
  @ApiEndpoint('Get Topic Question By Id')
  @Get('course-progress-bar')
  async getCourseProgress(@CurrentUser() user: CurrentUserData) {
    return this.courseService.getCourseProgress(user.accounts[0].id);
  }

  @Post('track')
  async trackProgress(
    @Body() body: { userId: number; courseId: number; topicId: number },
  ) {
    // Ensure course progress exists
    await this.prismaService.userCourseProgress.upsert({
      where: {
        userId: body.userId,
        courseId: body.courseId,
      },
      create: {
        userId: body.userId,
        courseId: body.courseId,
        completed: false,
      },
      update: {},
    });

    // Update topic progress
    return this.prismaService.userTopicProgress.upsert({
      where: {
        userId_topicId: {
          userId: body.userId,
          topicId: body.topicId,
        },
      },
      create: {
        userId: body.userId,
        topicId: body.topicId,
        completed: false,
      },
      update: {},
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(+id);
  }
}
