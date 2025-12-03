// src/availability/availability.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  Put,
  Req,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // SECRÉTAIRE : Ajouter une journée
  @Post('add')
  @Roles(Role.SECRETAIRE)
  async create(
    @Body() body: { date: string; startTime: string; endTime: string },
    @CurrentUser() user: User,
  ) {
    return this.availabilityService.create(body, user.id);
  }

  // SECRÉTAIRE : Voir toutes les dispos de son médecin
  @Get('my-doctor')
  @Roles(Role.SECRETAIRE)
  async findAll(@CurrentUser() user: User) {
    return this.availabilityService.findAll(user.id);
  }
  
  @Get('my-schedule')   
  @UseGuards(JwtAuthGuard)
  async getMySchedule(@Req() req: RequestWithUser) {
  const medecinId = req.user.id;
  return this.availabilityService.findByDoctor(medecinId);
}


  // PATIENT / SECRÉTAIRE : Voir les créneaux disponibles d'un médecin
  @Get('slots')
async getAvailableSlots(
  @Query('medecinId') medecinId: number,
  @Query('date') date: string,
) {
  const slots = await this.availabilityService.getSlotsByDoctorAndDate(medecinId, date);

  // RENVOIE UNIQUEMENT LES CRÉNEAUX DISPONIBLES
  return slots.filter(slot => slot.status === 'disponible');
}

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: { date: string; startTime: string; endTime: string },
    @Req() req: RequestWithUser,   // ← PLUS D'ERREUR !
  ) {
    const secretaireId = req.user.id;
    return this.availabilityService.update(+id, dto, secretaireId);
  }


  // SECRÉTAIRE : Supprimer une disponibilité
  @Delete(':id')
  @Roles(Role.SECRETAIRE)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.availabilityService.remove(+id, user.id);
  }
}