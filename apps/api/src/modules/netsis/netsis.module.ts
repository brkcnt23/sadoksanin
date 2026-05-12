import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NetsisService } from './netsis.service';
import { NetsisController } from './netsis.controller';
import { NetsisScheduler } from './netsis.scheduler';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule, ScheduleModule.forRoot()],
  controllers: [NetsisController],
  providers: [NetsisService, NetsisScheduler],
  exports: [NetsisService],
})
export class NetsisModule {}
