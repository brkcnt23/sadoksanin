import { Module } from '@nestjs/common';
import { DealerController } from './dealer.controller';
import { DealerService } from './dealer.service';
import { CommonModule } from '../../common/common.module';
import { MailerModule } from '../mailer/mailer.module';
import { NetsisModule } from '../netsis/netsis.module';

@Module({
  imports: [CommonModule, MailerModule, NetsisModule],
  controllers: [DealerController],
  providers: [DealerService],
  exports: [DealerService],
})
export class DealerModule {}
