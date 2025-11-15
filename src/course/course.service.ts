import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDatabaseService } from './db/course.service';
import { CreateCourseTopicDto } from './dto/create-course-topic.dto';
import { CourseTopicDatabaseService } from './db/course-topic.service';
import { CourseTopicQuestionDatabaseService } from './db/course-topic-question.service';
import { AnswerDatabaseService } from './db/answer.service';
import { ContentSlideDatabaseService } from './db/content-slide.service';
import { CourseCategoryDatabaseService } from './db/course-category.service';
import { UserAnswerDatabaseService } from './db/user-answer.service';
import { UserCourseProgressDatabaseService } from './db/user-course-progress.service';
import { UserTopicProgressDatabaseService } from './db/user-topic-progress.service';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { CreateCourseTopicQuestionDto } from './dto/create-course-topic-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateContentSlideDto } from './dto/create-content-slide.dto';
import { CreateUserAnswerDto } from './dto/create-user-answer.dto';
import { CreateUserCourseProgressDto } from './dto/create-user-course-progress.dto';
import { CreateUserTopicProgressDto } from './dto/create-user-topic-progress.dto';
import { PrismaService } from '@app/core/database/prisma.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly courseDatabaseService: CourseDatabaseService,
    private readonly courseTopicDatabaseService: CourseTopicDatabaseService,
    private readonly courseTopicQuestionDatabaseService: CourseTopicQuestionDatabaseService,
    private readonly answerDatabaseService: AnswerDatabaseService,
    private readonly contentSlideDatabaseService: ContentSlideDatabaseService,
    private readonly courseCategoryDatabaseService: CourseCategoryDatabaseService,
    private readonly userAnswerDatabaseService: UserAnswerDatabaseService,
    private readonly userCourseProgressDatabaseService: UserCourseProgressDatabaseService,
    private readonly userTopicProgressDatabaseService: UserTopicProgressDatabaseService,
  ) {}

  async createCourse(data: CreateCourseDto) {
    return await this.courseDatabaseService.create(data);
  }

  async createCourseTopic(data: CreateCourseTopicDto) {
    return await this.courseTopicDatabaseService.create(data);
  }

  async createCourseCategory(data: CreateCourseCategoryDto) {
    return await this.courseCategoryDatabaseService.create(data);
  }

  async createCourseTopicQuestion(data: CreateCourseTopicQuestionDto) {
    return await this.courseTopicQuestionDatabaseService.create(data);
  }

  async createQuestionAnswer(data: CreateAnswerDto) {
    return await this.answerDatabaseService.create(data);
  }

  // In your service
  async createContentSlide(data: CreateContentSlideDto) {
    return this.prismaService.contentSlide.create({
      data: {
        title: data.title,
        body: data.body,
        topicId: +data.topicId,
        images: data.images,
      },
    });
  }

  // async createContentSlide(data: CreateContentSlideDto) {
  //   return await this.contentSlideDatabaseService.create(data);
  // }

  async createUserAnswer(data: CreateUserAnswerDto) {
    return await this.userAnswerDatabaseService.create(data);
  }

  async createUserCourseProgress(data: CreateUserCourseProgressDto) {
    return await this.userCourseProgressDatabaseService.create(data);
  }

  async createUserTopicProgress(data: CreateUserTopicProgressDto) {
    return await this.userTopicProgressDatabaseService.create(data);
  }

  async findAllCourse(filterOptions, paginationOptions) {
    const [data, totalCount] = await this.courseDatabaseService.findAll(
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findAllCourseCategory(filterOptions, paginationOptions) {
    const [data, totalCount] = await this.courseCategoryDatabaseService.findAll(
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findAllContentSlide(filterOptions, paginationOptions) {
    const [data, totalCount] = await this.contentSlideDatabaseService.findAll(
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findAllCourseTopic(filterOptions, paginationOptions) {
    const [data, totalCount] = await this.courseTopicDatabaseService.findAll(
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findAllCourseTopicQuestion(filterOptions, paginationOptions) {
    const [data, totalCount] =
      await this.courseTopicQuestionDatabaseService.findAll(
        filterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findAllAnswer(filterOptions, paginationOptions) {
    const [data, totalCount] = await this.answerDatabaseService.findAll(
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findAllUserAnswer(filterOptions, paginationOptions) {
    const [data, totalCount] = await this.userAnswerDatabaseService.findAll(
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findAllUserCourseProgress(filterOptions, paginationOptions) {
    const [data, totalCount] =
      await this.userCourseProgressDatabaseService.findAll(
        filterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findAllUserTopicProgress(filterOptions, paginationOptions) {
    const [data, totalCount] =
      await this.userTopicProgressDatabaseService.findAll(
        filterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findAllCourseTopicForACourse(
    courseId: number,
    filterOptions,
    paginationOptions,
  ) {
    const [data, totalCount] =
      await this.courseTopicDatabaseService.findAllById(
        courseId,
        'courseId',
        filterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findAllContentSlideForATopic(
    topicId: number,
    filterOptions,
    paginationOptions,
  ) {
    const [data, totalCount] =
      await this.contentSlideDatabaseService.findAllById(
        topicId,
        'topicId',
        filterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findAnswerForAQuestion(
    questionId: number,
    filterOptions,
    paginationOptions,
  ) {
    const [data, totalCount] = await this.answerDatabaseService.findAllById(
      questionId,
      'questionId',
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findUserAnswerForAQuestion(
    userId: number,
    questionId: number,
    filterOptions,
    paginationOptions,
  ) {
    console.log('userId:', userId);
    console.log('questionId:', questionId);
    const enhancedFilterOptions = {
      ...filterOptions,
      questionId,
    };

    const [data, totalCount] = await this.userAnswerDatabaseService.findAllById(
      userId,
      'userId',
      enhancedFilterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findUserAnswerForAllQuestion(
    userId: number,
    filterOptions,
    paginationOptions,
  ) {
    const [data, totalCount] = await this.userAnswerDatabaseService.findAllById(
      userId,
      'userId',
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findTopicQuestion(topicId: number, filterOptions, paginationOptions) {
    const [data, totalCount] =
      await this.courseTopicQuestionDatabaseService.findAllById(
        topicId,
        'topicId',
        filterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findCoursesForCategory(
    categoryId: number,
    filterOptions,
    paginationOptions,
  ) {
    const [data, totalCount] = await this.courseDatabaseService.findAllById(
      categoryId,
      'categoryId',
      filterOptions,
      paginationOptions,
    );

    return { data, totalCount };
  }

  async findUserCourseProgress(
    userId: number,
    courseId: number,
    filterOptions,
    paginationOptions,
  ) {
    const enhancedFilterOptions = {
      ...filterOptions,
      courseId,
    };

    const [data, totalCount] =
      await this.userCourseProgressDatabaseService.findAllById(
        userId,
        'userId',
        enhancedFilterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findUserTopicProgress(
    userId: number,
    topicId: number,
    filterOptions,
    paginationOptions,
  ) {
    // const checkIfTopicIsCompleted =
    //   await this.prismaService.userTopicProgress.findFirst({
    //     where: { userId, topicId },
    //   });

    // if (checkIfTopicIsCompleted) {
    //   throw new BadRequestException('User Already completed this topic');
    // }

    const enhancedFilterOptions = {
      ...filterOptions,
      topicId,
    };

    const [data, totalCount] =
      await this.userTopicProgressDatabaseService.findAllById(
        userId,
        'userId',
        enhancedFilterOptions,
        paginationOptions,
      );

    return { data, totalCount };
  }

  async findOneTopic(id: number) {
    return await this.courseTopicDatabaseService.findById(id);
  }

  async findOneQuestion(id: number) {
    return await this.courseTopicQuestionDatabaseService.findById(id);
  }

  async getCourseProgress(userId: number) {
    // Get all in-progress courses for the user
    const courses = await this.prismaService.userCourseProgress.findMany({
      where: {
        userId,
        completed: false,
      },
      include: {
        course: {
          include: {
            topics: {
              include: {
                UserTopicProgress: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    // Calculate progress for each course
    return courses.map((courseProgress) => {
      const totalTopics = courseProgress.course.topics.length;
      const completedTopics = courseProgress.course.topics.filter(
        (topic) => topic.UserTopicProgress[0]?.completed,
      ).length;

      return {
        courseId: courseProgress.courseId,
        title: courseProgress.course.title,
        description: courseProgress.course.description,
        image: courseProgress.course.image,
        progress: totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0,
        nextTopic: this.getNextUncompletedTopic(courseProgress.course.topics),
      };
    });
  }

  private getNextUncompletedTopic(topics: any[]) {
    return (
      topics
        .sort((a, b) => a.id - b.id)
        .find((topic) => !topic.UserTopicProgress[0]?.completed) || null
    );
  }

  async updateUserTopicProgress(topicId: number, userId: number, data) {
    console.log('service data:', data);
    console.log('service topicId:', topicId);
    console.log('service userId:', userId);

    try {
      return await this.prismaService.userTopicProgress.update({
        where: {
          userId_topicId: {
            userId,
            topicId,
          },
        },
        data: {
          completed: data.completed,
          completedAt: data.completedAt,
        },
      });
    } catch (error) {
      console.error('Error updating user topic progress:', error);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
