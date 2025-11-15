import { Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Module({
  exports: [PrismaService],
  imports: [],
  providers: [PrismaService],
})
export class CoreModule {}
