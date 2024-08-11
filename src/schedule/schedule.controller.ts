import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { IncidentPayload } from './models/service-now.model';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('start')
  startJob() {
    this.scheduleService.startCronJob();
    return { message: 'Cron job started' };
  }

  @Get('stop')
  stopJob() {
    this.scheduleService.stopCronJob();
    return { message: 'Cron job stopped' };
  }

  @Post('update-cookie')
  updateCookie(@Body('cookie') newCookie: string): string {
    this.scheduleService.updateCookie(newCookie);
    return 'Cookie updated successfully';
  }

  @Post('access')
  async accessTask(@Body('link') link: string) {
    try {
      // Call the service method with the provided link
      const result = await this.scheduleService.accessTask(link);
      return result;
    } catch (error) {
      // Handle errors
      console.error('Error accessing task:', error);
      return null;
    }
  }
}
