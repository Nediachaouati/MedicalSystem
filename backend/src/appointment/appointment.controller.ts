import { Controller, Get, Post, Body, Patch, Param, UseGuards, ForbiddenException, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entities/appointment.entity';

import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TimeSlot } from '../availability/entities/time-slot.entity'; 
import type { Request } from 'express';
import { UsersService } from 'src/users/users.service';


interface RequestWithUser extends Request {
  user: {
    id: number;
    role: string;
  };
}

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService,
    private readonly usersService: UsersService
  ) {}

  @Post('book-slot')
  @Roles(Role.PATIENT) // seulement le patient peut réserver
  async bookSlot(
    @Body() body: { timeSlotId: number },
    @CurrentUser() user: User,
  ) {
    return this.appointmentService.bookBySlot(body.timeSlotId, user.id);
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

@Get('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SECRETAIRE)
async getSecretaryStats(@CurrentUser() user: User) {
  return this.appointmentService.getStatsForSecretary(user.id);
}

@Roles(Role.MEDECIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('doctor-stats')
async getDoctorStats(@CurrentUser() user: User) {
  return this.appointmentService.getStatsForDoctor(user.id);
}

@Post(':id/review')
@Roles(Role.PATIENT)
async addReview(
  @Param('id') appointmentId: number,
  @Body() body: { rating: number; review?: string },
  @CurrentUser() user: User,
) {
  return this.appointmentService.addReview(appointmentId, user.id, body.rating, body.review);
}

@Get('reviews')
@Roles(Role.MEDECIN, Role.SECRETAIRE)
async getReviewsForDoctor(@CurrentUser() user: User) {
  let doctorId: number;

  if (user.role === 'MEDECIN') {
    doctorId = user.id;
  } 
  else if (user.role === 'SECRETAIRE') {
    // ON UTILISE LA BONNE MÉTHODE
    const secretary = await this.usersService.findOneByIdOrEmail(user.id);

    if (!secretary?.medecinId) {
      throw new BadRequestException('Cette secrétaire n\'est pas assignée à un médecin');
    }
    doctorId = secretary.medecinId;
  } 
  else {
    throw new ForbiddenException('Accès refusé');
  }

  return this.appointmentService.getReviewsByDoctor(doctorId);
}
}