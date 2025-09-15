import { Controller, Get, Post, Body, Patch, Param, UseGuards, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entities/appointment.entity';

import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';


@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto, @CurrentUser() user: User): Promise<Appointment> {
    return this.appointmentService.create({ ...createAppointmentDto, patientId: user.id });
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string, @CurrentUser() user: User): Promise<Appointment[]> {
    if (user.role !== 'SECRETAIRE' && user.role !== 'MEDECIN' && user.id !== +patientId) {
      throw new ForbiddenException(`Vous n'êtes pas autorisé à accéder aux rendez-vous du patient ID ${patientId}`);
    }
    return this.appointmentService.findByPatient(+patientId);
  }

   @Roles(Role.SECRETAIRE, Role.MEDECIN)
  @Get('doctor/:doctorId')
  findByDoctor(@Param('doctorId') doctorId: string, @CurrentUser() user: User): Promise<Appointment[]> {
    console.log('User accessing doctor appointments:', { id: user.id, role: user.role, medecinId: user.medecinId, requestedDoctorId: +doctorId });
    if (user.role === 'SECRETAIRE' && user.medecinId && user.medecinId !== +doctorId) {
      throw new ForbiddenException(`Vous n'êtes pas autorisé à accéder aux rendez-vous du médecin ID ${doctorId}`);
    }
    return this.appointmentService.findByDoctor(+doctorId);
  }

  @Roles(Role.SECRETAIRE)
  @Patch(':id/appointment-status')
  updateAppointmentStatus(@Param('id') id: string, @Body('appointmentStatus') appointmentStatus: 'en_attente' | 'approuvé' | 'annulé', @CurrentUser() user: User): Promise<Appointment> {
    if (user.role !== 'SECRETAIRE') {
      throw new ForbiddenException('Seuls les secrétaires peuvent mettre à jour le statut du rendez-vous');
    }
    return this.appointmentService.updateAppointmentStatus(+id, appointmentStatus);
  }

  @Roles(Role.MEDECIN)
  @Patch(':id/consultation-status')
  updateConsultationStatus(@Param('id') id: string, @Body('consultationStatus') consultationStatus: 'en_cours' | 'terminée', @CurrentUser() user: User): Promise<Appointment> {
    if (user.role !== 'MEDECIN') {
      throw new ForbiddenException('Seuls les médecins peuvent mettre à jour le statut de consultation');
    }
    return this.appointmentService.updateConsultationStatus(+id, consultationStatus);
  }
}