import { Module } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { WaitlistUserDatabaseService } from './db/waitlist-user.service';
import { CoreModule } from '@app/core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [WaitlistController],
  providers: [WaitlistService, WaitlistUserDatabaseService],
})
export class WaitlistModule {}
