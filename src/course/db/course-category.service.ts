import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CourseCategoryDatabaseService extends BaseDatabaseService {
  public fillable = ['name'];
  public searchable = ['name'];
  public relations = [];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.category);
  }
}
