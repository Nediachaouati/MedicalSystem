import { Controller, Get, Param, Post, Delete, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get(':userId')
  async getNotifications(@Param('userId') userId: number) {
    const notifications = await this.notifService.findAllForUser(userId);
    const unreadCount = await this.notifService.unreadCount(userId);
    return { notifications, unreadCount };
  }

  @Post('read/:id')
  async markAsRead(@Param('id') id: number, @Body('userId') userId: number) {
    return this.notifService.markAsRead(id, userId);
  }

  @Delete(':id/:userId')
  async delete(@Param('id') id: number, @Param('userId') userId: number) {
    return this.notifService.delete(id, userId);
  }
}
