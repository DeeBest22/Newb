import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserTopicProgressDatabaseService extends BaseDatabaseService {
  public fillable = ['userId', 'topicId', 'completed', 'completedAt'];
  public searchable = ['userId', 'topicId', 'completed'];
  public relations = [];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.userTopicProgress);
  }
}
