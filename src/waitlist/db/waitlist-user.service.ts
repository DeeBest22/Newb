import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { PrismaService } from '@app/core/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WaitlistUserDatabaseService extends BaseDatabaseService {
  public fillable = ['email', 'telegramUsername', 'ref'];
  public searchable = ['email', 'telegramUsername', 'ref'];
  public relations = [];
  constructor(private readonly prisma: PrismaService) {
    super(prisma.waitlistUser);
  }
}
