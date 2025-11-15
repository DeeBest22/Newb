import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserAnswerDatabaseService extends BaseDatabaseService {
  public fillable = ['userId', 'questionId', 'answerId', 'isCorrect', 'points'];
  public searchable = ['userId', 'questionId', 'answerId', 'isCorrect'];
  public relations = [];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.userAnswer);
  }
}
