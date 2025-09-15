import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private usersService: UsersService,
    private mailService: MailService
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.usersService.findOneById(createAppointmentDto.patientId);
    if (!patient) {
      throw new NotFoundException(`Patient avec l'ID ${createAppointmentDto.patientId} non trouvé`);
    }
    const doctor = await this.usersService.findOneById(createAppointmentDto.medecinId);
    if (!doctor) {
      throw new NotFoundException(`Médecin avec l'ID ${createAppointmentDto.medecinId} non trouvé`);
    }
    const secretaries = await this.usersService.findSecretariesByMedecin(createAppointmentDto.medecinId);
    const secretary = secretaries.length > 0 ? secretaries[0] : null;
    const appointmentData = {
      ...createAppointmentDto,
      patientName: patient.name || 'Patient inconnu',
      doctorName: doctor.name || 'Médecin inconnu',
      secretaryId: secretary ? secretary.id : undefined,
    };
    const appointment = this.appointmentRepository.create(appointmentData);
    return this.appointmentRepository.save(appointment);
  }


  async findOne(id: number): Promise<Appointment> {
  const appointment = await this.appointmentRepository.findOne({
    where: { id },
    relations: ['patient', 'medecin'],
  });
  if (!appointment) {
    throw new NotFoundException(`Rendez-vous avec l'ID ${id} non trouvé`);
  }
  return appointment;
}


  async findByDoctor(medecinId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { medecinId },
      relations: ['patient', 'medecin', 'symptoms', 'prescriptions'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async findByPatient(patientId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { patientId },
      relations: ['patient', 'medecin', 'secretary', 'symptoms', 'prescriptions'],
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async updateAppointmentStatus(id: number, appointmentStatus: 'en_attente' | 'approuvé' | 'annulé'): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'medecin'],
    });
    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${id} non trouvé`);
    }
    appointment.appointmentStatus = appointmentStatus;
    if (appointmentStatus === 'approuvé') {
      appointment.consultationStatus = 'en_cours';
    } else if (appointmentStatus === 'annulé') {
      appointment.consultationStatus = null;
    }
    const savedAppointment = await this.appointmentRepository.save(appointment);
    if (appointmentStatus === 'approuvé') {
      try {
        await this.mailService.sendAppointmentConfirmation(
          appointment.patient.email,
          appointment.patientName || 'Patient',
          appointment.doctorName || 'Médecin',
          appointment.date,
          appointment.time,
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      }
    }
    return savedAppointment;
  }

  async updateConsultationStatus(id: number, consultationStatus: 'en_cours' | 'terminée'): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'medecin'],
    });
    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${id} non trouvé`);
    }
    if (appointment.appointmentStatus !== 'approuvé') {
      throw new ForbiddenException('Le rendez-vous doit être approuvé pour modifier le statut de consultation');
    }
    appointment.consultationStatus = consultationStatus;
    const savedAppointment = await this.appointmentRepository.save(appointment);
    if (consultationStatus === 'terminée') {
      try {
        await this.mailService.sendAppointmentCompletion(
          appointment.patient.email,
          appointment.patientName || 'Patient',
          appointment.doctorName || 'Médecin',
          appointment.date,
          appointment.time,
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      }
    }
    return savedAppointment;
  }
}