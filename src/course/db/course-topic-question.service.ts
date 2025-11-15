import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CourseTopicQuestionDatabaseService extends BaseDatabaseService {
  public fillable = ['text', 'topicId'];
  public searchable = ['text', 'topicId'];
  public relations = ['topic'];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.question);
  }
}
