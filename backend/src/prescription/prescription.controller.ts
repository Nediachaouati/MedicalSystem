import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { Prescription } from './entities/prescription.entity';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPrescriptionDto: CreatePrescriptionDto): Promise<Prescription> {
    return this.prescriptionService.create(createPrescriptionDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
  ): Promise<Prescription> {
    return this.prescriptionService.update(id, updatePrescriptionDto);
  }

  @Get('appointment/:appointmentId')
  @UseGuards(JwtAuthGuard)
  findByAppointment(@Param('appointmentId', ParseIntPipe) appointmentId: number): Promise<Prescription[]> {
    return this.prescriptionService.findByAppointment(appointmentId);
  }

  @Get('appointment/:appointmentId/pdf')
  @UseGuards(JwtAuthGuard)
  async generatePrescriptionPdf(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
    @CurrentUser() user: { id: number; role: string },
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.prescriptionService.generatePrescriptionPdf(appointmentId, user.id, user.role);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ordonnance_${appointmentId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}