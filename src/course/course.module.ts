import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { AnswerDatabaseService } from './db/answer.service';
import { ContentSlideDatabaseService } from './db/content-slide.service';
import { CourseCategoryDatabaseService } from './db/course-category.service';
import { CourseTopicQuestionDatabaseService } from './db/course-topic-question.service';
import { CourseTopicDatabaseService } from './db/course-topic.service';
import { CourseDatabaseService } from './db/course.service';
import { UserAnswerDatabaseService } from './db/user-answer.service';
import { UserCourseProgressDatabaseService } from './db/user-course-progress.service';
import { UserTopicProgressDatabaseService } from './db/user-topic-progress.service';
import { PrismaService } from '@app/core/database/prisma.service';

@Module({
  controllers: [CourseController],
  providers: [
    PrismaService,
    CourseService,
    AnswerDatabaseService,
    ContentSlideDatabaseService,
    CourseCategoryDatabaseService,
    CourseTopicQuestionDatabaseService,
    CourseTopicDatabaseService,
    CourseDatabaseService,
    UserAnswerDatabaseService,
    UserCourseProgressDatabaseService,
    UserTopicProgressDatabaseService,
  ],
})
export class CourseModule {}
