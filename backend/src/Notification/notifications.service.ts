import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async findAllForUser(userId: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async unreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({ where: { userId, read: false } });
  }

  async markAsRead(id: number, userId: number) {
    const notif = await this.notificationRepo.findOne({ where: { id, userId } });
    if (notif) {
      notif.read = true;
      return this.notificationRepo.save(notif);
    }
    return null;
  }

  async delete(id: number, userId: number) {
    const notif = await this.notificationRepo.findOne({ where: { id, userId } });
    if (notif) return this.notificationRepo.remove(notif);
    return null;
  }

  async createNotification(userId: number, message: string) {
    const notif = this.notificationRepo.create({ userId, message });
    return this.notificationRepo.save(notif);
  }
}
