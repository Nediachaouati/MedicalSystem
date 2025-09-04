import { Controller, Post, Body, Get, Param, Patch, UseGuards, ForbiddenException } from '@nestjs/common';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { SymptomService } from './symptom.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Symptom } from './entities/symptom.entity';

@Controller('symptoms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SymptomController {
  constructor(private readonly symptomService: SymptomService) {}

  @Roles(Role.PATIENT)
  @Post()
  create(@Body() createSymptomDto: CreateSymptomDto, @CurrentUser() user: User): Promise<Symptom> {
    if (user.role !== 'PATIENT') {
      throw new ForbiddenException('Seuls les patients peuvent créer des symptômes');
    }
    return this.symptomService.create({ ...createSymptomDto, patientId: user.id });
  }

  @Roles(Role.MEDECIN, Role.SECRETAIRE)
  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string): Promise<Symptom[]> {
    return this.symptomService.findByPatient(+patientId);
  }

  @Roles(Role.PATIENT)
  @Patch(':symptomId/appointment')
  updateSymptomAppointmentId(
    @Param('symptomId') symptomId: string,
    @Body('appointmentId') appointmentId: number,
    @CurrentUser() user: User
  ): Promise<Symptom> {
    if (user.role !== 'PATIENT') {
      throw new ForbiddenException('Seuls les patients peuvent associer un symptôme à un rendez-vous');
    }
    return this.symptomService.updateSymptomAppointmentId(+symptomId, appointmentId);
  }
}