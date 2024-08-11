import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ConfigModule } from '@nestjs/config';
import { ServiceNowService } from './service-now.service';

@Module({
  imports: [ConfigModule],
  providers: [ScheduleService, ServiceNowService],
  controllers: [ScheduleController]
})
export class ScheduleModule {}
