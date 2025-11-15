import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserCourseProgressDatabaseService extends BaseDatabaseService {
  public fillable = ['userId', 'courseId', 'completed', 'completedAt'];
  public searchable = ['userId', 'courseId', 'completed'];
  public relations = ['user'];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.userCourseProgress);
  }
}
