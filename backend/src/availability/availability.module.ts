// src/availability/availability.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { Availability } from './entities/availability.entity';
import { TimeSlot } from './entities/time-slot.entity';
import { User } from '../users/entities/user.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Availability,
      TimeSlot,
      User, 
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}