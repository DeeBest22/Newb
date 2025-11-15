import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskDatabaseService extends BaseDatabaseService {
  public fillable = [
    'userId',
    'taskId',
    'taskType',
    'completed',
    'completedAt',
    'expiresAt',
  ];
  public searchable = ['userId', 'taskId', 'taskType'];
  public relations = [];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.task);
  }
}
