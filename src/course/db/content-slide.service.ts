import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentSlideDatabaseService extends BaseDatabaseService {
  public fillable = ['title', 'body', 'topicId'];
  public searchable = ['title', 'topicId'];
  public relations = ['topic'];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.contentSlide);
  }
}
