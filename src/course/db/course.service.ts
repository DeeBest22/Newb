import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CourseDatabaseService extends BaseDatabaseService {
  public fillable = ['title', 'description', 'image', 'categoryId', 'points'];
  public searchable = ['title', 'categoryId'];
  public relations = ['category'];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.course);
  }
}
