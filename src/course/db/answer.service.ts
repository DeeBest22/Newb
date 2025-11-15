import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AnswerDatabaseService extends BaseDatabaseService {
  public fillable = ['text', 'isCorrect', 'questionId'];
  public searchable = ['text', 'isCorrect'];
  public relations = ['question'];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.answer);
  }
}
