import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';
import { Prescription } from './entities/prescription.entity';
import { AppointmentService } from '../appointment/appointment.service';
import { Appointment } from '../appointment/entities/appointment.entity';
import { UsersModule } from '../users/users.module';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prescription, Appointment]),
    UsersModule,
  ],
  controllers: [PrescriptionController],
  providers: [PrescriptionService, AppointmentService, MailService],
})
export class PrescriptionModule {}