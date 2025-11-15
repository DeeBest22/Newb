import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CourseTopicDatabaseService extends BaseDatabaseService {
  public fillable = ['title', 'courseId', 'points'];
  public searchable = ['title', 'courseId'];
  public relations = ['course'];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.topic);
  }
}
