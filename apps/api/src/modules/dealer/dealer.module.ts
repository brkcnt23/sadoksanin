import { Module } from '@nestjs/common';
import { DealerController } from './dealer.controller';
import { DealerService } from './dealer.service';
import { CommonModule } from '../../common/common.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [CommonModule, MailerModule],
  controllers: [DealerController],
  providers: [DealerService],
  exports: [DealerService],
})
export class DealerModule {}
