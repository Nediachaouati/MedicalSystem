import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Symptom } from './entities/symptom.entity';
import { UsersModule } from '../users/users.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { SymptomController } from './symptom.controller';
import { SymptomService } from './symptom.service';

@Module({
  imports: [TypeOrmModule.forFeature([Symptom]), UsersModule, AppointmentModule],
  providers: [SymptomService],
  controllers: [SymptomController],
})
export class SymptomModule {}